import React from "react";
import { useAppContext } from "../../context/AppContext.jsx";
import { useTranslation } from "react-i18next";
import { PLATFORMS, PLATFORM_NAMES } from "../../utils/constants.js";

const PLATFORM_ICON = {
  [PLATFORMS.INSTAGRAM]: (
    <svg
      className="w-5 h-5"
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
  [PLATFORMS.TWITTER]: (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  ),
  [PLATFORMS.THREADS]: (
    <svg
      className="w-5 h-5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M16 12a4 4 0 1 0-8 0 4 4 0 0 0 8 0zm0 0v1.5a2.5 2.5 0 0 0 5 0V12a9 9 0 1 0-9 9m4.5-1.206a8.959 8.959 0 0 1-4.5 1.206" />
    </svg>
  ),
};

const PLATFORM_COLOR = {
  [PLATFORMS.INSTAGRAM]: {
    bg: "from-pink-600 to-rose-600",
    icon: "text-pink-300",
  },
  [PLATFORMS.TWITTER]: {
    bg: "from-slate-700 to-slate-900",
    icon: "text-slate-300",
  },
  [PLATFORMS.THREADS]: {
    bg: "from-zinc-700 to-zinc-900",
    icon: "text-zinc-300",
  },
};

export function Accounts() {
  const { t } = useTranslation();
  const {
    cookiesStatus,
    checkAllCookiesStatus,
    setActiveTab,
    setSettingsSubTab,
  } = useAppContext();

  const connectedCount = Object.values(cookiesStatus).filter(Boolean).length;

  const goToProfiles = () => {
    setActiveTab("settings");
    setSettingsSubTab("profiles");
  };

  return (
    <div className="flex-1 flex flex-col gap-5 max-w-5xl mx-auto w-full">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-black text-white">
            {t("accounts.title")}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {t("accounts.description")}
          </p>
        </div>
        <button
          onClick={checkAllCookiesStatus}
          className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 border border-white/[0.08] rounded-xl px-3 py-1.5 hover:bg-white/[0.04] hover:text-slate-300 transition-all"
        >
          <svg
            className="w-3.5 h-3.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2.5"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
          Refresh Status
        </button>
      </div>

      {/* Summary bar */}
      <div
        className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${
          connectedCount === 3
            ? "bg-emerald-500/8 border-emerald-500/20"
            : connectedCount > 0
              ? "bg-amber-500/8 border-amber-500/20"
              : "bg-red-500/8 border-red-500/20"
        }`}
      >
        <span
          className={`text-xl font-black ${connectedCount === 3 ? "text-emerald-400" : connectedCount > 0 ? "text-amber-400" : "text-red-400"}`}
        >
          {connectedCount}/3
        </span>
        <div>
          <p
            className={`text-xs font-bold ${connectedCount === 3 ? "text-emerald-300" : connectedCount > 0 ? "text-amber-300" : "text-red-300"}`}
          >
            {connectedCount === 3
              ? "Semua platform siap"
              : connectedCount > 0
                ? `${connectedCount} platform terhubung`
                : "Belum ada profil aktif"}
          </p>
          <p className="text-[10px] text-slate-600">
            Cookie profil diperlukan untuk menjalankan otomatisasi per platform.
          </p>
        </div>
        <button
          onClick={goToProfiles}
          className="ml-auto text-[10px] font-bold text-indigo-400 border border-indigo-500/20 rounded-lg px-2.5 py-1 hover:bg-indigo-500/10 transition-all shrink-0"
        >
          Kelola Profil →
        </button>
      </div>

      {/* Platform cards */}
      <div className="grid grid-cols-1 gap-3">
        {Object.values(PLATFORMS).map((p) => {
          const connected = cookiesStatus[p];
          const meta = PLATFORM_COLOR[p];

          return (
            <div
              key={p}
              className={`flex items-center gap-4 px-5 py-4 bg-white/[0.03] border rounded-2xl transition-all hover:border-white/10 ${
                connected ? "border-emerald-500/20" : "border-white/[0.06]"
              }`}
            >
              {/* Left accent bar */}
              <div
                className={`w-0.5 h-10 rounded-full shrink-0 ${connected ? "bg-emerald-500" : "bg-slate-700"}`}
              />

              {/* Platform icon */}
              <div
                className={`w-10 h-10 rounded-xl bg-gradient-to-br ${meta.bg} flex items-center justify-center shadow-lg shrink-0 ${meta.icon}`}
              >
                {PLATFORM_ICON[p]}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-bold text-slate-200">
                    {PLATFORM_NAMES[p]}
                  </p>
                  {connected && (
                    <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full text-[9px] font-black uppercase">
                      {t("accounts.profileActive")}
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-600 mt-0.5">
                  {connected
                    ? t("accounts.profileAvailable")
                    : t("accounts.noProfileActive")}
                </p>
              </div>

              {/* Action */}
              <button
                onClick={goToProfiles}
                className={`px-3 py-1.5 rounded-xl text-[10px] font-bold border transition-all shrink-0 ${
                  connected
                    ? "bg-white/[0.04] border-white/[0.08] text-slate-400 hover:text-slate-300"
                    : "bg-indigo-500/10 border-indigo-500/20 text-indigo-400 hover:bg-indigo-500/20"
                }`}
              >
                {connected ? "Ganti Profil" : "Tambah Profil"}
              </button>
            </div>
          );
        })}
      </div>

      {/* Quick guide */}
      <div className="bg-white/[0.02] border border-white/[0.05] rounded-2xl p-5">
        <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-3">
          {t("accounts.info")}
        </p>
        <ol className="space-y-2">
          {[
            t("accounts.infoOpenSettings"),
            t("accounts.infoMultipleProfiles"),
            t("accounts.infoSetActive"),
            t("accounts.infoReplacesOld"),
          ].map((step, i) => (
            <li key={i} className="flex items-start gap-2.5">
              <span className="w-5 h-5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[9px] font-black flex items-center justify-center shrink-0">
                {i + 1}
              </span>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                {step}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
