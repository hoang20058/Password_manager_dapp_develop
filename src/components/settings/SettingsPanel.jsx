import { useRef, useState } from "react";
import { Download, Trash2, Upload } from "lucide-react";

export default function SettingsPanel({
  profile,
  setProfile,
  masterPassword,
  setMasterPassword,
  accountPassword,
  setAccountPassword,
  onExport,
  onImport,
  onDeleteAll,
  onToast
}) {
  const fileInputRef = useRef(null);
  const [draft, setDraft] = useState(profile);
  const [passwordForm, setPasswordForm] = useState({ current: "", next: "", confirm: "", mode: "master" });

  const saveProfile = (event) => {
    event.preventDefault();
    setProfile(draft);
    onToast("Đã cập nhật hồ sơ", "success");
  };

  const submitPassword = (event) => {
    event.preventDefault();
    if (passwordForm.next !== passwordForm.confirm) {
      onToast("Xác nhận mật khẩu không khớp", "warning");
      return;
    }

    if (passwordForm.mode === "master") {
      if (passwordForm.current !== masterPassword) {
        onToast("Sai mật khẩu master", "danger");
        return;
      }
      setMasterPassword(passwordForm.next);
      onToast("Đã đổi mật khẩu master", "success");
    } else {
      if (passwordForm.current !== accountPassword) {
        onToast("Sai mật khẩu tài khoản", "danger");
        return;
      }
      setAccountPassword(passwordForm.next);
      onToast("Đã đổi mật khẩu tài khoản", "success");
    }

    setPasswordForm({ current: "", next: "", confirm: "", mode: passwordForm.mode });
  };

  return (
    <section className="grid gap-4 xl:grid-cols-2">
      <form className="panel space-y-3 p-5" onSubmit={saveProfile}>
        <h3 className="text-lg font-semibold">Hồ sơ người dùng</h3>
        <input
          className="field"
          placeholder="Họ và tên"
          value={draft.name}
          onChange={(event) => setDraft((prev) => ({ ...prev, name: event.target.value }))}
        />
        <input
          className="field"
          placeholder="Username"
          value={draft.username}
          onChange={(event) => setDraft((prev) => ({ ...prev, username: event.target.value }))}
        />
        <input
          className="field"
          type="email"
          placeholder="Email"
          value={draft.email}
          onChange={(event) => setDraft((prev) => ({ ...prev, email: event.target.value }))}
        />
        <input
          className="field"
          placeholder="Bio"
          value={draft.bio}
          onChange={(event) => setDraft((prev) => ({ ...prev, bio: event.target.value }))}
        />
        <button className="btn-primary" type="submit">
          Lưu thông tin
        </button>
      </form>

      <form className="panel space-y-3 p-5" onSubmit={submitPassword}>
        <h3 className="text-lg font-semibold">Bảo mật tài khoản</h3>
        <select
          className="field"
          value={passwordForm.mode}
          onChange={(event) => setPasswordForm((prev) => ({ ...prev, mode: event.target.value }))}
        >
          <option value="master">Đổi mật khẩu master</option>
          <option value="account">Đổi mật khẩu tài khoản</option>
        </select>
        <input
          className="field"
          type="password"
          placeholder="Mật khẩu hiện tại"
          value={passwordForm.current}
          onChange={(event) => setPasswordForm((prev) => ({ ...prev, current: event.target.value }))}
        />
        <input
          className="field"
          type="password"
          placeholder="Mật khẩu mới"
          value={passwordForm.next}
          onChange={(event) => setPasswordForm((prev) => ({ ...prev, next: event.target.value }))}
        />
        <input
          className="field"
          type="password"
          placeholder="Xác nhận mật khẩu"
          value={passwordForm.confirm}
          onChange={(event) => setPasswordForm((prev) => ({ ...prev, confirm: event.target.value }))}
        />
        <button className="btn-primary" type="submit">
          Lưu mật khẩu
        </button>
      </form>

      <div className="panel space-y-3 p-5 xl:col-span-2">
        <h3 className="text-lg font-semibold">Dữ liệu</h3>
        <div className="flex flex-wrap gap-3">
          <button className="btn-soft gap-2" type="button" onClick={onExport}>
            <Download className="h-4 w-4" />
            Export JSON
          </button>
          <button className="btn-soft gap-2" type="button" onClick={() => fileInputRef.current?.click()}>
            <Upload className="h-4 w-4" />
            Import JSON
          </button>
          <button className="btn-soft gap-2 text-red-500" type="button" onClick={onDeleteAll}>
            <Trash2 className="h-4 w-4" />
            Xóa toàn bộ dữ liệu
          </button>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="application/json"
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) onImport(file);
          }}
        />
      </div>
    </section>
  );
}
