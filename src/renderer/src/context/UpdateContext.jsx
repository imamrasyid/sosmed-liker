import React, { createContext, useContext, useState, useCallback } from "react";

const UpdateContext = createContext(null);

export function UpdateProvider({ children }) {
  const [appVersion, setAppVersion] = useState("1.0.0");
  const [updateInfo, setUpdateInfo] = useState(null);
  const [updateModalOpen, setUpdateModalOpen] = useState(false);
  const [checkingForUpdates, setCheckingForUpdates] = useState(false);

  const loadAppVersion = useCallback(async () => {
    if (!window.api?.app?.getVersion) return;
    try {
      const version = await window.api.app.getVersion();
      setAppVersion(version);
    } catch (err) {
      console.error("Failed to load app version:", err);
    }
  }, []);

  const runUpdateCheck = useCallback(async (silent = false) => {
    if (!window.api?.app?.checkForUpdates) return;
    if (!silent) setCheckingForUpdates(true);
    try {
      const res = await window.api.app.checkForUpdates();
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

  const value = {
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
  };

  return (
    <UpdateContext.Provider value={value}>{children}</UpdateContext.Provider>
  );
}

export function useUpdateContext() {
  const context = useContext(UpdateContext);
  if (!context)
    throw new Error("useUpdateContext must be used within UpdateProvider");
  return context;
}
