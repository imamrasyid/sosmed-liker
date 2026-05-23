import React from "react";
import { useAppContext } from "../../context/AppContext.jsx";
import { useDatabase } from "../../hooks/useDatabase.js";
import { useTranslation } from "react-i18next";

export function SettingsApp() {
  const { t } = useTranslation();
  const { confirmClearDb, setConfirmClearDb, showToast } = useAppContext();
  const { clearAllHistory } = useDatabase();

  const handleClearDatabase = async () => {
    const success = await clearAllHistory();
    if (success) {
      showToast(t("settingsApp.alertClearSuccess"), "success");
      setConfirmClearDb(false);
    } else {
      showToast(t("settingsApp.alertClearFailed"), "error");
    }
  };

  return (
    <div className="flex-1 flex flex-col gap-6 max-w-6xl mx-auto w-full animate-fadeIn">
      <div>
        <h2 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-200 to-indigo-400 tracking-tight">
          {t("settingsApp.title")}
        </h2>
        <p className="text-slate-400 text-sm mt-1">
          {t("settingsApp.description")}
        </p>
      </div>

      {/* Informative tips box */}
      <div className="bg-slate-900/20 border border-slate-800 rounded-2xl p-5 flex gap-3 text-xs leading-relaxed text-slate-400 shadow-sm">
        <span className="text-md">💾</span>
        <div>
          <h4 className="font-bold text-slate-300 uppercase tracking-wider text-[10px] mb-1">
            {t("settingsApp.dbManagement")}
          </h4>
          {t("settingsApp.dbManagementDesc")}
        </div>
      </div>

      {/* Database Management Section */}
      <div className="bg-slate-900/40 backdrop-blur-md rounded-2xl p-6 border border-slate-800/80 flex flex-col gap-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/2 rounded-full blur-2xl pointer-events-none"></div>

        <div className="flex flex-col gap-5">
          <h3 className="text-xs font-black text-indigo-400 uppercase tracking-widest border-b border-slate-800/50 pb-2 flex items-center gap-2">
            <svg
              className="w-4 h-4"
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
            {t("settingsApp.dbOperations")}
          </h3>

          {/* Clear Database Warning */}
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-5">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-red-500/20 border border-red-500/30 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg
                  className="w-5 h-5 text-red-400"
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
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-bold text-red-400 mb-1">
                  {t("settingsApp.deleteAllData")}
                </h4>
                <p className="text-xs text-slate-400 leading-relaxed mb-4">
                  {t("settingsApp.deleteAllDataDesc")}
                </p>
                {!confirmClearDb ? (
                  <button
                    onClick={() => setConfirmClearDb(true)}
                    className="px-4 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-500/30 rounded-lg text-xs font-bold uppercase tracking-wider transition-all duration-300"
                  >
                    {t("settingsApp.deleteDatabase")}
                  </button>
                ) : (
                  <div className="flex gap-3">
                    <button
                      onClick={handleClearDatabase}
                      className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg text-xs font-bold uppercase tracking-wider transition-all duration-300"
                    >
                      {t("settingsApp.confirmDelete")}
                    </button>
                    <button
                      onClick={() => setConfirmClearDb(false)}
                      className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg text-xs font-bold uppercase tracking-wider transition-all duration-300"
                    >
                      {t("settingsApp.cancel")}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* System Info Section */}
      <div className="bg-slate-900/40 backdrop-blur-md rounded-2xl p-6 border border-slate-800/80 flex flex-col gap-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/2 rounded-full blur-2xl pointer-events-none"></div>

        <div className="flex flex-col gap-5">
          <h3 className="text-xs font-black text-emerald-400 uppercase tracking-widest border-b border-slate-800/50 pb-2 flex items-center gap-2">
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z"
              />
            </svg>
            {t("settingsApp.systemInfo")}
          </h3>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-950/50 rounded-xl p-4 border border-slate-800/50">
              <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">
                {t("settingsApp.appVersion")}
              </div>
              <div className="text-sm font-bold text-slate-300">
                {t("settingsApp.appVersionValue")}
              </div>
            </div>
            <div className="bg-slate-950/50 rounded-xl p-4 border border-slate-800/50">
              <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">
                {t("settingsApp.platform")}
              </div>
              <div className="text-sm font-bold text-slate-300">
                {t("settingsApp.platformValue")}
              </div>
            </div>
            <div className="bg-slate-950/50 rounded-xl p-4 border border-slate-800/50">
              <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">
                {t("settingsApp.database")}
              </div>
              <div className="text-sm font-bold text-slate-300">
                {t("settingsApp.databaseValue")}
              </div>
            </div>
            <div className="bg-slate-950/50 rounded-xl p-4 border border-slate-800/50">
              <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">
                {t("settingsApp.status")}
              </div>
              <div className="text-sm font-bold text-emerald-400">
                {t("settingsApp.online")}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
