import { useRef, useState } from "react";
import PageHeader from "../components/shared/PageHeader";
import { vaultService } from "../services/vaultService";
import { useApp } from "../context/AppContext";
import { assessVaultPasswords } from "../utils/password";

export default function ImportPage() {
  const { setVaults, notify } = useApp();
  const fileRef = useRef(null);
  const [preview, setPreview] = useState(null);
  const [summary, setSummary] = useState(null);

  const handleImport = (file) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = vaultService.importFromJson(String(reader.result));
        const assessment = assessVaultPasswords(parsed);
        setPreview(parsed.slice(0, 5));
        setSummary(assessment);
        setVaults(parsed);
        notify(
          assessment.weakCount > 0
            ? `Đã import ${assessment.total} bản ghi, có ${assessment.weakCount} mật khẩu rủi ro cần đổi.`
            : `Đã import ${assessment.total} bản ghi, tất cả đạt khuyến nghị.`,
          assessment.weakCount > 0 ? "warning" : "success"
        );
      } catch {
        setSummary(null);
        setPreview([{ error: "File import không hợp lệ" }]);
        notify("File import không hợp lệ", "danger");
      }
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
        <input ref={fileRef} type="file" accept="application/json" className="hidden" onChange={(event) => event.target.files?.[0] && handleImport(event.target.files[0])} />
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
    </section>
  );
}
