import React, { useState, useEffect } from "react";
import { useAppContext } from "../../context/AppContext.jsx";
import { ConfirmModal } from "../shared/ConfirmModal.jsx";
import { formatPostUrl, formatDate } from "../../utils/formatters.js";
import { PLATFORMS } from "../../utils/constants.js";
import { useTranslation } from "react-i18next";

const PLATFORM_BADGE = {
  [PLATFORMS.INSTAGRAM]: "bg-pink-500/10 text-pink-400 border-pink-500/20",
  [PLATFORMS.TWITTER]: "bg-slate-500/10 text-slate-300 border-slate-500/20",
  [PLATFORMS.THREADS]: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20",
};

export function History() {
  const { t } = useTranslation();
  const {
    history,
    loadHistory,
    deleteHistoryItem,
    clearAllHistory,
    confirmClearDb,
    setConfirmClearDb,
    showToast,
  } = useAppContext();

  const [search, setSearch] = useState("");

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const filtered = history.filter((item) => {
    const q = search.toLowerCase();
    return (
      item.target_profile.toLowerCase().includes(q) ||
      item.post_id.toLowerCase().includes(q) ||
      item.platform.toLowerCase().includes(q)
    );
  });

  const handleDelete = async (id) => {
    const ok = await deleteHistoryItem(id);
    showToast(
      ok ? t("history.deleteSuccess") : t("history.deleteFailed"),
      ok ? "success" : "error",
    );
  };

  const handleClearAll = async () => {
    const ok = await clearAllHistory();
    setConfirmClearDb(false);
    showToast(
      ok ? t("history.clearSuccess") : t("history.clearFailed"),
      ok ? "success" : "error",
    );
  };

  return (
    <div className="flex-1 flex flex-col gap-5 max-w-5xl mx-auto w-full">
      <ConfirmModal
        open={confirmClearDb}
        title={t("history.clearWarning")}
        message={t("history.clearConfirm", { count: history.length })}
        confirmLabel={t("history.confirmDelete")}
        onConfirm={handleClearAll}
        onCancel={() => setConfirmClearDb(false)}
      />

      {/* Page header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-white">
            {t("history.title")}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {t("history.description")}
          </p>
        </div>
        <div className="flex gap-2 shrink-0">
          <button
            onClick={loadHistory}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-400 border border-white/[0.08] rounded-xl hover:bg-white/[0.04] hover:text-slate-300 transition-all"
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
            {t("history.refresh")}
          </button>
          <button
            onClick={() => setConfirmClearDb(true)}
            disabled={history.length === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-red-400 border border-red-500/20 rounded-xl hover:bg-red-500/10 disabled:opacity-30 disabled:hover:bg-transparent transition-all"
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
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
            {t("history.clearHistory")}
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <svg
          className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t("history.search")}
          className="w-full bg-white/[0.03] border border-white/[0.06] rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-200 placeholder-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 transition-all"
        />
        {search && (
          <button
            onClick={() => setSearch("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600 hover:text-slate-400"
          >
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
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        )}
      </div>

      {/* Counter */}
      {search && (
        <p className="text-xs text-slate-600">
          {t("history.showing")}{" "}
          <span className="text-slate-400 font-bold">{filtered.length}</span>{" "}
          {t("history.of")}{" "}
          <span className="text-slate-400 font-bold">{history.length}</span>{" "}
          {t("history.entries")}
        </p>
      )}

      {/* Table */}
      <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-white/[0.06] text-[9px] font-black text-slate-600 uppercase tracking-widest">
                <th className="px-5 py-3">#</th>
                <th className="px-5 py-3">{t("history.platform")}</th>
                <th className="px-5 py-3">{t("history.targetProfile")}</th>
                <th className="px-5 py-3">{t("history.postId")}</th>
                <th className="px-5 py-3">{t("history.likedAt")}</th>
                <th className="px-5 py-3 text-right">{t("history.actions")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {filtered.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-5 py-12 text-center text-slate-700 text-xs select-none"
                  >
                    {history.length === 0
                      ? t("history.noHistory")
                      : t("history.noMatch")}
                  </td>
                </tr>
              ) : (
                filtered.map((item, idx) => (
                  <tr
                    key={item.id}
                    className="hover:bg-white/[0.02] transition-colors"
                  >
                    <td className="px-5 py-3.5 text-[10px] text-slate-700 font-mono">
                      {idx + 1}
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className={`px-2 py-0.5 border rounded-full text-[9px] font-black uppercase ${PLATFORM_BADGE[item.platform] ?? "bg-white/5 text-slate-400 border-white/10"}`}
                      >
                        {item.platform}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-xs font-semibold text-slate-300 max-w-[200px] truncate">
                      {item.target_profile}
                    </td>
                    <td className="px-5 py-3.5 font-mono text-[10px] text-violet-400 max-w-[160px] truncate">
                      {item.post_id}
                    </td>
                    <td className="px-5 py-3.5 text-[11px] text-slate-500">
                      {formatDate(item.liked_at)}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() =>
                            window.open(formatPostUrl(item), "_blank")
                          }
                          className="px-2.5 py-1 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/20 rounded-lg text-[9px] font-bold transition-all"
                        >
                          {t("history.openPost")}
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="px-2.5 py-1 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-lg text-[9px] font-bold transition-all"
                        >
                          {t("common.delete")}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {history.length > 0 && (
          <div className="px-5 py-2.5 border-t border-white/[0.04]">
            <p className="text-[10px] text-slate-700">
              {t("history.totalEntries", { count: history.length })}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
