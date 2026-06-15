import {
  PBKDF2_ITERATIONS,
  CryptoOperationError,
  deriveKey,
  encrypt,
  decrypt,
  generateSalt
} from "../utils/crypto";
import { fetchFromIPFS, uploadToIPFS } from "./ipfsService";
import { getVaultCidFromChain, updateVaultCidOnChain } from "./blockchainService";
import {
  ErrorCodes,
  VaultServiceError,
  getUserFriendlyMessage,
  isRetryableError,
  normalizeError,
  retryAsync,
  validateEthereumAddress
} from "../utils/errorHandling";

const DB_NAME = "vault-security-db";
const DB_VERSION = 1;
const STORE_VAULT = "vaultEncrypted";
const STORE_META = "vaultMeta";
const RECORD_ID = "primary";
const META_KEY_SALT = "kdfSaltV1";
const META_KEY_MIGRATED = "migratedFromLocalStorageV1";
const META_KEY_LAST_SYNCED_CID = "lastSyncedCid";
const META_KEY_PENDING_SYNC = "pendingSyncV1";
const EXPORT_FORMAT = "vault-ciphertext-v1";

let databasePromise = null;

function ensureIndexedDbAvailable() {
  if (!globalThis.indexedDB) {
    throw new VaultServiceError(ErrorCodes.LOCAL_SAVE_FAILED, "IndexedDB is not available");
  }
}

function openDatabase() {
  ensureIndexedDbAvailable();
  if (databasePromise) return databasePromise;

  databasePromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_VAULT)) {
        db.createObjectStore(STORE_VAULT, { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains(STORE_META)) {
        db.createObjectStore(STORE_META, { keyPath: "key" });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new VaultServiceError(ErrorCodes.LOCAL_SAVE_FAILED));
  });

  return databasePromise;
}

function txPromise(transaction) {
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error || new VaultServiceError(ErrorCodes.LOCAL_SAVE_FAILED));
    transaction.onabort = () => reject(transaction.error || new VaultServiceError(ErrorCodes.LOCAL_SAVE_FAILED));
  });
}

function reqPromise(request) {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new VaultServiceError(ErrorCodes.LOCAL_SAVE_FAILED));
  });
}

async function getMeta(db, key) {
  const tx = db.transaction(STORE_META, "readonly");
  const record = await reqPromise(tx.objectStore(STORE_META).get(key));
  await txPromise(tx);
  return record?.value;
}

async function setMeta(db, key, value) {
  const tx = db.transaction(STORE_META, "readwrite");
  tx.objectStore(STORE_META).put({ key, value, updatedAt: Date.now() });
  await txPromise(tx);
}

async function deleteMeta(db, key) {
  const tx = db.transaction(STORE_META, "readwrite");
  tx.objectStore(STORE_META).delete(key);
  await txPromise(tx);
}

async function getVaultRecord(db) {
  const tx = db.transaction(STORE_VAULT, "readonly");
  const record = await reqPromise(tx.objectStore(STORE_VAULT).get(RECORD_ID));
  await txPromise(tx);
  return record || null;
}

async function putVaultRecord(db, payload) {
  const tx = db.transaction(STORE_VAULT, "readwrite");
  tx.objectStore(STORE_VAULT).put({ id: RECORD_ID, payload, updatedAt: Date.now() });
  await txPromise(tx);
}

function normalizeVaultArray(vaults) {
  return Array.isArray(vaults) ? vaults : [];
}

function normalizeSaveOptions(optionsOrSkipIpfs = {}) {
  if (typeof optionsOrSkipIpfs === "boolean") {
    return { skipWeb3: optionsOrSkipIpfs };
  }

  return {
    skipWeb3: Boolean(optionsOrSkipIpfs.skipWeb3 || optionsOrSkipIpfs.skipIpfs),
    onProgress: typeof optionsOrSkipIpfs.onProgress === "function" ? optionsOrSkipIpfs.onProgress : null
  };
}

