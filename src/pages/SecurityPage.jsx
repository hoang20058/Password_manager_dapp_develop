import { useMemo, useState } from "react";
import { useApp } from "../context/AppContext";
import PageHeader from "../components/shared/PageHeader";
import PasswordStrengthHint from "../components/security/PasswordStrengthHint";
import { evaluatePasswordStrength } from "../utils/password";

export default function SecurityPage() {
  const { updateMasterPassword, autoLockMinutes, setAutoLockMinutes } = useApp();
  const [masterForm, setMasterForm] = useState({ current: "", next: "", confirm: "" });
  const [message, setMessage] = useState("");

  const masterStrength = useMemo(
    () => evaluatePasswordStrength(masterForm.next, []),
    [masterForm.next]
  );
  const submitMaster = async (event) => {
    event.preventDefault();
    if (!masterStrength.meetsPolicy) return setMessage("Master password mới chưa đủ mạnh");
    if (masterForm.next !== masterForm.confirm) return setMessage("Xác nhận master password không khớp");
    const result = await updateMasterPassword(masterForm.current, masterForm.next);
    setMessage(result.ok ? "Đã đổi master password" : result.message);
  };

  return (
    <section className="space-y-4">
      <PageHeader
        eyebrow="Cài đặt"
        title="Bảo mật"
        description="Tất cả thay đổi liên quan đến mật khẩu đều đi qua lớp xác thực và được lưu dưới dạng hash."
      />
      {message ? <div className="panel p-4 text-sm text-app-text">{message}</div> : null}
      <div className="panel space-y-3 p-6">
        <h3 className="text-lg font-semibold">Tự động khóa phiên</h3>
        <p className="text-sm text-app-muted">
          Phiên sẽ tự khóa sau khoảng thời gian không sử dụng, khi tab bị ẩn hoặc khi tải lại trang.
        </p>
        <label className="text-sm text-app-text" htmlFor="auto-lock-minutes">
          Thời gian không sử dụng trước khi khóa
        </label>
        <select
          id="auto-lock-minutes"
          className="field max-w-xs"
          value={String(autoLockMinutes)}
          onChange={(event) => setAutoLockMinutes(Number(event.target.value))}
        >
          <option value="5">5 phút</option>
          <option value="15">15 phút</option>
          <option value="30">30 phút</option>
          <option value="60">1 giờ</option>
        </select>
      </div>
      <div className="grid gap-4 xl:grid-cols-2">
        <form className="panel space-y-3 p-6" onSubmit={submitMaster}>
          <h3 className="text-lg font-semibold">Đổi master password</h3>
          <input className="field" type="password" placeholder="Mật khẩu hiện tại" value={masterForm.current} onChange={(event) => setMasterForm((prev) => ({ ...prev, current: event.target.value }))} />
          <input className="field" type="password" placeholder="Mật khẩu mới" value={masterForm.next} onChange={(event) => setMasterForm((prev) => ({ ...prev, next: event.target.value }))} />
          <PasswordStrengthHint password={masterForm.next} policyText="Master password phải đạt mức Khá trở lên và tối thiểu 8 ký tự." />
          <input className="field" type="password" placeholder="Xác nhận mật khẩu" value={masterForm.confirm} onChange={(event) => setMasterForm((prev) => ({ ...prev, confirm: event.target.value }))} />
          <button className="btn-primary" type="submit" disabled={!masterStrength.meetsPolicy}>Lưu</button>
        </form>
      </div>
    </section>
  );
}
