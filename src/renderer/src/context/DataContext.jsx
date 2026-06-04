import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
} from "react";

const DataContext = createContext(null);

export function DataProvider({ children }) {
  // ── History & DB stats — single source of truth ───────────────────────────
  const [history, setHistory] = useState([]);
  const [stats, setStats] = useState({
    total_liked: 0,
    total_profiles: 0,
    liked_today: 0,
  });
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState(null);

  const loadHistory = useCallback(async () => {
    if (!window.api?.history?.getLikedPosts) return;
    setHistoryLoading(true);
    setHistoryError(null);
    try {
      const posts = await window.api.history.getLikedPosts();
      setHistory(posts);
    } catch (err) {
      console.error("Failed to load history:", err);
      setHistoryError(err.message);
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  const loadDbStats = useCallback(async () => {
    if (!window.api?.history?.getDbStats) return;
    try {
      const s = await window.api.history.getDbStats();
      setStats(s);
    } catch (err) {
      console.error("Failed to load db stats:", err);
    }
  }, []);

  const deleteHistoryItem = useCallback(
    async (id) => {
      try {
        const res = await window.api.history.deleteLikedPost(id);
        if (res.success) {
          setHistory((prev) => prev.filter((item) => item.id !== id));
          await loadDbStats();
          return true;
        }
        return false;
      } catch (err) {
        console.error(err);
        setHistoryError(err.message);
        return false;
      }
    },
    [loadDbStats],
  );

  const clearAllHistory = useCallback(async () => {
    try {
      const res = await window.api.history.clearHistory();
      if (res.success) {
        setHistory([]);
        await loadDbStats();
        return true;
      }
      return false;
    } catch (err) {
      console.error(err);
      setHistoryError(err.message);
      return false;
    }
  }, [loadDbStats]);

  // Load on mount
  useEffect(() => {
    loadHistory();
    loadDbStats();
  }, [loadHistory, loadDbStats]);

  // Auto-refresh ketika automation selesai — event-driven, bukan polling
  useEffect(() => {
    if (!window.api) return;
    const unsubscribers = [];

    if (window.api.automation?.onDone) {
      unsubscribers.push(
        window.api.automation.onDone(() => {
          loadHistory();
          loadDbStats();
        }),
      );
    }
    if (window.api.automation?.onStopped) {
      unsubscribers.push(
        window.api.automation.onStopped(() => {
          loadDbStats();
        }),
      );
    }

    return () =>
      unsubscribers.forEach((unsub) => {
        if (unsub) unsub();
      });
  }, [loadHistory, loadDbStats]);

  const value = {
    history,
    stats,
    historyLoading,
    historyError,
    loadHistory,
    loadDbStats,
    deleteHistoryItem,
    clearAllHistory,
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useDataContext() {
  const context = useContext(DataContext);
  if (!context)
    throw new Error("useDataContext must be used within DataProvider");
  return context;
}
