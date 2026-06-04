import React from "react";
import { useAppContext } from "../../context/AppContext.jsx";
import { useDatabase } from "../../hooks/useDatabase.js";
import { ConfirmModal } from "../shared/ConfirmModal.jsx";
import { useTranslation } from "react-i18next";

export function SettingsApp() {
  const { t } = useTranslation();
  const {
    confirmClearDb,
    setConfirmClearDb,
    showToast,
    appVersion,
    runUpdateCheck,
    checkingForUpdates,
  } = useAppContext();
  const { clearAllHistory } = useDatabase();

  const handleClear = async () => {
    const ok = await clearAllHistory();
    setConfirmClearDb(false);
    showToast(
      ok
        ? t("settingsApp.alertClearSuccess")
        : t("settingsApp.alertClearFailed"),
      ok ? "success" : "error",
    );
  };

  const handleBackup = async () => {
    if (!window.api?.database?.backup) return;
    const r = await window.api.database.backup();
    if (r.cancelled) return;
    showToast(
      r.success
        ? t("settingsApp.backupSuccess", { path: r.path })
        : t("settingsApp.backupFailed", { error: r.error }),
      r.success ? "success" : "error",
    );
  };

  const handleRestore = async () => {
    if (!window.api?.database?.restore) return;
    const r = await window.api.database.restore();
    if (r.cancelled) return;
    showToast(
      r.success
        ? t("settingsApp.restoreSuccess")
        : t("settingsApp.restoreFailed", { error: r.error }),
      r.success ? "success" : "error",
    );
  };

  const handleCheckUpdate = async () => {
    const r = await runUpdateCheck(false);
    if (r)
      showToast(r.message ?? r.error ?? "", r.success ? "success" : "error");
  };

  const sysInfo = [
    { label: t("settingsApp.appVersion"), value: appVersion },
    { label: t("settingsApp.platform"), value: t("settingsApp.platformValue") },
    { label: t("settingsApp.database"), value: t("settingsApp.databaseValue") },
    {
      label: t("settingsApp.status"),
      value: t("settingsApp.online"),
      valueColor: "text-emerald-400",
    },
  ];

  return (
    <div className="flex-1 flex flex-col gap-5 max-w-5xl mx-auto w-full">
      <ConfirmModal
        open={confirmClearDb}
        title={t("settingsApp.deleteAllData")}
        message={t("settingsApp.deleteAllDataDesc")}
        confirmLabel={t("settingsApp.confirmDelete")}
        cancelLabel={t("settingsApp.cancel")}
        onConfirm={handleClear}
        onCancel={() => setConfirmClearDb(false)}
      />

      <div>
        <h1 className="text-xl font-black text-white">
          {t("settingsApp.title")}
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          {t("settingsApp.description")}
        </p>
      </div>

      {/* Database operations */}
      <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-5 flex flex-col gap-4">
        <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">
          {t("settingsApp.dbOperations")}
        </p>

        <div className="grid grid-cols-3 gap-3">
          {/* Backup */}
          <button
            onClick={handleBackup}
            className="flex flex-col items-start gap-2 p-4 bg-white/[0.02] border border-white/[0.06] rounded-xl hover:border-indigo-500/30 hover:bg-indigo-500/5 transition-all group"
          >
            <svg
              className="w-5 h-5 text-indigo-400 group-hover:text-indigo-300"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
              />
            </svg>
            <div className="text-left">
              <p className="text-xs font-bold text-slate-300">
                {t("settingsApp.backupLabel")}
              </p>
              <p className="text-[10px] text-slate-600">
                {t("settingsApp.backupDesc")}
              </p>
            </div>
          </button>

          {/* Restore */}
          <button
            onClick={handleRestore}
            className="flex flex-col items-start gap-2 p-4 bg-white/[0.02] border border-white/[0.06] rounded-xl hover:border-amber-500/30 hover:bg-amber-500/5 transition-all group"
          >
            <svg
              className="w-5 h-5 text-amber-400 group-hover:text-amber-300"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
              />
            </svg>
            <div className="text-left">
              <p className="text-xs font-bold text-slate-300">
                {t("settingsApp.restoreLabel")}
              </p>
              <p className="text-[10px] text-slate-600">
                {t("settingsApp.restoreDesc")}
              </p>
            </div>
          </button>

          {/* Delete */}
          <button
            onClick={() => setConfirmClearDb(true)}
            className="flex flex-col items-start gap-2 p-4 bg-white/[0.02] border border-white/[0.06] rounded-xl hover:border-red-500/30 hover:bg-red-500/5 transition-all group"
          >
            <svg
              className="w-5 h-5 text-red-400 group-hover:text-red-300"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
            <div className="text-left">
              <p className="text-xs font-bold text-red-400">
                {t("settingsApp.deleteAllData")}
              </p>
              <p className="text-[10px] text-slate-600">
                {t("settingsApp.deleteAllDataWarning")}
              </p>
            </div>
          </button>
        </div>
      </div>

      {/* System info */}
      <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">
            {t("settingsApp.systemInfo")}
          </p>
          <button
            onClick={handleCheckUpdate}
            disabled={checkingForUpdates}
            className="flex items-center gap-1.5 text-[10px] font-bold text-indigo-400 hover:text-indigo-300 border border-indigo-500/20 rounded-lg px-2.5 py-1 hover:bg-indigo-500/10 transition-all disabled:opacity-40"
          >
            {checkingForUpdates ? (
              <svg
                className="animate-spin w-3 h-3"
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
            ) : (
              <svg
                className="w-3 h-3"
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
            )}
            {t("settingsApp.checkUpdate")}
          </button>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {sysInfo.map((info) => (
            <div
              key={info.label}
              className="bg-[#0c1220] border border-white/[0.06] rounded-xl p-3.5"
            >
              <p className="text-[9px] text-slate-600 uppercase tracking-widest mb-1">
                {info.label}
              </p>
              <p
                className={`text-sm font-bold ${info.valueColor ?? "text-slate-300"}`}
              >
                {info.value}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
