/**
 * AppContext — navigation state + external link handler.
 *
 * State yang dulu monolitik di sini sudah dipecah ke context masing-masing:
 *   - UIContext      → toast, confirmClearDb
 *   - DataContext    → history, stats, loadHistory, loadDbStats
 *   - ProfileContext → cookiesStatus, checkAllCookiesStatus
 *   - UpdateContext  → appVersion, updateInfo, runUpdateCheck
 *
 * useAppContext() masih di-export untuk backward compatibility — ia menggabungkan
 * semua context sehingga komponen yang sudah ada tidak perlu diubah import-nya.
 */
import React, { createContext, useContext, useState, useCallback } from "react";
import { TABS, PLATFORMS } from "../utils/constants.js";
import { UIProvider, useUIContext } from "./UIContext.jsx";
import { DataProvider, useDataContext } from "./DataContext.jsx";
import { ProfileProvider, useProfileContext } from "./ProfileContext.jsx";
import { UpdateProvider, useUpdateContext } from "./UpdateContext.jsx";

const AppContext = createContext(null);

function AppStateProvider({ children }) {
  // ── Navigation ────────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState(TABS.DASHBOARD);
  const [selectedPlatform, setSelectedPlatform] = useState(PLATFORMS.INSTAGRAM);
  const [settingsSubTab, setSettingsSubTab] = useState("config");
  const [language, setLanguage] = useState("id");

  // ── External link ─────────────────────────────────────────────────────────
  const handleOpenExternal = useCallback(async (url) => {
    if (window.api?.app?.openExternal) {
      try {
        await window.api.app.openExternal(url);
      } catch (err) {
        console.error("Failed to open external URL:", err);
      }
    } else {
      window.open(url, "_blank");
    }
  }, []);

  const value = {
    activeTab,
    setActiveTab,
    selectedPlatform,
    setSelectedPlatform,
    settingsSubTab,
    setSettingsSubTab,
    language,
    setLanguage,
    handleOpenExternal,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

/**
 * AppProvider — menyusun semua provider dalam urutan yang benar.
 */
export function AppProvider({ children }) {
  return (
    <UIProvider>
      <DataProvider>
        <ProfileProvider>
          <UpdateProvider>
            <AppStateProvider>{children}</AppStateProvider>
          </UpdateProvider>
        </ProfileProvider>
      </DataProvider>
    </UIProvider>
  );
}

/**
 * useAppContext — menggabungkan semua context sekaligus untuk backward compatibility.
 * Komponen yang sudah ada bisa tetap pakai hook ini tanpa perubahan.
 *
 * Untuk komponen baru, lebih baik langsung pakai hook spesifik:
 *   useUIContext, useDataContext, useProfileContext, useUpdateContext
 */
export function useAppContext() {
  const appCtx = useContext(AppContext);
  if (!appCtx) throw new Error("useAppContext must be used within AppProvider");

  const ui = useUIContext();
  const data = useDataContext();
  const profile = useProfileContext();
  const update = useUpdateContext();

  return {
    // Navigation (AppContext)
    ...appCtx,

    // UI (UIContext)
    ...ui,

    // Data (DataContext)
    history: data.history,
    stats: data.stats,
    historyLoading: data.historyLoading,
    historyError: data.historyError,
    loadHistory: data.loadHistory,
    loadDbStats: data.loadDbStats,
    deleteHistoryItem: data.deleteHistoryItem,
    clearAllHistory: data.clearAllHistory,

    // Profile (ProfileContext)
    cookiesStatus: profile.cookiesStatus,
    checkAllCookiesStatus: profile.checkAllCookiesStatus,
    refreshCookiesStatus: profile.refreshCookiesStatus,

    // Update (UpdateContext)
    appVersion: update.appVersion,
    setAppVersion: update.setAppVersion,
    updateInfo: update.updateInfo,
    setUpdateInfo: update.setUpdateInfo,
    updateModalOpen: update.updateModalOpen,
    setUpdateModalOpen: update.setUpdateModalOpen,
    checkingForUpdates: update.checkingForUpdates,
    setCheckingForUpdates: update.setCheckingForUpdates,
    loadAppVersion: update.loadAppVersion,
    runUpdateCheck: update.runUpdateCheck,
  };
}
