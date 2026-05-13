import {
  PBKDF2_ITERATIONS,
  CryptoOperationError,
  deriveKey,
  encrypt,
  decrypt,
  generateSalt
} from "../utils/crypto";

const DB_NAME = "vault-security-db";
const DB_VERSION = 1;
const STORE_VAULT = "vaultEncrypted";
const STORE_META = "vaultMeta";
const RECORD_ID = "primary";
const META_KEY_SALT = "kdfSaltV1";
const META_KEY_MIGRATED = "migratedFromLocalStorageV1";
const EXPORT_FORMAT = "vault-ciphertext-v1";

let databasePromise = null;

function ensureIndexedDbAvailable() {
  if (!globalThis.indexedDB) {
    throw new Error("IndexedDB is not available in this environment");
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
    request.onerror = () => reject(request.error || new Error("Failed to open IndexedDB"));
  });

  return databasePromise;
}

function txPromise(transaction) {
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error || new Error("IndexedDB transaction failed"));
    transaction.onabort = () => reject(transaction.error || new Error("IndexedDB transaction aborted"));
  });
}

function reqPromise(request) {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error("IndexedDB request failed"));
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
    throw new Error("Vault encryption key is not available. Please unlock the session first.");
  }
}

async function deriveVaultKey(password, db) {
  const normalizedSecret = String(password ?? "").trim();
  if (!normalizedSecret) {
    throw new Error("Master password is required to access encrypted vault data");
  }

  const salt = await resolveOrCreateSalt(db);
  const key = await deriveKey(normalizedSecret, salt, { iterations: PBKDF2_ITERATIONS });
  return key;
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
          await this.saveVaultsWithKey(parsed, encryptionKey);
          migratedCount = parsed.length;
        }
      } catch {
        // Ignore malformed legacy payload and continue with empty vault.
      }
    }

    if (migratedCount === 0) {
      await this.saveVaultsWithKey([], encryptionKey);
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

  async saveVaultsWithKey(vaults, encryptionKey) {
    ensureEncryptionKey(encryptionKey);
    const normalizedVaults = normalizeVaultArray(vaults);
    const db = await openDatabase();
    await resolveOrCreateSalt(db);
    const encryptedPayload = await encrypt(normalizedVaults, encryptionKey);
    await putVaultRecord(db, encryptedPayload);
    return normalizedVaults;
  },

  async rotateEncryptionKey(oldPassword, nextPassword) {
    const db = await openDatabase();
    const oldKey = await deriveVaultKey(oldPassword, db);
    const nextKey = await deriveVaultKey(nextPassword, db);
    const currentVaults = await this.loadVaultsWithKey(oldKey);
    await this.saveVaultsWithKey(currentVaults, nextKey);
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

    // Keep compatibility for old plaintext exports while migrating users.
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
        throw new Error("Không thể giải mã file import (sai master password hoặc dữ liệu bị hỏng)");
      }
      throw error;
    }
  }
};
