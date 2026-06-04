import React, { createContext, useContext, useState, useCallback } from "react";
import { TOAST_TYPES } from "../utils/constants.js";

const UIContext = createContext(null);

export function UIProvider({ children }) {
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

  // ── Confirm modal states ──────────────────────────────────────────────────
  const [confirmClearDb, setConfirmClearDb] = useState(false);

  const value = {
    toast,
    showToast,
    hideToast,
    confirmClearDb,
    setConfirmClearDb,
  };

  return <UIContext.Provider value={value}>{children}</UIContext.Provider>;
}

export function useUIContext() {
  const context = useContext(UIContext);
  if (!context) throw new Error("useUIContext must be used within UIProvider");
  return context;
}
