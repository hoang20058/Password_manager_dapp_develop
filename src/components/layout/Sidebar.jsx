import { KeyRound, LogOut, Settings, Shield } from "lucide-react";

const items = [
  { id: "vault", label: "Quản lý mật khẩu", icon: KeyRound },
  { id: "settings", label: "Cài đặt", icon: Settings }
];

export default function Sidebar({ activeTab, setActiveTab, onLogout }) {
  return (
    <aside className="panel hidden w-72 shrink-0 p-5 lg:block">
      <div className="mb-8 flex items-center gap-2">
        <Shield className="h-5 w-5 text-app-primary" />
        <h1 className="text-lg font-bold">JJin Vault</h1>
      </div>

      <nav className="space-y-2">
        {items.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            className={`flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm font-medium transition ${
              activeTab === id
                ? "bg-app-primary text-white"
                : "bg-app-surface-alt text-app-text hover:bg-app-surface"
            }`}
            onClick={() => setActiveTab(id)}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </nav>

      <button
        className="btn-soft mt-8 w-full justify-start gap-2 text-red-500"
        type="button"
        onClick={onLogout}
      >
        <LogOut className="h-4 w-4" />
        Đăng xuất
      </button>
    </aside>
  );
}
