import React, { useState, useEffect } from "react";
import { PLATFORMS } from "../../utils/constants.js";
import { useTranslation } from "react-i18next";

export function ProfileManagement() {
  const { t } = useTranslation();
  const [platform, setPlatform] = useState(PLATFORMS.INSTAGRAM);
  const [profiles, setProfiles] = useState([]);
  const [activeProfile, setActiveProfile] = useState(null);
  const [profileName, setProfileName] = useState("");
  const [cookieContent, setCookieContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [migrationStatus, setMigrationStatus] = useState(false);
  const [migrationLoading, setMigrationLoading] = useState(false);

  useEffect(() => {
    loadProfiles();
    checkMigrationStatus();
  }, [platform]);

  const checkMigrationStatus = async () => {
    try {
      const result = await window.api.getMigrationStatus();
      if (result.success) {
        setMigrationStatus(result.migrated);
      }
    } catch (err) {
      console.error("Failed to check migration status:", err);
    }
  };

  const handleMigrate = async () => {
    if (!confirm(t("profileManagement.migrationConfirm"))) {
      return;
    }

    setMigrationLoading(true);
    try {
      const result = await window.api.migrateCookiesToProfiles();
      if (result.success) {
        alert(result.message || t("profileManagement.migrationSuccess"));
        setMigrationStatus(true);
        loadProfiles();
      } else {
        alert(result.error || t("profileManagement.migrationFailed"));
      }
    } catch (err) {
      alert(t("profileManagement.migrationFailed") + ": " + err.message);
    } finally {
      setMigrationLoading(false);
    }
  };

  const loadProfiles = async () => {
    setLoading(true);
    try {
      const [profilesResult, activeResult] = await Promise.all([
        window.api.getProfiles(platform),
        window.api.getActiveProfile(platform),
      ]);

      if (profilesResult.success) {
        setProfiles(profilesResult.data || []);
      }
      if (activeResult.success) {
        setActiveProfile(activeResult.data);
      }
    } catch (err) {
      console.error("Failed to load profiles:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddProfile = async () => {
    if (!profileName.trim()) {
      alert(t("profileManagement.profileNameRequired"));
      return;
    }
    if (!cookieContent.trim()) {
      alert(t("profileManagement.cookieContentRequired"));
      return;
    }

    setLoading(true);
    try {
      const result = await window.api.saveProfile(
        platform,
        profileName,
        cookieContent,
      );
      if (result.success) {
        setProfileName("");
        setCookieContent("");
        loadProfiles();
        alert(t("profileManagement.profileAdded"));
      } else {
        alert(result.error || t("profileManagement.profileAddFailed"));
      }
    } catch (err) {
      alert(t("profileManagement.profileAddFailed") + ": " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSetActive = async (profileId) => {
    setLoading(true);
    try {
      const result = await window.api.setActiveProfile(profileId);
      if (result.success) {
        loadProfiles();
      } else {
        alert(result.error || t("profileManagement.profileSetActiveFailed"));
      }
    } catch (err) {
      alert(t("profileManagement.profileSetActiveFailed") + ": " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (profileId) => {
    if (!confirm(t("profileManagement.profileDeleteConfirm"))) return;

    setLoading(true);
    try {
      const result = await window.api.deleteProfile(profileId);
      if (result.success) {
        loadProfiles();
      } else {
        alert(result.error || t("profileManagement.profileDeleteFailed"));
      }
    } catch (err) {
      alert(t("profileManagement.profileDeleteFailed") + ": " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const getPlatformLabel = (p) => {
    switch (p) {
      case PLATFORMS.INSTAGRAM:
        return t("profileManagement.instagram");
      case PLATFORMS.TWITTER:
        return t("profileManagement.twitterX");
      case PLATFORMS.THREADS:
        return t("profileManagement.threads");
      default:
        return p;
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h3 className="text-xl font-bold text-white mb-2">
          {t("profileManagement.title")}
        </h3>
        <p className="text-slate-400 text-sm">
          {t("profileManagement.description")}
          <span className="text-indigo-400">
            {" "}
            {t("profileManagement.replacesOld")}
          </span>
        </p>
      </div>

      {/* Migration Banner */}
      {!migrationStatus && (
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <span className="text-lg">🔄</span>
            <div className="flex-1">
              <p className="text-sm font-bold text-amber-300">
                {t("profileManagement.migrationTitle")}
              </p>
              <p className="text-xs text-amber-400/90 mt-1">
                {t("profileManagement.migrationDesc")}
              </p>
              <button
                onClick={handleMigrate}
                disabled={migrationLoading}
                className="mt-3 px-4 py-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 rounded-lg text-xs font-bold transition-all disabled:opacity-50"
              >
                {migrationLoading
                  ? t("profileManagement.migrating")
                  : t("profileManagement.migrateNow")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Info */}
      <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <span className="text-lg">ℹ️</span>
          <div>
            <p className="text-sm font-bold text-blue-300">
              {t("profileManagement.info")}
            </p>
            <ul className="text-xs text-blue-400/90 mt-1 space-y-1">
              <li>• {t("profileManagement.info1")}</li>
              <li>• {t("profileManagement.info2")}</li>
              <li>• {t("profileManagement.info3")}</li>
              <li>• {t("profileManagement.info4")}</li>
              <li>• {t("profileManagement.info5")}</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Platform Selector */}
      <div className="flex gap-4 items-end">
        <div className="flex-1">
          <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">
            {t("profileManagement.platform")}
          </label>
          <select
            value={platform}
            onChange={(e) => setPlatform(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500"
          >
            <option value={PLATFORMS.INSTAGRAM}>Instagram</option>
            <option value={PLATFORMS.TWITTER}>Twitter / X</option>
            <option value={PLATFORMS.THREADS}>Threads</option>
          </select>
        </div>
      </div>

      {/* Active Profile Indicator */}
      {activeProfile ? (
        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
            <div>
              <p className="text-sm font-bold text-emerald-300">
                {t("profileManagement.activeProfile")}:{" "}
                {activeProfile.profile_name}
              </p>
              <p className="text-xs text-emerald-400/90">
                Profil ini akan digunakan untuk automasi{" "}
                {getPlatformLabel(platform)}
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-slate-600"></div>
            <div>
              <p className="text-sm font-bold text-slate-300">
                Tidak ada profil aktif
              </p>
              <p className="text-xs text-slate-400">
                Cookie dari folder akan digunakan sebagai fallback
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Add Profile Form */}
      <div className="bg-slate-900/40 backdrop-blur-md rounded-2xl border border-slate-800/80 p-5">
        <h4 className="text-sm font-bold text-slate-200 mb-4">
          Tambah Profil Baru
        </h4>
        <div className="flex flex-col gap-3">
          <div>
            <label className="block text-xs font-bold text-slate-400 mb-2">
              Nama Profil
            </label>
            <input
              type="text"
              value={profileName}
              onChange={(e) => setProfileName(e.target.value)}
              placeholder={t("profileManagement.profileNamePlaceholder")}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 placeholder-slate-600"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-400 mb-2">
              Cookie Content (Netscape Format)
            </label>
            <textarea
              value={cookieContent}
              onChange={(e) => setCookieContent(e.target.value)}
              placeholder={t("profileManagement.cookieContentPlaceholder")}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 h-32 resize-none font-mono placeholder-slate-600"
            />
          </div>
          <button
            onClick={handleAddProfile}
            disabled={loading}
            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:hover:bg-indigo-600 text-white rounded-xl text-sm font-bold transition-all self-start"
          >
            {loading
              ? t("profileManagement.adding")
              : t("profileManagement.addProfileBtn")}
          </button>
        </div>
      </div>

      {/* Profiles List */}
      <div className="bg-slate-900/40 backdrop-blur-md rounded-2xl border border-slate-800/80 overflow-hidden">
        <div className="p-4 border-b border-slate-800/50">
          <h4 className="text-sm font-bold text-slate-200">
            Daftar Profil - {getPlatformLabel(platform)}
            <span className="ml-2 text-xs text-slate-400">
              ({profiles.length} profil)
            </span>
          </h4>
        </div>

        {loading ? (
          <div className="p-8 text-center text-slate-400">
            {t("profileManagement.loading")}
          </div>
        ) : profiles.length === 0 ? (
          <div className="p-8 text-center text-slate-500">
            {t("profileManagement.noProfilesPlatform")}
          </div>
        ) : (
          <div className="divide-y divide-slate-800/40">
            {profiles.map((profile) => (
              <div
                key={profile.id}
                className="p-4 flex items-center justify-between hover:bg-slate-900/20 transition-all"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-slate-200">
                      {profile.profile_name}
                    </p>
                    {activeProfile?.id === profile.id && (
                      <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full text-[10px] font-bold uppercase">
                        Aktif
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Ditambahkan:{" "}
                    {new Date(profile.created_at).toLocaleDateString("id-ID")}
                  </p>
                </div>
                <div className="flex gap-2 ml-4">
                  {activeProfile?.id !== profile.id && (
                    <button
                      onClick={() => handleSetActive(profile.id)}
                      className="px-3 py-1.5 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 rounded-lg text-xs font-bold border border-indigo-500/20 transition-all"
                    >
                      Set Aktif
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(profile.id)}
                    className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg text-xs font-bold border border-red-500/20 transition-all"
                  >
                    Hapus
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
