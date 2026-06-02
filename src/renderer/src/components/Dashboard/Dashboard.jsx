import React, { useState, useRef, useEffect } from "react";
import { useAppContext } from "../../context/AppContext.jsx";
import { useAutomation } from "../../hooks/useAutomation.js";
import { useConfig } from "../../hooks/useConfig.js";
import { PLATFORMS, PLATFORM_NAMES, LOG_TYPES } from "../../utils/constants.js";
import { useTranslation } from "react-i18next";

const PLATFORM_META = {
  [PLATFORMS.INSTAGRAM]: {
    color: "from-pink-600 to-rose-500",
    border: "border-pink-500/30",
    ring: "ring-pink-500/20",
    badge: "bg-pink-500/10 text-pink-300 border-pink-500/20",
    dot: "bg-pink-400",
    placeholder: "https://www.instagram.com/username",
    icon: (
      <svg
        className="w-4 h-4"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth="2"
      >
        <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
        <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
        <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
      </svg>
    ),
  },
  [PLATFORMS.TWITTER]: {
    color: "from-slate-700 to-slate-900",
    border: "border-slate-600/30",
    ring: "ring-slate-500/20",
    badge: "bg-slate-500/10 text-slate-300 border-slate-500/20",
    dot: "bg-slate-400",
    placeholder: "https://x.com/username",
    icon: (
      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    ),
  },
  [PLATFORMS.THREADS]: {
    color: "from-zinc-700 to-zinc-900",
    border: "border-zinc-600/30",
    ring: "ring-zinc-500/20",
    badge: "bg-zinc-500/10 text-zinc-300 border-zinc-500/20",
    dot: "bg-zinc-400",
    placeholder: "https://www.threads.net/@username",
    icon: (
      <svg
        className="w-4 h-4"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth="2"
      >
        <path d="M16 12a4 4 0 1 0-8 0 4 4 0 0 0 8 0zm0 0v1.5a2.5 2.5 0 0 0 5 0V12a9 9 0 1 0-9 9m4.5-1.206a8.959 8.959 0 0 1-4.5 1.206" />
      </svg>
    ),
  },
};

const LOG_STYLE = {
  SUKSES: {
    pill: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    text: "text-emerald-400",
    icon: "✓",
  },
  SKIP: {
    pill: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    text: "text-amber-400",
    icon: "→",
  },
  ERROR: {
    pill: "bg-red-500/10 text-red-400 border-red-500/20",
    text: "text-red-400",
    icon: "✕",
  },
  ACTION: {
    pill: "bg-sky-500/10 text-sky-400 border-sky-500/20",
    text: "text-sky-300",
    icon: "⚡",
  },
  SYSTEM: {
    pill: "bg-indigo-500/10 text-indigo-300 border-indigo-500/20",
    text: "text-indigo-300/80 italic",
    icon: "●",
  },
  default: {
    pill: "bg-white/5 text-slate-400 border-white/10",
    text: "text-slate-400",
    icon: "·",
  },
};