function emitProgress(onProgress, stage, message, meta = {}) {
  onProgress?.({ stage, message, ...meta });
}

async function resolveOrCreateSalt(db) {
  const existingSalt = await getMeta(db, META_KEY_SALT);
  if (typeof existingSalt === "string" && existingSalt.trim()) {
    return existingSalt.trim();
  }

  const nextSalt = generateSalt();
  await setMeta(db, META_KEY_SALT, nextSalt);
  return nextSalt;
}

function ensureEncryptionKey(encryptionKey) {
  if (!(encryptionKey instanceof CryptoKey)) {
    throw new Error("Phiên đang khóa. Vui lòng mở khóa trước khi thay đổi vault.");
  }
}

async function deriveVaultKey(password, db) {
  const normalizedSecret = String(password ?? "").trim();
  if (!normalizedSecret) {
    throw new Error("Master password is required to access encrypted vault data");
  }

  const salt = await resolveOrCreateSalt(db);
  return deriveKey(normalizedSecret, salt, { iterations: PBKDF2_ITERATIONS });
}

async function persistLocalVault(db, encryptedPayload) {
  await resolveOrCreateSalt(db);
  await putVaultRecord(db, encryptedPayload);
}

function canFallbackToLocal(error) {
  const normalized = normalizeError(error, ErrorCodes.SYNC_FAILED);
  return isRetryableError(normalized);
}

