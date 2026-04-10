import { useMemo } from "react";
import { useApp } from "../context/AppContext";
import PageHeader from "../components/shared/PageHeader";
import { isSafePassword } from "../utils/password";

export default function ReportsPage() {
  const { vaults } = useApp();

  const metrics = useMemo(() => {
    const total = vaults.length;
    const safe = vaults.filter((item) => isSafePassword(item.password)).length;
    const weak = total - safe;
    return { total, safe, weak };
  }, [vaults]);

  return (
    <section className="space-y-4">
      <PageHeader
        eyebrow="Báo cáo"
        title="Thống kê bảo mật"
        description="Theo dõi số lượng vault an toàn, yếu và tổng quan trạng thái dữ liệu trong ứng dụng."
      />
      <div className="grid gap-4 md:grid-cols-3">
        <div className="panel p-6">
          <p className="text-sm text-app-muted">Tổng vault</p>
          <p className="mt-2 text-3xl font-bold">{metrics.total}</p>
        </div>
        <div className="panel p-6">
          <p className="text-sm text-app-muted">An toàn</p>
          <p className="mt-2 text-3xl font-bold text-green-500">{metrics.safe}</p>
        </div>
        <div className="panel p-6">
          <p className="text-sm text-app-muted">Rủi ro</p>
          <p className="mt-2 text-3xl font-bold text-red-500">{metrics.weak}</p>
        </div>
      </div>
    </section>
  );
}