export function Dashboard() {
  const {
    selectedPlatform,
    setSelectedPlatform,
    cookiesStatus,
    checkAllCookiesStatus,
    showToast,
    setActiveTab,
    setSettingsSubTab,
  } = useAppContext();
  const { isRunning, logs, handleStart, handleStop, clearLogs } =
    useAutomation();
  const { config } = useConfig();
  const { t } = useTranslation();

  const [targetUrl, setTargetUrl] = useState("");
  const [logSearch, setLogSearch] = useState("");
  const [logFilter, setLogFilter] = useState(LOG_TYPES.ALL);
  const [autoScroll, setAutoScroll] = useState(true);
  const logRef = useRef(null);

  const meta = PLATFORM_META[selectedPlatform];
  const hasCookie = cookiesStatus[selectedPlatform];

  const handleUrlChange = (val) => {
    setTargetUrl(val);
    const l = val.toLowerCase();
    if (l.includes("instagram.com")) setSelectedPlatform(PLATFORMS.INSTAGRAM);
    else if (l.includes("twitter.com") || l.includes("x.com"))
      setSelectedPlatform(PLATFORMS.TWITTER);
    else if (l.includes("threads.net") || l.includes("threads.com"))
      setSelectedPlatform(PLATFORMS.THREADS);
  };

  const filteredLogs = logs.filter((log) => {
    const match = log.message.toLowerCase().includes(logSearch.toLowerCase());
    return logFilter === LOG_TYPES.ALL
      ? match
      : log.type === logFilter && match;
  });

  useEffect(() => {
    if (autoScroll && logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [logs, autoScroll]);

  const handleDownloadLogs = () => {
    const text = logs
      .map((l) => `[${l.time ?? "SYSTEM"}] [${l.type}] ${l.message}`)
      .join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([text], { type: "text/plain" }));
    a.download = `liker_logs_${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
  };

  return (
    <div className="flex-1 flex flex-col gap-5 max-w-5xl mx-auto w-full">
      {/* ── Page header ──────────────────────────────────── */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-black text-white">
            {t("dashboard.title")}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {t("dashboard.description")}
          </p>
        </div>
        {/* Platform tabs */}
        <div className="flex items-center gap-1 bg-white/[0.04] border border-white/[0.06] rounded-xl p-1">
          {Object.values(PLATFORMS).map((p) => {
            const m = PLATFORM_META[p];
            const active = selectedPlatform === p;
            return (
              <button
                key={p}
                disabled={isRunning}
                onClick={() => setSelectedPlatform(p)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all duration-150 disabled:opacity-40 border
                  ${
                    active
                      ? `bg-gradient-to-r ${m.color} text-white border-white/10 shadow-sm`
                      : "text-slate-500 border-transparent hover:text-slate-300 hover:bg-white/[0.04]"
                  }`}
              >
                {m.icon}
                {PLATFORM_NAMES[p]}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Main grid ────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-4">
        {/* ── Left: control panel (col-span-2) ─────────── */}
        <div className="col-span-2 flex flex-col gap-3">
          {/* Cookie status banner */}
          {!hasCookie && (
            <div className="flex items-center gap-3 px-4 py-3 bg-amber-500/8 border border-amber-500/20 rounded-xl">
              <svg
                className="w-4 h-4 text-amber-400 shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
              <p className="text-xs text-amber-300 flex-1">
                Akun <strong>{PLATFORM_NAMES[selectedPlatform]}</strong> belum
                dikonfigurasi. Tambahkan cookie profil sebelum menjalankan
                otomatisasi.
              </p>
              <button
                onClick={() => {
                  setActiveTab("settings");
                  setSettingsSubTab("profiles");
                }}
                className="text-[10px] font-bold text-amber-400 border border-amber-500/30 rounded-lg px-2.5 py-1 hover:bg-amber-500/10 transition-all shrink-0"
              >
                Konfigurasi →
              </button>
            </div>
          )}

          {/* URL input card */}
          <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-5">
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">
              {t("dashboard.targetUrl")} — {PLATFORM_NAMES[selectedPlatform]}
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <span className={`${meta.dot}`}>
                  {meta.icon && (
                    <span className="text-current opacity-60">{meta.icon}</span>
                  )}
                </span>
              </div>
              <input
                type="url"
                value={targetUrl}
                onChange={(e) => handleUrlChange(e.target.value)}
                disabled={isRunning}
                placeholder={meta.placeholder}
                className="w-full bg-[#0c1220] border border-white/[0.08] rounded-xl pl-10 pr-4 py-3 text-sm text-slate-200 placeholder-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500/50 transition-all disabled:opacity-40"
              />
            </div>
            <p className="text-[10px] text-slate-600 mt-2">
              {t("dashboard.cookieHint")}
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex gap-3">
            <button
              onClick={() =>
                handleStart(targetUrl, selectedPlatform, cookiesStatus)
              }
              disabled={isRunning || !targetUrl || !hasCookie}
              className={`flex-1 py-3 px-5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all duration-200 border
                ${
                  isRunning || !targetUrl || !hasCookie
                    ? "bg-white/[0.03] border-white/[0.06] text-slate-600 cursor-not-allowed"
                    : "bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white border-indigo-400/20 shadow-lg shadow-indigo-500/20 active:scale-[0.98]"
                }`}
            >
              {isRunning ? (
                <>
                  <svg
                    className="animate-spin w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                  {t("dashboard.automationRunning")}
                </>
              ) : (
                <>
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  {t("dashboard.startAutomation")}
                </>
              )}
            </button>

            {isRunning ? (
              <button
                onClick={handleStop}
                className="py-3 px-5 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 border border-red-500/20 shadow-lg shadow-red-500/15 active:scale-[0.98] transition-all"
              >
                {t("dashboard.stopAutomation")}
              </button>
            ) : (
              <button
                onClick={async () => {
                  await checkAllCookiesStatus();
                  showToast(
                    hasCookie
                      ? `Cookie ${PLATFORM_NAMES[selectedPlatform]} valid ✓`
                      : `Cookie ${PLATFORM_NAMES[selectedPlatform]} tidak ditemukan`,
                    hasCookie ? "success" : "error",
                  );
                }}
                className="py-3 px-4 rounded-xl text-[11px] font-bold text-slate-400 border border-white/[0.06] hover:bg-white/[0.04] hover:text-slate-300 transition-all"
              >
                Cek Cookie
              </button>
            )}
          </div>
        </div>

        {/* ── Right: config summary ─────────────────────── */}
        <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">
              {t("dashboard.configInfo")}
            </p>
            <button
              onClick={() => setActiveTab("settings")}
              className="text-[9px] font-bold text-indigo-400 hover:text-indigo-300 transition-colors"
            >
              Edit →
            </button>
          </div>

          <div className="space-y-2 flex-1">
            {[
              {
                label: t("dashboard.headlessMode"),
                value: config.headless ? "Aktif (Silent)" : "Nonaktif",
                valueColor: config.headless
                  ? "text-amber-400"
                  : "text-slate-300",
              },
              {
                label: t("dashboard.postLimit"),
                value: `${config.limit} post`,
                valueColor: "text-slate-300",
              },
              {
                label: t("dashboard.delayRange"),
                value: `${config.minDelay / 1000}s – ${config.maxDelay / 1000}s`,
                valueColor: "text-slate-300",
              },
              {
                label: "User Agent",
                value: config.userAgent || "Default",
                valueColor: "text-slate-400",
              },
            ].map((row) => (
              <div
                key={row.label}
                className="flex justify-between items-center py-1.5 border-b border-white/[0.04] last:border-0"
              >
                <span className="text-[11px] text-slate-500">{row.label}</span>
                <span className={`text-[11px] font-bold ${row.valueColor}`}>
                  {row.value}
                </span>
              </div>
            ))}
          </div>

          {/* Cookie status per platform */}
          <div className="pt-2 border-t border-white/[0.04] space-y-1.5">
            <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest">
              Status Akun
            </p>
            {Object.values(PLATFORMS).map((p) => (
              <div key={p} className="flex items-center gap-2">
                <span
                  className={`w-1.5 h-1.5 rounded-full shrink-0 ${cookiesStatus[p] ? "bg-emerald-500" : "bg-slate-700"}`}
                />
                <span className="text-[11px] text-slate-500 flex-1">
                  {PLATFORM_NAMES[p]}
                </span>
                <span
                  className={`text-[9px] font-bold ${cookiesStatus[p] ? "text-emerald-500" : "text-slate-700"}`}
                >
                  {cookiesStatus[p] ? "READY" : "—"}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Activity Log ─────────────────────────────────── */}
      <div className="flex-1 bg-white/[0.03] border border-white/[0.06] rounded-2xl flex flex-col min-h-0 overflow-hidden">
        {/* Log toolbar */}
        <div className="flex items-center gap-2 px-4 py-2.5 border-b border-white/[0.06] shrink-0">
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest mr-1">
            {t("dashboard.logHeader")}
          </span>
          <span
            className={`w-1.5 h-1.5 rounded-full ${isRunning ? "bg-emerald-400 animate-pulse" : "bg-slate-700"}`}
          />

          {/* Filters */}
          <div className="flex gap-0.5 ml-2">
            {[
              LOG_TYPES.ALL,
              LOG_TYPES.SUKSES,
              LOG_TYPES.ERROR,
              LOG_TYPES.SKIP,
              LOG_TYPES.SYSTEM,
            ].map((f) => (
              <button
                key={f}
                onClick={() => setLogFilter(f)}
                className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase transition-all ${
                  logFilter === f
                    ? "bg-indigo-600/20 text-indigo-300 border border-indigo-500/30"
                    : "text-slate-600 hover:text-slate-400 border border-transparent"
                }`}
              >
                {f}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="flex-1 relative ml-1">
            <svg
              className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <input
              value={logSearch}
              onChange={(e) => setLogSearch(e.target.value)}
              placeholder="Cari log..."
              className="w-full bg-[#0c1220] border border-white/[0.06] rounded-lg pl-7 pr-3 py-1 text-[11px] text-slate-300 placeholder-slate-700 focus:outline-none focus:border-indigo-500/40 transition-all"
            />
          </div>

          {/* Auto scroll toggle */}
          <button
            onClick={() => setAutoScroll((v) => !v)}
            className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[9px] font-bold border transition-all ${
              autoScroll
                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                : "text-slate-600 border-white/[0.06]"
            }`}
          >
            <span
              className={`w-1 h-1 rounded-full ${autoScroll ? "bg-emerald-400 animate-pulse" : "bg-slate-600"}`}
            />
            Scroll
          </button>

          {/* Utilities */}
          <button
            onClick={clearLogs}
            className="text-[9px] font-bold text-slate-600 hover:text-slate-400 px-2 py-1 border border-transparent hover:border-white/[0.06] rounded-lg transition-all"
          >
            Hapus
          </button>
          <button
            onClick={handleDownloadLogs}
            disabled={!logs.length}
            className="text-[9px] font-bold text-slate-600 hover:text-slate-400 disabled:opacity-30 px-2 py-1 border border-transparent hover:border-white/[0.06] rounded-lg transition-all"
          >
            Unduh
          </button>
        </div>

        {/* Log output */}
        <div
          ref={logRef}
          className="flex-1 overflow-y-auto p-3 space-y-0.5 font-mono text-[11px] min-h-[200px] max-h-[340px]"
        >
          {filteredLogs.length === 0 ? (
            <div className="h-full flex items-center justify-center text-slate-700 select-none py-10">
              {logs.length === 0
                ? "Sistem siap. Masukkan URL target untuk memulai."
                : "Tidak ada log yang cocok."}
            </div>
          ) : (
            filteredLogs.map((log, i) => {
              const s = LOG_STYLE[log.type] ?? LOG_STYLE.default;
              return (
                <div
                  key={i}
                  className="flex items-start gap-2.5 py-0.5 px-2 rounded hover:bg-white/[0.02] transition-colors group"
                >
                  <span className="text-[9px] text-slate-700 shrink-0 mt-0.5 tabular-nums w-14">
                    {log.time ?? "--:--:--"}
                  </span>
                  <span
                    className={`text-[8.5px] font-black border px-1.5 py-px rounded shrink-0 ${s.pill}`}
                  >
                    {s.icon} {log.type}
                  </span>
                  <span className={`break-all leading-relaxed ${s.text}`}>
                    {log.message}
                  </span>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
