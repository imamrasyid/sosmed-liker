import React from "react";
import appLogo from "../../app_logo_icon.png";
import { useAppContext } from "../../context/AppContext.jsx";
import { useAutomation } from "../../hooks/useAutomation.js";
import { useTranslation } from "react-i18next";
import { PLATFORMS } from "../../utils/constants.js";

const NAV_ITEMS = [
  {
    section: "sidebar.main",
    items: [
      {
        id: "dashboard-instagram",
        label: "Instagram",
        tab: "dashboard",
        platform: "instagram",
        badge: null,
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
        color: "text-pink-400",
        activeBg: "bg-pink-500/10 border-pink-500/20 text-pink-300",
      },
      {
        id: "dashboard-twitter",
        label: "Twitter / X",
        tab: "dashboard",
        platform: "twitter",
        icon: (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
          </svg>
        ),
        color: "text-slate-300",
        activeBg: "bg-slate-500/10 border-slate-500/20 text-slate-200",
      },
      {
        id: "dashboard-threads",
        label: "Threads",
        tab: "dashboard",
        platform: "threads",
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
        color: "text-zinc-400",
        activeBg: "bg-zinc-500/10 border-zinc-500/20 text-zinc-300",
      },
    ],
  },
  {
    section: "sidebar.data",
    items: [
      {
        id: "history",
        label: "sidebar.likeHistory",
        tab: "history",
        platform: null,
        icon: (
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
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        ),
        color: "text-slate-400",
        activeBg: "bg-indigo-500/10 border-indigo-500/20 text-indigo-300",
      },
      {
        id: "analytics",
        label: "sidebar.statistics",
        tab: "analytics",
        platform: null,
        icon: (
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
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 002 2h2a2 2 0 002-2z"
            />
          </svg>
        ),
        color: "text-slate-400",
        activeBg: "bg-indigo-500/10 border-indigo-500/20 text-indigo-300",
      },
    ],
  },
  {
    section: "sidebar.configuration",
    items: [
      {
        id: "accounts",
        label: "sidebar.profileStatus",
        tab: "accounts",
        platform: null,
        icon: (
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
              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
            />
          </svg>
        ),
        color: "text-slate-400",
        activeBg: "bg-indigo-500/10 border-indigo-500/20 text-indigo-300",
      },
      {
        id: "settings",
        label: "sidebar.parameters",
        tab: "settings",
        platform: null,
        icon: (
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
              d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
            />
          </svg>
        ),
        color: "text-slate-400",
        activeBg: "bg-indigo-500/10 border-indigo-500/20 text-indigo-300",
      },
      {
        id: "settings-app",
        label: "sidebar.system",
        tab: "settings-app",
        platform: null,
        icon: (
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
              d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z"
            />
          </svg>
        ),
        color: "text-slate-400",
        activeBg: "bg-indigo-500/10 border-indigo-500/20 text-indigo-300",
      },
    ],
  },
];

