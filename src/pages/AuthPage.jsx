import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Link2, Shield, Wallet } from "lucide-react";
import { useApp } from "../context/AppContext";
import { evaluatePasswordStrength } from "../utils/password";
import PasswordStrengthHint from "../components/security/PasswordStrengthHint";
import LoadingSpinner from "../components/ui/LoadingSpinner";

export default function AuthPage() {
  const navigate = useNavigate();
  const {
    session,
    signInGoogle,
    connectWallet,
    bootstrapped,
    authBusy,
    setSession,
    setProfile,
    hasMasterPassword,
    createMasterPassword,
    unlockWithMasterPassword,
    syncVaultOnLoginIfNeeded
  } = useApp();
  const [error, setError] = useState("");
  const [syncNotice, setSyncNotice] = useState("");
  const [tab, setTab] = useState("login");
  const [step, setStep] = useState(1);
  const [identity, setIdentity] = useState(null);
  const [loginMaster, setLoginMaster] = useState("");
  const [registerMaster, setRegisterMaster] = useState("");
  const [registerConfirm, setRegisterConfirm] = useState("");
  const [isSyncing, setIsSyncing] = useState(false);

  const registerStrength = useMemo(
    () =>
      evaluatePasswordStrength(registerMaster, [
        identity?.email || "",
        identity?.displayName || "",
        identity?.address || ""
      ]),
    [identity?.address, identity?.displayName, identity?.email, registerMaster]
  );

  const applyIdentityToProfile = (selectedIdentity) => {
    if (!selectedIdentity) return;
    setProfile((prev) => ({
      ...prev,
      name: selectedIdentity.displayName || prev.name,
      email: selectedIdentity.email || prev.email,
      username: selectedIdentity.email?.split("@")[0] || selectedIdentity.address?.slice(0, 10) || prev.username
    }));
  };

  const finalizeSession = (selectedIdentity) => {
    const isGoogle = selectedIdentity.provider === "google";
    setSession({
      isAuthenticated: true,
      provider: selectedIdentity.provider,
      google: isGoogle ? selectedIdentity : null,
      wallet: isGoogle ? null : selectedIdentity
    });
    applyIdentityToProfile(selectedIdentity);
    navigate("/app/vault", { replace: true });
  };

  useEffect(() => {
    if (bootstrapped && session?.isAuthenticated) {
      navigate("/app/vault", { replace: true });
    }
  }, [bootstrapped, navigate, session]);

  const handleSelectGoogle = async () => {
    try {
      const googleIdentity = await signInGoogle(false);
      setIdentity(googleIdentity);
      setStep(2);
      setError("");
      setSyncNotice("");
    } catch (appError) {
      setError(appError.message || "Không thể đăng nhập Google");
    }
  };

  const handleSelectWallet = async () => {
    try {
      const walletIdentity = await connectWallet(false);
      setIdentity(walletIdentity);
      setStep(2);
      setError("");
      setSyncNotice("");
    } catch (appError) {
      setError(appError.message || "Không thể kết nối ví");
    }
  };

  const resetStepFlow = (nextTab) => {
    setTab(nextTab);
    setStep(1);
    setIdentity(null);
    setLoginMaster("");
    setRegisterMaster("");
    setRegisterConfirm("");
    setError("");
    setSyncNotice("");
  };

  const handleLogin = async (event) => {
    event.preventDefault();
    if (!identity) return setError("Vui lòng chọn Google hoặc Connect ví trước khi đăng nhập");
    if (!hasMasterPassword) {
      setTab("register");
      return setError("Bạn chưa đăng ký master password. Hệ thống đã chuyển sang tab Đăng ký.");
    }
    if (!loginMaster) return setError("Vui lòng nhập master password");

    setError("");
    setSyncNotice("");

    const result = await unlockWithMasterPassword(loginMaster);
    if (!result.ok) return setError(result.message || "Master password không chính xác");

    if (identity?.address && window.ethereum) {
      setIsSyncing(true);
      setSyncNotice("Đang kiểm tra dữ liệu mới nhất từ blockchain...");
      try {
        const syncResult = await syncVaultOnLoginIfNeeded(identity.address, {
          onProgress: ({ message }) => {
            if (message) setSyncNotice(message);
          }
        });

        setSyncNotice(
          syncResult.synced
            ? `Đã đồng bộ ${syncResult.count ?? 0} mục từ chain.`
            : syncResult.reason || "Không có dữ liệu mới trên chain."
        );
      } finally {
        setIsSyncing(false);
      }
    }

    finalizeSession(identity);
  };

  const handleRegister = async (event) => {
    event.preventDefault();
    if (!identity) return setError("Vui lòng chọn Google hoặc Connect ví trước khi đăng ký");
    if (hasMasterPassword) return setError("Master password đã tồn tại. Hãy dùng tab Đăng nhập");
    if (!registerStrength.meetsPolicy) {
      return setError("Master password chưa đủ mạnh. Hãy tăng độ dài và độ phức tạp.");
    }
    if (registerMaster !== registerConfirm) return setError("Xác nhận master password không khớp");

    try {
      await createMasterPassword(registerMaster);
      finalizeSession(identity);
    } catch (appError) {
      setError(appError.message || "Không thể đăng ký");
    }
  };

  const selectedIdentity = identity
    ? identity.email || identity.address || identity.displayName || identity.provider
    : "Chưa chọn";

  return (
    <main className="flex min-h-[100dvh] items-center justify-center overflow-x-hidden bg-app-bg p-4 text-app-text sm:p-6">
      <div className="grid w-full max-w-6xl overflow-hidden rounded-[2rem] border border-app-border bg-app-surface shadow-modal lg:grid-cols-[1.05fr_0.95fr]">
        <section className="relative overflow-hidden bg-[radial-gradient(circle_at_18%_18%,rgba(16,185,129,0.28),transparent_26rem),linear-gradient(135deg,#020617,#0f172a_48%,#111827)] p-8 text-white lg:p-10">
          <div className="relative z-10 flex min-h-full flex-col justify-between gap-10">
            <div>
              <div className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-white/15 bg-white/10 shadow-lg shadow-emerald-950/20">
                <Shield className="h-6 w-6" />
              </div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-200/80">Auth Gateway</p>
              <h1 className="mt-3 max-w-2xl text-3xl font-bold leading-tight lg:text-5xl">
                Đăng nhập danh tính trước, mở kho bằng Master Password
              </h1>
              <p className="mt-4 max-w-xl text-sm leading-6 text-slate-300">
                Google hoặc ví Web3 dùng để định danh. Master Password vẫn là chìa khóa cục bộ để mở dữ liệu mã hóa.
              </p>
            </div>

            <div className="rounded-2xl border border-white/15 bg-white/10 p-4 text-sm text-slate-200 backdrop-blur">
              <Link2 className="mr-2 inline-block h-4 w-4 text-emerald-200" />
              Trạng thái master: <span className="font-semibold text-white">{hasMasterPassword ? "Đã tạo" : "Chưa tạo"}</span>
            </div>
          </div>
        </section>

        <section className="space-y-4 p-6 sm:p-8 lg:p-10">
          <div className="grid grid-cols-2 gap-2 rounded-xl bg-app-surface-alt p-1">
            <button
              className={`rounded-lg px-3 py-2 text-sm font-semibold transition-all duration-200 ease-premium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-app-focus ${
                tab === "login" ? "bg-app-surface text-app-text shadow-sm" : "text-app-muted hover:text-app-text"
              }`}
              type="button"
              onClick={() => resetStepFlow("login")}
              disabled={isSyncing}
            >
              Đăng nhập
            </button>
            <button
              className={`rounded-lg px-3 py-2 text-sm font-semibold transition-all duration-200 ease-premium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-app-focus ${
                tab === "register" ? "bg-app-surface text-app-text shadow-sm" : "text-app-muted hover:text-app-text"
              }`}
              type="button"
              onClick={() => resetStepFlow("register")}
              disabled={isSyncing}
            >
              Đăng ký
            </button>
          </div>

          <div className="rounded-2xl border border-app-border bg-app-surface-alt p-3 text-xs text-app-muted">
            <div className="mb-2 h-2 overflow-hidden rounded-full bg-app-surface-muted">
              <div className="h-full rounded-full bg-app-primary transition-all duration-300 ease-premium" style={{ width: `${step * 50}%` }} />
            </div>
            Tiến trình: Bước {step}/2 {step === 1 ? "- Định danh tài khoản" : "- Nhập Master Password"}
          </div>

          {step === 1 ? (
            <div className="space-y-3 rounded-2xl border border-app-border bg-app-surface-alt/70 p-4">
              <p className="text-sm font-semibold">Bước 1: Chọn phương thức định danh</p>
              <div className="grid gap-3">
                <button
                  className="group flex w-full items-center justify-between gap-3 rounded-2xl border border-app-border bg-app-surface p-3 text-left shadow-sm transition-all duration-200 ease-premium hover:-translate-y-0.5 hover:border-app-primary/40 hover:shadow-card active:translate-y-0 active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-app-focus disabled:pointer-events-none disabled:opacity-50"
                  type="button"
                  onClick={handleSelectGoogle}
                  disabled={authBusy || isSyncing}
                >
                  <span className="flex min-w-0 items-center gap-3">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-lg font-bold text-[#4285f4] shadow-sm">
                      G
                    </span>
                    <span className="min-w-0">
                      <span className="block text-sm font-semibold text-app-text">Google Sign-in</span>
                      <span className="block truncate text-xs text-app-muted">Xác thực nhanh bằng tài khoản Google</span>
                    </span>
                  </span>
                  <ArrowRight className="h-4 w-4 text-app-muted transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-app-primary" />
                </button>

                <button
                  className="group flex w-full items-center justify-between gap-3 rounded-2xl border border-orange-400/30 bg-orange-500/10 p-3 text-left shadow-sm transition-all duration-200 ease-premium hover:-translate-y-0.5 hover:border-orange-400/60 hover:bg-orange-500/15 hover:shadow-card active:translate-y-0 active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 disabled:pointer-events-none disabled:opacity-50"
                  type="button"
                  onClick={handleSelectWallet}
                  disabled={authBusy || isSyncing}
                >
                  <span className="flex min-w-0 items-center gap-3">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-orange-500 text-white shadow-sm shadow-orange-900/20">
                      <Wallet className="h-5 w-5" />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-sm font-semibold text-app-text">Connect MetaMask</span>
                      <span className="block truncate text-xs text-app-muted">Kết nối ví Web3 trực tiếp</span>
                    </span>
                  </span>
                  <ArrowRight className="h-4 w-4 text-app-muted transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-orange-500" />
                </button>
              </div>
              <p className="text-xs text-app-muted">Đã chọn: {selectedIdentity}</p>
            </div>
          ) : null}

          {step === 2 ? (
            <>
              <div className="rounded-2xl border border-amber-400/30 bg-amber-500/10 p-3 text-sm text-amber-800 dark:text-amber-200">
                <p className="font-semibold">Lưu ý quan trọng về Master Password</p>
                <p className="mt-1 leading-6">
                  Master Password dùng để mở kho dữ liệu. Nếu quên mật khẩu này, bạn có thể mất quyền truy cập vào dữ liệu đã lưu.
                </p>
              </div>

              {syncNotice ? (
                <div className="rounded-2xl border border-app-border bg-app-surface-alt p-3">
                  {isSyncing ? (
                    <LoadingSpinner label="Đang đồng bộ..." description={syncNotice} />
                  ) : (
                    <p className="text-sm text-app-muted">{syncNotice}</p>
                  )}
                </div>
              ) : null}

              {tab === "login" ? (
                <form className="space-y-3" onSubmit={handleLogin}>
                  <p className="text-sm font-semibold">Bước 2: Xác thực Master Password để vào kho</p>
                  {!hasMasterPassword ? (
                    <div className="rounded-xl border border-amber-400/30 bg-amber-500/10 p-3 text-sm text-amber-800 dark:text-amber-200">
                      Tài khoản này chưa có master password. Vui lòng chuyển sang tab Đăng ký để tạo master trước khi đăng nhập.
                    </div>
                  ) : null}
                  <input
                    className="field"
                    type="password"
                    placeholder="Nhập master password"
                    value={loginMaster}
                    disabled={isSyncing}
                    onChange={(event) => setLoginMaster(event.target.value)}
                  />
                  <button className="btn-primary w-full" type="submit" disabled={authBusy || isSyncing || !hasMasterPassword}>
                    {isSyncing ? "Đang đồng bộ..." : "Đăng nhập vào Vault"}
                  </button>
                </form>
              ) : (
                <form className="space-y-3" onSubmit={handleRegister}>
                  <p className="text-sm font-semibold">Bước 2: Tạo Master Password lần đầu</p>
                  <input
                    className="field"
                    type="password"
                    placeholder="Tạo master password"
                    value={registerMaster}
                    onChange={(event) => setRegisterMaster(event.target.value)}
                  />
                  <PasswordStrengthHint
                    password={registerMaster}
                    userInputs={[identity?.email || "", identity?.displayName || "", identity?.address || ""]}
                    policyText="Master password phải đạt mức Khá trở lên và tối thiểu 8 ký tự."
                  />
                  <input
                    className="field"
                    type="password"
                    placeholder="Xác nhận master password"
                    value={registerConfirm}
                    onChange={(event) => setRegisterConfirm(event.target.value)}
                  />
                  <button className="btn-primary w-full" type="submit" disabled={authBusy || !registerStrength.meetsPolicy}>
                    Đăng ký và vào Vault
                  </button>
                </form>
              )}

              <button className="btn-soft w-full" type="button" onClick={() => setStep(1)} disabled={isSyncing}>
                Quay lại bước định danh
              </button>
            </>
          ) : null}

          {error ? <div className="panel border-rose-400/40 p-4 text-sm text-rose-600 dark:text-rose-300">{error}</div> : null}
        </section>
      </div>
    </main>
  );
}
