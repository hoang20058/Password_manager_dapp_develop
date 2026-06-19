import { useMemo, useState, useEffect } from "react";
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

  useEffect(() => {
    if (profile) {
      setGeneralProfile({
        name: profile.name || "",
        username: profile.username || "",
        email: profile.email || "",
        bio: profile.bio || ""
      });
    }
  }, [profile]);

  useEffect(() => {
    if (userProfile) {
      setSecProfile({
        fullName: userProfile.fullName || "",
        dob: userProfile.dob || "",
        phone: userProfile.phone || ""
      });
    }
  }, [userProfile]);

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

      {/* Tabs Switcher */}
      <div className="flex border-b border-white/5">
        <button
          onClick={() => setActiveTab("security")}
          className={`flex items-center gap-2 px-6 py-3.5 text-sm font-semibold border-b-2 transition-all duration-200 focus:outline-none ${
            activeTab === "security"
              ? "border-emerald-500 text-emerald-400"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
          type="button"
        >
          <Lock className="h-4 w-4" />
          Cấu hình bảo mật
        </button>
        <button
          onClick={() => setActiveTab("profile")}
          className={`flex items-center gap-2 px-6 py-3.5 text-sm font-semibold border-b-2 transition-all duration-200 focus:outline-none ${
            activeTab === "profile"
              ? "border-emerald-500 text-emerald-400"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
          type="button"
        >
          <User className="h-4 w-4" />
          Hồ sơ cá nhân
        </button>
      </div>

      {message && (
        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4 text-xs font-semibold text-emerald-400">
          {message}
        </div>
      )}

      {activeTab === "security" ? (
        <div className="grid gap-6 md:grid-cols-[0.9fr_1.1fr]">
          {/* Left Panel: Auto Lock settings */}
          <div className="bg-slate-900/40 border border-white/5 backdrop-blur-md p-6 rounded-3xl space-y-4 h-fit">
            <div className="space-y-1.5">
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <Clock className="h-4 w-4 text-emerald-400" />
                Tự động khóa phiên
              </h3>
              <p className="text-xs text-slate-400 leading-normal">
                Phiên làm việc sẽ tự động khóa sau khoảng thời gian không sử dụng để đảm bảo an toàn. Khi bạn thao tác trong ứng dụng, bộ đếm thời gian sẽ được làm mới.
              </p>
            </div>
            
            <div className="space-y-2 pt-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block" htmlFor="auto-lock-minutes">
                Thời gian chờ trước khi khóa
              </label>
              <select
                id="auto-lock-minutes"
                className="field bg-black/20 border-white/10 text-white placeholder-slate-650 focus:border-emerald-500 focus:ring-emerald-500/25"
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
          <form className="bg-slate-900/40 border border-white/5 backdrop-blur-md p-6 rounded-3xl space-y-4" onSubmit={submitMaster}>
            <div className="space-y-1.5">
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <Shield className="h-4 w-4 text-emerald-400" />
                Đổi Master Password
              </h3>
              <p className="text-xs text-slate-400 leading-normal">
                Thay đổi mật khẩu chủ dùng để mã hóa và giải mã dữ liệu két sắt cục bộ của bạn.
              </p>
            </div>
            
            <div className="space-y-3">
              <div className="space-y-1.5">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Mật khẩu hiện tại</span>
                <input 
                  className="field bg-black/20 border-white/10 text-white placeholder-slate-650 focus:border-emerald-500 focus:ring-emerald-500/25" 
                  type="password" 
                  placeholder="Nhập mật khẩu hiện tại" 
                  required
                  value={masterForm.current} 
                  onChange={(event) => setMasterForm((prev) => ({ ...prev, current: event.target.value }))} 
                />
              </div>

              <div className="space-y-1.5">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Mật khẩu mới</span>
                <input 
                  className="field bg-black/20 border-white/10 text-white placeholder-slate-650 focus:border-emerald-500 focus:ring-emerald-500/25" 
                  type="password" 
                  placeholder="Nhập mật khẩu mới" 
                  required
                  value={masterForm.next} 
                  onChange={(event) => setMasterForm((prev) => ({ ...prev, next: event.target.value }))} 
                />
              </div>

              <PasswordStrengthHint 
                password={masterForm.next} 
                userInputs={personalInputs} 
                policyText="Master password mới của bạn nên đạt mức Khá trở lên và tối thiểu 8 ký tự." 
              />

              <div className="space-y-1.5">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Xác nhận mật khẩu mới</span>
                <input 
                  className="field bg-black/20 border-white/10 text-white placeholder-slate-650 focus:border-emerald-500 focus:ring-emerald-500/25" 
                  type="password" 
                  placeholder="Xác nhận lại mật khẩu mới" 
                  required
                  value={masterForm.confirm} 
                  onChange={(event) => setMasterForm((prev) => ({ ...prev, confirm: event.target.value }))} 
                />
              </div>
            </div>

            <div className="pt-2">
              <button 
                className="btn-primary w-full h-11 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold shadow-glow shadow-emerald-500/10 flex items-center justify-center transition-all disabled:opacity-50 disabled:cursor-not-allowed" 
                type="submit" 
                disabled={!masterStrength.meetsPolicy}
              >
                Cập nhật Master Password
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {/* General Profile Section */}
          <form className="bg-slate-900/40 border border-white/5 backdrop-blur-md p-6 rounded-3xl space-y-4" onSubmit={handleSaveGeneralProfile}>
            <div className="space-y-1.5">
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <User className="h-4 w-4 text-emerald-400" />
                Hồ sơ công khai
              </h3>
              <p className="text-xs text-slate-400 leading-normal">
                Thông tin cơ bản hiển thị cục bộ trên thanh bên của ứng dụng.
              </p>
            </div>

            <div className="space-y-3">
              <div className="space-y-1.5">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Họ và tên</span>
                <input 
                  className="field bg-black/20 border-white/10 text-white placeholder-slate-650 focus:border-emerald-500 focus:ring-emerald-500/25" 
                  value={generalProfile.name} 
                  onChange={(e) => setGeneralProfile((prev) => ({ ...prev, name: e.target.value }))} 
                  placeholder="Nhập họ và tên hiển thị" 
                />
              </div>

              <div className="space-y-1.5">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Tên đăng nhập</span>
                <input 
                  className="field bg-black/20 border-white/10 text-white placeholder-slate-650 focus:border-emerald-500 focus:ring-emerald-500/25" 
                  value={generalProfile.username} 
                  onChange={(e) => setGeneralProfile((prev) => ({ ...prev, username: e.target.value }))} 
                  placeholder="Nhập username hiển thị" 
                />
              </div>

              <div className="space-y-1.5">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Email</span>
                <input 
                  className="field bg-black/20 border-white/10 text-white placeholder-slate-650 focus:border-emerald-500 focus:ring-emerald-500/25" 
                  type="email"
                  value={generalProfile.email} 
                  onChange={(e) => setGeneralProfile((prev) => ({ ...prev, email: e.target.value }))} 
                  placeholder="name@example.com" 
                />
              </div>

              <div className="space-y-1.5">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Mô tả tiểu sử</span>
                <textarea 
                  className="field bg-black/20 border-white/10 text-white placeholder-slate-650 focus:border-emerald-500 focus:ring-emerald-500/25 resize-none h-24 p-3" 
                  value={generalProfile.bio} 
                  onChange={(e) => setGeneralProfile((prev) => ({ ...prev, bio: e.target.value }))} 
                  placeholder="Viết một đoạn ngắn giới thiệu bản thân..." 
                />
              </div>
            </div>

            <div className="pt-2">
              <button 
                className="btn-primary w-full h-11 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold shadow-glow shadow-emerald-500/10 flex items-center justify-center transition-all" 
                type="submit"
              >
                Lưu hồ sơ công khai
              </button>
            </div>
          </form>

          {/* Secure Profile Section (Saved E2E encrypted in DApp vault) */}
          <form className="bg-slate-900/40 border border-white/5 backdrop-blur-md p-6 rounded-3xl space-y-4 flex flex-col justify-between" onSubmit={handleSaveSecProfile}>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                  <Shield className="h-4 w-4 text-emerald-400" />
                  Hồ sơ bảo mật tối ưu hóa
                </h3>
                <p className="text-xs text-slate-400 leading-normal">
                  Được mã hóa đầu-cuối bằng Master Password của bạn và lưu trữ phi tập trung an toàn trên Web3/IPFS.
                </p>
              </div>

              <div className="rounded-2xl border border-blue-500/20 bg-blue-500/5 p-4 flex gap-3 text-xs text-blue-400">
                <Info className="h-4.5 w-4.5 shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  Thông tin cá nhân này chỉ dùng cục bộ trong trình duyệt để phân tích, giúp bạn phát hiện xem Master Password có chứa thông tin dễ đoán trùng với họ tên, ngày sinh hay số điện thoại hay không. Dữ liệu thô tuyệt đối không bao giờ được lưu trữ hay gửi đi dưới dạng plaintext.
                </p>
              </div>

              <div className="space-y-3">
                <div className="space-y-1.5">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Họ và tên đầy đủ</span>
                  <input 
                    className="field bg-black/20 border-white/10 text-white placeholder-slate-650 focus:border-emerald-500 focus:ring-emerald-500/25" 
                    value={secProfile.fullName} 
                    onChange={(e) => setSecProfile((prev) => ({ ...prev, fullName: e.target.value }))} 
                    placeholder="Nhập họ và tên đầy đủ" 
                  />
                </div>

                <div className="space-y-1.5">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Ngày tháng năm sinh</span>
                  <input 
                    className="field bg-black/20 border-white/10 text-white placeholder-slate-650 focus:border-emerald-500 focus:ring-emerald-500/25 text-slate-300" 
                    type="date"
                    value={secProfile.dob} 
                    onChange={(e) => setSecProfile((prev) => ({ ...prev, dob: e.target.value }))} 
                  />
                </div>

                <div className="space-y-1.5">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Số điện thoại</span>
                  <input 
                    className="field bg-black/20 border-white/10 text-white placeholder-slate-650 focus:border-emerald-500 focus:ring-emerald-500/25" 
                    value={secProfile.phone} 
                    onChange={(e) => setSecProfile((prev) => ({ ...prev, phone: e.target.value }))} 
                    placeholder="Nhập số điện thoại cá nhân" 
                  />
                </div>
              </div>
            </div>

            <div className="pt-4">
              <button 
                className="btn-primary w-full h-11 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold shadow-glow shadow-emerald-500/10 flex items-center justify-center transition-all" 
                type="submit"
              >
                Đồng bộ lên Web3 & IPFS
              </button>
            </div>
          </form>
        </div>
      )}
    </section>
  );
}
