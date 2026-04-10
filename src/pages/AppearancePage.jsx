import { useApp } from "../context/AppContext";
import PageHeader from "../components/shared/PageHeader";

export default function AppearancePage() {
  const { theme, setTheme } = useApp();

  return (
    <section className="space-y-4">
      <PageHeader
        eyebrow="Cài đặt"
        title="Giao diện"
        description="Điều chỉnh theme và nền ứng dụng theo nhu cầu sử dụng."
      />
      <div className="panel space-y-4 p-6">
        <p className="text-sm text-app-muted">Theme hiện tại: <span className="font-semibold text-app-text">{theme}</span></p>
        <div className="flex flex-wrap gap-2">
          <button className="btn-primary" type="button" onClick={() => setTheme("light")}>Chủ đề sáng</button>
          <button className="btn-soft" type="button" onClick={() => setTheme("dark")}>Chủ đề tối</button>
        </div>
      </div>
    </section>
  );
}
