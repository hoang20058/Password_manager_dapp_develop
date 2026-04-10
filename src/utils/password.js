import { zxcvbn, zxcvbnOptions } from "@zxcvbn-ts/core";
import {
  adjacencyGraphs,
  dictionary
} from "@zxcvbn-ts/language-common";

const MIN_PASSWORD_LENGTH = 8;
const SAFE_SCORE_THRESHOLD = 3;

const COMMON_PASSWORDS = new Set([
  "123456",
  "123456789",
  "12345678",
  "12345",
  "password",
  "password123",
  "qwerty",
  "qwerty123",
  "abc123",
  "111111",
  "000000",
  "123123",
  "iloveyou",
  "admin",
  "welcome",
  "letmein",
  "monkey",
  "dragon",
  "sunshine",
  "football",
  "baseball",
  "master",
  "login",
  "passw0rd",
  "1q2w3e4r",
  "1qaz2wsx",
  "zaq12wsx",
  "asdfgh",
  "asdf1234",
  "987654321",
  "11111111",
  "1234",
  "1234567",
  "654321",
  "7777777",
  "123321",
  "qwe123",
  "princess",
  "charlie",
  "myspace1",
  "freedom",
  "superman",
  "trustno1",
  "admin123",
  "root",
  "pass123",
  "123456a",
  "0987654321",
  "batman",
  "hello123"
]);

let strengthEngineConfigured = false;

function ensureStrengthEngine() {
  if (strengthEngineConfigured) return;

  zxcvbnOptions.setOptions({
    dictionary: {
      ...dictionary,
      userInputs: []
    },
    graphs: adjacencyGraphs
  });

  strengthEngineConfigured = true;
}

function getStrengthLabel(score) {
  if (score <= 1) return "Yếu";
  if (score === 2) return "Trung bình";
  if (score === 3) return "Khá";
  return "Mạnh";
}

function translateCrackTimeDisplay(value) {
  if (!value) return "";

  return String(value)
    .replace(/years?/gi, "năm")
    .replace(/months?/gi, "tháng")
    .replace(/weeks?/gi, "tuần")
    .replace(/days?/gi, "ngày")
    .replace(/hours?/gi, "giờ")
    .replace(/minutes?/gi, "phút")
    .replace(/seconds?/gi, "giây")
    .replace(/less than/gi, "ít hơn")
    .replace(/centuries?/gi, "Thế kỷ");
}

export function evaluatePasswordStrength(password = "", userInputs = []) {
  const normalizedPassword = String(password ?? "");
  const loweredPassword = normalizedPassword.toLowerCase();
  const cleanedInputs = userInputs
    .filter((item) => typeof item === "string" && item.trim())
    .map((item) => item.trim());

  if (!normalizedPassword) {
    return {
      score: 0,
      label: "Rỗng",
      isCommon: false,
      tooShort: true,
      meetsPolicy: false,
      warning: "",
      suggestions: [],
      crackTimeDisplay: ""
    };
  }

  ensureStrengthEngine();
  const result = zxcvbn(normalizedPassword, cleanedInputs);
  const isCommon = COMMON_PASSWORDS.has(loweredPassword);
  const tooShort = normalizedPassword.length < MIN_PASSWORD_LENGTH;
  const score = isCommon ? 0 : result.score;
  const warning = isCommon
    ? "Mật khẩu nằm trong danh sách phổ biến, rất dễ bị tấn công."
    : result.feedback.warning || "";

  const suggestions = isCommon
    ? [
        "Không dùng mật khẩu phổ biến hoặc mang tính mặc định.",
        "Tăng độ dài và kết hợp chữ hoa, chữ thường, số, ký tự đặc biệt."
      ]
    : result.feedback.suggestions || [];

  const meetsPolicy = !tooShort && score >= SAFE_SCORE_THRESHOLD;

  return {
    score,
    label: getStrengthLabel(score),
    isCommon,
    tooShort,
    meetsPolicy,
    warning,
    suggestions,
    crackTimeDisplay: translateCrackTimeDisplay(result.crackTimesDisplay.offlineSlowHashing1e4PerSecond || "")
  };
}

export { translateCrackTimeDisplay };

export const isSafePassword = (password = "", userInputs = []) =>
  evaluatePasswordStrength(password, userInputs).meetsPolicy;

export function assessVaultPasswords(vaults = []) {
  const entries = Array.isArray(vaults) ? vaults : [];
  const weakEntries = entries
    .map((item, index) => ({
      index,
      url: item?.url || "",
      username: item?.username || "",
      strength: evaluatePasswordStrength(item?.password || "", [item?.url || "", item?.username || ""])
    }))
    .filter((item) => !item.strength.meetsPolicy);

  return {
    total: entries.length,
    weakCount: weakEntries.length,
    safeCount: entries.length - weakEntries.length,
    weakEntries
  };
}

export const getDomainName = (url = "") => {
  try {
    return url.replace(/^(https?:\/\/)?(www\.)?/i, "").split("/")[0];
  } catch {
    return "unknown-site";
  }
};
