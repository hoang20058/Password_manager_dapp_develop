export default function Modal({ open, title, onClose, children }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
      <div className="panel w-full max-w-xl p-5">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold">{title}</h3>
          <button className="btn-soft px-3 py-1" onClick={onClose} type="button">
            Đóng
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
