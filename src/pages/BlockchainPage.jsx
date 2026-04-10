import { useState } from "react";
import PageHeader from "../components/shared/PageHeader";
import { useApp } from "../context/AppContext";
import { commitVaultsToChain } from "../services/blockchainService";

export default function BlockchainPage() {
  const { vaults } = useApp();
  const [result, setResult] = useState(null);
  const [metadataUri, setMetadataUri] = useState("");

  const commit = async () => {
    const response = await commitVaultsToChain({
      vaults,
      masterPassword: import.meta.env.VITE_DEFAULT_MASTER_PASSWORD || "123456",
      metadataUri
    });
    setResult(response);
  };

  return (
    <section className="space-y-4">
      <PageHeader
        eyebrow="Công cụ"
        title="Lưu trữ Blockchain"
        description="Tạo hash của vault và sẵn sàng ghi commitment lên smart contract khi có địa chỉ hợp đồng và ví kết nối."
      />
      <div className="panel space-y-4 p-6">
        <input className="field" placeholder="Metadata URI hoặc IPFS CID" value={metadataUri} onChange={(event) => setMetadataUri(event.target.value)} />
        <button className="btn-primary" type="button" onClick={commit}>Tạo commitment</button>
        {result ? (
          <pre className="overflow-auto rounded-2xl bg-slate-950 p-4 text-xs text-slate-100">{JSON.stringify(result, null, 2)}</pre>
        ) : null}
      </div>
    </section>
  );
}
