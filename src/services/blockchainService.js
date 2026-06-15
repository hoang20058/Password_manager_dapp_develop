import { BrowserProvider, Contract } from "ethers";
import {
  ErrorCodes,
  VaultServiceError,
  getUserFriendlyMessage,
  isRetryableError,
  normalizeError,
  validateCID,
  validateEthereumAddress,
  validateNetworkMatch
} from "../utils/errorHandling";

const vaultContractAbi = [
  {
    type: "function",
    name: "updateVaultPointer",
    inputs: [{ name: "_cid", type: "string" }],
    outputs: [],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    name: "getVaultPointer",
    inputs: [{ name: "_user", type: "address" }],
    outputs: [
      { name: "cid", type: "string" },
      { name: "updatedAt", type: "uint256" }
    ],
    stateMutability: "view"
  },
  {
    type: "event",
    name: "VaultUpdated",
    inputs: [
      { name: "user", type: "address", indexed: true },
      { name: "cid", type: "string" },
      { name: "timestamp", type: "uint256" }
    ]
  }
];

function getContractAddress() {
  const contractAddress = import.meta.env.VITE_VAULT_CONTRACT_ADDRESS;
  if (!contractAddress || !/^0x[a-fA-F0-9]{40}$/.test(contractAddress)) {
    throw new VaultServiceError(ErrorCodes.CONTRACT_ADDRESS_MISSING);
  }
  return contractAddress;
}

function getEthereumProvider() {
  if (!globalThis.window?.ethereum) {
    throw new VaultServiceError(ErrorCodes.METAMASK_NOT_DETECTED);
  }
  return window.ethereum;
}

export async function updateVaultCidOnChain(cid) {
  try {
    const validCid = validateCID(cid);
    const provider = new BrowserProvider(getEthereumProvider());
    const contractAddress = getContractAddress();

    await validateNetworkMatch();

    let accounts = [];
    try {
      accounts = await provider.send("eth_requestAccounts", []);
    } catch (error) {
      throw normalizeError(error, ErrorCodes.USER_REJECTED);
    }

    if (!accounts.length) {
      throw new VaultServiceError(ErrorCodes.METAMASK_NOT_DETECTED, "No MetaMask account is connected");
    }

    const signer = await provider.getSigner();
    const contract = new Contract(contractAddress, vaultContractAbi, signer);

    try {
      await contract.updateVaultPointer.estimateGas(validCid);
    } catch (error) {
      const normalized = normalizeError(error, ErrorCodes.GAS_ESTIMATION_FAILED);
      if (!isRetryableError(normalized)) throw normalized;
    }

    const tx = await contract.updateVaultPointer(validCid);
    const receipt = await tx.wait();

    if (!receipt || receipt.status === 0) {
      throw new VaultServiceError(ErrorCodes.TRANSACTION_FAILED, "Transaction reverted", receipt);
    }

    return {
      success: true,
      txHash: tx.hash,
      blockNumber: receipt.blockNumber
    };
  } catch (error) {
    const normalized = normalizeError(error, ErrorCodes.TRANSACTION_FAILED);
    return {
      success: false,
      txHash: null,
      error: getUserFriendlyMessage(normalized),
      code: normalized.code,
      canRetry: isRetryableError(normalized),
      details: normalized.details || normalized.message
    };
  }
}

export async function getVaultCidFromChain(userAddress) {
  try {
    const validAddress = validateEthereumAddress(userAddress);
    const provider = new BrowserProvider(getEthereumProvider());
    const contract = new Contract(getContractAddress(), vaultContractAbi, provider);

    await validateNetworkMatch();

    const [cid, updatedAt] = await contract.getVaultPointer(validAddress);

    return {
      cid: cid || "",
      updatedAt: Number(updatedAt) || 0,
      error: null
    };
  } catch (error) {
    const normalized = normalizeError(error, ErrorCodes.SYNC_FAILED);
    return {
      cid: "",
      updatedAt: 0,
      error: getUserFriendlyMessage(normalized),
      code: normalized.code,
      details: normalized.details || normalized.message
    };
  }
}
