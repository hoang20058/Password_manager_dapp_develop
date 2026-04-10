import { Menu, Search, SunMoon } from "lucide-react";

export default function Topbar({ search, setSearch, onToggleTheme, currentTheme, onMenuOpen }) {
  return (
    <header className="panel mb-4 flex items-center gap-3 p-3">
      <button
        className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border bg-app-surface-alt text-app-text transition hover:bg-app-surface lg:hidden"
        type="button"
        onClick={onMenuOpen}
        aria-label="Mở menu"
      >
        <Menu className="h-5 w-5" />
      </button>
      <div className="relative flex-1">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-app-muted" />
        <input
          className="field pl-9"
          placeholder="Tim kiem URL hoac username"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
      </div>
      <button className="btn-soft gap-2" type="button" onClick={onToggleTheme}>
        <SunMoon className="h-4 w-4" />
        {currentTheme === "dark" ? "Chủ đề sáng" : "Chủ đề tối"}
      </button>
    </header>
  );
}
