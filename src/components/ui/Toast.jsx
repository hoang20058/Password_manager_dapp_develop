export default function Toast({ toast, onClose }) {
  if (!toast) return null;

  const tone = {
    success: "border-green-700 bg-green-600 text-white",
    warning: "border-amber-600 bg-amber-500 text-slate-950",
    danger: "border-red-700 bg-red-600 text-white",
    info: "border-slate-700 bg-slate-900 text-white"
  };

  return (
    <div className={`fixed bottom-4 left-1/2 z-[60] w-[min(92vw,28rem)] -translate-x-1/2 rounded-2xl border px-4 py-3 shadow-2xl ${tone[toast.type] || tone.info}`}>
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium leading-5">{toast.message}</p>
        {toast.action ? (
          <button
            className="shrink-0 rounded-xl bg-white/15 px-3 py-1.5 text-xs font-semibold text-inherit transition hover:bg-white/25"
            type="button"
            onClick={() => {
              toast.action.onClick?.();
              onClose();
            }}
          >
            {toast.action.label || "Hoàn tác"}
          </button>
        ) : (
          <button className="shrink-0 rounded-xl bg-white/15 px-3 py-1.5 text-xs font-semibold text-inherit transition hover:bg-white/25" type="button" onClick={onClose}>
            Đóng
          </button>
        )}
      </div>
    </div>
  );
}
