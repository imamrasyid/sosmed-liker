import React, { useState, useEffect } from "react";
import { PLATFORMS } from "../../utils/constants.js";
import { useAppContext } from "../../context/AppContext.jsx";
import { ConfirmModal } from "../shared/ConfirmModal.jsx";
import { useTranslation } from "react-i18next";

const PLATFORM_OPTIONS = [
  { value: PLATFORMS.INSTAGRAM, label: "Instagram" },
  { value: PLATFORMS.TWITTER, label: "Twitter / X" },
  { value: PLATFORMS.THREADS, label: "Threads" },
];

export function ProfileManagement() {
  const { t } = useTranslation();
  const { showToast } = useAppContext();
  const [platform, setPlatform] = useState(PLATFORMS.INSTAGRAM);
  const [profiles, setProfiles] = useState([]);
  const [activeProfile, setActiveProfile] = useState(null);
  const [profileName, setProfileName] = useState("");
  const [cookieContent, setCookieContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [migrationStatus, setMigrationStatus] = useState(false);
  const [migrationLoading, setMigrationLoading] = useState(false);

  // Confirm modal state
  const [confirmModal, setConfirmModal] = useState({
    open: false,
    type: "",
    payload: null,
  });

  useEffect(() => {
    loadProfiles();
    checkMigrationStatus();
  }, [platform]);

  const checkMigrationStatus = async () => {
    try {
      const r = await window.api.getMigrationStatus();
      if (r.success) setMigrationStatus(r.migrated);
    } catch {}
  };

  const loadProfiles = async () => {
    setLoading(true);
    try {
      const [pRes, aRes] = await Promise.all([
        window.api.getProfiles(platform),
        window.api.getActiveProfile(platform),
      ]);
      if (pRes.success) setProfiles(pRes.data ?? []);
      if (aRes.success) setActiveProfile(aRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddProfile = async () => {
    if (!profileName.trim()) {
      showToast(t("profileManagement.profileNameRequired"), "error");
      return;
    }
    if (!cookieContent.trim()) {
      showToast(t("profileManagement.cookieContentRequired"), "error");
      return;
    }
    setLoading(true);
    try {
      const r = await window.api.saveProfile(
        platform,
        profileName,
        cookieContent,
      );
      if (r.success) {
        setProfileName("");
        setCookieContent("");
        await loadProfiles();
        showToast(t("profileManagement.profileAdded"), "success");
      } else {
        showToast(r.error ?? t("profileManagement.profileAddFailed"), "error");
      }
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleSetActive = async (profileId) => {
    setLoading(true);
    try {
      const r = await window.api.setActiveProfile(profileId);
      if (r.success) {
        await loadProfiles();
        showToast(t("profileManagement.profileSetActive"), "success");
      } else {
        showToast(
          r.error ?? t("profileManagement.profileSetActiveFailed"),
          "error",
        );
      }
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (profileId) => {
    setLoading(true);
    try {
      const r = await window.api.deleteProfile(profileId);
      if (r.success) {
        await loadProfiles();
        showToast(t("profileManagement.profileDeleted"), "success");
      } else {
        showToast(
          r.error ?? t("profileManagement.profileDeleteFailed"),
          "error",
        );
      }
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setLoading(false);
      setConfirmModal({ open: false, type: "", payload: null });
    }
  };

  const handleMigrate = async () => {
    setMigrationLoading(true);
    try {
      const r = await window.api.migrateCookiesToProfiles();
      if (r.success) {
        setMigrationStatus(true);
        await loadProfiles();
        showToast(
          r.message ?? t("profileManagement.migrationSuccess"),
          "success",
        );
      } else {
        showToast(r.error ?? t("profileManagement.migrationFailed"), "error");
      }
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setMigrationLoading(false);
      setConfirmModal({ open: false, type: "", payload: null });
    }
  };

  return (
    <div className="flex flex-col gap-5">
      <ConfirmModal
        open={confirmModal.open && confirmModal.type === "delete"}
        title="Hapus Profil?"
        message={`Profil ini akan dihapus permanen dan tidak bisa dikembalikan.`}
        confirmLabel="Ya, Hapus"
        onConfirm={() => handleDelete(confirmModal.payload)}
        onCancel={() =>
          setConfirmModal({ open: false, type: "", payload: null })
        }
      />
      <ConfirmModal
        open={confirmModal.open && confirmModal.type === "migrate"}
        title="Migrasi Cookie Lama?"
        message="Ini akan membaca file cookie dari folder userData/cookie dan membuat profil baru untuk setiap file yang ditemukan."
        confirmLabel="Ya, Migrasi"
        variant="warning"
        onConfirm={handleMigrate}
        onCancel={() =>
          setConfirmModal({ open: false, type: "", payload: null })
        }
      />

      {/* Platform tabs */}
      <div className="flex items-center gap-1 bg-white/[0.04] border border-white/[0.06] rounded-xl p-1 w-fit">
        {PLATFORM_OPTIONS.map((p) => (
          <button
            key={p.value}
            onClick={() => setPlatform(p.value)}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${platform === p.value ? "bg-indigo-600 text-white" : "text-slate-500 hover:text-slate-300"}`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Migration banner */}
      {!migrationStatus && (
        <div className="flex items-start gap-3 px-4 py-3 bg-amber-500/8 border border-amber-500/20 rounded-xl">
          <span className="text-amber-400 text-sm shrink-0">🔄</span>
          <div className="flex-1">
            <p className="text-xs font-bold text-amber-300">
              {t("profileManagement.migrationTitle")}
            </p>
            <p className="text-[11px] text-amber-400/70 mt-0.5">
              {t("profileManagement.migrationDesc")}
            </p>
          </div>
          <button
            onClick={() =>
              setConfirmModal({ open: true, type: "migrate", payload: null })
            }
            disabled={migrationLoading}
            className="text-[10px] font-bold text-amber-400 border border-amber-500/30 rounded-lg px-2.5 py-1 hover:bg-amber-500/10 transition-all shrink-0 disabled:opacity-50"
          >
            {migrationLoading ? "..." : t("profileManagement.migrateNow")}
          </button>
        </div>
      )}

      {/* Active profile indicator */}
      <div
        className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${activeProfile ? "bg-emerald-500/8 border-emerald-500/20" : "bg-white/[0.02] border-white/[0.06]"}`}
      >
        <span
          className={`w-2 h-2 rounded-full shrink-0 ${activeProfile ? "bg-emerald-500" : "bg-slate-700"}`}
        />
        <div>
          <p
            className={`text-xs font-bold ${activeProfile ? "text-emerald-300" : "text-slate-500"}`}
          >
            {activeProfile
              ? `Profil Aktif: ${activeProfile.profile_name}`
              : "Tidak ada profil aktif"}
          </p>
          <p className="text-[10px] text-slate-600">
            {activeProfile
              ? `Digunakan untuk otomatisasi ${platform}`
              : "Cookie folder akan digunakan sebagai fallback"}
          </p>
        </div>
      </div>

      {/* Add profile form */}
      <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-5 flex flex-col gap-3">
        <p className="text-xs font-black text-slate-400 uppercase tracking-widest">
          {t("profileManagement.addProfile")}
        </p>
        <input
          type="text"
          value={profileName}
          onChange={(e) => setProfileName(e.target.value)}
          placeholder={t("profileManagement.profileNamePlaceholder")}
          className="w-full bg-[#0c1220] border border-white/[0.08] rounded-xl px-4 py-2.5 text-sm text-slate-200 placeholder-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 transition-all"
        />
        <div>
          <textarea
            value={cookieContent}
            onChange={(e) => setCookieContent(e.target.value)}
            placeholder={t("profileManagement.cookieContentPlaceholder")}
            rows={5}
            className="w-full bg-[#0c1220] border border-white/[0.08] rounded-xl px-4 py-2.5 text-xs text-slate-200 placeholder-slate-700 font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500/40 transition-all resize-none"
          />
          <p className="text-[10px] text-slate-600 mt-1">
            Format: Netscape HTTP Cookie File (.txt dari ekstensi browser)
          </p>
        </div>
        <button
          onClick={handleAddProfile}
          disabled={loading || !profileName.trim() || !cookieContent.trim()}
          className="self-start px-5 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:hover:bg-indigo-600 text-white rounded-xl text-xs font-bold transition-all"
        >
          {loading ? "Menambahkan..." : t("profileManagement.addProfileBtn")}
        </button>
      </div>

      {/* Profiles list */}
      <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl overflow-hidden">
        <div className="px-5 py-3 border-b border-white/[0.06] flex items-center justify-between">
          <p className="text-xs font-black text-slate-400 uppercase tracking-widest">
            Daftar Profil —{" "}
            {PLATFORM_OPTIONS.find((p) => p.value === platform)?.label}
          </p>
          <span className="text-[10px] text-slate-600">
            {profiles.length} profil
          </span>
        </div>

        {loading ? (
          <div className="p-8 text-center text-slate-600 text-xs">
            Memuat...
          </div>
        ) : profiles.length === 0 ? (
          <div className="p-8 text-center text-slate-700 text-xs">
            {t("profileManagement.noProfilesPlatform")}
          </div>
        ) : (
          <div className="divide-y divide-white/[0.04]">
            {profiles.map((profile) => (
              <div
                key={profile.id}
                className="px-5 py-3.5 flex items-center gap-3 hover:bg-white/[0.02] transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-slate-200 truncate">
                      {profile.profile_name}
                    </p>
                    {activeProfile?.id === profile.id && (
                      <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full text-[9px] font-black uppercase shrink-0">
                        Aktif
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-slate-600 mt-0.5">
                    Ditambahkan{" "}
                    {new Date(profile.created_at).toLocaleDateString("id-ID")}
                  </p>
                </div>
                <div className="flex gap-2">
                  {activeProfile?.id !== profile.id && (
                    <button
                      onClick={() => handleSetActive(profile.id)}
                      className="px-3 py-1.5 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/20 rounded-lg text-[10px] font-bold transition-all"
                    >
                      Set Aktif
                    </button>
                  )}
                  <button
                    onClick={() =>
                      setConfirmModal({
                        open: true,
                        type: "delete",
                        payload: profile.id,
                      })
                    }
                    className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-lg text-[10px] font-bold transition-all"
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