export function Sidebar() {
  const {
    activeTab,
    selectedPlatform,
    setActiveTab,
    setSelectedPlatform,
    stats,
    cookiesStatus,
    appVersion,
  } = useAppContext();
  const { isRunning } = useAutomation();
  const { t } = useTranslation();

  const isActive = (item) => {
    if (item.platform) {
      return activeTab === item.tab && selectedPlatform === item.platform;
    }
    return activeTab === item.tab;
  };

  const handleNav = (item) => {
    setActiveTab(item.tab);
    if (item.platform) setSelectedPlatform(item.platform);
  };

  const connectedCount = Object.values(cookiesStatus).filter(Boolean).length;

  return (
    <aside className="w-60 bg-[#0c1220] border-r border-white/[0.06] flex flex-col h-full">
      {/* ── Title bar drag region (kosong, hanya untuk dragging window) ── */}
      <div className="h-8 drag-region shrink-0" />

      {/* ── Brand header ──────────────────────────────────── */}
      <div className="px-4 pb-3 shrink-0 no-drag-region">
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 p-[1.5px] shadow-lg shadow-indigo-500/30 shrink-0">
            <div className="h-full w-full rounded-[10px] bg-[#0c1220] flex items-center justify-center overflow-hidden">
              <img
                src={appLogo}
                alt="logo"
                className="h-full w-full object-cover rounded-[10px]"
              />
            </div>
          </div>
          <div>
            <p className="text-[11px] font-black text-white tracking-tight leading-none">
              SOSMED LIKER
            </p>
            <p className="text-[9px] text-indigo-400/70 font-semibold tracking-widest uppercase leading-none mt-0.5">
              Pro Suite
            </p>
          </div>
        </div>
      </div>

      {/* ── Bot status pill ────────────────────────────────── */}
      <div className="px-3 pb-3 no-drag-region shrink-0">
        <div
          className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${isRunning ? "bg-emerald-500/8 border-emerald-500/20" : "bg-white/[0.03] border-white/[0.06]"}`}
        >
          <span
            className={`w-1.5 h-1.5 rounded-full shrink-0 ${isRunning ? "bg-emerald-400 animate-pulse" : "bg-slate-600"}`}
          />
          <span
            className={`text-[10px] font-bold tracking-wider uppercase ${isRunning ? "text-emerald-400" : "text-slate-500"}`}
          >
            {isRunning ? t("common.botActive") : t("common.botStandby")}
          </span>
          {isRunning && (
            <span className="ml-auto text-[9px] text-emerald-500/70 font-mono">
              LIVE
            </span>
          )}
        </div>
      </div>

      {/* ── Navigation ─────────────────────────────────────── */}
      <nav className="flex-1 overflow-y-auto px-2 space-y-4 pb-3">
        {NAV_ITEMS.map((group) => (
          <div key={group.section}>
            <p className="text-[9px] font-black tracking-widest text-slate-600 uppercase px-2 mb-1.5">
              {t(group.section)}
            </p>
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const active = isActive(item);
                const label = item.label.includes(".")
                  ? t(item.label)
                  : item.label;
                // Connection status dot for account items
                const isCookieItem =
                  item.platform && cookiesStatus[item.platform] !== undefined;

                return (
                  <button
                    key={item.id}
                    onClick={() => handleNav(item)}
                    className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[11.5px] font-semibold transition-all duration-150 border group
                      ${
                        active
                          ? `${item.activeBg} border-current/30`
                          : "text-slate-500 border-transparent hover:text-slate-300 hover:bg-white/[0.04]"
                      }`}
                  >
                    <span
                      className={`shrink-0 transition-colors ${active ? "" : `${item.color} group-hover:text-slate-300`}`}
                    >
                      {item.icon}
                    </span>
                    <span className="flex-1 text-left">{label}</span>
                    {isCookieItem && (
                      <span
                        className={`w-1.5 h-1.5 rounded-full shrink-0 ${cookiesStatus[item.platform] ? "bg-emerald-500" : "bg-slate-700"}`}
                      />
                    )}
                    {active && (
                      <span className="w-1 h-1 rounded-full bg-current shrink-0 opacity-60" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* ── Footer stats ───────────────────────────────────── */}
      <div className="shrink-0 px-3 py-3 border-t border-white/[0.06] space-y-2">
        {/* Stats row */}
        <div className="grid grid-cols-3 gap-1.5">
          {[
            {
              labelKey: "sidebar.stats.likes",
              value: stats.total_liked,
              color: "text-indigo-400",
            },
            {
              labelKey: "sidebar.stats.profiles",
              value: stats.total_profiles,
              color: "text-violet-400",
            },
            {
              labelKey: "sidebar.stats.today",
              value: stats.liked_today,
              color: "text-emerald-400",
            },
          ].map((s) => (
            <div
              key={s.labelKey}
              className="bg-white/[0.03] border border-white/[0.05] rounded-lg px-2 py-1.5 text-center"
            >
              <p className={`text-sm font-black ${s.color} leading-none`}>
                {s.value}
              </p>
              <p className="text-[8px] text-slate-600 font-semibold mt-0.5 uppercase tracking-wide">
                {t(s.labelKey)}
              </p>
            </div>
          ))}
        </div>

        {/* Accounts connected */}
        <div className="flex items-center justify-between px-1">
          <span className="text-[9px] text-slate-600 font-semibold uppercase tracking-wider">
            {t("sidebar.stats.connected")}
          </span>
          <div className="flex items-center gap-1">
            {[PLATFORMS.INSTAGRAM, PLATFORMS.TWITTER, PLATFORMS.THREADS].map(
              (p) => (
                <span
                  key={p}
                  className={`w-1.5 h-1.5 rounded-full ${cookiesStatus[p] ? "bg-emerald-500" : "bg-slate-700"}`}
                />
              ),
            )}
            <span className="text-[9px] text-slate-500 ml-1">
              {connectedCount}/3
            </span>
          </div>
        </div>

        {/* Version */}
        <p className="text-[9px] text-slate-700 text-center font-mono">
          v{appVersion}
        </p>
      </div>
    </aside>
  );
}
