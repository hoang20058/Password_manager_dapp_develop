import { useRef, useState } from "react";
import PageHeader from "../components/shared/PageHeader";
import { useApp } from "../context/AppContext";
import { assessVaultPasswords } from "../utils/password";
import Modal from "../components/ui/Modal";

export default function ImportPage() {
  const { importVaultData, notify } = useApp();
  const fileRef = useRef(null);
  const [preview, setPreview] = useState(null);
  const [summary, setSummary] = useState(null);
  const [importPassword, setImportPassword] = useState("");
  const [pendingRawText, setPendingRawText] = useState("");
  const [isPromptOpen, setPromptOpen] = useState(false);
  const [promptError, setPromptError] = useState("");
  const [isImporting, setImporting] = useState(false);

  const closePrompt = () => {
    setPromptOpen(false);
    setPendingRawText("");
    setImportPassword("");
    setPromptError("");
  };

  const executeImport = async (password = "") => {
    if (!pendingRawText) {
      setPromptError("Không tìm thấy dữ liệu file import");
      return;
    }

    setImporting(true);
    setPromptError("");

    try {
      const parsed = await importVaultData(pendingRawText, password);
      const assessment = assessVaultPasswords(parsed);
      setPreview(parsed.slice(0, 5));
      setSummary(assessment);
      notify(
        assessment.weakCount > 0
          ? `Đã import ${assessment.total} bản ghi, có ${assessment.weakCount} mật khẩu rủi ro cần đổi.`
          : `Đã import ${assessment.total} bản ghi, tất cả đạt khuyến nghị.`,
        assessment.weakCount > 0 ? "warning" : "success"
      );
      closePrompt();
    } catch (error) {
      const message = error?.message || "File import không hợp lệ";
      setPromptError(message);
      setSummary(null);
      setPreview([{ error: message }]);
      notify(message, "danger");
    } finally {
      setImporting(false);
    }
  };

  const handleImport = (file) => {
    const reader = new FileReader();
    reader.onload = () => {
      setPendingRawText(String(reader.result ?? ""));
      setPromptOpen(true);
      setPromptError("");
      setImportPassword("");
    };
    reader.onerror = () => {
      notify("Không thể đọc file import", "danger");
    };
    reader.readAsText(file);
  };

  return (
    <section className="space-y-4">
      <PageHeader
        eyebrow="Công cụ"
        title="Nhập dữ liệu"
        description="Khôi phục vault từ file JSON. Nên kiểm tra định dạng trước khi ghi đè dữ liệu đang có."
      />
      <div className="panel space-y-4 p-6">
        <button className="btn-primary" type="button" onClick={() => fileRef.current?.click()}>
          Chọn file JSON
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="application/json"
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) handleImport(file);
            event.target.value = "";
          }}
        />
        {summary ? (
          <div className="rounded-2xl border bg-app-surface-alt p-4 text-sm text-app-text">
            <p>Tổng bản ghi: {summary.total}</p>
            <p className="text-green-600">An toàn: {summary.safeCount}</p>
            <p className="text-red-600">Rủi ro: {summary.weakCount}</p>
          </div>
        ) : null}
        {preview ? (
          <pre className="overflow-auto rounded-2xl bg-slate-950 p-4 text-xs text-slate-100">{JSON.stringify(preview, null, 2)}</pre>
        ) : (
          <p className="text-sm text-app-muted">Chưa có dữ liệu xem trước.</p>
        )}
      </div>

      <Modal open={isPromptOpen} title="Xác nhận import dữ liệu" onClose={isImporting ? () => {} : closePrompt}>
        <div className="space-y-3">
          <p className="text-sm text-app-muted">
            Nhập master password nếu file là ciphertext export mới. Nếu là file JSON plaintext cũ, bạn có thể bấm Skip.
          </p>
          <input
            className="field"
            type="password"
            placeholder="Master password để giải mã file ciphertext"
            value={importPassword}
            onChange={(event) => setImportPassword(event.target.value)}
            disabled={isImporting}
          />
          {promptError ? <p className="text-sm text-red-500">{promptError}</p> : null}
          <div className="flex flex-wrap justify-end gap-2">
            <button className="btn-soft" type="button" onClick={closePrompt} disabled={isImporting}>
              Hủy
            </button>
            <button className="btn-soft" type="button" onClick={() => executeImport("")} disabled={isImporting}>
              Skip
            </button>
            <button
              className="btn-primary"
              type="button"
              onClick={() => executeImport(importPassword)}
              disabled={isImporting}
            >
              {isImporting ? "Đang import..." : "Import với master password"}
            </button>
          </div>
        </div>
      </Modal>
    </section>
  );
}
