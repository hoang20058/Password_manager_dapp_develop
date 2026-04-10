import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useLocalStorage } from "../hooks/useLocalStorage";
import { STORAGE_KEYS } from "../utils/storageKeys";
import { hashSecret, normalizeStoredSecret, verifySecret } from "../utils/crypto";
import { signInWithGoogle, signOutGoogle } from "../services/authService";
import { connectMetaMask } from "../services/walletService";

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
  const [vaults, setVaults] = useLocalStorage(STORAGE_KEYS.VAULTS, []);
  const [profile, setProfile] = useLocalStorage(STORAGE_KEYS.USER_PROFILE, defaultProfile);
  const [theme, setTheme] = useLocalStorage(STORAGE_KEYS.THEME, "dark");

  const [masterPasswordHash, setMasterPasswordHash] = useState(null);
  const [accountPasswordHash, setAccountPasswordHash] = useState(null);
  const [bootstrapped, setBootstrapped] = useState(false);
  const [masterGate, setMasterGate] = useState({ open: false, purpose: "", action: null });
  const [authBusy, setAuthBusy] = useState(false);
  const [search, setSearch] = useLocalStorage("appSearch", "");
  const [autoLockMinutes, setAutoLockMinutes] = useLocalStorage(STORAGE_KEYS.AUTO_LOCK_MINUTES, 15);
  const [isSessionUnlocked, setSessionUnlocked] = useLocalStorage(STORAGE_KEYS.SESSION_UNLOCKED, false);
  const [toast, setToast] = useState(null);
  const toastTimerRef = useRef(null);
  const inactivityTimerRef = useRef(null);

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
      const defaultMasterPassword = import.meta.env.VITE_DEFAULT_MASTER_PASSWORD || "123456";
      const storedMaster =
        localStorage.getItem(STORAGE_KEYS.MASTER_PASSWORD) ||
        localStorage.getItem(STORAGE_KEYS.MASTER_PASSWORD_HASH) ||
        defaultMasterPassword;

      const storedAccount =
        localStorage.getItem(STORAGE_KEYS.ACCOUNT_PASSWORD) ||
        localStorage.getItem(STORAGE_KEYS.ACCOUNT_PASSWORD_HASH) ||
        (import.meta.env.VITE_DEFAULT_ACCOUNT_PASSWORD || "123456");

      const normalizedMaster = normalizeStoredSecret(storedMaster);
      const normalizedAccount = normalizeStoredSecret(storedAccount);

      const masterHash = normalizedMaster
        ? (normalizedMaster.startsWith("sha256:") ? normalizedMaster : await hashSecret(normalizedMaster))
        : null;
      const accountHash = normalizedAccount.startsWith("sha256:") ? normalizedAccount : await hashSecret(normalizedAccount);

      setMasterPasswordHash(masterHash);
      setAccountPasswordHash(accountHash);
      if (masterHash) {
        localStorage.setItem(STORAGE_KEYS.MASTER_PASSWORD_HASH, masterHash);
      } else {
        localStorage.removeItem(STORAGE_KEYS.MASTER_PASSWORD_HASH);
      }
      localStorage.setItem(STORAGE_KEYS.ACCOUNT_PASSWORD_HASH, accountHash);
      localStorage.removeItem(STORAGE_KEYS.MASTER_PASSWORD);
      localStorage.removeItem(STORAGE_KEYS.ACCOUNT_PASSWORD);
      setBootstrapped(true);
    };

    bootstrapSecrets();
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
    setSessionUnlocked(false);
    setSession(defaultSession);
  }, [setSession]);

  const lockSession = useCallback(() => {
    setSessionUnlocked(false);
    if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
  }, []);

  const runSessionUnlock = useCallback(async (password) => {
    if (!masterPasswordHash) {
      return { ok: false, message: "Bạn chưa tạo master password" };
    }
    const isValid = await verifySecret(password, masterPasswordHash);
    if (!isValid) {
      return { ok: false, message: "Sai mật khẩu master" };
    }
    setSessionUnlocked(true);
    return { ok: true };
  }, [masterPasswordHash]);

  const updateMasterPassword = useCallback(async (currentPassword, nextPassword) => {
    if (!masterPasswordHash) {
      return { ok: false, message: "Bạn chưa tạo master password" };
    }

    if (!masterPasswordHash || !(await verifySecret(currentPassword, masterPasswordHash))) {
      return { ok: false, message: "Sai mật khẩu master" };
    }

    const nextHash = await hashSecret(nextPassword);
    setMasterPasswordHash(nextHash);
    localStorage.setItem(STORAGE_KEYS.MASTER_PASSWORD_HASH, nextHash);
    return { ok: true };
  }, [masterPasswordHash]);

  const createMasterPassword = useCallback(async (nextPassword) => {
    const nextHash = await hashSecret(nextPassword);
    setMasterPasswordHash(nextHash);
    localStorage.setItem(STORAGE_KEYS.MASTER_PASSWORD_HASH, nextHash);
    return { ok: true };
  }, []);

  const verifyMasterPassword = useCallback(async (password) => {
    if (!masterPasswordHash) return false;
    return verifySecret(password, masterPasswordHash);
  }, [masterPasswordHash]);

  const updateAccountPassword = useCallback(async (currentPassword, nextPassword) => {
    if (!accountPasswordHash || !(await verifySecret(currentPassword, accountPasswordHash))) {
      return { ok: false, message: "Sai mật khẩu tài khoản" };
    }

    const nextHash = await hashSecret(nextPassword);
    setAccountPasswordHash(nextHash);
    localStorage.setItem(STORAGE_KEYS.ACCOUNT_PASSWORD_HASH, nextHash);
    return { ok: true };
  }, [accountPasswordHash]);

  const requestMasterAction = useCallback((purpose, action, options = {}) => {
    const { forceReauth = false } = options;

    if (!forceReauth && isSessionUnlocked) {
      action?.();
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
    const result = await runSessionUnlock(password);
    if (!result.ok) {
      setMasterGate((prev) => ({ ...prev, error: result.message || "Sai mật khẩu master" }));
      return result;
    }

    const action = masterGate.action;
    closeMasterGate();
    if (action) {
      await action();
    }
    return { ok: true };
  }, [closeMasterGate, masterGate.action, runSessionUnlock]);

  const clearAllVaultData = useCallback(() => {
    setVaults([]);
    notify("Đã xóa toàn bộ dữ liệu vault", "warning");
  }, [notify, setVaults]);

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
    hasMasterPassword: Boolean(masterPasswordHash),
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
    updateAccountPassword,
    clearAllVaultData
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
    masterPasswordHash,
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
    updateAccountPassword,
    clearAllVaultData
  ]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error("useApp must be used within AppProvider");
  return context;
}
