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
  // Navigation State
  const [activeTab, setActiveTab] = useState(TABS.DASHBOARD);
  const [selectedPlatform, setSelectedPlatform] = useState(PLATFORMS.INSTAGRAM);
  const [settingsSubTab, setSettingsSubTab] = useState("config");
  const [language, setLanguage] = useState("id");

  // Cookie Status State (for showing profile status in Accounts view)
  const [cookiesStatus, setCookiesStatus] = useState({
    [PLATFORMS.INSTAGRAM]: false,
    [PLATFORMS.TWITTER]: false,
    [PLATFORMS.THREADS]: false,
  });

  // Input & Status State
  const [targetUrl, setTargetUrl] = useState("");

  // Custom Log State
  const [logSearch, setLogSearch] = useState("");
  const [logFilter, setLogFilter] = useState("ALL");
  const [autoScroll, setAutoScroll] = useState(true);

  // History State
  const [historySearch, setHistorySearch] = useState("");

  // Update Info State
  const [updateInfo, setUpdateInfo] = useState(null);
  const [updateModalOpen, setUpdateModalOpen] = useState(false);
  const [checkingForUpdates, setCheckingForUpdates] = useState(false);
  const [appVersion, setAppVersion] = useState("1.0.0");

  // Sidebar Collapsible States
  const [expandedGroups, setExpandedGroups] = useState({
    "campaigns-group": true,
    "history-group": true,
    "analytics-group": true,
    "accounts-group": true,
    "settings-group": true,
  });

  // Confirmation States
  const [confirmClearDb, setConfirmClearDb] = useState(false);

  // Toast State
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

  const loadHistory = useCallback(async () => {
    if (window.api && window.api.getLikedPosts) {
      try {
        const posts = await window.api.getLikedPosts();
        return posts;
      } catch (err) {
        console.error("Failed to load history:", err);
        return [];
      }
    }
    return [];
  }, []);

  const loadDbStats = useCallback(async () => {
    if (window.api && window.api.getDbStats) {
      try {
        const stats = await window.api.getDbStats();
        return stats;
      } catch (err) {
        console.error("Failed to load db stats:", err);
        return { total_liked: 0, total_profiles: 0, liked_today: 0 };
      }
    }
    return { total_liked: 0, total_profiles: 0, liked_today: 0 };
  }, []);

  const checkAllCookiesStatus = useCallback(async () => {
    if (window.api && window.api.getActiveProfile) {
      try {
        const platforms = [
          PLATFORMS.INSTAGRAM,
          PLATFORMS.TWITTER,
          PLATFORMS.THREADS,
        ];
        const statusPromises = platforms.map(async (platform) => {
          const result = await window.api.getActiveProfile(platform);
          return {
            platform,
            hasProfile: result.success && result.data !== null,
          };
        });

        const statuses = await Promise.all(statusPromises);
        const newStatus = {};
        statuses.forEach(({ platform, hasProfile }) => {
          newStatus[platform] = hasProfile;
        });

        setCookiesStatus(newStatus);
      } catch (err) {
        console.error("Failed to check profile status:", err);
      }
    }
  }, []);

  // Load profile status on mount
  useEffect(() => {
    checkAllCookiesStatus();
  }, [checkAllCookiesStatus]);

  const loadAppVersion = useCallback(async () => {
    if (window.api && window.api.getAppVersion) {
      try {
        const version = await window.api.getAppVersion();
        setAppVersion(version);
      } catch (err) {
        console.error("Failed to load app version:", err);
      }
    }
  }, []);

  const runUpdateCheck = useCallback(async (silent = false) => {
    if (window.api && window.api.checkForUpdates) {
      if (!silent) setCheckingForUpdates(true);
      try {
        const res = await window.api.checkForUpdates();
        if (res && res.updateAvailable) {
          setUpdateInfo(res);
          setUpdateModalOpen(true);
          if (!silent) {
            return { success: true, message: "Pembaruan baru tersedia!" };
          }
        } else {
          if (!silent) {
            return {
              success: true,
              message: "Aplikasi Anda sudah menggunakan versi terbaru.",
            };
          }
        }
      } catch (err) {
        console.error("Failed to check for updates:", err);
        if (!silent) {
          return { success: false, error: "Gagal memeriksa pembaruan." };
        }
      } finally {
        if (!silent) setCheckingForUpdates(false);
      }
    }
  }, []);

  const handleUrlChange = useCallback((val) => {
    setTargetUrl(val);
    const lower = val.toLowerCase();
    if (lower.includes("instagram.com")) {
      setSelectedPlatform(PLATFORMS.INSTAGRAM);
    } else if (lower.includes("twitter.com") || lower.includes("x.com")) {
      setSelectedPlatform(PLATFORMS.TWITTER);
    } else if (lower.includes("threads.net") || lower.includes("threads.com")) {
      setSelectedPlatform(PLATFORMS.THREADS);
    }
  }, []);

  const handleOpenExternal = useCallback(async (url) => {
    if (window.api && window.api.openExternal) {
      try {
        await window.api.openExternal(url);
      } catch (err) {
        console.error("Failed to open external URL:", err);
      }
    } else {
      window.open(url, "_blank");
    }
  }, []);

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

    // Profile Status (for Accounts view)
    cookiesStatus,
    checkAllCookiesStatus,

    // Input
    targetUrl,
    setTargetUrl,
    handleUrlChange,
    handleOpenExternal,

    // Logs
    logSearch,
    setLogSearch,
    logFilter,
    setLogFilter,
    autoScroll,
    setAutoScroll,

    // History
    historySearch,
    setHistorySearch,
    loadHistory,
    loadDbStats,

    // Updates
    updateInfo,
    setUpdateInfo,
    updateModalOpen,
    setUpdateModalOpen,
    checkingForUpdates,
    setCheckingForUpdates,
    appVersion,
    setAppVersion,
    runUpdateCheck,
    loadAppVersion,

    // Sidebar
    expandedGroups,
    setExpandedGroups,

    // Confirmations
    confirmClearDb,
    setConfirmClearDb,

    // Toast
    toast,
    showToast,
    hideToast,
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
