import React from "react";
import { useAppContext } from "../../context/AppContext.jsx";
import { useTranslation } from "react-i18next";
import {
  PLATFORMS,
  PLATFORM_NAMES,
  PLATFORM_DOMAINS,
} from "../../utils/constants.js";

export function Accounts() {
  const { cookiesStatus, setActiveTab, setSettingsSubTab } = useAppContext();
  const { t } = useTranslation();

  const platforms = [
    {
      id: PLATFORMS.INSTAGRAM,
      name: PLATFORM_NAMES[PLATFORMS.INSTAGRAM],
      domain: PLATFORM_DOMAINS[PLATFORMS.INSTAGRAM],
      color: "from-pink-600 to-rose-600",
      icon: (
        <svg
          className="w-6 h-6 text-pink-400"
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
    {
      id: PLATFORMS.TWITTER,
      name: PLATFORM_NAMES[PLATFORMS.TWITTER],
      domain: PLATFORM_DOMAINS[PLATFORMS.TWITTER],
      color: "from-slate-700 to-slate-900",
      icon: (
        <svg
          className="w-6 h-6 text-slate-300"
          fill="currentColor"
          viewBox="0 0 24 24"
        >
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      ),
    },
    {
      id: PLATFORMS.THREADS,
      name: PLATFORM_NAMES[PLATFORMS.THREADS],
      domain: PLATFORM_DOMAINS[PLATFORMS.THREADS],
      color: "from-zinc-800 to-zinc-950",
      icon: (
        <svg
          className="w-6 h-6 text-zinc-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M16 12a4 4 0 1 0-8 0 4 4 0 0 0 8 0zm0 0v1.5a2.5 2.5 0 0 0 5 0V12a9 9 0 1 0-9 9m4.5-1.206a8.959 8.959 0 0 1-4.5 1.206"
          />
        </svg>
      ),
    },
  ];

  return (
    <div className="flex-1 flex flex-col gap-6 max-w-6xl mx-auto w-full animate-fadeIn">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-200 to-indigo-400 tracking-tight">
          {t("accounts.title")}
        </h2>
        <p className="text-slate-400 text-sm mt-1">
          {t("accounts.description")}
        </p>
      </div>

      {/* Migration Notice */}
      <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <span className="text-lg">ℹ️</span>
          <div>
            <p className="text-sm font-bold text-indigo-300">
              {t("accounts.newSystem")}
            </p>
            <p className="text-xs text-indigo-400/90 mt-1">
              {t("accounts.newSystemDesc")}
            </p>
          </div>
        </div>
      </div>

      {/* Platform Status Cards */}
      <div className="grid grid-cols-1 gap-4">
        {platforms.map((platform) => {
          const isConnected = cookiesStatus[platform.id];
          return (
            <div
              key={platform.id}
              className={`bg-slate-900/40 backdrop-blur-md border rounded-2xl p-5 flex items-center justify-between gap-4 transition-all duration-300 hover:scale-[1.01] hover:border-slate-700/80 shadow-lg relative overflow-hidden
                ${isConnected ? "border-emerald-500/30" : "border-slate-800/80"}
              `}
            >
              {/* Status bar marker */}
              <div
                className={`absolute left-0 top-0 bottom-0 w-[4px] 
                ${isConnected ? "bg-emerald-500" : "bg-slate-700"}
              `}
              ></div>

              <div className="flex items-center gap-4 flex-1">
                <div
                  className={`w-12 h-12 rounded-xl bg-gradient-to-br ${platform.color} flex items-center justify-center shadow-lg`}
                >
                  {platform.icon}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-slate-200">
                      {platform.name}
                    </h3>
                    {isConnected && (
                      <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full text-[10px] font-bold uppercase">
                        {t("accounts.profileActive")}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    {isConnected
                      ? t("accounts.profileAvailable")
                      : t("accounts.noProfileActive")}
                  </p>
                </div>
              </div>

              <button
                onClick={() => {
                  setActiveTab("settings");
                  setSettingsSubTab("profiles");
                }}
                className="px-4 py-2 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/20 rounded-lg text-xs font-bold transition-all"
              >
                {t("accounts.manageProfile")}
              </button>
            </div>
          );
        })}
      </div>

      {/* Info Footer */}
      <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <span className="text-lg">ℹ️</span>
          <div>
            <p className="text-sm font-bold text-blue-300">
              {t("accounts.info")}
            </p>
            <ul className="text-xs text-blue-400/90 mt-1 space-y-1">
              <li>• {t("accounts.infoOpenSettings")}</li>
              <li>• {t("accounts.infoMultipleProfiles")}</li>
              <li>• {t("accounts.infoSetActive")}</li>
              <li>• {t("accounts.infoReplacesOld")}</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
