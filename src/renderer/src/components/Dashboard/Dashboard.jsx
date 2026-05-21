import React, { useState, useRef, useEffect } from "react";
import { useAppContext } from "../../context/AppContext.jsx";
import { useAutomation } from "../../hooks/useAutomation.js";
import { useConfig } from "../../hooks/useConfig.js";
import { PLATFORMS, PLATFORM_NAMES, LOG_TYPES } from "../../utils/constants.js";
import { getPlatformPlaceholder } from "../../utils/validators.js";

export function Dashboard() {
  const {
    selectedPlatform,
    setSelectedPlatform,
    cookiesStatus,
    checkAllCookiesStatus,
    setActiveTab,
    setSetupStep,
    setActiveSetupPlatform,
    showToast,
  } = useAppContext();

  const { isRunning, logs, handleStart, handleStop, clearLogs } =
    useAutomation();
  const { config } = useConfig();

  const [targetUrl, setTargetUrl] = useState("");
  const [logSearch, setLogSearch] = useState("");
  const [logFilter, setLogFilter] = useState(LOG_TYPES.ALL);
  const [autoScroll, setAutoScroll] = useState(true);
  const logContainerRef = useRef(null);

  const handleUrlChange = (val) => {
    setTargetUrl(val);
    const lower = val.toLowerCase();
    if (lower.includes("instagram.com")) {
      setSelectedPlatform(PLATFORMS.INSTAGRAM);
    } else if (lower.includes("twitter.com") || lower.includes("x.com")) {
      setSelectedPlatform(PLATFORMS.TWITTER);
    } else if (lower.includes("threads.net") || lower.includes("threads.com")) {
      setSelectedPlatform(PLATFORMS.THREADS);
    }
  };

  const handleDownloadLogs = () => {
    const textContent = logs
      .map((l) => `[${l.time || "SYSTEM"}] [${l.type}] ${l.message}`)
      .join("\n");
    const blob = new Blob([textContent], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `liker_logs_${new Date().toISOString().slice(0, 10)}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const filteredLogs = logs.filter((log) => {
    const matchesSearch = log.message
      .toLowerCase()
      .includes(logSearch.toLowerCase());
    if (logFilter === LOG_TYPES.ALL) return matchesSearch;
    return log.type === logFilter && matchesSearch;
  });

  useEffect(() => {
    if (autoScroll && logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs, autoScroll]);

  const platforms = [
    {
      id: PLATFORMS.INSTAGRAM,
      name: PLATFORM_NAMES[PLATFORMS.INSTAGRAM],
      activeBg:
        "bg-gradient-to-r from-pink-600/80 to-rose-600/80 border-pink-500/30",
      activeGlow: "shadow-pink-500/25",
      icon: (
        <svg
          className="w-4.5 h-4.5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth="2.5"
        >
          <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
          <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
          <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
        </svg>
      ),
    },
    {
      id: PLATFORMS.TWITTER,
      name: PLATFORM_NAMES[PLATFORMS.TWITTER],
      activeBg:
        "bg-gradient-to-r from-slate-850 to-slate-950 border-slate-700/50",
      activeGlow: "shadow-slate-500/25",
      icon: (
        <svg className="w-4.5 h-4.5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      ),
    },
    {
      id: PLATFORMS.THREADS,
      name: PLATFORM_NAMES[PLATFORMS.THREADS],
      activeBg:
        "bg-gradient-to-r from-zinc-800 to-stone-900 border-zinc-700/50",
      activeGlow: "shadow-zinc-500/25",
      icon: (
        <svg
          className="w-4.5 h-4.5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth="2.5"
        >
          <path d="M16 12a4 4 0 1 0-8 0 4 4 0 0 0 8 0zm0 0v1.5a2.5 2.5 0 0 0 5 0V12a9 9 0 1 0-9 9m4.5-1.206a8.959 8.959 0 0 1-4.5 1.206" />
        </svg>
      ),
    },
  ];

  const getLogIcon = (type) => {
    switch (type) {
      case "SUKSES":
        return "✅";
      case "SKIP":
        return "⏭️";
      case "ERROR":
        return "🚨";
      case "ACTION":
        return "⚙️";
      case "SYSTEM":
        return "🤖";
      default:
        return "ℹ️";
    }
  };

  const getLogStyles = (type) => {
    switch (type) {
      case "SUKSES":
        return {
          colorClass:
            "text-emerald-400 font-bold shadow-glow-sm shadow-emerald-400/5",
          pillClass: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
        };
      case "SKIP":
        return {
          colorClass: "text-amber-400 font-medium",
          pillClass: "bg-amber-500/10 text-amber-400 border-amber-500/20",
        };
      case "ERROR":
        return {
          colorClass:
            "text-rose-400 font-bold shadow-glow-sm shadow-rose-400/5",
          pillClass:
            "bg-rose-500/10 text-rose-400 border-rose-500/20 animate-pulse",
        };
      case "ACTION":
        return {
          colorClass: "text-sky-300",
          pillClass: "bg-sky-500/10 text-sky-400 border-sky-500/20",
        };
      case "SYSTEM":
        return {
          colorClass: "text-indigo-300/90 italic",
          pillClass: "bg-indigo-500/10 text-indigo-300 border-indigo-500/20",
        };
      default:
        return {
          colorClass: "text-slate-300",
          pillClass: "bg-slate-800 text-slate-400 border-slate-700",
        };
    }
  };

  return (
    <div className="flex-1 flex flex-col gap-6 max-w-6xl mx-auto w-full">
      {/* Dynamic Header */}
      <div>
        <h2 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-200 to-indigo-400 tracking-tight">
          Control Center
        </h2>
        <p className="text-slate-400 text-sm mt-1">
          Sistem otomatisasi interaksi cerdas bertenaga Playwright & SQLite.
        </p>
      </div>

      {/* PLATFORM SELECTOR TAB BAR */}
      <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 rounded-2xl p-2.5 flex flex-wrap gap-2.5 shadow-xl relative z-10">
        {platforms.map((platform) => (
          <button
            key={platform.id}
            disabled={isRunning}
            onClick={() => setSelectedPlatform(platform.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all duration-300 relative group border select-none
              ${
                selectedPlatform === platform.id
                  ? `${platform.activeBg} text-white shadow-lg ${platform.activeGlow}`
                  : "bg-slate-950/40 text-slate-400 hover:text-slate-200 border-slate-900/60 hover:bg-slate-800/20 disabled:opacity-40 disabled:hover:text-slate-400 disabled:hover:bg-transparent"
              }
            `}
          >
            {platform.icon}
            <span>{platform.name}</span>
            {selectedPlatform === platform.id && (
              <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-4 h-[3px] rounded-full bg-white/80 animate-pulse"></span>
            )}
          </button>
        ))}
      </div>

      {/* Control Panel Grid */}
      <div className="grid grid-cols-3 gap-6">
        {/* Input Card Container (Spans 2 columns) */}
        <div className="col-span-2 bg-slate-900/40 backdrop-blur-md rounded-2xl p-6 border border-slate-800/80 flex flex-col justify-between gap-5 relative overflow-hidden shadow-xl">
          {/* Decorative glowing gradient radial block */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none"></div>

          <div className="flex flex-col gap-4">
            <div className="flex justify-between items-center">
              <label className="text-sm font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <span>Target Profile {PLATFORM_NAMES[selectedPlatform]}</span>
              </label>
              <span
                className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border select-none uppercase
                ${selectedPlatform === PLATFORMS.INSTAGRAM ? "text-pink-400 bg-pink-500/10 border-pink-500/20" : ""}
                ${selectedPlatform === PLATFORMS.TWITTER ? "text-slate-300 bg-slate-500/10 border-slate-500/20" : ""}
                ${selectedPlatform === PLATFORMS.THREADS ? "text-zinc-400 bg-zinc-500/10 border-zinc-500/20" : ""}
              `}
              >
                {PLATFORM_NAMES[selectedPlatform]} Platform
              </span>
            </div>

            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                <svg
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                  />
                </svg>
              </div>
              <input
                type="url"
                value={targetUrl}
                onChange={(e) => handleUrlChange(e.target.value)}
                disabled={isRunning}
                placeholder={getPlatformPlaceholder(selectedPlatform)}
                className="w-full bg-slate-950/80 border border-slate-800 rounded-xl pl-11 pr-4 py-3.5 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all duration-300 disabled:opacity-50 font-medium placeholder-slate-600"
              />
            </div>
          </div>

          {/* Cookie Status Indicator & Check Button */}
          <div className="flex items-center justify-between p-3.5 rounded-xl border bg-slate-950/50 mt-2 mb-1 border-slate-800/80">
            <div className="flex items-center gap-3">
              <span
                className={`w-2.5 h-2.5 rounded-full ${cookiesStatus[selectedPlatform] ? "bg-emerald-500 shadow-glow shadow-emerald-500/50" : "bg-rose-500 shadow-glow shadow-rose-500/50"}`}
              ></span>
              <div>
                <span className="text-xs font-bold text-slate-200 block">
                  Status Kuki Sesi:{" "}
                  <span
                    className={
                      cookiesStatus[selectedPlatform]
                        ? "text-emerald-400"
                        : "text-rose-400"
                    }
                  >
                    {cookiesStatus[selectedPlatform]
                      ? "Tersedia & Valid"
                      : "Belum Dikonfigurasi"}
                  </span>
                </span>
                <span className="text-[10px] text-slate-500 block">
                  Otomatisasi memerlukan berkas kuki login.
                </span>
              </div>
            </div>

            <button
              onClick={async () => {
                await checkAllCookiesStatus();
                if (cookiesStatus[selectedPlatform]) {
                  showToast(
                    `Sistem mendeteksi kuki ${selectedPlatform} valid dan siap digunakan!`,
                    "success",
                  );
                } else {
                  showToast(
                    `Kuki ${selectedPlatform} tidak ditemukan. Mengalihkan ke halaman konfigurasi...`,
                    "error",
                  );
                  setActiveTab("accounts");
                  setSetupStep(1);
                  setActiveSetupPlatform(selectedPlatform);
                }
              }}
              className={`px-4 py-2 rounded-lg text-[11px] font-bold transition-all duration-300 border flex items-center gap-1.5
                  ${
                    cookiesStatus[selectedPlatform]
                      ? "bg-slate-900 border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white"
                      : "bg-rose-600/20 border-rose-500/30 text-rose-400 hover:bg-rose-600/30"
                  }
                `}
            >
              <svg
                className="w-3.5 h-3.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              {cookiesStatus[selectedPlatform] ? "Periksa Kuki" : "Setup Kuki"}
            </button>
          </div>

          <div className="flex gap-4">
            <button
              onClick={() =>
                handleStart(targetUrl, selectedPlatform, cookiesStatus)
              }
              disabled={isRunning || !targetUrl}
              className={`flex-1 py-3.5 px-6 rounded-xl font-bold text-sm text-white transition-all duration-300 shadow-xl flex justify-center items-center gap-2.5 border
                ${
                  isRunning || !targetUrl
                    ? "bg-slate-800/40 border-slate-700/50 text-slate-500 cursor-not-allowed shadow-none"
                    : "bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 border-indigo-400/20 hover:shadow-indigo-500/20 active:scale-[0.98]"
                }
              `}
            >
              {isRunning ? (
                <>
                  <svg
                    className="animate-spin h-5 w-5 text-white"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  <span>PROSES BERJALAN...</span>
                </>
              ) : (
                <>
                  <svg
                    className="h-5 w-5"
                    viewBox="0 0 24 24"
                    fill="none"
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
                  <span>MULAI OTOMATISASI</span>
                </>
              )}
            </button>

            {isRunning && (
              <button
                onClick={handleStop}
                className="py-3.5 px-6 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 transition-all duration-300 border border-red-500/20 hover:shadow-red-500/25 shadow-xl active:scale-[0.98]"
              >
                HENTIKAN
              </button>
            )}
          </div>
        </div>

        {/* Right Quick Info Card */}
        <div className="bg-slate-900/40 backdrop-blur-md rounded-2xl p-6 border border-slate-800/80 flex flex-col justify-between gap-4 relative overflow-hidden shadow-xl">
          <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 rounded-full blur-2xl pointer-events-none"></div>

          <span className="text-[10px] font-bold text-slate-500 tracking-widest uppercase">
            Info Konfigurasi Aktif
          </span>

          <div className="flex-1 flex flex-col justify-center gap-3">
            <div className="flex justify-between items-center border-b border-slate-800/50 pb-2">
              <span className="text-xs text-slate-400 font-medium">
                Headless Mode
              </span>
              <span
                className={`text-xs font-bold ${config.headless ? "text-amber-400" : "text-indigo-400"}`}
              >
                {config.headless
                  ? "AKTIF (Silent)"
                  : "NONAKTIF (Browser Muncul)"}
              </span>
            </div>
            <div className="flex justify-between items-center border-b border-slate-800/50 pb-2">
              <span className="text-xs text-slate-400 font-medium">
                Post Limit
              </span>
              <span className="text-xs font-bold text-slate-200">
                {config.limit} Post
              </span>
            </div>
            <div className="flex justify-between items-center pb-1">
              <span className="text-xs text-slate-400 font-medium">
                Delay Range
              </span>
              <span className="text-xs font-bold text-slate-200">
                {config.minDelay / 1000}s - {config.maxDelay / 1000}s
              </span>
            </div>
          </div>

          <button
            onClick={() => setActiveTab("settings")}
            className="w-full text-center py-2 bg-slate-800/40 hover:bg-slate-800/80 border border-slate-700/40 hover:border-slate-700 transition-all rounded-xl text-xs font-bold text-slate-300"
          >
            Ubah Pengaturan
          </button>
        </div>
      </div>

      {/* System Log Activity 2.0 */}
      <section className="bg-slate-900/40 backdrop-blur-md rounded-2xl p-6 border border-slate-800/80 flex-1 flex flex-col min-h-[350px] shadow-xl relative overflow-hidden">
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-indigo-500/2 rounded-full blur-3xl pointer-events-none"></div>

        {/* Log Header Controls */}
        <div className="flex flex-col gap-4 mb-4">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <span>Log Aktivitas Interaktif</span>
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
            </h3>

            <div className="flex gap-2">
              <button
                onClick={clearLogs}
                className="p-1.5 bg-slate-800/50 hover:bg-slate-800 border border-slate-700/50 rounded-lg text-slate-400 hover:text-slate-200 transition-all text-xs font-semibold flex items-center gap-1.5"
                title="Bersihkan log di layar"
              >
                Bersihkan Layar
              </button>

              <button
                onClick={handleDownloadLogs}
                disabled={logs.length === 0}
                className="p-1.5 bg-slate-800/50 hover:bg-indigo-600/30 hover:text-indigo-200 disabled:opacity-40 disabled:hover:bg-slate-800/50 disabled:hover:text-slate-400 border border-slate-700/50 rounded-lg text-slate-400 hover:text-slate-200 transition-all text-xs font-semibold flex items-center gap-1.5"
                title="Unduh log berkas .txt"
              >
                Unduh Log (.txt)
              </button>
            </div>
          </div>

          {/* Log Filter & Search Toolbar */}
          <div className="flex gap-3 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80">
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-slate-500 font-bold px-2 uppercase">
                Filter:
              </span>
              {Object.values(LOG_TYPES)
                .filter((t) => t !== LOG_TYPES.ACTION)
                .map((filterOption) => (
                  <button
                    key={filterOption}
                    onClick={() => setLogFilter(filterOption)}
                    className={`text-[10px] font-bold px-2.5 py-1 rounded-md transition-all uppercase border
                    ${
                      logFilter === filterOption
                        ? "bg-indigo-600/20 text-indigo-300 border-indigo-500/30"
                        : "bg-transparent text-slate-400 hover:text-slate-200 border-transparent"
                    }
                  `}
                  >
                    {filterOption}
                  </button>
                ))}
            </div>

            <div className="flex-1 relative">
              <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-600">
                <svg
                  className="h-4 w-4"
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
              </div>
              <input
                type="text"
                value={logSearch}
                onChange={(e) => setLogSearch(e.target.value)}
                placeholder="Cari log..."
                className="w-full bg-slate-900/50 border border-slate-800/80 rounded-lg pl-8 pr-3 py-1 text-xs text-slate-300 focus:outline-none focus:border-slate-700 transition-all duration-300 placeholder-slate-700"
              />
            </div>

            <button
              onClick={() => setAutoScroll(!autoScroll)}
              className={`px-3 py-1 rounded-lg text-[10px] font-bold border transition-all uppercase flex items-center gap-1.5
                ${
                  autoScroll
                    ? "bg-emerald-600/10 text-emerald-400 border-emerald-500/20"
                    : "bg-slate-900 text-slate-400 border-slate-800"
                }
              `}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${autoScroll ? "bg-emerald-400 animate-pulse" : "bg-slate-500"}`}
              ></span>
              Auto-Scroll: {autoScroll ? "ON" : "OFF"}
            </button>
          </div>
        </div>

        {/* Log Outputs Terminal */}
        <div
          ref={logContainerRef}
          className="flex-1 bg-slate-950/80 rounded-xl border border-slate-800/80 p-4.5 font-mono text-[12px] text-slate-300 overflow-y-auto space-y-2 max-h-[300px] shadow-inner"
        >
          {filteredLogs.length === 0 ? (
            <div className="h-full flex items-center justify-center text-slate-600 select-none">
              Tidak ada log aktivitas{" "}
              {logSearch && "yang cocok dengan pencarian Anda"}
            </div>
          ) : (
            filteredLogs.map((log, index) => {
              const styles = getLogStyles(log.type);
              const icon = getLogIcon(log.type);

              return (
                <div
                  key={index}
                  className="flex gap-3.5 items-start py-1 px-2 hover:bg-slate-900/30 rounded transition-all"
                >
                  <span className="text-[10px] text-slate-600 select-none font-bold mt-0.5">
                    {log.time || "SYSTEM"}
                  </span>
                  <span
                    className={`text-[9px] font-black border uppercase px-1.5 py-0.25 rounded tracking-wide ${styles.pillClass} select-none`}
                  >
                    {icon} {log.type}
                  </span>
                  <span
                    className={`break-all leading-relaxed ${styles.colorClass}`}
                  >
                    {log.message}
                  </span>
                </div>
              );
            })
          )}
        </div>
      </section>
    </div>
  );
}
