import { useMemo, useState } from "react";
import {
  Copy,
  Eye,
  EyeOff,
  KeyRound,
  Pencil,
  Plus,
  ShieldAlert,
  ShieldCheck,
  Trash2
} from "lucide-react";
import Modal from "../ui/Modal";
import PasswordStrengthHint from "../security/PasswordStrengthHint";
import { evaluatePasswordStrength, getDomainName, isSafePassword } from "../../utils/password";

const emptyForm = { url: "", username: "", password: "" };

export default function VaultPanel({ vaults, setVaults, search, onToast }) {
  const [mode, setMode] = useState("all");
  const [isModalOpen, setModalOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [showFormPassword, setShowFormPassword] = useState(false);

  const stats = {
    total: vaults.length,
    safe: vaults.filter((item) => isSafePassword(item.password)).length,
    risk: vaults.filter((item) => !isSafePassword(item.password)).length
  };

  const filtered = useMemo(() => {
    const searchTerm = search.toLowerCase().trim();
    return vaults
      .map((item, index) => ({ ...item, index }))
      .filter((item) => {
        const matchMode =
          mode === "all"
            ? true
            : mode === "safe"
              ? isSafePassword(item.password)
              : !isSafePassword(item.password);

        const matchSearch =
          !searchTerm ||
          item.url.toLowerCase().includes(searchTerm) ||
          item.username.toLowerCase().includes(searchTerm);

        return matchMode && matchSearch;
      });
  }, [mode, search, vaults]);

  const openCreate = () => {
    setEditingIndex(null);
    setForm(emptyForm);
    setShowFormPassword(false);
    setModalOpen(true);
  };

  const openEdit = (index) => {
    setEditingIndex(index);
    setForm(vaults[index]);
    setShowFormPassword(false);
    setModalOpen(true);
  };

  const save = (event) => {
    event.preventDefault();
    if (!form.url || !form.username || !form.password) return;
    const strength = evaluatePasswordStrength(form.password, [form.url, form.username]);

    if (editingIndex === null) {
      setVaults((prev) => [...prev, form]);
      onToast(
        strength.meetsPolicy
          ? "Đã thêm mật khẩu mới"
          : "Đã thêm nhưng mật khẩu còn yếu, nên đổi ngay để an toàn hơn",
        strength.meetsPolicy ? "success" : "warning"
      );
    } else {
      setVaults((prev) => prev.map((item, index) => (index === editingIndex ? form : item)));
      onToast(
        strength.meetsPolicy
          ? "Đã cập nhật mật khẩu"
          : "Đã cập nhật nhưng mật khẩu còn yếu, nên đổi sớm",
        strength.meetsPolicy ? "success" : "warning"
      );
    }

    setModalOpen(false);
    setForm(emptyForm);
    setEditingIndex(null);
  };

  const remove = (index) => {
    const deletedItem = vaults[index];
    setVaults((prev) => prev.filter((_, idx) => idx !== index));
    onToast("Đã xóa mật khẩu", "warning", {
      action: {
        label: "Hoàn tác",
        onClick: () => {
          if (!deletedItem) return;
          setVaults((prev) => {
            const next = [...prev];
            next.splice(index, 0, deletedItem);
            return next;
          });
        }
      },
      duration: 6000
    });
  };

  const copyPassword = async (password) => {
    await navigator.clipboard.writeText(password);
    onToast("Đã sao chép mật khẩu", "info");
  };

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-bold">Trang chủ Vault</h2>
        <button className="btn-primary gap-2" onClick={openCreate} type="button">
          <Plus className="h-4 w-4" />
          Thêm mật khẩu mới
        </button>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <button type="button" className="panel flex items-center justify-between p-4 text-left" onClick={() => setMode("all")}>
          <div>
            <p className="text-xs text-app-muted">Tổng số</p>
            <p className="text-2xl font-bold">{stats.total}</p>
          </div>
          <KeyRound className="h-8 w-8 text-app-primary" />
        </button>
        <button type="button" className="panel flex items-center justify-between p-4 text-left" onClick={() => setMode("safe")}>
          <div>
            <p className="text-xs text-app-muted">An toàn</p>
            <p className="text-2xl font-bold text-app-success">{stats.safe}</p>
          </div>
          <ShieldCheck className="h-8 w-8 text-app-success" />
        </button>
        <button type="button" className="panel flex items-center justify-between p-4 text-left" onClick={() => setMode("risk")}>
          <div>
            <p className="text-xs text-app-muted">Rủi ro</p>
            <p className="text-2xl font-bold text-app-danger">{stats.risk}</p>
          </div>
          <ShieldAlert className="h-8 w-8 text-app-danger" />
        </button>
      </div>

      <div className="panel overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-app-surface-alt text-app-muted">
              <tr>
                <th className="px-4 py-3 text-left font-semibold">URL</th>
                <th className="px-4 py-3 text-left font-semibold">Username</th>
                <th className="px-4 py-3 text-left font-semibold">Password</th>
                <th className="px-4 py-3 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-10 text-center text-app-muted">
                    Chưa có dữ liệu phù hợp
                  </td>
                </tr>
              )}
              {filtered.map((item) => (
                <tr className="border-t" key={`${item.url}-${item.index}`}>
                  <td className="px-4 py-3 font-medium">{getDomainName(item.url)}</td>
                  <td className="px-4 py-3">{item.username}</td>
                  <td className="px-4 py-3 font-mono">••••••••</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <button className="btn-soft px-2 py-1" type="button" onClick={() => copyPassword(item.password)}>
                        <Copy className="h-4 w-4" />
                      </button>
                      <button
                        className="btn-soft px-2 py-1"
                        type="button"
                        onClick={() => openEdit(item.index)}
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        className="btn-soft px-2 py-1 text-red-500"
                        type="button"
                        onClick={() => remove(item.index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        open={isModalOpen}
        title={editingIndex === null ? "Thêm mật khẩu" : "Chỉnh sửa mật khẩu"}
        onClose={() => {
          setModalOpen(false);
          setShowFormPassword(false);
        }}
      >
        <form className="space-y-3" onSubmit={save}>
          <input
            className="field"
            placeholder="https://example.com"
            required
            value={form.url}
            onChange={(event) => setForm((prev) => ({ ...prev, url: event.target.value }))}
          />
          <input
            className="field"
            placeholder="Username / Email"
            required
            value={form.username}
            onChange={(event) => setForm((prev) => ({ ...prev, username: event.target.value }))}
          />
          <div className="relative">
            <input
              className="field pr-12"
              type={showFormPassword ? "text" : "password"}
              placeholder="Password"
              required
              value={form.password}
              onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
            />
            <button
              className="absolute inset-y-0 right-2 my-auto flex h-8 w-8 items-center justify-center rounded-lg text-app-muted hover:bg-app-surface-alt hover:text-app-text"
              type="button"
              onClick={() => setShowFormPassword((prev) => !prev)}
              aria-label={showFormPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
            >
              {showFormPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          <PasswordStrengthHint
            password={form.password}
            userInputs={[form.url, form.username]}
            policyText="Mật khẩu lưu trong vault nên đạt mức Khá trở lên và tối thiểu 8 ký tự."
          />
          <button className="btn-primary w-full" type="submit">
            Lưu
          </button>
        </form>
      </Modal>
    </section>
  );
}
