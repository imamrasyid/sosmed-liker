import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
} from "react";
import { TABS, PLATFORMS, TOAST_TYPES } from "../utils/constants.js";

const AppContext = createContext(null);

export function AppProvider({ children }) {
  // ── Navigation ────────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState(TABS.DASHBOARD);
  const [selectedPlatform, setSelectedPlatform] = useState(PLATFORMS.INSTAGRAM);
  const [settingsSubTab, setSettingsSubTab] = useState("config");
  const [language, setLanguage] = useState("id");

  // ── Sidebar collapsible ───────────────────────────────────────────────────
  const [expandedGroups, setExpandedGroups] = useState({
    "campaigns-group": true,
    "history-group": true,
    "analytics-group": true,
    "accounts-group": true,
    "settings-group": true,
  });

  // ── Cookie / profile status ───────────────────────────────────────────────
  const [cookiesStatus, setCookiesStatus] = useState({
    [PLATFORMS.INSTAGRAM]: false,
    [PLATFORMS.TWITTER]: false,
    [PLATFORMS.THREADS]: false,
  });

  const checkAllCookiesStatus = useCallback(async () => {
    if (!window.api?.getActiveProfile) return;
    try {
      const results = await Promise.all(
        [PLATFORMS.INSTAGRAM, PLATFORMS.TWITTER, PLATFORMS.THREADS].map(
          async (platform) => {
            const res = await window.api.getActiveProfile(platform);
            return { platform, hasProfile: res.success && res.data !== null };
          },
        ),
      );
      const newStatus = {};
      results.forEach(({ platform, hasProfile }) => {
        newStatus[platform] = hasProfile;
      });
      setCookiesStatus(newStatus);
    } catch (err) {
      console.error("Failed to check profile status:", err);
    }
  }, []);

  useEffect(() => {
    checkAllCookiesStatus();
  }, [checkAllCookiesStatus]);

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
    if (!window.api?.getLikedPosts) return;
    setHistoryLoading(true);
    setHistoryError(null);
    try {
      const posts = await window.api.getLikedPosts();
      setHistory(posts);
    } catch (err) {
      console.error("Failed to load history:", err);
      setHistoryError(err.message);
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  const loadDbStats = useCallback(async () => {
    if (!window.api?.getDbStats) return;
    try {
      const s = await window.api.getDbStats();
      setStats(s);
    } catch (err) {
      console.error("Failed to load db stats:", err);
    }
  }, []);

  const deleteHistoryItem = useCallback(
    async (id) => {
      try {
        const res = await window.api.deleteLikedPost(id);
        if (res.success) {
          // Optimistic update — hapus dari state lokal dulu, lalu sync stats
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
      const res = await window.api.clearHistory();
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

  // Auto-refresh stats ketika automation selesai — event-driven, bukan polling
  useEffect(() => {
    if (!window.api) return;
    const unsubscribers = [];

    if (window.api.onAutomationDone) {
      unsubscribers.push(
        window.api.onAutomationDone(() => {
          loadHistory();
          loadDbStats();
        }),
      );
    }
    if (window.api.onAutomationStopped) {
      unsubscribers.push(
        window.api.onAutomationStopped(() => {
          loadDbStats();
        }),
      );
    }

    return () =>
      unsubscribers.forEach((unsub) => {
        if (unsub) unsub();
      });
  }, [loadHistory, loadDbStats]);

  // ── Confirmation state ────────────────────────────────────────────────────
  const [confirmClearDb, setConfirmClearDb] = useState(false);

  // ── Toast ─────────────────────────────────────────────────────────────────
  const [toast, setToast] = useState({
    show: false,
    message: "",
    type: TOAST_TYPES.SUCCESS,
  });

  const showToast = useCallback((message, type = TOAST_TYPES.SUCCESS) => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast({ show: false, message: "", type: TOAST_TYPES.SUCCESS });
    }, 4000);
  }, []);

  const hideToast = useCallback(() => {
    setToast({ show: false, message: "", type: TOAST_TYPES.SUCCESS });
  }, []);

  // ── App version & updates ─────────────────────────────────────────────────
  const [appVersion, setAppVersion] = useState("1.0.0");
  const [updateInfo, setUpdateInfo] = useState(null);
  const [updateModalOpen, setUpdateModalOpen] = useState(false);
  const [checkingForUpdates, setCheckingForUpdates] = useState(false);

  const loadAppVersion = useCallback(async () => {
    if (!window.api?.getAppVersion) return;
    try {
      const version = await window.api.getAppVersion();
      setAppVersion(version);
    } catch (err) {
      console.error("Failed to load app version:", err);
    }
  }, []);

  const runUpdateCheck = useCallback(async (silent = false) => {
    if (!window.api?.checkForUpdates) return;
    if (!silent) setCheckingForUpdates(true);
    try {
      const res = await window.api.checkForUpdates();
      if (res?.updateAvailable) {
        setUpdateInfo(res);
        setUpdateModalOpen(true);
        if (!silent)
          return { success: true, message: "Pembaruan baru tersedia!" };
      } else {
        if (!silent)
          return {
            success: true,
            message: "Aplikasi Anda sudah menggunakan versi terbaru.",
          };
      }
    } catch (err) {
      console.error("Failed to check for updates:", err);
      if (!silent)
        return { success: false, error: "Gagal memeriksa pembaruan." };
    } finally {
      if (!silent) setCheckingForUpdates(false);
    }
  }, []);

  // ── URL / platform detection ──────────────────────────────────────────────
  const handleOpenExternal = useCallback(async (url) => {
    if (window.api?.openExternal) {
      try {
        await window.api.openExternal(url);
      } catch (err) {
        console.error("Failed to open external URL:", err);
      }
    } else {
      window.open(url, "_blank");
    }
  }, []);

  // ── Context value ─────────────────────────────────────────────────────────
  const value = {
    // Navigation
    activeTab,
    setActiveTab,
    selectedPlatform,
    setSelectedPlatform,
    settingsSubTab,
    setSettingsSubTab,
    language,
    setLanguage,

    // Sidebar
    expandedGroups,
    setExpandedGroups,

    // Profile / cookie status
    cookiesStatus,
    checkAllCookiesStatus,

    // History & stats (single source of truth)
    history,
    stats,
    historyLoading,
    historyError,
    loadHistory,
    loadDbStats,
    deleteHistoryItem,
    clearAllHistory,

    // Confirmations
    confirmClearDb,
    setConfirmClearDb,

    // Toast
    toast,
    showToast,
    hideToast,

    // App & updates
    appVersion,
    setAppVersion,
    updateInfo,
    setUpdateInfo,
    updateModalOpen,
    setUpdateModalOpen,
    checkingForUpdates,
    setCheckingForUpdates,
    loadAppVersion,
    runUpdateCheck,

    // External link
    handleOpenExternal,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useAppContext must be used within AppProvider");
  }
  return context;
}
