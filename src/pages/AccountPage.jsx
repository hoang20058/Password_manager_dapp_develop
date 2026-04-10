import { useApp } from "../context/AppContext";
import PageHeader from "../components/shared/PageHeader";
import { useNavigate } from "react-router-dom";

export default function AccountPage() {
  const navigate = useNavigate();
  const { profile, setProfile, session, signInGoogle, connectWallet, logout, authBusy } = useApp();

  const handleLogout = async () => {
    await logout();
    navigate("/auth", { replace: true });
  };

  return (
    <section className="space-y-4">
      <PageHeader
        eyebrow="Cài đặt"
        title="Tài khoản của tôi"
        description="Quản lý thông tin định danh, trạng thái đăng nhập Google và ví kết nối."
      />
      <div className="grid gap-4 xl:grid-cols-2">
        <form className="panel space-y-3 p-6" onSubmit={(event) => event.preventDefault()}>
          <h3 className="text-lg font-semibold">Hồ sơ cá nhân</h3>
          <input className="field" value={profile.name} onChange={(event) => setProfile((prev) => ({ ...prev, name: event.target.value }))} placeholder="Họ và tên" />
          <input className="field" value={profile.username} onChange={(event) => setProfile((prev) => ({ ...prev, username: event.target.value }))} placeholder="Tên đăng nhập" />
          <input className="field" value={profile.email} onChange={(event) => setProfile((prev) => ({ ...prev, email: event.target.value }))} placeholder="Email" />
          <input className="field" value={profile.bio} onChange={(event) => setProfile((prev) => ({ ...prev, bio: event.target.value }))} placeholder="Mô tả" />
        </form>

        <div className="panel space-y-3 p-6">
          <h3 className="text-lg font-semibold">Hybrid Auth</h3>
          <p className="text-sm text-app-muted">Trạng thái hiện tại: {session?.provider || "chưa xác thực"}</p>
          <div className="flex flex-wrap gap-2">
            <button className="btn-primary" type="button" onClick={signInGoogle} disabled={authBusy}>Đăng nhập Google</button>
            <button className="btn-soft" type="button" onClick={connectWallet} disabled={authBusy}>Kết nối ví</button>
            <button className="btn-soft text-red-500" type="button" onClick={handleLogout} disabled={authBusy}>Đăng xuất</button>
          </div>
        </div>
      </div>
    </section>
  );
}
