import React, { useState, useEffect } from "react";
import { useAppContext } from "../../context/AppContext.jsx";
import { useDatabase } from "../../hooks/useDatabase.js";
import { formatPostUrl, formatDate } from "../../utils/formatters.js";
import { PLATFORMS, PLATFORM_NAMES } from "../../utils/constants.js";

export function History() {
  const {
    confirmClearDb,
    setConfirmClearDb,
    showToast,
    loadHistory: loadHistoryFromContext,
  } = useAppContext();
  const { history, deleteHistoryItem, clearAllHistory } = useDatabase();

  useEffect(() => {
    loadHistoryFromContext();
  }, [loadHistoryFromContext]);

  // Refresh history when component mounts
  useEffect(() => {
    const interval = setInterval(() => {
      loadHistoryFromContext();
    }, 5000); // Refresh every 5 seconds

    return () => clearInterval(interval);
  }, [loadHistoryFromContext]);

  const [historySearch, setHistorySearch] = useState("");

  const filteredHistory = history.filter((item) => {
    const searchLower = historySearch.toLowerCase();
    return (
      item.target_profile.toLowerCase().includes(searchLower) ||
      item.post_id.toLowerCase().includes(searchLower) ||
      item.platform.toLowerCase().includes(searchLower)
    );
  });

  const handleOpenPostUrl = (item) => {
    const url = formatPostUrl(item);
    window.open(url, "_blank");
  };

  const handleDeleteHistoryItem = async (id) => {
    const success = await deleteHistoryItem(id);
    if (success) {
      showToast("Item riwayat berhasil dihapus", "success");
      loadHistoryFromContext();
    } else {
      showToast("Gagal menghapus item riwayat", "error");
    }
  };

  const handleClearAllHistory = async () => {
    const success = await clearAllHistory();
    if (success) {
      setConfirmClearDb(false);
      showToast("Database berhasil dikosongkan", "success");
      loadHistoryFromContext();
    } else {
      showToast("Gagal mengosongkan database", "error");
    }
  };

  const getPlatformBadge = (platform) => {
    switch (platform) {
      case PLATFORMS.INSTAGRAM:
        return (
          <span className="px-2.5 py-0.5 bg-pink-500/10 text-pink-400 border border-pink-500/20 rounded-full text-[10px] font-bold uppercase select-none">
            instagram
          </span>
        );
      case PLATFORMS.TWITTER:
        return (
          <span className="px-2.5 py-0.5 bg-slate-500/10 text-slate-300 border border-slate-500/20 rounded-full text-[10px] font-bold uppercase select-none">
            twitter / x
          </span>
        );
      case PLATFORMS.THREADS:
        return (
          <span className="px-2.5 py-0.5 bg-zinc-500/10 text-zinc-400 border border-zinc-500/20 rounded-full text-[10px] font-bold uppercase select-none">
            threads
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-0.5 bg-slate-500/10 text-slate-300 border border-slate-500/20 rounded-full text-[10px] font-bold uppercase select-none">
            {platform}
          </span>
        );
    }
  };

  return (
    <div className="flex-1 flex flex-col gap-6 max-w-6xl mx-auto w-full">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-200 to-indigo-400 tracking-tight">
            Riwayat Database SQLite
          </h2>
          <p className="text-slate-400 text-sm mt-1">
            Daftar semua postingan yang berhasil disukai dan tersimpan di
            database lokal.
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={loadHistory}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 transition-all rounded-xl text-xs font-bold text-slate-300 flex items-center gap-2"
          >
            Refresh Data
          </button>

          <button
            onClick={() => setConfirmClearDb(true)}
            disabled={history.length === 0}
            className="px-4 py-2 bg-red-600/10 hover:bg-red-600/30 disabled:opacity-40 disabled:hover:bg-red-600/10 border border-red-500/20 hover:border-red-500/30 transition-all rounded-xl text-xs font-bold text-red-400 flex items-center gap-2"
          >
            Kosongkan Database
          </button>
        </div>
      </div>

      {/* Clear DB Confirmation Dialog Overlay */}
      {confirmClearDb && (
        <div className="bg-red-500/5 border border-red-500/20 rounded-2xl p-5 flex flex-col gap-3.5 relative overflow-hidden shadow-glow shadow-red-500/2 animate-fadeIn">
          <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/2 rounded-full blur-2xl pointer-events-none"></div>
          <div className="flex items-center gap-3">
            <span className="text-xl">⚠️</span>
            <h4 className="text-sm font-bold text-red-300 uppercase tracking-wider">
              Peringatan: Penghapusan Masal!
            </h4>
          </div>
          <p className="text-xs text-red-400/90 leading-relaxed">
            Apakah Anda yakin ingin mengosongkan seluruh riwayat database?
            Tindakan ini akan menghapus semua catatan{" "}
            <strong>{history.length} postingan</strong> yang telah tersimpan di
            SQLite secara permanen. Tindakan ini tidak dapat dibatalkan.
          </p>
          <div className="flex gap-3 mt-1">
            <button
              onClick={handleClearAllHistory}
              className="px-4.5 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-bold shadow-lg"
            >
              Ya, Hapus Semua
            </button>
            <button
              onClick={() => setConfirmClearDb(false)}
              className="px-4.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold border border-slate-700/50"
            >
              Batal
            </button>
          </div>
        </div>
      )}

      {/* Search Database bar */}
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
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
        <input
          type="text"
          value={historySearch}
          onChange={(e) => setHistorySearch(e.target.value)}
          placeholder="Cari berdasarkan target profil atau Post ID..."
          className="w-full bg-slate-900/40 backdrop-blur-md border border-slate-800 rounded-xl pl-11 pr-4 py-3 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all duration-300 placeholder-slate-700"
        />
      </div>

      {/* Data Table */}
      <div className="bg-slate-900/40 backdrop-blur-md rounded-2xl border border-slate-800/80 shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-sm text-slate-300">
            <thead>
              <tr className="bg-slate-950/80 border-b border-slate-800/50 text-[10px] font-bold text-slate-500 tracking-wider uppercase">
                <th className="px-6 py-4">ID</th>
                <th className="px-6 py-4">Platform</th>
                <th className="px-6 py-4">Target Profile</th>
                <th className="px-6 py-4">Post ID</th>
                <th className="px-6 py-4">Liked At</th>
                <th className="px-6 py-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/40">
              {filteredHistory.length === 0 ? (
                <tr>
                  <td
                    colSpan="6"
                    className="px-6 py-12 text-center text-slate-600 select-none"
                  >
                    {history.length === 0
                      ? "Database kosong"
                      : "Tidak ada riwayat database yang cocok"}
                  </td>
                </tr>
              ) : (
                filteredHistory.map((item, idx) => (
                  <tr
                    key={item.id}
                    className="hover:bg-slate-900/20 transition-all"
                  >
                    <td className="px-6 py-4 font-mono text-xs text-slate-500">
                      {idx + 1}
                    </td>
                    <td className="px-6 py-4">
                      {getPlatformBadge(item.platform)}
                    </td>
                    <td className="px-6 py-4 font-semibold text-slate-200 break-all">
                      {item.target_profile}
                    </td>
                    <td className="px-6 py-4 font-mono text-xs text-purple-300 break-all">
                      {item.post_id}
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-400">
                      {formatDate(item.liked_at)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2.5">
                        <button
                          onClick={() => handleOpenPostUrl(item)}
                          className="px-2.5 py-1.5 bg-indigo-500/10 hover:bg-indigo-600 text-indigo-300 hover:text-white rounded-lg text-xs font-bold border border-indigo-500/20 transition-all"
                        >
                          Buka Post
                        </button>
                        <button
                          onClick={() => handleDeleteHistoryItem(item.id)}
                          className="px-2.5 py-1.5 bg-red-500/10 hover:bg-red-600 text-red-400 hover:text-white rounded-lg text-xs font-bold border border-red-500/20 transition-all"
                        >
                          Hapus
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