export const vaultService = {
  async deriveVaultKeyFromPassword(password) {
    const db = await openDatabase();
    const salt = await resolveOrCreateSalt(db);
    return deriveKey(String(password ?? ""), salt, { iterations: PBKDF2_ITERATIONS });
  },

  async hasVaultData() {
    const db = await openDatabase();
    const record = await getVaultRecord(db);
    return Boolean(record?.payload);
  },

  async ensureVaultStorage(encryptionKey, options = {}) {
    ensureEncryptionKey(encryptionKey);
    const db = await openDatabase();
    const hasMigrated = Boolean(await getMeta(db, META_KEY_MIGRATED));
    const existingRecord = await getVaultRecord(db);

    if (existingRecord) {
      if (!hasMigrated) await setMeta(db, META_KEY_MIGRATED, true);
      return { migrated: false, count: 0 };
    }

    let migratedCount = 0;
    const legacyRawText = options.legacyVaultRawText;
    if (typeof legacyRawText === "string" && legacyRawText.trim()) {
      try {
        const parsed = JSON.parse(legacyRawText);
        if (Array.isArray(parsed) && parsed.length > 0) {
          await this.saveVaultsWithKey(parsed, encryptionKey, { skipWeb3: true });
          migratedCount = parsed.length;
        }
      } catch {
        // Ignore malformed legacy payload and continue with an empty vault.
      }
    }

    if (migratedCount === 0) {
      await this.saveVaultsWithKey([], encryptionKey, { skipWeb3: true });
    }

    await setMeta(db, META_KEY_MIGRATED, true);
    return { migrated: migratedCount > 0, count: migratedCount };
  },

  async loadVaultsWithKey(encryptionKey) {
    ensureEncryptionKey(encryptionKey);
    const db = await openDatabase();
    const record = await getVaultRecord(db);
    if (!record?.payload) return [];

    const decrypted = await decrypt(record.payload, encryptionKey);
    return normalizeVaultArray(decrypted);
  },

  async saveVaultsWithKey(vaults, encryptionKey, optionsOrSkipIpfs = {}) {
    ensureEncryptionKey(encryptionKey);

    const options = normalizeSaveOptions(optionsOrSkipIpfs);
    const normalizedVaults = normalizeVaultArray(vaults);
    const db = await openDatabase();

    emitProgress(options.onProgress, "encrypting", "Đang mã hóa vault...");
    const encryptedPayload = await encrypt(normalizedVaults, encryptionKey);

    const canUseWeb3 =
      !options.skipWeb3 &&
      Boolean(globalThis.window?.ethereum) &&
      Boolean(import.meta.env.VITE_PINATA_JWT) &&
      Boolean(import.meta.env.VITE_VAULT_CONTRACT_ADDRESS);

    if (!canUseWeb3) {
      emitProgress(options.onProgress, "local", "Đang lưu local...");
      await persistLocalVault(db, encryptedPayload);
      return {
        vaults: normalizedVaults,
        sync: { status: "skipped", message: "Đã lưu local. Web3 sync chưa được cấu hình hoặc MetaMask chưa sẵn sàng." }
      };
    }

    try {
      emitProgress(options.onProgress, "ipfs", "Đang upload IPFS...");
      const cid = await retryAsync(() => uploadToIPFS(encryptedPayload), {
        maxRetries: 3,
        initialDelayMs: 1000,
        backoffMultiplier: 2,
        onRetry: ({ attempt, maxRetries }) =>
          emitProgress(options.onProgress, "retry", `Upload IPFS lỗi, đang thử lại ${attempt + 1}/${maxRetries}...`)
      });

      emitProgress(options.onProgress, "chain", "Đang chờ MetaMask xác nhận giao dịch...");
      const txResult = await retryAsync(
        async () => {
          const result = await updateVaultCidOnChain(cid);
          if (!result.success) {
            throw new VaultServiceError(result.code || ErrorCodes.TRANSACTION_FAILED, result.error, result.details);
          }
          return result;
        },
        {
          maxRetries: 3,
          initialDelayMs: 1500,
          backoffMultiplier: 2,
          onRetry: ({ attempt, maxRetries }) =>
            emitProgress(options.onProgress, "retry", `RPC chưa ổn định, đang thử lại ${attempt + 1}/${maxRetries}...`)
        }
      );

      emitProgress(options.onProgress, "local", "Đang cập nhật bản local...");
      await persistLocalVault(db, encryptedPayload);
      await setMeta(db, META_KEY_LAST_SYNCED_CID, cid);
      await deleteMeta(db, META_KEY_PENDING_SYNC);

      emitProgress(options.onProgress, "complete", "Đã lưu và đồng bộ blockchain.");
      return {
        vaults: normalizedVaults,
        sync: {
          status: "synced",
          cid,
          txHash: txResult.txHash,
          blockNumber: txResult.blockNumber,
          message: "Đã lưu local và cập nhật pointer blockchain."
        }
      };
    } catch (error) {
      const normalized = normalizeError(error, ErrorCodes.SYNC_FAILED);

      if (!canFallbackToLocal(normalized)) {
        emitProgress(options.onProgress, "failed", getUserFriendlyMessage(normalized), { error: normalized });
        throw normalized;
      }

      emitProgress(options.onProgress, "fallback", "Mạng Web3 lỗi. Đang lưu local để bạn không mất dữ liệu...");
      await persistLocalVault(db, encryptedPayload);
      await setMeta(db, META_KEY_PENDING_SYNC, {
        reason: normalized.code,
        message: getUserFriendlyMessage(normalized),
        updatedAt: Date.now()
      });

      return {
        vaults: normalizedVaults,
        sync: {
          status: "local_fallback",
          code: normalized.code,
          message: "Đã lưu local. Web3 sync sẽ cần thử lại khi mạng ổn định.",
          error: getUserFriendlyMessage(normalized)
        }
      };
    }
  },

  async syncVaultOnLogin(encryptionKey, userAddress, options = {}) {
    ensureEncryptionKey(encryptionKey);
    const db = await openDatabase();
    const onProgress = typeof options.onProgress === "function" ? options.onProgress : null;

    try {
      const validAddress = validateEthereumAddress(userAddress);
      emitProgress(onProgress, "chain", "Đang kiểm tra pointer trên blockchain...");

      const { cid, error, code } = await getVaultCidFromChain(validAddress);
      if (error || !cid) {
        return { synced: false, reason: error || "No CID on chain", code };
      }

      const localSyncedCid = await getMeta(db, META_KEY_LAST_SYNCED_CID);
      if (localSyncedCid === cid) {
        return { synced: true, reason: "Already up-to-date", vaults: await this.loadVaultsWithKey(encryptionKey) };
      }

      emitProgress(onProgress, "ipfs", "Đang tải vault mới nhất từ IPFS...");
      const encryptedPayloadFromIpfs = await retryAsync(() => fetchFromIPFS(cid), {
        maxRetries: 3,
        initialDelayMs: 1000,
        backoffMultiplier: 2,
        onRetry: ({ attempt, maxRetries }) =>
          emitProgress(onProgress, "retry", `Tải IPFS lỗi, đang thử lại ${attempt + 1}/${maxRetries}...`)
      });

      emitProgress(onProgress, "decrypting", "Đang giải mã dữ liệu đồng bộ...");
      let decrypted = [];
      try {
        decrypted = await decrypt(encryptedPayloadFromIpfs, encryptionKey);
      } catch (error) {
        throw new VaultServiceError(
          ErrorCodes.DECRYPTION_FAILED,
          "Cannot decrypt synced vault. Master password may not match this on-chain data.",
          error
        );
      }

      if (!Array.isArray(decrypted)) {
        throw new VaultServiceError(ErrorCodes.DECRYPTION_FAILED, "Synced vault payload is not an array");
      }

      await putVaultRecord(db, encryptedPayloadFromIpfs);
      await setMeta(db, META_KEY_LAST_SYNCED_CID, cid);
      await deleteMeta(db, META_KEY_PENDING_SYNC);

      return { synced: true, reason: "Synced from IPFS", cid, vaults: decrypted };
    } catch (error) {
      const normalized = normalizeError(error, ErrorCodes.SYNC_FAILED);
      return {
        synced: false,
        reason: normalized.message,
        code: normalized.code,
        userMessage: getUserFriendlyMessage(normalized),
        canRetry: isRetryableError(normalized)
      };
    }
  },

  async rotateEncryptionKey(oldPassword, nextPassword) {
    const db = await openDatabase();
    const oldKey = await deriveVaultKey(oldPassword, db);
    const nextKey = await deriveVaultKey(nextPassword, db);
    const currentVaults = await this.loadVaultsWithKey(oldKey);
    await this.saveVaultsWithKey(currentVaults, nextKey, { skipWeb3: true });
    return { vaults: currentVaults, encryptionKey: nextKey };
  },

  async exportToJson(vaults, masterSecret) {
    const normalizedVaults = normalizeVaultArray(vaults);
    const exportSalt = generateSalt();
    const key = await deriveKey(String(masterSecret ?? ""), exportSalt, { iterations: PBKDF2_ITERATIONS });
    const cipher = await encrypt(normalizedVaults, key);

    return JSON.stringify(
      {
        format: EXPORT_FORMAT,
        kdf: {
          algorithm: "PBKDF2-SHA256",
          iterations: PBKDF2_ITERATIONS,
          salt: exportSalt
        },
        cipher
      },
      null,
      2
    );
  },

  async importFromJson(rawText, masterSecret) {
    const data = JSON.parse(rawText);

    if (Array.isArray(data)) {
      return data;
    }

    if (!data || typeof data !== "object" || data.format !== EXPORT_FORMAT) {
      throw new Error("Invalid vault import format");
    }

    const iterations = Number.isInteger(data.kdf?.iterations) && data.kdf.iterations > 0
      ? data.kdf.iterations
      : PBKDF2_ITERATIONS;
    const salt = data.kdf?.salt;
    const key = await deriveKey(String(masterSecret ?? ""), salt, { iterations });

    try {
      const decrypted = await decrypt(data.cipher, key);
      if (!Array.isArray(decrypted)) {
        throw new Error("Invalid vault import payload");
      }
      return decrypted;
    } catch (error) {
      if (error instanceof CryptoOperationError && error.code === "DECRYPT_FAILED") {
        throw new Error("Không thể giải mã file import. Master password sai hoặc dữ liệu bị hỏng.");
      }
      throw error;
    }
  }
};
