export async function hashText(text) {
  const encoder = new TextEncoder();
  const buffer = await crypto.subtle.digest("SHA-256", encoder.encode(text));
  return Array.from(new Uint8Array(buffer))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function normalizeInputSecret(value) {
  return String(value ?? "");
}

export function normalizeStoredSecret(storedValue) {
  if (typeof storedValue !== "string") return "";

  const trimmed = storedValue.trim();
  if (!trimmed) return "";
  if (trimmed === "null" || trimmed === "undefined") return "";

  // Handle legacy values accidentally persisted as JSON strings, e.g. "\"sha256:...\""
  if ((trimmed.startsWith('"') && trimmed.endsWith('"')) || (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
    try {
      const parsed = JSON.parse(trimmed);
      return typeof parsed === "string" ? parsed.trim() : trimmed.slice(1, -1).trim();
    } catch {
      return trimmed.slice(1, -1).trim();
    }
  }

  return trimmed;
}

export async function hashSecret(text) {
  const normalized = normalizeInputSecret(text);
  return `sha256:${await hashText(normalized)}`;
}

export async function verifySecret(text, storedValue) {
  const normalizedStored = normalizeStoredSecret(storedValue);
  const normalizedInput = normalizeInputSecret(text);

  if (!normalizedStored) return false;
  if (normalizedStored.startsWith("sha256:")) {
    return normalizedStored === (await hashSecret(normalizedInput));
  }
  return normalizedStored === normalizedInput;
}

export function maskAddress(address = "") {
  if (!address) return "";
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function generatePassword(length = 16, options = {}) {
  const {
    lowercase = true,
    uppercase = true,
    numbers = true,
    symbols = true
  } = options;

  const pools = [];
  if (lowercase) pools.push("abcdefghijklmnopqrstuvwxyz");
  if (uppercase) pools.push("ABCDEFGHIJKLMNOPQRSTUVWXYZ");
  if (numbers) pools.push("0123456789");
  if (symbols) pools.push("!@#$%^&*()-_=+[]{};:,.?/\\|~");

  const charset = pools.join("") || "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  const result = [];

  for (let index = 0; index < length; index += 1) {
    result.push(charset[Math.floor(Math.random() * charset.length)]);
  }

  return result.join("");
}

export function buildVaultCommitment(vaults, salt = "") {
  const raw = JSON.stringify(vaults) + `::${salt}`;
  return raw;
}
