import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useLocalStorage } from "../hooks/useLocalStorage";
import { STORAGE_KEYS } from "../utils/storageKeys";
import { createPasswordVerifier, verifyPasswordVerifier, CryptoOperationError, normalizeStoredSecret } from "../utils/crypto";
import { signInWithGoogle, signOutGoogle } from "../services/authService";
import { connectMetaMask } from "../services/walletService";
import { vaultService } from "../services/vaultService";

const ACTIVITY_EVENTS = ["pointerdown", "keydown", "scroll", "touchstart", "mousemove"];

const defaultProfile = {
  name: "miniminZ",
  username: "miniminz",
  email: "",
  bio: "Công nghệ thông tin | PTIT"
};

const defaultSession = {
  isAuthenticated: false,
  provider: null,
  google: null,
  wallet: null
};

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [session, setSession] = useLocalStorage(STORAGE_KEYS.SESSION, defaultSession);
  const [vaults, setVaultsState] = useState([]);
  const [profile, setProfile] = useLocalStorage(STORAGE_KEYS.USER_PROFILE, defaultProfile);
  const [theme, setTheme] = useLocalStorage(STORAGE_KEYS.THEME, "dark");

  const [masterPasswordRecord, setMasterPasswordRecord] = useState(null);
  const [bootstrapped, setBootstrapped] = useState(false);
  const [masterGate, setMasterGate] = useState({ open: false, purpose: "", action: null });
  const [authBusy, setAuthBusy] = useState(false);
  const [hasVaultData, setHasVaultData] = useState(false);
  const [search, setSearch] = useLocalStorage("appSearch", "");
  const [autoLockMinutes, setAutoLockMinutes] = useLocalStorage(STORAGE_KEYS.AUTO_LOCK_MINUTES, 15);
  const [isSessionUnlocked, setSessionUnlocked] = useLocalStorage(STORAGE_KEYS.SESSION_UNLOCKED, false);
  const [toast, setToast] = useState(null);
  const toastTimerRef = useRef(null);
  const inactivityTimerRef = useRef(null);
  const vaultsRef = useRef([]);
  const sessionKeyRef = useRef(null);

  useEffect(() => {
    vaultsRef.current = vaults;
  }, [vaults]);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  useEffect(() => () => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
  }, []);

  useEffect(() => () => {
    if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
  }, []);

  useEffect(() => {
    const bootstrapSecrets = async () => {
      const storedValue = localStorage.getItem(STORAGE_KEYS.MASTER_PASSWORD_HASH);
      let nextRecord = null;

      if (storedValue) {
        try {
          const parsed = JSON.parse(storedValue);
          nextRecord = parsed && typeof parsed === "object" ? parsed : storedValue;
        } catch {
          nextRecord = storedValue;
        }
      } else {
        const defaultMasterPassword = import.meta.env.VITE_DEFAULT_MASTER_PASSWORD || "";
        const normalizedDefault = String(defaultMasterPassword ?? "").trim();
        if (normalizedDefault) {
          nextRecord = await createPasswordVerifier(normalizedDefault);
          localStorage.setItem(STORAGE_KEYS.MASTER_PASSWORD_HASH, JSON.stringify(nextRecord));
        }
      }

      setMasterPasswordRecord(nextRecord);
      setSessionUnlocked(false);
      setVaultsState([]);
      localStorage.removeItem(STORAGE_KEYS.MASTER_PASSWORD);
      sessionKeyRef.current = null;
      const hasIndexedVaults = await vaultService.hasVaultData();
      const legacyRawText = localStorage.getItem(STORAGE_KEYS.VAULTS);
      const hasLegacyVaults = Boolean(legacyRawText && legacyRawText.trim());
      setHasVaultData(hasIndexedVaults || hasLegacyVaults);
      setBootstrapped(true);
    };

    bootstrapSecrets();
  }, [setSessionUnlocked]);

  useEffect(() => {
    const clearSessionKey = () => {
      sessionKeyRef.current = null;
    };

    window.addEventListener("pagehide", clearSessionKey);
    window.addEventListener("beforeunload", clearSessionKey);

    return () => {
      window.removeEventListener("pagehide", clearSessionKey);
      window.removeEventListener("beforeunload", clearSessionKey);
    };
  }, []);

  const setVaults = useCallback(async (nextVaultsOrUpdater) => {
    const encryptionKey = sessionKeyRef.current;
    if (!encryptionKey) {
      throw new Error("Phiên đang khóa. Vui lòng mở khóa trước khi thay đổi vault");
    }

    const previousVaults = vaultsRef.current;
    const computedVaults = typeof nextVaultsOrUpdater === "function"
      ? nextVaultsOrUpdater(previousVaults)
      : nextVaultsOrUpdater;
    const normalizedVaults = Array.isArray(computedVaults) ? computedVaults : [];

    setVaultsState(normalizedVaults);

    try {
      await vaultService.saveVaultsWithKey(normalizedVaults, encryptionKey);
      setHasVaultData(normalizedVaults.length > 0 || (await vaultService.hasVaultData()));
      return normalizedVaults;
    } catch (error) {
      setVaultsState(previousVaults);
      throw error;
    }
  }, []);

  const signInGoogle = useCallback(async (activateSession = true) => {
    setAuthBusy(true);
    try {
      const googleUser = await signInWithGoogle();

      if (!activateSession) {
        return googleUser;
      }

      const nextSession = {
        isAuthenticated: true,
        provider: "google",
        google: googleUser,
        wallet: session.wallet || null
      };
      setSession(nextSession);
      setProfile((prev) => ({
        ...prev,
        name: googleUser.displayName || prev.name,
        email: googleUser.email || prev.email
      }));
      return nextSession;
    } finally {
      setAuthBusy(false);
    }
  }, [session.wallet, setProfile, setSession]);

  const connectWallet = useCallback(async (activateSession = true) => {
    setAuthBusy(true);
    try {
      const wallet = await connectMetaMask();

      if (!activateSession) {
        return wallet;
      }

      const nextSession = {
        isAuthenticated: true,
        provider: wallet.provider,
        google: session.google || null,
        wallet
      };
      setSession(nextSession);
      return nextSession;
    } finally {
      setAuthBusy(false);
    }
  }, [session.google, setSession]);

  const logout = useCallback(async () => {
    await signOutGoogle();
    sessionKeyRef.current = null;
    setSessionUnlocked(false);
    setVaultsState([]);
    setSession(defaultSession);
  }, [setSession, setSessionUnlocked]);

  const lockSession = useCallback(() => {
    sessionKeyRef.current = null;
    setVaultsState([]);
    setSessionUnlocked(false);
    if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
  }, [setSessionUnlocked]);

  const runSessionUnlock = useCallback(async (password) => {
    if (!masterPasswordRecord) {
      return { ok: false, message: "Bạn chưa tạo master password" };
    }

    const isValid = await verifyPasswordVerifier(password, masterPasswordRecord);
    if (!isValid) {
      return { ok: false, message: "Sai mật khẩu master" };
    }

    let encryptionKey = await vaultService.deriveVaultKeyFromPassword(password);
    let migration = { migrated: false };
    let loadedVaults = [];

    try {
      migration = await vaultService.ensureVaultStorage(encryptionKey, {
        legacyVaultRawText: localStorage.getItem(STORAGE_KEYS.VAULTS)
      });
      loadedVaults = await vaultService.loadVaultsWithKey(encryptionKey);
    } catch (error) {
      const canTryLegacyCipherFallback =
        error instanceof CryptoOperationError && error.code === "DECRYPT_FAILED";

      if (!canTryLegacyCipherFallback) {
        throw error;
      }

      const legacyRaw = typeof masterPasswordRecord === "string"
        ? normalizeStoredSecret(masterPasswordRecord)
        : normalizeStoredSecret(masterPasswordRecord?.legacyHash);

      if (!legacyRaw) {
        throw error;
      }

      const legacyKey = await vaultService.deriveVaultKeyFromPassword(legacyRaw);
      loadedVaults = await vaultService.loadVaultsWithKey(legacyKey);
      await vaultService.saveVaultsWithKey(loadedVaults, encryptionKey);
      migration = { migrated: true };
    }

    sessionKeyRef.current = encryptionKey;
    setVaultsState(loadedVaults);
    setSessionUnlocked(true);

    if (!masterPasswordRecord?.algorithm) {
      const upgradedRecord = await createPasswordVerifier(password);
      setMasterPasswordRecord(upgradedRecord);
      localStorage.setItem(STORAGE_KEYS.MASTER_PASSWORD_HASH, JSON.stringify(upgradedRecord));
    }

    if (migration.migrated) {
      localStorage.removeItem(STORAGE_KEYS.VAULTS);
    }
    setHasVaultData(loadedVaults.length > 0 || (await vaultService.hasVaultData()));

    return { ok: true };
  }, [masterPasswordRecord, setSessionUnlocked]);

  const updateMasterPassword = useCallback(async (currentPassword, nextPassword) => {
    if (!masterPasswordRecord) {
      return { ok: false, message: "Bạn chưa tạo master password" };
    }

    if (!(await verifyPasswordVerifier(currentPassword, masterPasswordRecord))) {
      return { ok: false, message: "Sai mật khẩu master" };
    }

    try {
      const rotation = await vaultService.rotateEncryptionKey(currentPassword, nextPassword);
      const nextRecord = await createPasswordVerifier(nextPassword);

      sessionKeyRef.current = rotation.encryptionKey;
      setVaultsState(rotation.vaults);
      setMasterPasswordRecord(nextRecord);
      localStorage.setItem(STORAGE_KEYS.MASTER_PASSWORD_HASH, JSON.stringify(nextRecord));
      setSessionUnlocked(true);
      setHasVaultData(rotation.vaults.length > 0 || (await vaultService.hasVaultData()));

      return { ok: true };
    } catch (error) {
      return { ok: false, message: error?.message || "Không thể đổi master password" };
    }
  }, [masterPasswordRecord, setSessionUnlocked]);

  const createMasterPassword = useCallback(async (nextPassword) => {
    const nextRecord = await createPasswordVerifier(nextPassword);
    const encryptionKey = await vaultService.deriveVaultKeyFromPassword(nextPassword);
    const migration = await vaultService.ensureVaultStorage(encryptionKey, {
      legacyVaultRawText: localStorage.getItem(STORAGE_KEYS.VAULTS)
    });
    const loadedVaults = await vaultService.loadVaultsWithKey(encryptionKey);

    sessionKeyRef.current = encryptionKey;
    setMasterPasswordRecord(nextRecord);
    setVaultsState(loadedVaults);
    setSessionUnlocked(true);
    setHasVaultData(loadedVaults.length > 0 || (await vaultService.hasVaultData()));
    localStorage.setItem(STORAGE_KEYS.MASTER_PASSWORD_HASH, JSON.stringify(nextRecord));
    localStorage.removeItem(STORAGE_KEYS.MASTER_PASSWORD);

    if (migration.migrated) {
      localStorage.removeItem(STORAGE_KEYS.VAULTS);
    }

    return { ok: true };
  }, [setSessionUnlocked]);

  const verifyMasterPassword = useCallback(async (password) => {
    if (!masterPasswordRecord) return false;
    return verifyPasswordVerifier(password, masterPasswordRecord);
  }, [masterPasswordRecord]);

  const requestMasterAction = useCallback((purpose, action, options = {}) => {
    const { forceReauth = false } = options;

    if (!forceReauth && isSessionUnlocked) {
      action?.(null);
      return;
    }

    setMasterGate({ open: true, purpose, action, error: "", forceReauth });
  }, [isSessionUnlocked]);

  const requestSessionUnlock = useCallback(() => {
    setMasterGate({
      open: true,
      purpose: "Mở khóa phiên",
      action: null,
      error: "",
      forceReauth: true
    });
  }, []);

  const notify = useCallback((message, type = "info", options = {}) => {
    const action = options.action;
    const duration = options.duration ?? 2600;

    setToast({ message, type, action });
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setToast(null), duration);
  }, []);

  const clearToast = useCallback(() => {
    setToast(null);
  }, []);

  const closeMasterGate = useCallback(() => {
    setMasterGate({ open: false, purpose: "", action: null });
  }, []);

  const confirmMasterGate = useCallback(async (password) => {
    try {
      const result = await runSessionUnlock(password);
      if (!result.ok) {
        setMasterGate((prev) => ({ ...prev, error: result.message || "Sai mật khẩu master" }));
        return result;
      }

      const action = masterGate.action;
      closeMasterGate();
      if (action) {
        await action(password);
      }
      return { ok: true };
    } catch (error) {
      setMasterGate((prev) => ({
        ...prev,
        error: error?.message || "Không thể mở khóa phiên. Vui lòng thử lại."
      }));
      return { ok: false, message: error?.message || "Không thể mở khóa phiên" };
    }
  }, [closeMasterGate, masterGate.action, runSessionUnlock]);

  const clearAllVaultData = useCallback(async () => {
    await setVaults([]);
    notify("Đã xóa toàn bộ dữ liệu vault", "warning");
  }, [notify, setVaults]);

  const exportVaultData = useCallback(async (password) => {
    const normalizedPassword = String(password ?? "").trim();
    if (!normalizedPassword) {
      throw new Error("Cần xác thực lại master password trước khi export");
    }
    return vaultService.exportToJson(vaultsRef.current, normalizedPassword);
  }, []);

  const importVaultData = useCallback(async (rawText, importPassword = "") => {
    const normalizedPassword = String(importPassword ?? "").trim();
    const parsedVaults = await vaultService.importFromJson(rawText, normalizedPassword);
    if (!sessionKeyRef.current) {
      throw new Error("Phiên đang khóa. Vui lòng mở khóa trước khi import");
    }
    await setVaults(parsedVaults);
    return parsedVaults;
  }, [setVaults]);

  const resetAutoLockTimer = useCallback(() => {
    if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
    if (!session?.isAuthenticated || !isSessionUnlocked) return;

    inactivityTimerRef.current = setTimeout(() => {
      lockSession();
      requestSessionUnlock();
      notify("Phiên đã tự khóa do không hoạt động", "warning");
    }, Number(autoLockMinutes) * 60 * 1000);
  }, [autoLockMinutes, isSessionUnlocked, lockSession, notify, requestSessionUnlock, session?.isAuthenticated]);

  useEffect(() => {
    if (!session?.isAuthenticated || !isSessionUnlocked) return undefined;

    resetAutoLockTimer();
    const onActivity = () => resetAutoLockTimer();

    ACTIVITY_EVENTS.forEach((eventName) => window.addEventListener(eventName, onActivity, { passive: true }));
    return () => {
      ACTIVITY_EVENTS.forEach((eventName) => window.removeEventListener(eventName, onActivity));
    };
  }, [isSessionUnlocked, resetAutoLockTimer, session?.isAuthenticated]);

  const value = useMemo(() => ({
    session,
    setSession,
    vaults,
    setVaults,
    profile,
    setProfile,
    theme,
    setTheme,
    search,
    setSearch,
    autoLockMinutes,
    setAutoLockMinutes,
    bootstrapped,
    hasMasterPassword: Boolean(masterPasswordRecord),
    hasVaultData,
    isSessionUnlocked,
    setSessionUnlocked,
    lockSession,
    requestSessionUnlock,
    authBusy,
    masterGate,
    requestMasterAction,
    closeMasterGate,
    confirmMasterGate,
    toast,
    notify,
    clearToast,
    signInGoogle,
    connectWallet,
    logout,
    createMasterPassword,
    verifyMasterPassword,
    updateMasterPassword,
    clearAllVaultData,
    exportVaultData,
    importVaultData,
    unlockWithMasterPassword: runSessionUnlock
  }), [
    session,
    setSession,
    vaults,
    setVaults,
    profile,
    setProfile,
    theme,
    setTheme,
    search,
    setSearch,
    autoLockMinutes,
    setAutoLockMinutes,
    bootstrapped,
    masterPasswordRecord,
    hasVaultData,
    isSessionUnlocked,
    setSessionUnlocked,
    lockSession,
    requestSessionUnlock,
    authBusy,
    masterGate,
    requestMasterAction,
    closeMasterGate,
    confirmMasterGate,
    toast,
    notify,
    clearToast,
    signInGoogle,
    connectWallet,
    logout,
    createMasterPassword,
    verifyMasterPassword,
    updateMasterPassword,
    clearAllVaultData,
    exportVaultData,
    importVaultData,
    runSessionUnlock
  ]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error("useApp must be used within AppProvider");
  return context;
}
