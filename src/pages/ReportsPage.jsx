import { useState, useEffect, useMemo, useRef } from "react";
import { useApp } from "../context/AppContext";
import PageHeader from "../components/shared/PageHeader";
import { evaluatePasswordStrength, extractUserInputs, containsPersonalInfo, getDomainName } from "../utils/password";
import { scanVaultsForLeaks } from "../services/pwnedService";
import { 
  ShieldAlert, 
  ShieldCheck, 
  AlertTriangle, 
  KeyRound, 
  Globe2, 
  UserRound, 
  Copy, 
  AlertCircle, 
  Activity, 
  RefreshCw,
  XCircle,
  Play
} from "lucide-react";

export default function ReportsPage() {
  const { vaults, userProfile, notify } = useApp();

  // State for leak scan
  const [scanState, setScanState] = useState("idle"); // idle, scanning, success, error
  const [scanProgress, setScanProgress] = useState(0);
  const [currentScanItem, setCurrentScanItem] = useState(null);
  const [scanResults, setScanResults] = useState([]);
  const [scanError, setScanError] = useState(null);
  
  const abortControllerRef = useRef(null);

  // Auto-abort scan on component unmount to prevent React state update memory leaks
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Compute vault analytics locally on RAM
  const personalInputs = useMemo(() => {
    return extractUserInputs(userProfile);
  }, [userProfile]);

  const analytics = useMemo(() => {
    const total = vaults.length;
    let weakCount = 0;
    let duplicateCount = 0;
    let personalInfoCount = 0;

    // Grouping passwords to find duplicates using a hash map
    const pwdGroups = {};
    vaults.forEach((item) => {
      const pwd = item.password || "";
      if (!pwdGroups[pwd]) {
        pwdGroups[pwd] = [];
      }
      pwdGroups[pwd].push(item);
    });

    const duplicatePasswords = new Set();
    Object.entries(pwdGroups).forEach(([pwd, items]) => {
      if (items.length > 1 && pwd !== "") {
        duplicateCount += items.length;
        duplicatePasswords.add(pwd);
      }
    });

    // Evaluate each vault item for local vulnerabilities
    const itemsWithIssues = vaults.map((item, index) => {
      const strength = evaluatePasswordStrength(item.password, personalInputs);
      const isWeak = strength.score <= 1;
      const isDuplicate = duplicatePasswords.has(item.password || "");
      const hasPersonalInfo = containsPersonalInfo(item.password, personalInputs);

      if (isWeak) weakCount++;
      if (hasPersonalInfo) personalInfoCount++;

      const issues = [];
      if (isWeak) {
        issues.push({
          type: "weak",
          label: "Mật khẩu yếu",
          description: `Độ bảo mật thấp (Điểm: ${strength.score}/4)`,
          color: "text-red-500 bg-red-500/10 border-red-500/20 dark:text-red-400"
        });
      }
      if (isDuplicate) {
        issues.push({
          type: "duplicate",
          label: "Mật khẩu trùng lặp",
          description: "Mật khẩu đang được dùng chung với tài khoản khác",
          color: "text-amber-500 bg-amber-500/10 border-amber-500/20 dark:text-amber-400"
        });
      }
      if (hasPersonalInfo) {
        issues.push({
          type: "personal",
          label: "Chứa thông tin cá nhân",
          description: "Mật khẩu chứa Tên/Ngày sinh/SĐT của bạn",
          color: "text-rose-500 bg-rose-500/10 border-rose-500/20 dark:text-rose-400"
        });
      }

      return {
        ...item,
        originalIndex: index,
        issues
      };
    }).filter(item => item.issues.length > 0);

    return {
      total,
      weakCount,
      duplicateCount,
      personalInfoCount,
      itemsWithIssues
    };
  }, [vaults, personalInputs]);

  // Handler to start the Have I Been Pwned scan
  const handleStartScan = async () => {
    if (vaults.length === 0) {
      notify("Két sắt trống, không có tài khoản để quét.", "warning");
      return;
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;

    setScanState("scanning");
    setScanProgress(0);
    setScanError(null);
    setScanResults([]);

    try {
      const results = await scanVaultsForLeaks(
        vaults,
        (progressInfo) => {
          if (controller.signal.aborted) return;
          
          if (progressInfo.status === "checking") {
            setCurrentScanItem({
              name: progressInfo.name,
              username: progressInfo.username,
              index: progressInfo.index,
              total: progressInfo.total
            });
          }
          setScanProgress(progressInfo.progress);
        },
        controller.signal,
        150 // 150ms delay between requests to avoid rate limits
      );

      if (controller.signal.aborted) return;

      // Filter to items that have pwned counts > 0 or checking errors
      const leakedItems = results
        .map((res, idx) => ({ ...res, domain: getDomainName(res.url) || "unknown-site", originalIndex: idx }))
        .filter(res => res.pwnedCount > 0 || res.error);

      setScanResults(leakedItems);
      setScanState("success");
      notify("Đã hoàn tất quét rò rỉ dữ liệu!", "success");
    } catch (err) {
      if (controller.signal.aborted) return;
      if (err.name === "AbortError") return;

      setScanState("error");
      setScanError(err.message || "Đã xảy ra lỗi kết nối hoặc rate limit từ API.");
      notify("Quét rò rỉ thất bại. Vui lòng thử lại sau.", "danger");
    } finally {
      if (abortControllerRef.current === controller) {
        abortControllerRef.current = null;
      }
    }
  };

  // Handler to manually cancel/abort scanning
  const handleCancelScan = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setScanState("idle");
      notify("Đã hủy quét rò rỉ", "warning");
    }
  };

  const copyPassword = async (password) => {
    try {
      await navigator.clipboard.writeText(password);
      notify("Đã sao chép mật khẩu", "success");
    } catch {
      notify("Không thể sao chép mật khẩu. Hãy thử lại.", "danger");
    }
  };

  // Configure summary card states based on analytics metrics
  const cards = [
    {
      title: "Tổng tài khoản",
      value: analytics.total,
      icon: KeyRound,
      color: "text-blue-500 bg-blue-500/10 border-blue-500/20 dark:text-blue-400",
      description: "Mục trong két sắt"
    },
    {
      title: "Mật khẩu yếu",
      value: analytics.weakCount,
      icon: ShieldAlert,
      color: analytics.weakCount > 0 
        ? "text-red-500 bg-red-500/10 border-red-500/20 dark:text-red-400" 
        : "text-emerald-500 bg-emerald-500/10 border-emerald-500/20 dark:text-emerald-400",
      description: "zxcvbn ≤ 1"
    },
    {
      title: "Trùng lặp",
      value: analytics.duplicateCount,
      icon: AlertTriangle,
      color: analytics.duplicateCount > 0 
        ? "text-amber-500 bg-amber-500/10 border-amber-500/20 dark:text-amber-400" 
        : "text-emerald-500 bg-emerald-500/10 border-emerald-500/20 dark:text-emerald-400",
      description: "Dùng lại mật khẩu"
    },
    {
      title: "Vi phạm thông tin",
      value: analytics.personalInfoCount,
      icon: AlertCircle,
      color: analytics.personalInfoCount > 0 
        ? "text-rose-500 bg-rose-500/10 border-rose-500/20 dark:text-rose-400" 
        : "text-emerald-500 bg-emerald-500/10 border-emerald-500/20 dark:text-emerald-400",
      description: "Chứa Tên/Ngày sinh/SĐT"
    }
  ];

  return (
    <section className="space-y-6 pb-12">
      <PageHeader
        eyebrow="Báo cáo bảo mật"
        title="Trung tâm An ninh"
        description="Đánh giá sức khỏe két sắt cục bộ trên RAM và quét rò rỉ Dark Web dựa trên mô hình Zero-Knowledge."
      />

      {/* SECTION 1: Health Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card, i) => {
          const Icon = card.icon;
          return (
            <div key={i} className={`panel flex items-center justify-between p-5 border ${card.color}`}>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-app-muted">{card.title}</p>
                <p className="mt-2 text-3xl font-extrabold tracking-tight">{card.value}</p>
                <p className="mt-1 text-xs opacity-85">{card.description}</p>
              </div>
              <div className="rounded-2xl bg-white/5 p-3">
                <Icon className="h-6 w-6" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Local Vault Diagnostics List */}
      <div className="panel p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-app-border pb-3">
          <div>
            <h3 className="text-lg font-bold text-app-text">Đánh giá két sắt</h3>
            <p className="text-sm text-app-muted">Phân tích rủi ro bảo mật cục bộ của từng tài khoản</p>
          </div>
          <span className="flex items-center gap-1.5 rounded-full bg-app-surface-alt px-3 py-1 text-xs font-medium text-app-muted">
            <Activity className="h-3.5 w-3.5 text-app-primary" />
            Kiểm tra cục bộ (RAM)
          </span>
        </div>

        {analytics.itemsWithIssues.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="rounded-full bg-emerald-500/10 p-3 text-emerald-500 border border-emerald-500/20 dark:text-emerald-400">
              <ShieldCheck className="h-8 w-8" />
            </div>
            <h4 className="mt-3 text-base font-bold text-app-text">Két sắt an toàn cục bộ</h4>
            <p className="mt-1 max-w-md text-sm text-app-muted">
              Tuyệt vời! Không phát hiện mật khẩu nào bị yếu, trùng lặp hoặc chứa thông tin cá nhân của bạn.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-app-border">
            {analytics.itemsWithIssues.map((item, idx) => {
              const domain = getDomainName(item.url) || "unknown-site";
              return (
                <div key={idx} className="flex flex-col gap-4 py-4 sm:flex-row sm:items-center sm:justify-between first:pt-0 last:pb-0">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-app-surface-alt text-app-primary">
                      <Globe2 className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="truncate text-sm font-semibold text-app-text">{domain}</h4>
                      <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-app-muted">
                        <span className="inline-flex items-center gap-1">
                          <UserRound className="h-3 w-3" />
                          {item.username}
                        </span>
                        <span className="font-mono tracking-wider">• • • • • •</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                    {item.issues.map((issue, issueIdx) => (
                      <span
                        key={issueIdx}
                        className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold ${issue.color}`}
                        title={issue.description}
                      >
                        {issue.label}
                      </span>
                    ))}
                    <button
                      className="icon-button h-8 w-8 ml-2"
                      onClick={() => copyPassword(item.password)}
                      title="Sao chép mật khẩu"
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* SECTION 2: Have I Been Pwned Leak Scanner Card */}
      <div className="panel p-6 space-y-6">
        <div className="border-b border-app-border pb-3">
          <h3 className="text-lg font-bold text-app-text">Quét Rò Rỉ Dark Web</h3>
          <p className="text-sm text-app-muted">
            Đối chiếu mật khẩu của bạn với cơ sở dữ liệu các vụ rò rỉ thông tin công khai đã biết.
          </p>
        </div>

        {/* Privacy principles & zero-knowledge disclosure */}
        <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-4 flex gap-3 text-sm text-blue-500 dark:text-blue-400">
          <ShieldCheck className="h-5 w-5 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-semibold text-blue-400">Cam kết bảo mật Zero-Knowledge</p>
            <p className="text-xs text-app-muted leading-relaxed">
              Chúng tôi sử dụng thuật toán <strong>K-Anonymity</strong> để đảm bảo mật khẩu gốc của bạn KHÔNG bao giờ bị gửi đi. 
              Mật khẩu được băm SHA-1 cục bộ, ứng dụng chỉ gửi 5 ký tự đầu (Prefix) của mã băm lên API Have I Been Pwned. 
              API trả về danh sách các hậu tố trùng khớp, và việc so khớp hậu tố hoàn chỉnh được thực hiện an toàn ngay trên RAM của bạn.
            </p>
          </div>
        </div>

        {/* IDLE State */}
        {scanState === "idle" && (
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <div className="rounded-full bg-app-surface-alt p-4 border border-app-border text-app-primary">
              <Activity className="h-10 w-10 animate-pulse" />
            </div>
            <h4 className="mt-4 text-base font-bold text-app-text">Sẵn sàng quét két sắt</h4>
            <p className="mt-1 max-w-md text-sm text-app-muted">
              Kiểm tra an toàn {vaults.length} tài khoản trong két sắt của bạn để phát hiện các mối đe dọa rò rỉ dữ liệu.
            </p>
            <button
              onClick={handleStartScan}
              className="btn-primary mt-5 flex items-center gap-2"
              disabled={vaults.length === 0}
            >
              <Play className="h-4 w-4" />
              Bắt đầu Quét
            </button>
          </div>
        )}

        {/* SCANNING State */}
        {scanState === "scanning" && (
          <div className="space-y-5 py-4">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <RefreshCw className="h-4 w-4 animate-spin text-app-primary" />
                <span className="font-semibold text-app-text">
                  Đang quét... ({currentScanItem ? currentScanItem.index : 0}/{currentScanItem ? currentScanItem.total : vaults.length})
                </span>
              </div>
              <span className="text-app-muted font-mono">{scanProgress}%</span>
            </div>

            {/* Progress Bar UI */}
            <div className="w-full bg-app-surface-alt rounded-full h-2.5 overflow-hidden border border-app-border">
              <div
                className="bg-app-primary h-full transition-all duration-300 rounded-full"
                style={{ width: `${scanProgress}%` }}
              />
            </div>

            {/* Current scanning item details */}
            {currentScanItem && (
              <p className="text-xs text-app-muted truncate bg-app-surface-alt/50 p-2.5 rounded-lg border border-app-border/40">
                Đang kiểm tra: <span className="font-semibold text-app-text">{getDomainName(currentScanItem.name)}</span> ({currentScanItem.username})
              </p>
            )}

            <div className="flex justify-end">
              <button
                onClick={handleCancelScan}
                className="btn-soft border-rose-500/30 text-rose-500 hover:bg-rose-500/10 flex items-center gap-1.5"
              >
                <XCircle className="h-4 w-4" />
                Hủy quét
              </button>
            </div>
          </div>
        )}

        {/* SUCCESS State */}
        {scanState === "success" && (
          <div className="space-y-6">
            {scanResults.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-6 text-center">
                <div className="rounded-full bg-emerald-500/10 p-4 text-emerald-500 border border-emerald-500/20 dark:text-emerald-400">
                  <ShieldCheck className="h-12 w-12" />
                </div>
                <h4 className="mt-4 text-lg font-bold text-app-text">Két sắt an toàn khỏi các rò rỉ đã biết</h4>
                <p className="mt-2 max-w-md text-sm text-app-muted">
                  Tuyệt vời! Không phát hiện mật khẩu nào của bạn xuất hiện trong cơ sở dữ liệu các vụ rò rỉ đã biết của Have I Been Pwned.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4 flex gap-3 text-sm text-red-500 dark:text-red-400">
                  <ShieldAlert className="h-5 w-5 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold">Phát hiện mật khẩu bị rò rỉ dữ liệu!</p>
                    <p className="text-xs text-app-muted mt-1 leading-relaxed">
                      Phát hiện {scanResults.length} tài khoản có mật khẩu đã từng bị lộ trên Dark Web hoặc các vụ hack lớn. Bạn nên đổi mật khẩu các tài khoản này ngay lập tức để giữ an toàn.
                    </p>
                  </div>
                </div>

                <div className="divide-y divide-app-border border border-app-border rounded-xl bg-app-surface-alt/20 px-4">
                  {scanResults.map((item, idx) => (
                    <div key={idx} className="flex flex-col gap-4 py-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-start gap-3 min-w-0">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-red-500/10 text-red-500 border border-red-500/20 dark:text-red-400">
                          <AlertCircle className="h-5 w-5" />
                        </div>
                        <div className="min-w-0">
                          <h4 className="truncate text-sm font-semibold text-app-text">{item.domain}</h4>
                          <span className="text-xs text-app-muted block truncate">{item.username}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        {item.error ? (
                          <span className="rounded-full bg-amber-500/10 border border-amber-500/20 px-3 py-1 text-xs font-semibold text-amber-500 dark:text-amber-400">
                            Lỗi: {item.error}
                          </span>
                        ) : (
                          <span className="rounded-full bg-red-500/10 border border-red-500/20 px-3 py-1 text-xs font-semibold text-red-500 dark:text-red-400">
                            Đã bị lộ {item.pwnedCount.toLocaleString()} lần trên mạng
                          </span>
                        )}

                        <button
                          className="icon-button h-8 w-8"
                          onClick={() => {
                            const original = vaults[item.originalIndex];
                            if (original) copyPassword(original.password);
                          }}
                          title="Sao chép mật khẩu"
                        >
                          <Copy className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end">
              <button
                onClick={handleStartScan}
                className="btn-soft flex items-center gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Quét lại
              </button>
            </div>
          </div>
        )}

        {/* ERROR State */}
        {scanState === "error" && (
          <div className="space-y-4 py-4">
            <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4 flex gap-3 text-sm text-red-500 dark:text-red-400">
              <ShieldAlert className="h-5 w-5 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Quá trình quét gặp sự cố</p>
                <p className="text-xs text-app-muted mt-1">{scanError}</p>
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setScanState("idle")}
                className="btn-secondary"
              >
                Quay lại
              </button>
              <button
                onClick={handleStartScan}
                className="btn-primary flex items-center gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Thử lại quét
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
