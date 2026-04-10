import { BrowserProvider, Contract, keccak256, toUtf8Bytes } from "ethers";

const vaultContractAbi = [
  "function storeCommitment(bytes32 commitment, string metadataUri) external",
  "function lastCommitment(address owner) view returns (bytes32 commitment, string metadataUri, uint256 updatedAt)"
];

export function buildVaultHash(vaults, masterPassword) {
  return keccak256(toUtf8Bytes(JSON.stringify(vaults) + `::${masterPassword}`));
}

export async function commitVaultsToChain({ vaults, masterPassword, metadataUri = "" }) {
  const commitment = buildVaultHash(vaults, masterPassword);
  const contractAddress = import.meta.env.VITE_VAULT_CONTRACT_ADDRESS;

  if (!window.ethereum || !contractAddress) {
    return {
      mode: "preview",
      commitment,
      metadataUri,
      txHash: null
    };
  }

  const provider = new BrowserProvider(window.ethereum);
  await provider.send("eth_requestAccounts", []);
  const signer = await provider.getSigner();
  const contract = new Contract(contractAddress, vaultContractAbi, signer);
  const tx = await contract.storeCommitment(commitment, metadataUri);
  await tx.wait();

  return {
    mode: "chain",
    commitment,
    metadataUri,
    txHash: tx.hash
  };
}
