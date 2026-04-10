import { Link2, LogIn, Shield, Wallet } from "lucide-react";

export default function HybridAuthCard({ onGoogleSignIn, onConnectWallet, busy }) {
  return (
    <div className="panel w-full max-w-4xl overflow-hidden rounded-[28px] p-0 shadow-2xl shadow-slate-900/10 lg:grid lg:grid-cols-[1.1fr_0.9fr]">
      <div className="bg-gradient-to-br from-[#0f172a] via-[#12263f] to-[#1e3a5f] p-8 text-white lg:p-10">
        <div className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10">
          <Shield className="h-6 w-6" />
        </div>
        <p className="text-sm uppercase tracking-[0.2em] text-white/60">Hybrid Auth</p>
        <h1 className="mt-2 text-3xl font-bold leading-tight lg:text-4xl">Đăng nhập bằng Google, kết nối ví và bảo vệ bằng Master Password</h1>
        <p className="mt-4 max-w-xl text-sm text-white/75">
          Cấu trúc DApp cho phép xác thực người dùng bằng Google, MetaMask và lớp bảo mật cục bộ trước khi thực hiện các thao tác nhạy cảm.
        </p>
      </div>

      <div className="space-y-4 p-8 lg:p-10">
        <div className="rounded-2xl border bg-app-surface-alt p-4">
          <p className="text-sm font-semibold">Google Auth</p>
          <p className="mt-1 text-sm text-app-muted">Firebase/Supabase có thể cấu hình qua biến môi trường. Khi chưa có cấu hình, hệ thống dùng luồng mô phỏng để dev local.</p>
          <button className="btn-primary mt-4 w-full gap-2" type="button" onClick={onGoogleSignIn} disabled={busy}>
            <LogIn className="h-4 w-4" />
            Đăng nhập Google
          </button>
        </div>

        <div className="rounded-2xl border bg-app-surface-alt p-4">
          <p className="text-sm font-semibold">Wallet Connect</p>
          <p className="mt-1 text-sm text-app-muted">Kết nối MetaMask hoặc ví tương thích EIP-1193. RainbowKit có thể gắn thêm ở bước UI nếu muốn mở rộng.</p>
          <button className="btn-soft mt-4 w-full gap-2" type="button" onClick={onConnectWallet} disabled={busy}>
            <Wallet className="h-4 w-4" />
            Kết nối ví
          </button>
        </div>

        <div className="rounded-2xl border border-dashed p-4 text-sm text-app-muted">
          <Link2 className="mr-2 inline-block h-4 w-4" />
          Sau khi xác thực thành công, người dùng sẽ được điều hướng vào khu vực DApp có kiểm soát bằng route.
        </div>
      </div>
    </div>
  );
}
