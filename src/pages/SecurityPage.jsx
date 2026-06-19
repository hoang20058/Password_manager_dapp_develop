import { useMemo, useState } from "react";
import { useApp } from "../context/AppContext";
import PageHeader from "../components/shared/PageHeader";
import PasswordStrengthHint from "../components/security/PasswordStrengthHint";
import { evaluatePasswordStrength, extractUserInputs } from "../utils/password";
import { Shield, User, Lock, Clock, Info } from "lucide-react";

export default function SecurityPage() {
  const { 
    updateMasterPassword, 
    autoLockMinutes, 
    setAutoLockMinutes, 
    userProfile, 
    setUserProfile,
    profile,
    setProfile,
    vaults,
    setVaults,
    notify 
  } = useApp();

  const [activeTab, setActiveTab] = useState("security");
  const [masterForm, setMasterForm] = useState({ current: "", next: "", confirm: "" });
  const [message, setMessage] = useState("");

  // general profile inputs
  const [generalProfile, setGeneralProfile] = useState({
    name: profile?.name || "",
    username: profile?.username || "",
    email: profile?.email || "",
    bio: profile?.bio || ""
  });

  // secure profile inputs (stored end-to-end encrypted in the vault)
  const [secProfile, setSecProfile] = useState({
    fullName: userProfile?.fullName || "",
    dob: userProfile?.dob || "",
    phone: userProfile?.phone || ""
  });

  const personalInputs = useMemo(
    () => extractUserInputs(userProfile),
    [userProfile]
  );

  const masterStrength = useMemo(
    () => evaluatePasswordStrength(masterForm.next, personalInputs),
    [masterForm.next, personalInputs]
  );

  const submitMaster = async (event) => {
    event.preventDefault();
    if (!masterStrength.meetsPolicy) return setMessage("Master password mới chưa đủ mạnh");
    if (masterForm.next !== masterForm.confirm) return setMessage("Xác nhận master password không khớp");
    
    setMessage("Đang cập nhật master password...");
    const result = await updateMasterPassword(masterForm.current, masterForm.next);
    setMessage(result.ok ? "Đã đổi master password thành công!" : result.message);
    if (result.ok) {
      setMasterForm({ current: "", next: "", confirm: "" });
    }
  };

  const handleSaveGeneralProfile = (e) => {
    e.preventDefault();
    setProfile(generalProfile);
    notify("Đã lưu hồ sơ cá nhân thành công!", "success");
  };

  const handleSaveSecProfile = async (e) => {
    e.preventDefault();
    try {
      setUserProfile(secProfile);
      // Save directly to the blockchain/IPFS by updating the vault package
      await setVaults(vaults, { userProfile: secProfile });
      notify("Đã đồng bộ thông tin tối ưu hóa bảo mật lên Web3!", "success");
    } catch (err) {
      notify("Đồng bộ thất bại: " + err.message, "danger");
    }
  };

  return (
    <section className="space-y-6 max-w-6xl mx-auto px-4 py-2">
      <PageHeader
        eyebrow="Cài đặt"
        title="Tài khoản & Bảo mật"
        description="Quản lý hồ sơ cá nhân, cấu hình thời gian khóa phiên và đổi Master Password bảo vệ két sắt."
      />

      {/* Tabs */}
      <div className="flex border-b border-slate-800">
        <button
          onClick={() => setActiveTab("security")}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-all duration-200 ${
            activeTab === "security"
              ? "border-emerald-500 text-emerald-400"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <Lock className="h-4 w-4" />
          Cấu hình bảo mật
        </button>
        <button
          onClick={() => setActiveTab("profile")}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-all duration-200 ${
            activeTab === "profile"
              ? "border-emerald-500 text-emerald-400"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <User className="h-4 w-4" />
          Hồ sơ cá nhân
        </button>
      </div>

      {message && (
        <div className="panel p-4 text-xs font-medium text-emerald-400 border-emerald-500/20 bg-emerald-500/5">
          {message}
        </div>
      )}

      {activeTab === "security" ? (
        <div className="grid gap-6 md:grid-cols-[0.9fr_1.1fr]">
          {/* Left Panel: Auto Lock settings */}
          <div className="panel bg-slate-900/40 border border-slate-800 backdrop-blur-md p-6 space-y-4 h-fit">
            <div className="space-y-1">
              <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
                <Clock className="h-4 w-4 text-slate-400" />
                Tự động khóa phiên
              </h3>
              <p className="text-xs text-slate-400 leading-normal">
                Phiên sẽ tự khóa sau khoảng thời gian không sử dụng. Khi có thao tác trong ứng dụng, bộ đếm sẽ được làm mới.
              </p>
            </div>
            
            <div className="space-y-2 pt-2">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider" htmlFor="auto-lock-minutes">
                Thời gian không sử dụng trước khi khóa
              </label>
              <select
                id="auto-lock-minutes"
                className="field bg-slate-950 border-slate-800 text-slate-150 focus:border-emerald-500 focus:ring-emerald-500/20"
                value={String(autoLockMinutes)}
                onChange={(event) => setAutoLockMinutes(Number(event.target.value))}
              >
                <option value="5">5 phút</option>
                <option value="15">15 phút</option>
                <option value="30">30 phút</option>
                <option value="60">1 giờ</option>
              </select>
            </div>
          </div>

          {/* Right Panel: Change master password */}
          <form className="panel bg-slate-900/40 border border-slate-800 backdrop-blur-md p-6 space-y-4" onSubmit={submitMaster}>
            <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
              <Shield className="h-4 w-4 text-slate-400" />
              Đổi Master Password
            </h3>
            
            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Mật khẩu hiện tại</label>
                <input 
                  className="field bg-slate-950 border-slate-800 text-slate-150 focus:border-emerald-500 focus:ring-emerald-500/20" 
                  type="password" 
                  placeholder="Mật khẩu hiện tại" 
                  value={masterForm.current} 
                  onChange={(event) => setMasterForm((prev) => ({ ...prev, current: event.target.value }))} 
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Mật khẩu mới</label>
                <input 
                  className="field bg-slate-950 border-slate-800 text-slate-150 focus:border-emerald-500 focus:ring-emerald-500/20" 
                  type="password" 
                  placeholder="Mật khẩu mới" 
                  value={masterForm.next} 
                  onChange={(event) => setMasterForm((prev) => ({ ...prev, next: event.target.value }))} 
                />
              </div>

              <PasswordStrengthHint 
                password={masterForm.next} 
                userInputs={personalInputs} 
                policyText="Master password phải đạt mức Khá trở lên và tối thiểu 8 ký tự." 
              />

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Xác nhận mật khẩu</label>
                <input 
                  className="field bg-slate-950 border-slate-800 text-slate-150 focus:border-emerald-500 focus:ring-emerald-500/20" 
                  type="password" 
                  placeholder="Xác nhận mật khẩu" 
                  value={masterForm.confirm} 
                  onChange={(event) => setMasterForm((prev) => ({ ...prev, confirm: event.target.value }))} 
                />
              </div>
            </div>

            <button 
              className="btn-primary w-full h-11 bg-emerald-600 hover:bg-emerald-500 text-white font-medium shadow-md shadow-emerald-950/10 active:scale-[0.99] transition-all" 
              type="submit" 
              disabled={!masterStrength.meetsPolicy}
            >
              Cập nhật Master Password
            </button>
          </form>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {/* General Profile Section */}
          <form className="panel bg-slate-900/40 border border-slate-800 backdrop-blur-md p-6 space-y-4" onSubmit={handleSaveGeneralProfile}>
            <div className="space-y-1">
              <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
                👤 Hồ sơ công khai
              </h3>
              <p className="text-xs text-slate-400">
                Thông tin cơ bản hiển thị cục bộ trên ứng dụng.
              </p>
            </div>

            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Họ và tên</label>
                <input 
                  className="field bg-slate-950 border-slate-800 text-slate-150 focus:border-emerald-500" 
                  value={generalProfile.name} 
                  onChange={(e) => setGeneralProfile((prev) => ({ ...prev, name: e.target.value }))} 
                  placeholder="Họ và tên" 
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Tên đăng nhập</label>
                <input 
                  className="field bg-slate-950 border-slate-800 text-slate-150 focus:border-emerald-500" 
                  value={generalProfile.username} 
                  onChange={(e) => setGeneralProfile((prev) => ({ ...prev, username: e.target.value }))} 
                  placeholder="Tên đăng nhập" 
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Email</label>
                <input 
                  className="field bg-slate-950 border-slate-800 text-slate-150 focus:border-emerald-500" 
                  value={generalProfile.email} 
                  onChange={(e) => setGeneralProfile((prev) => ({ ...prev, email: e.target.value }))} 
                  placeholder="Email" 
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Mô tả tiểu sử</label>
                <input 
                  className="field bg-slate-950 border-slate-800 text-slate-150 focus:border-emerald-500" 
                  value={generalProfile.bio} 
                  onChange={(e) => setGeneralProfile((prev) => ({ ...prev, bio: e.target.value }))} 
                  placeholder="Mô tả tiểu sử ngắn" 
                />
              </div>
            </div>

            <button 
              className="btn-primary w-full h-11 bg-emerald-600 hover:bg-emerald-500 text-white font-medium transition-all" 
              type="submit"
            >
              Lưu hồ sơ công khai
            </button>
          </form>

          {/* Secure Profile Section (Saved E2E encrypted in DApp vault) */}
          <form className="panel bg-slate-900/40 border border-slate-800 backdrop-blur-md p-6 space-y-4 flex flex-col justify-between" onSubmit={handleSaveSecProfile}>
            <div className="space-y-4">
              <div className="space-y-1">
                <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
                  🔒 Thông tin tối ưu hóa bảo mật
                </h3>
                <p className="text-xs text-slate-400">
                  Được mã hóa đầu-cuối bằng Master Password và lưu trữ phi tập trung trên Web3/IPFS.
                </p>
              </div>

              <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-3 flex gap-2.5 text-xs text-blue-400">
                <Info className="h-4 w-4 shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  Thông tin này chỉ dùng cục bộ để phát hiện xem Master Password của bạn có chứa thông tin cá nhân dễ đoán hay không. Hệ thống không lưu trữ plaintext.
                </p>
              </div>

              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Họ và tên đầy đủ</label>
                  <input 
                    className="field bg-slate-950 border-slate-800 text-slate-150 focus:border-emerald-500" 
                    value={secProfile.fullName} 
                    onChange={(e) => setSecProfile((prev) => ({ ...prev, fullName: e.target.value }))} 
                    placeholder="Họ và tên khai sinh" 
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Ngày tháng năm sinh</label>
                  <input 
                    className="field bg-slate-950 border-slate-800 text-slate-150 focus:border-emerald-500" 
                    type="date"
                    value={secProfile.dob} 
                    onChange={(e) => setSecProfile((prev) => ({ ...prev, dob: e.target.value }))} 
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Số điện thoại</label>
                  <input 
                    className="field bg-slate-950 border-slate-800 text-slate-150 focus:border-emerald-500" 
                    value={secProfile.phone} 
                    onChange={(e) => setSecProfile((prev) => ({ ...prev, phone: e.target.value }))} 
                    placeholder="Số điện thoại cá nhân" 
                  />
                </div>
              </div>
            </div>

            <button 
              className="btn-primary w-full h-11 bg-emerald-600 hover:bg-emerald-500 text-white font-medium mt-4 transition-all" 
              type="submit"
            >
              Đồng bộ lên Web3 & IPFS
            </button>
          </form>
        </div>
      )}
    </section>
  );
}
