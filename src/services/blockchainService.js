import { BrowserProvider, Contract } from "ethers";

/**
 * ABI cho VaultPointer contract
 * Định nghĩa các function: updateVaultPointer, getVaultPointer
 */
const vaultContractAbi = [
  {
    "type": "function",
    "name": "updateVaultPointer",
    "inputs": [
      {
        "name": "_cid",
        "type": "string"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "getVaultPointer",
    "inputs": [
      {
        "name": "_user",
        "type": "address"
      }
    ],
    "outputs": [
      {
        "name": "cid",
        "type": "string"
      },
      {
        "name": "updatedAt",
        "type": "uint256"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "event",
    "name": "VaultUpdated",
    "inputs": [
      {
        "name": "user",
        "type": "address",
        "indexed": true
      },
      {
        "name": "cid",
        "type": "string"
      },
      {
        "name": "timestamp",
        "type": "uint256"
      }
    ]
  }
];

/**
 * Cập nhật IPFS CID pointer lên blockchain
 * @param {string} cid - IPFS Content Identifier
 * @returns {Object} - { success: boolean, txHash: string | null, error?: string }
 */
export async function updateVaultCidOnChain(cid) {
  try {
    const contractAddress = import.meta.env.VITE_VAULT_CONTRACT_ADDRESS;

    if (!window.ethereum) {
      return {
        success: false,
        txHash: null,
        error: "MetaMask not detected"
      };
    }

    if (!contractAddress) {
      return {
        success: false,
        txHash: null,
        error: "Contract address not configured"
      };
    }

    if (!cid || cid.trim() === "") {
      return {
        success: false,
        txHash: null,
        error: "CID cannot be empty"
      };
    }

    // Kết nối đến MetaMask provider
    const provider = new BrowserProvider(window.ethereum);
    await provider.send("eth_requestAccounts", []);
    const signer = await provider.getSigner();
    const contract = new Contract(contractAddress, vaultContractAbi, signer);

    // Gọi updateVaultPointer trên contract
    const tx = await contract.updateVaultPointer(cid);
    const receipt = await tx.wait();

    return {
      success: true,
      txHash: tx.hash,
      blockNumber: receipt?.blockNumber
    };
  } catch (error) {
    console.error("Error updating vault CID on chain:", error);
    return {
      success: false,
      txHash: null,
      error: error.message || "Transaction failed"
    };
  }
}

/**
 * Lấy IPFS CID pointer từ blockchain
 * @param {string} userAddress - Địa chỉ ví của người dùng
 * @returns {Object} - { cid: string, updatedAt: number, error?: string }
 */
export async function getVaultCidFromChain(userAddress) {
  try {
    const contractAddress = import.meta.env.VITE_VAULT_CONTRACT_ADDRESS;

    if (!window.ethereum) {
      return {
        cid: "",
        updatedAt: 0,
        error: "MetaMask not detected"
      };
    }

    if (!contractAddress) {
      return {
        cid: "",
        updatedAt: 0,
        error: "Contract address not configured"
      };
    }

    // Kết nối đến provider (read-only, không cần signer)
    const provider = new BrowserProvider(window.ethereum);
    const contract = new Contract(contractAddress, vaultContractAbi, provider);

    // Gọi getVaultPointer để lấy dữ liệu
    const [cid, updatedAt] = await contract.getVaultPointer(userAddress);

    return {
      cid,
      updatedAt: Number(updatedAt),
      error: null
    };
  } catch (error) {
    console.error("Error getting vault CID from chain:", error);
    return {
      cid: "",
      updatedAt: 0,
      error: error.message || "Failed to fetch vault pointer"
    };
  }
}
