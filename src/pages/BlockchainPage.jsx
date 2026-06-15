import { useState } from "react";
import PageHeader from "../components/shared/PageHeader";
import { updateVaultCidOnChain, getVaultCidFromChain } from "../services/blockchainService";

export default function BlockchainPage() {
  const [cid, setCid] = useState("");
  const [userAddress, setUserAddress] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Update Vault CID on blockchain
  const handleUpdateVault = async () => {
    if (!cid.trim()) {
      setError("⚠️ Vui lòng nhập IPFS CID");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await updateVaultCidOnChain(cid);
      setResult(response);
      if (response.success) {
        setCid(""); // Clear input on success
      } else {
        setError(response.error);
      }
    } catch (err) {
      setError(err.message || "Lỗi không xác định");
    } finally {
      setLoading(false);
    }
  };

  // Get Vault CID from blockchain
  const handleGetVault = async () => {
    if (!userAddress.trim()) {
      setError("⚠️ Vui lòng nhập địa chỉ ví");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await getVaultCidFromChain(userAddress);
      if (response.error) {
        setError(response.error);
      } else {
        setResult(response);
      }
    } catch (err) {
      setError(err.message || "Lỗi không xác định");
    } finally {
      setLoading(false);
    }
  };

  // Get connected wallet address
  const handleGetMyAddress = async () => {
    try {
      if (!window.ethereum) {
        setError("❌ MetaMask không được phát hiện");
        return;
      }
      const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
      setUserAddress(accounts[0]);
      setError(null);
    } catch (err) {
      setError("❌ Không thể kết nối MetaMask");
    }
  };

  return (
    <section className="space-y-6">
      <PageHeader
        eyebrow="Blockchain Tools"
        title="Quản lý Vault Pointer"
        description="Cập nhật IPFS CID lên Smart Contract hoặc truy xuất CID đã lưu từ blockchain."
      />

      {/* Error Message */}
      {error && (
        <div className="panel border border-red-500/30 bg-red-500/10 p-4">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      {/* Section 1: Update Vault CID */}
      <div className="panel space-y-4 p-6">
        <div className="mb-4 border-b border-slate-700 pb-4">
          <h3 className="text-lg font-semibold text-white">📤 Cập nhật Vault CID</h3>
          <p className="text-xs text-slate-400 mt-2">Ghi IPFS CID của vault đã mã hóa lên blockchain</p>
        </div>

        <div className="space-y-3">
          <input
            className="field w-full rounded-lg border border-slate-600 bg-slate-900 px-4 py-2 text-white placeholder-slate-500"
            placeholder="Nhập IPFS CID (ví dụ: QmXxxx...)"
            value={cid}
            onChange={(e) => setCid(e.target.value)}
            disabled={loading}
          />
          <button
            className="btn-primary w-full rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
            onClick={handleUpdateVault}
            disabled={loading || !cid.trim()}
          >
            {loading ? "⏳ Đang xử lý..." : "✅ Cập nhật Vault"}
          </button>
        </div>
      </div>

      {/* Section 2: Get Vault CID */}
      <div className="panel space-y-4 p-6">
        <div className="mb-4 border-b border-slate-700 pb-4">
          <h3 className="text-lg font-semibold text-white">📥 Truy xuất Vault CID</h3>
          <p className="text-xs text-slate-400 mt-2">Lấy IPFS CID và thời gian cập nhật từ blockchain</p>
        </div>

        <div className="space-y-3">
          <div className="flex gap-2">
            <input
              className="field flex-1 rounded-lg border border-slate-600 bg-slate-900 px-4 py-2 text-white placeholder-slate-500"
              placeholder="Nhập địa chỉ ví (0x...)"
              value={userAddress}
              onChange={(e) => setUserAddress(e.target.value)}
              disabled={loading}
            />
            <button
              className="btn-secondary rounded-lg border border-slate-600 bg-slate-800 hover:bg-slate-700 px-4 py-2 text-sm text-white"
              onClick={handleGetMyAddress}
              disabled={loading}
            >
              📍 Địa chỉ của tôi
            </button>
          </div>
          <button
            className="btn-primary w-full rounded-lg bg-green-600 hover:bg-green-700 disabled:opacity-50"
            onClick={handleGetVault}
            disabled={loading || !userAddress.trim()}
          >
            {loading ? "⏳ Đang truy xuất..." : "🔍 Lấy Vault"}
          </button>
        </div>
      </div>

      {/* Result Display */}
      {result && (
        <div className="panel space-y-4 p-6">
          <h3 className="text-lg font-semibold text-white">📊 Kết quả</h3>
          <pre className="overflow-auto rounded-lg bg-slate-950 p-4 text-xs text-slate-100 border border-slate-700">
            {JSON.stringify(result, null, 2)}
          </pre>

          {/* Transaction Link */}
          {result.txHash && (
            <div className="pt-4 border-t border-slate-700">
              <a
                href={`https://sepolia.etherscan.io/tx/${result.txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300 underline text-sm"
              >
                🔗 Xem trên Etherscan →
              </a>
            </div>
          )}

          {/* Display CID if retrieved */}
          {result.cid && (
            <div className="mt-4 space-y-2 bg-slate-900 rounded-lg p-4">
              <div>
                <p className="text-xs text-slate-400">IPFS CID:</p>
                <p className="text-sm text-white font-mono break-all">{result.cid}</p>
              </div>
              {result.updatedAt && (
                <div>
                  <p className="text-xs text-slate-400">Lần cập nhật cuối:</p>
                  <p className="text-sm text-white">
                    {new Date(result.updatedAt * 1000).toLocaleString("vi-VN")}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Info Panel */}
      <div className="panel bg-blue-500/10 border border-blue-500/30 p-6 space-y-3">
        <h4 className="font-semibold text-blue-300">ℹ️ Hướng dẫn sử dụng</h4>
        <ul className="text-xs text-slate-300 space-y-2">
          <li>✓ Cần MetaMask kết nối trên mạng <strong>Sepolia Testnet</strong></li>
          <li>✓ Nhập IPFS CID (bắt đầu với "Qm" hoặc "bafy")</li>
          <li>✓ Nhấp "Cập nhật Vault" để lưu CID lên blockchain</li>
          <li>✓ Xác nhận transaction trong MetaMask</li>
          <li>✓ Sử dụng "Truy xuất Vault CID" để kiểm tra dữ liệu đã lưu</li>
        </ul>
      </div>
    </section>
  );
}
