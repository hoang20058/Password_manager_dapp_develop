import { useApp } from "../context/AppContext";
import PageHeader from "../components/shared/PageHeader";
import { Download, Trash2 } from "lucide-react";
import { vaultService } from "../services/vaultService";

export default function ExportPage() {
  const { vaults, requestMasterAction, clearAllVaultData } = useApp();

  const runExport = () => {
    const blob = new Blob([vaultService.exportToJson(vaults)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "vault-export.json";
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <section className="space-y-4">
      <PageHeader
        eyebrow="Công cụ"
        title="Xuất dữ liệu"
        description="Xuất vault ra JSON chỉ được phép sau khi xác thực master password."
      />
      <div className="panel space-y-4 p-6">
        <div className="grid gap-3 sm:grid-cols-2">
          <button
            className="btn-primary h-12 gap-2 text-base"
            type="button"
            onClick={() => requestMasterAction("Xuất dữ liệu", runExport, { forceReauth: true })}
          >
            <Download className="h-5 w-5" />
            Xuất JSON
          </button>
          <button
            className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-red-500/40 bg-red-500/10 px-4 text-base font-medium text-red-600 transition hover:bg-red-500/20"
            type="button"
            onClick={() => requestMasterAction("Xóa toàn bộ dữ liệu vault", clearAllVaultData, { forceReauth: true })}
          >
            <Trash2 className="h-5 w-5" />
            Xóa toàn bộ dữ liệu
          </button>
        </div>
        <p className="text-sm text-app-muted">
          Màn hình này đại diện cho luồng backup dữ liệu được bảo vệ bằng lớp xác thực cục bộ.
        </p>
      </div>
    </section>
  );
}
