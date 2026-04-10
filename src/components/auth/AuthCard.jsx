import { useState } from "react";
import { Eye, EyeOff, LogIn, Shield, Wallet } from "lucide-react";

export default function AuthCard({ onLogin, onGoogleSignIn, onConnectWallet, busy = false }) {
  const [tab, setTab] = useState("login");
  const [form, setForm] = useState({ email: "", password: "", name: "" });
  const [showPassword, setShowPassword] = useState(false);

  const submit = (event) => {
    event.preventDefault();
    onLogin({
      name: form.name || "miniminZ",
      email: form.email,
      username: form.email.split("@")[0] || "guest"
    });
  };

  return (
    <div className="panel w-full max-w-md p-7">
      <div className="mb-6 text-center">
        <div className="mb-2 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-app-primary/10 text-app-primary">
          <Shield className="h-6 w-6" />
        </div>
        <h1 className="text-2xl font-bold">Password Vault</h1>
        <p className="mt-1 text-sm text-app-muted">Đăng nhập để quản lý dữ liệu an toàn</p>
      </div>

      <div className="mb-5 grid grid-cols-2 gap-2 rounded-xl bg-app-surface-alt p-1">
        <button
          className={`rounded-lg py-2 text-sm font-medium ${tab === "login" ? "bg-app-surface" : "text-app-muted"}`}
          onClick={() => setTab("login")}
          type="button"
        >
          Đăng nhập
        </button>
        <button
          className={`rounded-lg py-2 text-sm font-medium ${tab === "register" ? "bg-app-surface" : "text-app-muted"}`}
          onClick={() => setTab("register")}
          type="button"
        >
          Đăng ký
        </button>
      </div>

      <form className="space-y-3" onSubmit={submit}>
        {tab === "register" && (
          <input
            className="field"
            required
            placeholder="Họ và tên"
            value={form.name}
            onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
          />
        )}
        <input
          className="field"
          type="email"
          required
          placeholder="Email"
          value={form.email}
          onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
        />
        <input
          className="field"
          type={showPassword ? "text" : "password"}
          required
          minLength={6}
          placeholder="Mật khẩu"
          value={form.password}
          onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
        />

        <button
          className="btn-soft w-full gap-2"
          type="button"
          onClick={() => setShowPassword((prev) => !prev)}
        >
          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          {showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
        </button>

        <button className="btn-primary w-full gap-2" type="submit" disabled={busy}>
          <LogIn className="h-4 w-4" />
          {tab === "login" ? "Đăng nhập" : "Tạo tài khoản"}
        </button>
      </form>

      <div className="my-5 flex items-center gap-3 text-xs uppercase tracking-[0.2em] text-app-muted">
        <span className="h-px flex-1 bg-app-border" />
        hoặc
        <span className="h-px flex-1 bg-app-border" />
      </div>

      <div className="space-y-2">
        <button className="btn-primary w-full gap-2" type="button" onClick={onGoogleSignIn} disabled={busy}>
          <Shield className="h-4 w-4" />
          Đăng nhập bằng Google
        </button>
        <button className="btn-soft w-full gap-2" type="button" onClick={onConnectWallet} disabled={busy}>
          <Wallet className="h-4 w-4" />
          Connect ví để đăng nhập
        </button>
      </div>
    </div>
  );
}
