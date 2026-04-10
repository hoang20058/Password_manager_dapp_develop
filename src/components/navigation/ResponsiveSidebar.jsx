import { ChevronDown, ChevronRight, Shield } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { navigationGroups, defaultRoute } from "../../config/navigation";

function SidebarLink({ to, icon: Icon, label, onNavigate }) {
  return (
    <NavLink
      to={to}
      onClick={onNavigate}
      className={({ isActive }) =>
        `flex items-center gap-3 rounded-2xl px-3 py-2 text-sm font-medium transition ${
          isActive ? "bg-app-primary text-white shadow-lg shadow-black/10" : "text-app-text/90 hover:bg-app-surface-alt"
        }`
      }
    >
      <Icon className="h-4 w-4" />
      <span>{label}</span>
    </NavLink>
  );
}

function SidebarGroup({ group, open, onToggle, onNavigate }) {
  const location = useLocation();
  const hasActiveChild = useMemo(
    () => group.children?.some((item) => location.pathname === item.path),
    [group.children, location.pathname]
  );

  useEffect(() => {
    if (hasActiveChild && !open) onToggle(true);
  }, [hasActiveChild, open, onToggle]);

  if (!group.children) {
    return <SidebarLink to={group.path || defaultRoute} icon={group.icon} label={group.label} onNavigate={onNavigate} />;
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={() => onToggle(!open)}
        className={`flex w-full items-center justify-between rounded-2xl px-3 py-2 text-sm font-semibold transition ${
          hasActiveChild ? "bg-app-surface-alt text-app-text" : "text-app-text/90 hover:bg-app-surface-alt"
        }`}
      >
        <span className="flex items-center gap-3">
          <group.icon className="h-4 w-4" />
          {group.label}
        </span>
        {open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
      </button>
      {open && (
        <div className="ml-3 space-y-2 border-l border-white/10 pl-3">
          {group.children.map((item) => (
            <SidebarLink key={item.path} to={item.path} icon={item.icon} label={item.label} onNavigate={onNavigate} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function ResponsiveSidebar({ mobileOpen, onClose, onLogout }) {
  const [expanded, setExpanded] = useState({});

  return (
    <>
      <aside className="hidden h-[calc(100vh-3rem)] w-[300px] shrink-0 rounded-[28px] border border-app-border bg-app-surface p-4 text-app-text shadow-card lg:flex lg:flex-col">
        <div className="mb-6 flex items-center gap-3 px-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-app-surface-alt text-app-primary">
            <Shield className="h-5 w-5" />
          </div>
          <div>
            <p className="text-lg font-semibold leading-tight">Kho bảo mật</p>
            <p className="text-xs text-app-muted">DApp Password Manager</p>
          </div>
        </div>
        <nav className="flex-1 space-y-2 overflow-y-auto pr-1">
          {navigationGroups.map((group) => (
            <SidebarGroup
              key={group.label}
              group={group}
              open={expanded[group.label] ?? true}
              onToggle={(next) => setExpanded((prev) => ({ ...prev, [group.label]: next }))}
              onNavigate={() => {}}
            />
          ))}
        </nav>

        <button
          type="button"
          className="mt-4 flex w-full items-center gap-3 rounded-2xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-left text-sm font-medium text-red-600 transition hover:bg-red-500/15"
          onClick={onLogout}
        >
          Đăng xuất
        </button>
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-40 bg-slate-950/50 lg:hidden" onClick={onClose} />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 w-[86vw] max-w-sm transform border-r border-app-border bg-app-surface p-4 text-app-text transition-transform duration-300 lg:hidden ${mobileOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-app-surface-alt text-app-primary">
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <p className="text-lg font-semibold leading-tight">Kho bảo mật</p>
              <p className="text-xs text-app-muted">Menu đa nhiệm</p>
            </div>
          </div>
          <button type="button" className="rounded-xl bg-app-surface-alt px-3 py-2 text-sm" onClick={onClose}>
            Đóng
          </button>
        </div>
        <nav className="space-y-2 overflow-y-auto pr-1">
          {navigationGroups.map((group) => (
            <SidebarGroup
              key={group.label}
              group={group}
              open={expanded[group.label] ?? true}
              onToggle={(next) => setExpanded((prev) => ({ ...prev, [group.label]: next }))}
              onNavigate={onClose}
            />
          ))}
        </nav>

        <button
          type="button"
          className="mt-4 flex w-full items-center gap-3 rounded-2xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-left text-sm font-medium text-red-600 transition hover:bg-red-500/15"
          onClick={onLogout}
        >
          Đăng xuất
        </button>
      </aside>
    </>
  );
}
