import React from "react";
import appLogo from "../../app_logo_icon.png";
import { useAppContext } from "../../context/AppContext.jsx";
import { useDatabase } from "../../hooks/useDatabase.js";

export function Sidebar() {
  const {
    activeTab,
    selectedPlatform,
    activeSetupPlatform,
    setActiveTab,
    setSelectedPlatform,
    setActiveSetupPlatform,
    setSetupStep,
    expandedGroups,
    setExpandedGroups,
    loadHistory,
    loadDbStats,
  } = useAppContext();

  const { stats } = useDatabase();

  const navigationSections = [
    {
      title: "Pusat Kendali",
      items: [
        {
          id: "dashboard-group",
          label: "Dasbor Utama",
          icon: (
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
                d="M4 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2v-4zM14 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2v-4z"
              />
            </svg>
          ),
          subItems: [
            {
              id: "dashboard-main",
              label: "Ringkasan Dasbor",
              action: () => {
                setActiveTab("dashboard");
              },
            },
          ],
        },
        {
          id: "campaigns-group",
          label: "Kampanye Liker",
          icon: (
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
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
          ),
          subItems: [
            {
              id: "camp-ig",
              label: "Instagram Kampanye",
              action: () => {
                setActiveTab("dashboard");
                setSelectedPlatform("instagram");
              },
            },
            {
              id: "camp-tw",
              label: "Twitter / X Kampanye",
              action: () => {
                setActiveTab("dashboard");
                setSelectedPlatform("twitter");
              },
            },
            {
              id: "camp-th",
              label: "Threads Kampanye",
              action: () => {
                setActiveTab("dashboard");
                setSelectedPlatform("threads");
              },
            },
          ],
        },
      ],
    },
    {
      title: "Manajemen Data",
      items: [
        {
          id: "credentials-group",
          label: "Kredensial Sesi",
          icon: (
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
                d="M15 7a2 2 0 012 2m-2 4a2 2 0 012 2m-2-4a2 2 0 11-4 0 2 2 0 014 0zM8 21h8a2 2 0 002-2v-9a2 2 0 00-2-2H8a2 2 0 00-2 2v9a2 2 0 002 2z"
              />
            </svg>
          ),
          subItems: [
            {
              id: "cred-ig",
              label: "Kuki Instagram",
              action: () => {
                setActiveTab("accounts");
                setActiveSetupPlatform("instagram");
                setSetupStep(1);
              },
            },
            {
              id: "cred-tw",
              label: "Kuki Twitter / X",
              action: () => {
                setActiveTab("accounts");
                setActiveSetupPlatform("twitter");
                setSetupStep(1);
              },
            },
            {
              id: "cred-th",
              label: "Kuki Threads",
              action: () => {
                setActiveTab("accounts");
                setActiveSetupPlatform("threads");
                setSetupStep(1);
              },
            },
          ],
        },
        {
          id: "database-group",
          label: "Basis Data SQLite",
          icon: (
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
                d="M4 7v10c0 2.21 3.58 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.58 4 8 4s8-1.79 8-4M4 7c0 2.21 3.58 4 8 4s8-1.79 8-4M4 7c0-2.21 3.58-4 8-4s8 1.79 8 4m0 5c0 2.21-3.58 4-8 4s-8-1.79-8-4"
              />
            </svg>
          ),
          subItems: [
            {
              id: "history",
              label: "Tabel Riwayat Liker",
              action: () => {
                setActiveTab("history");
                loadHistory();
              },
            },
          ],
        },
      ],
    },
    {
      title: "Konfigurasi & Analitis",
      items: [
        {
          id: "analytics-group",
          label: "Analitis & Statistik",
          icon: (
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
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 002 2h2a2 2 0 002-2z"
              />
            </svg>
          ),
          subItems: [
            {
              id: "analytics",
              label: "Ringkasan Laporan",
              action: () => {
                setActiveTab("analytics");
                loadDbStats();
              },
            },
          ],
        },
        {
          id: "settings-group",
          label: "Konfigurasi Sistem",
          icon: (
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
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
              />
            </svg>
          ),
          subItems: [
            {
              id: "settings",
              label: "Parameter Automaton",
              action: () => {
                setActiveTab("settings");
              },
            },
            {
              id: "settings-app",
              label: "Sistem & Database",
              action: () => {
                setActiveTab("settings-app");
              },
            },
          ],
        },
      ],
    },
  ];

  const isChildActive = (sub, item) => {
    if (sub.id === "dashboard-main")
      return activeTab === "dashboard" && selectedPlatform === "instagram";
    if (sub.id === "camp-ig")
      return activeTab === "dashboard" && selectedPlatform === "instagram";
    if (sub.id === "camp-tw")
      return activeTab === "dashboard" && selectedPlatform === "twitter";
    if (sub.id === "camp-th")
      return activeTab === "dashboard" && selectedPlatform === "threads";
    if (sub.id === "cred-ig")
      return activeTab === "accounts" && activeSetupPlatform === "instagram";
    if (sub.id === "cred-tw")
      return activeTab === "accounts" && activeSetupPlatform === "twitter";
    if (sub.id === "cred-th")
      return activeTab === "accounts" && activeSetupPlatform === "threads";
    return activeTab === sub.id;
  };

  const isAnyChildActive = (item) => {
    return item.subItems.some((sub) => isChildActive(sub, item));
  };

  return (
    <aside className="w-64 bg-slate-900/60 backdrop-blur-xl border-r border-slate-800/80 flex flex-col justify-between h-full shadow-2xl relative z-10">
      <div>
        {/* Custom App Title Bar Header */}
        <div className="h-10 drag-region flex items-center px-6 border-b border-slate-800/50 bg-slate-950/50">
          <span className="text-[10px] font-black tracking-widest text-slate-500 uppercase">
            BOT PLATFORM v1.1
          </span>
        </div>

        {/* Glowing Brand Header */}
        <div className="p-5 border-b border-slate-800/40 bg-slate-950/20">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-pink-500 p-[2px] shadow-lg shadow-indigo-500/20">
              <div className="h-full w-full rounded-[10px] bg-slate-950 flex items-center justify-center overflow-hidden">
                <img
                  src={appLogo}
                  alt="App Logo"
                  className="h-full w-full object-cover rounded-[10px]"
                />
              </div>
            </div>
            <div>
              <h1 className="text-md font-bold tracking-tight bg-gradient-to-r from-white via-slate-200 to-indigo-300 bg-clip-text text-transparent">
                SOSMED LIKER
              </h1>
              <p className="text-[10px] text-indigo-400/80 font-semibold tracking-wider uppercase">
                Automation Suite
              </p>
            </div>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="px-3 py-4 space-y-4 overflow-y-auto max-h-[calc(100vh-210px)] select-none">
          {navigationSections.map((section, sIdx) => (
            <div key={sIdx} className="space-y-2">
              {/* Level 1: Category Header */}
              <span className="text-[10px] font-extrabold tracking-widest text-slate-500 uppercase px-3 block select-none">
                {section.title}
              </span>

              <div className="space-y-1">
                {section.items.map((item) => {
                  const isExpanded = expandedGroups[item.id];
                  const childActive = isAnyChildActive(item);

                  return (
                    <div key={item.id} className="space-y-0.5">
                      {/* Level 2: Collapsible Main Menu Item */}
                      <button
                        onClick={() => {
                          setExpandedGroups((prev) => ({
                            ...prev,
                            [item.id]: !prev[item.id],
                          }));
                        }}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all duration-300 group
                          ${
                            childActive
                              ? "bg-indigo-650/15 text-indigo-300 border border-indigo-500/20"
                              : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/35 border border-transparent"
                          }
                        `}
                      >
                        <div className="flex items-center gap-2.5">
                          <span
                            className={`transition-transform duration-300 group-hover:scale-110 ${childActive ? "text-indigo-400" : "text-slate-500 group-hover:text-slate-300"}`}
                          >
                            {item.icon}
                          </span>
                          <span>{item.label}</span>
                        </div>

                        {/* Toggle caret down/right */}
                        <svg
                          className={`w-3 h-3 text-slate-500 transition-transform duration-300 ${isExpanded ? "rotate-90 text-indigo-400" : ""}`}
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth="2.5"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M9 5l7 7-7 7"
                          />
                        </svg>
                      </button>

                      {/* Level 3: Sub Items */}
                      {isExpanded && (
                        <div className="pl-6 pr-1 py-1 space-y-1 border-l border-slate-800/60 ml-5 transition-all duration-350">
                          {item.subItems.map((sub) => {
                            const isActive = isChildActive(sub, item);

                            return (
                              <button
                                key={sub.id}
                                onClick={sub.action}
                                className={`w-full flex items-center justify-between py-1.5 px-3 rounded-lg text-[10.5px] font-semibold transition-all duration-205 relative group
                                  ${
                                    isActive
                                      ? "text-indigo-400 font-bold bg-indigo-500/5"
                                      : "text-slate-500 hover:text-slate-350"
                                  }
                                `}
                              >
                                <div className="flex items-center gap-2">
                                  <span
                                    className={`w-1 h-1 rounded-full transition-all duration-300 ${isActive ? "bg-indigo-400 scale-125" : "bg-slate-700 group-hover:bg-slate-550"}`}
                                  ></span>
                                  <span>{sub.label}</span>
                                </div>

                                {isActive && (
                                  <span className="w-1 h-1 rounded-full bg-indigo-400 animate-ping"></span>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
      </div>

      {/* Sidebar Footer Stats */}
      <div className="p-4 border-t border-slate-800/50 bg-slate-950/20">
        <div className="bg-slate-900/80 border border-slate-800/60 rounded-xl p-3.5 flex flex-col gap-1.5 relative overflow-hidden">
          <span className="text-[10px] font-bold text-slate-500 tracking-wider uppercase">
            DATABASE STATUS
          </span>
          <div className="flex justify-between items-baseline">
            <span className="text-xl font-black text-indigo-400 shadow-glow shadow-indigo-400/10">
              {stats.total_liked}
            </span>
            <span className="text-[11px] font-semibold text-slate-400">
              Total Likes
            </span>
          </div>
          <div className="w-full bg-slate-800 h-[3px] rounded-full overflow-hidden mt-1">
            <div className="bg-gradient-to-r from-indigo-500 to-pink-500 h-full rounded-full w-full"></div>
          </div>
        </div>
      </div>
    </aside>
  );
}
