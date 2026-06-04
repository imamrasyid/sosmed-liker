import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
} from "react";
import { PLATFORMS } from "../utils/constants.js";

const ProfileContext = createContext(null);

export function ProfileProvider({ children }) {
  // ── Cookie / profile status per platform ──────────────────────────────────
  const [cookiesStatus, setCookiesStatus] = useState({
    [PLATFORMS.INSTAGRAM]: false,
    [PLATFORMS.TWITTER]: false,
    [PLATFORMS.THREADS]: false,
  });

  const checkAllCookiesStatus = useCallback(async () => {
    if (!window.api?.profiles?.getActive) return;
    try {
      const results = await Promise.all(
        [PLATFORMS.INSTAGRAM, PLATFORMS.TWITTER, PLATFORMS.THREADS].map(
          async (platform) => {
            const res = await window.api.profiles.getActive(platform);
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

  const value = {
    cookiesStatus,
    checkAllCookiesStatus,
    // Alias untuk komponen yang memanggil refreshCookiesStatus
    refreshCookiesStatus: checkAllCookiesStatus,
  };

  return (
    <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>
  );
}

export function useProfileContext() {
  const context = useContext(ProfileContext);
  if (!context)
    throw new Error("useProfileContext must be used within ProfileProvider");
  return context;
}
