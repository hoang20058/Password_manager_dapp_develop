/**
 * pwnedService.js
 * Implementation of K-Anonymity model for checking password exposure using Have I Been Pwned API.
 * Ref: https://haveibeenpwned.com/API/v3#PwnedPasswords
 */

/**
 * Computes SHA-1 hash of a string using Web Crypto API.
 * Returns uppercase hex string.
 * @param {string} password 
 * @returns {Promise<string>}
 */
export async function sha1(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await window.crypto.subtle.digest("SHA-1", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("").toUpperCase();
}

/**
 * Checks a single password against the Have I Been Pwned API.
 * @param {string} password 
 * @param {AbortSignal} [signal]
 * @returns {Promise<number>} Number of times pwned
 */
export async function checkPasswordLeak(password, signal) {
  if (!password) return 0;
  
  const hashHex = await sha1(password);
  const prefix = hashHex.slice(0, 5);
  const suffix = hashHex.slice(5);

  const response = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`, { signal });
  
  if (!response.ok) {
    throw new Error(`Yêu cầu thất bại với mã trạng thái ${response.status}`);
  }

  const text = await response.text();
  const lines = text.split("\n");
  
  for (const line of lines) {
    const [lineSuffix, countStr] = line.trim().split(":");
    if (lineSuffix === suffix) {
      return parseInt(countStr, 10) || 0;
    }
  }
  
  return 0;
}

/**
 * Scans a list of vaults for leaks.
 * Runs sequentially with a delay to avoid rate limiting (HTTP 429).
 * Supports cancellation via AbortSignal to prevent state updates on unmounted components.
 * 
 * @param {Array} vaults List of vault objects
 * @param {Function} onProgress Progress callback: (info) => void
 * @param {AbortSignal} [signal] Optional abort signal
 * @param {number} [delayMs] Delay between requests in milliseconds
 * @returns {Promise<Array>} List of scan results
 */
export async function scanVaultsForLeaks(vaults, onProgress, signal, delayMs = 150) {
  const results = [];
  const total = vaults.length;

  for (let i = 0; i < total; i++) {
    if (signal?.aborted) {
      throw new DOMException("Aborted", "AbortError");
    }

    const item = vaults[i];
    const name = item.url || "unknown-site";
    const username = item.username || "";

    // Trigger progress update for start of check
    onProgress({
      index: i,
      total,
      name,
      username,
      status: "checking",
      progress: Math.round((i / total) * 100)
    });

    let pwnedCount = 0;
    let error = null;

    try {
      if (item.password) {
        pwnedCount = await checkPasswordLeak(item.password, signal);
      }
    } catch (err) {
      if (err.name === "AbortError") {
        throw err;
      }
      error = err.message || "Lỗi kiểm tra";
    }

    const resultItem = {
      url: item.url,
      username: item.username,
      pwnedCount,
      error
    };

    results.push(resultItem);

    // Trigger progress update after completed check
    onProgress({
      index: i + 1,
      total,
      name,
      username,
      pwnedCount,
      error,
      status: "done",
      progress: Math.round(((i + 1) / total) * 100),
      currentResult: resultItem
    });

    // Apply delay if this is not the last item
    if (i < total - 1) {
      await new Promise((resolve, reject) => {
        const timeoutId = setTimeout(resolve, delayMs);
        const onAbort = () => {
          clearTimeout(timeoutId);
          reject(new DOMException("Aborted", "AbortError"));
        };
        
        if (signal?.aborted) {
          onAbort();
        } else {
          signal?.addEventListener("abort", onAbort);
        }
      });
    }
  }

  return results;
}
