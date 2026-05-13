import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Link2, LogIn, Shield, Wallet } from "lucide-react";
import { useApp } from "../context/AppContext";
import { evaluatePasswordStrength } from "../utils/password";
import PasswordStrengthHint from "../components/security/PasswordStrengthHint";

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
    unlockWithMasterPassword
  } = useApp();
  const [error, setError] = useState("");
  const [tab, setTab] = useState("login");
  const [step, setStep] = useState(1);
  const [identity, setIdentity] = useState(null);
  const [loginMaster, setLoginMaster] = useState("");
  const [registerMaster, setRegisterMaster] = useState("");
  const [registerConfirm, setRegisterConfirm] = useState("");

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
  };

  const handleLogin = async (event) => {
    event.preventDefault();
    if (!identity) return setError("Vui lòng chọn Google hoặc Connect ví trước khi đăng nhập");
    if (!hasMasterPassword) {
      setTab("register");
      return setError("Bạn chưa đăng ký master password. Hệ thống đã chuyển sang tab Đăng ký.");
    }
    if (!loginMaster) return setError("Vui lòng nhập master password");

    const result = await unlockWithMasterPassword(loginMaster);
    if (!result.ok) return setError(result.message || "Master password không chính xác");

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

  return (
    <main className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.14),_transparent_35%),linear-gradient(135deg,_#f8fafc,_#e2e8f0)] p-4">
      <div className="panel w-full max-w-5xl overflow-hidden rounded-[32px] p-0 shadow-2xl shadow-slate-900/10 lg:grid lg:grid-cols-[1.1fr_0.9fr]">
        <section className="bg-gradient-to-br from-[#0f172a] via-[#12263f] to-[#1e3a5f] p-8 text-white lg:p-10">
          <div className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10">
            <Shield className="h-6 w-6" />
          </div>
          <p className="text-sm uppercase tracking-[0.2em] text-white/60">Auth Gateway</p>
          <h1 className="mt-2 text-3xl font-bold leading-tight lg:text-4xl">Đăng nhập danh tính trước, mở kho bằng Master Password</h1>
          <p className="mt-4 max-w-xl text-sm text-white/75">
            DApp sử dụng Google/Wallet để định danh. Đăng ký sẽ tạo master password mới, đăng nhập sẽ xác thực master password hiện có.
          </p>
          <div className="mt-6 rounded-2xl border border-white/20 bg-white/5 p-4 text-sm text-white/80">
            <Link2 className="mr-2 inline-block h-4 w-4" />
            Trạng thái master: {hasMasterPassword ? "Đã tạo" : "Chưa tạo"}
          </div>
        </section>

        <section className="space-y-4 p-8 lg:p-10">
          <div className="grid grid-cols-2 gap-2 rounded-xl bg-app-surface-alt p-1">
            <button
              className={`rounded-lg py-2 text-sm font-medium ${tab === "login" ? "bg-app-surface" : "text-app-muted"}`}
              type="button"
              onClick={() => resetStepFlow("login")}
            >
              Đăng nhập
            </button>
            <button
              className={`rounded-lg py-2 text-sm font-medium ${tab === "register" ? "bg-app-surface" : "text-app-muted"}`}
              type="button"
              onClick={() => resetStepFlow("register")}
            >
              Đăng ký
            </button>
          </div>

          <div className="rounded-2xl border border-app-border bg-app-surface-alt p-3 text-xs text-app-muted">
            Tiến trình: Bước {step}/2 {step === 1 ? "- Định danh tài khoản" : "- Nhập Master Password"}
          </div>

          {step === 1 ? (
            <div className="space-y-2 rounded-2xl border bg-app-surface-alt p-4">
              <p className="text-sm font-semibold">Bước 1: Chọn phương thức định danh</p>
              <div className="grid gap-2">
                <button className="btn-primary w-full gap-2" type="button" onClick={handleSelectGoogle} disabled={authBusy}>
                  <LogIn className="h-4 w-4" />
                  Đăng nhập bằng Google
                </button>
                <button className="btn-soft w-full gap-2" type="button" onClick={handleSelectWallet} disabled={authBusy}>
                  <Wallet className="h-4 w-4" />
                  Connect ví trực tiếp
                </button>
              </div>
              <p className="text-xs text-app-muted">
                Đã chọn: {identity ? (identity.email || identity.address || identity.displayName || identity.provider) : "Chưa chọn"}
              </p>
            </div>
          ) : null}

          {step === 2 ? (
            <>
              <div className="rounded-2xl border border-red-300 bg-red-50 p-3 text-sm text-red-700">
                <p className="font-semibold">Lưu ý quan trọng về Master Password</p>
                <p className="mt-1">
                  Master Password dùng để mở kho dữ liệu. Nếu quên mật khẩu này, bạn có thể mất quyền truy cập vào dữ liệu đã lưu.
                </p>
              </div>

              {tab === "login" ? (
                <form className="space-y-3" onSubmit={handleLogin}>
                  <p className="text-sm font-semibold">Bước 2: Xác thực Master Password để vào kho</p>
                  {!hasMasterPassword ? (
                    <div className="rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-700">
                      Tài khoản này chưa có master password. Vui lòng chuyển sang tab Đăng ký để tạo master trước khi đăng nhập.
                    </div>
                  ) : null}
                  <input
                    className="field"
                    type="password"
                    placeholder="Nhập master password"
                    value={loginMaster}
                    onChange={(event) => setLoginMaster(event.target.value)}
                  />
                  <button className="btn-primary w-full" type="submit" disabled={authBusy || !hasMasterPassword}>Đăng nhập vào Vault</button>
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
                  <button className="btn-primary w-full" type="submit" disabled={authBusy || !registerStrength.meetsPolicy}>Đăng ký và vào Vault</button>
                </form>
              )}

              <button className="btn-soft w-full" type="button" onClick={() => setStep(1)}>
                Quay lại bước định danh
              </button>

            </>
          ) : null}

          {error ? <div className="panel border-red-200 p-4 text-sm text-red-600">{error}</div> : null}
        </section>
      </div>
    </main>
  );
}
