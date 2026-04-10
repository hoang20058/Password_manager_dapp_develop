import { useMemo } from "react";
import { evaluatePasswordStrength } from "../../utils/password";

const meterTone = [
  "bg-red-500",
  "bg-orange-500",
  "bg-amber-500",
  "bg-lime-500",
  "bg-green-500"
];

export default function PasswordStrengthHint({ password = "", userInputs = [], policyText }) {
  const strength = useMemo(
    () => evaluatePasswordStrength(password, userInputs),
    [password, userInputs]
  );

  if (!password) {
    return (
      <div className="rounded-xl border bg-app-surface-alt p-3 text-xs text-app-muted">
        Nhập mật khẩu để xem đánh giá độ mạnh.
      </div>
    );
  }

  return (
    <div className="rounded-xl border bg-app-surface-alt p-3 text-xs text-app-muted">
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="font-semibold text-app-text">Độ mạnh: {strength.label}</p>
        <p className={strength.meetsPolicy ? "text-green-600" : "text-amber-600"}>
          {strength.meetsPolicy ? "Đạt khuyến nghị" : "Cần cải thiện"}
        </p>
      </div>

      <div className="mb-2 grid grid-cols-4 gap-1">
        {[0, 1, 2, 3].map((segment) => (
          <span
            key={segment}
            className={`h-1.5 rounded-full ${segment <= strength.score ? meterTone[strength.score] : "bg-app-border"}`}
          />
        ))}
      </div>

      <p>
        Chính sách: {policyText || "Tối thiểu 8 ký tự và đạt mức Khá trở lên."}
      </p>
      {strength.warning ? <p className="mt-1 text-amber-700">Cảnh báo: {strength.warning}</p> : null}
      {strength.suggestions?.length ? (
        <p className="mt-1">Gợi ý: {strength.suggestions[0]}</p>
      ) : null}
      {strength.crackTimeDisplay ? (
        <p className="mt-1">Ước tính thời gian bẻ khóa: {strength.crackTimeDisplay}</p>
      ) : null}
    </div>
  );
}
