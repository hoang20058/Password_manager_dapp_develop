import { useState } from "react";
import Modal from "../ui/Modal";

export default function MasterPasswordGate({ open, purpose, error, onClose, onSubmit, onLogout }) {
  const [password, setPassword] = useState("");

  const isUnlockSession = purpose === "Mở khóa phiên";

  return (
    <Modal open={open} title={`Xác thực master password - ${purpose}`} onClose={onClose}>
      <form
        className="space-y-3"
        onSubmit={async (event) => {
          event.preventDefault();
          const result = await onSubmit(password);
          if (result?.ok) {
            setPassword("");
          }
        }}
      >
        <input
          className="field"
          type="password"
          placeholder="Nhập master password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
        {error ? <p className="text-sm text-red-500">{error}</p> : null}
        <div className="flex justify-end gap-2">
          {isUnlockSession && onLogout ? (
            <button
              className="btn-soft border-red-500/30 text-red-500 hover:bg-red-500/10 mr-auto"
              type="button"
              onClick={() => {
                setPassword("");
                onLogout();
              }}
            >
              Đăng xuất
            </button>
          ) : null}
          <button className="btn-soft" type="button" onClick={onClose}>
            Hủy
          </button>
          <button className="btn-primary" type="submit">
            Xác nhận
          </button>
        </div>
      </form>
    </Modal>
  );
}

