import React, { useState, useEffect, useCallback, useRef } from "react";
import { PLATFORMS } from "../../utils/constants.js";
import { useAppContext } from "../../context/AppContext.jsx";
import { ConfirmModal } from "../shared/ConfirmModal.jsx";
import { isValidCookieFormat } from "../../utils/validators.js";
import { useTranslation } from "react-i18next";

const PLATFORM_OPTIONS = [
  { value: PLATFORMS.INSTAGRAM, label: "Instagram" },
  { value: PLATFORMS.TWITTER, label: "Twitter / X" },
  { value: PLATFORMS.THREADS, label: "Threads" },
];

// Domain → platform mapping untuk auto-detect
const COOKIE_DOMAIN_MAP = {
  "instagram.com": PLATFORMS.INSTAGRAM,
  "twitter.com": PLATFORMS.TWITTER,
  "x.com": PLATFORMS.TWITTER,
  "threads.net": PLATFORMS.THREADS,
};

/**
 * Parse cookie content dan kembalikan info: jumlah cookie valid, platform yang terdeteksi.
 */
function parseCookieInfo(content) {
  if (!content.trim()) return { count: 0, detectedPlatform: null };

  let count = 0;
  const domains = new Set();

  for (const rawLine of content.split("\n")) {
    let line = rawLine.trim();
    if (!line) continue;
    if (line.startsWith("#HttpOnly_")) line = line.substring(10);
    else if (line.startsWith("#")) continue;

    const parts = line.split("\t");
    if (parts.length === 7) {
      count++;
      const domain = parts[0].replace(/^\./, "").toLowerCase();
      domains.add(domain);
    }
  }

  // Deteksi platform dari domain
  let detectedPlatform = null;
  for (const domain of domains) {
    for (const [key, plat] of Object.entries(COOKIE_DOMAIN_MAP)) {
      if (domain.includes(key)) {
        detectedPlatform = plat;
        break;
      }
    }
    if (detectedPlatform) break;
  }

  return { count, detectedPlatform };
}

export function ProfileManagement() {
  const { t } = useTranslation();
  const { showToast, refreshCookiesStatus } = useAppContext();

  const [platform, setPlatform] = useState(PLATFORMS.INSTAGRAM);
  const [profiles, setProfiles] = useState([]);
  const [activeProfile, setActiveProfile] = useState(null);

  // Form state
  const [profileName, setProfileName] = useState("");
  const [cookieContent, setCookieContent] = useState("");
  const [cookieInfo, setCookieInfo] = useState({
    count: 0,
    detectedPlatform: null,
  });
  const debounceRef = useRef(null);

  // Per-item loading — key = profileId atau "add" / "migrate"
  const [loadingItems, setLoadingItems] = useState(new Set());
  const [listLoading, setListLoading] = useState(false);

  // Edit mode
  const [editingId, setEditingId] = useState(null);
  const [editContent, setEditContent] = useState("");
  const [editInfo, setEditInfo] = useState({
    count: 0,
    detectedPlatform: null,
  });

  // Migration
  const [migrationChecked, setMigrationChecked] = useState(false);
  const [hasOldCookies, setHasOldCookies] = useState(false);
  const [migrationStatus, setMigrationStatus] = useState(false);

  // Confirm modal
  const [confirmModal, setConfirmModal] = useState({
    open: false,
    type: "",
    payload: null,
  });

  const isItemLoading = (key) => loadingItems.has(key);
  const setItemLoading = (key, val) =>
    setLoadingItems((prev) => {
      const s = new Set(prev);
      val ? s.add(key) : s.delete(key);
      return s;
    });

  // ── Load ──────────────────────────────────────────────────────────────────

  const loadProfiles = useCallback(async () => {
    setListLoading(true);
    try {
      const [pRes, aRes] = await Promise.all([
        window.api.profiles.getAll(platform),
        window.api.profiles.getActive(platform),
      ]);
      if (pRes.success) setProfiles(pRes.data ?? []);
      if (aRes.success) setActiveProfile(aRes.data);
    } catch (err) {
      showToast("Gagal memuat profil: " + err.message, "error");
    } finally {
      setListLoading(false);
    }
  }, [platform, showToast]);

  const checkMigration = useCallback(async () => {
    try {
      const [statusRes] = await Promise.all([
        window.api.database.getMigrationStatus(),
        window.api.database.getMigrationStatus(),
      ]);
      if (statusRes.success) {
        setMigrationStatus(statusRes.migrated);
        // Banner hanya tampil kalau belum pernah migrasi
        setHasOldCookies(!statusRes.migrated);
      }
    } catch {
    } finally {
      setMigrationChecked(true);
    }
  }, []);

  useEffect(() => {
    loadProfiles();
  }, [loadProfiles]);

  useEffect(() => {
    if (!migrationChecked) checkMigration();
  }, [migrationChecked, checkMigration]);

  // ── Cookie content parser (debounced) ─────────────────────────────────────

  const handleCookieChange = (val) => {
    setCookieContent(val);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      const info = parseCookieInfo(val);
      setCookieInfo(info);
      // Auto-detect platform dari isi cookie
      if (info.detectedPlatform && info.detectedPlatform !== platform) {
        setPlatform(info.detectedPlatform);
      }
    }, 300);
  };

  const handleEditCookieChange = (val) => {
    setEditContent(val);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setEditInfo(parseCookieInfo(val));
    }, 300);
  };

  // ── Operations ────────────────────────────────────────────────────────────

  const handleAddProfile = async () => {
    if (!profileName.trim()) {
      showToast(t("profileManagement.profileNameRequired"), "error");
      return;
    }
    if (!cookieContent.trim()) {
      showToast(t("profileManagement.cookieContentRequired"), "error");
      return;
    }
    if (!isValidCookieFormat(cookieContent)) {
      showToast(
        "Format cookie tidak valid. Pastikan menggunakan format Netscape HTTP Cookie File.",
        "error",
      );
      return;
    }

    setItemLoading("add", true);
    try {
      const r = await window.api.profiles.save(
        platform,
        profileName.trim(),
        cookieContent.trim(),
      );
      if (r.success) {
        setProfileName("");
        setCookieContent("");
        setCookieInfo({ count: 0, detectedPlatform: null });
        await loadProfiles();
        await refreshCookiesStatus();
        showToast(t("profileManagement.profileAdded"), "success");
      } else {
        showToast(r.error ?? t("profileManagement.profileAddFailed"), "error");
      }
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setItemLoading("add", false);
    }
  };

  const handleSetActive = async (profileId) => {
    setItemLoading(profileId, true);
    try {
      const r = await window.api.profiles.setActive(profileId);
      if (r.success) {
        await loadProfiles();
        await refreshCookiesStatus();
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
      setItemLoading(profileId, false);
    }
  };

  const handleDelete = async (profileId) => {
    setItemLoading(profileId, true);
    try {
      const r = await window.api.profiles.delete(profileId);
      if (r.success) {
        // Kalau profil aktif yang dihapus, kasih warning tambahan
        if (r.wasActive) {
          showToast(
            "Profil aktif dihapus. Automation tidak bisa berjalan sampai profil baru diaktifkan.",
            "error",
          );
        } else {
          showToast(t("profileManagement.profileDeleted"), "success");
        }
        await loadProfiles();
        await refreshCookiesStatus();
      } else {
        showToast(
          r.error ?? t("profileManagement.profileDeleteFailed"),
          "error",
        );
      }
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setItemLoading(profileId, false);
      setConfirmModal({ open: false, type: "", payload: null });
    }
  };

  const handleUpdateCookie = async (profileId) => {
    if (!isValidCookieFormat(editContent)) {
      showToast(
        "Format cookie tidak valid. Pastikan menggunakan format Netscape HTTP Cookie File.",
        "error",
      );
      return;
    }
    setItemLoading(`edit-${profileId}`, true);
    try {
      const r = await window.api.profiles.updateCookie(
        profileId,
        editContent.trim(),
      );
      if (r.success) {
        setEditingId(null);
        setEditContent("");
        setEditInfo({ count: 0, detectedPlatform: null });
        await loadProfiles();
        showToast("Cookie berhasil diperbarui.", "success");
      } else {
        showToast(r.error ?? "Gagal memperbarui cookie.", "error");
      }
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setItemLoading(`edit-${profileId}`, false);
    }
  };

  const handleMigrate = async () => {
    setItemLoading("migrate", true);
    try {
      const r = await window.api.database.migrateCookiesToProfiles();
      if (r.success) {
        setMigrationStatus(true);
        setHasOldCookies(false);
        await loadProfiles();
        await refreshCookiesStatus();
        showToast(
          r.message ?? t("profileManagement.migrationSuccess"),
          "success",
        );
      } else {
        // Partial failure — tampilkan detail apa yang gagal
        showToast(r.message ?? t("profileManagement.migrationFailed"), "error");
        // Kalau ada yang berhasil, tetap refresh
        if ((r.migrated ?? 0) > 0) {
          await loadProfiles();
          await refreshCookiesStatus();
        }
      }
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setItemLoading("migrate", false);
      setConfirmModal({ open: false, type: "", payload: null });
    }
  };

  // ── Helpers ───────────────────────────────────────────────────────────────

  const startEdit = (profile) => {
    setEditingId(profile.id);
    setEditContent(profile.cookie_content ?? "");
    setEditInfo(parseCookieInfo(profile.cookie_content ?? ""));
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditContent("");
    setEditInfo({ count: 0, detectedPlatform: null });
  };

  const isDeleteActive = (profile) => activeProfile?.id === profile.id;

  // ── Cookie validity badge ─────────────────────────────────────────────────

  function CookieValidityBadge({ info, content }) {
    if (!content.trim()) return null;
    if (!isValidCookieFormat(content)) {
      return (
        <div className="flex items-center gap-1.5 text-[10px] text-red-400">
          <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
          Format tidak valid — bukan Netscape HTTP Cookie File
        </div>
      );
    }
    return (
      <div className="flex items-center gap-3 text-[10px]">
        <div className="flex items-center gap-1.5 text-emerald-400">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
          {info.count} cookie valid
        </div>
        {info.detectedPlatform && (
          <div className="flex items-center gap-1 text-indigo-400">
            <span>Platform terdeteksi:</span>
            <span className="font-bold capitalize">
              {info.detectedPlatform}
            </span>
          </div>
        )}
      </div>
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col gap-5">
      {/* Delete confirm */}
      <ConfirmModal
        open={confirmModal.open && confirmModal.type === "delete"}
        title={
          isDeleteActive(
            profiles.find((p) => p.id === confirmModal.payload) ?? {},
          )
            ? "Hapus Profil Aktif?"
            : t("profileManagement.noActiveProfile")
        }
        message={
          isDeleteActive(
            profiles.find((p) => p.id === confirmModal.payload) ?? {},
          )
            ? "Profil ini sedang aktif digunakan. Menghapusnya akan menghentikan kemampuan automation untuk platform ini sampai profil baru diaktifkan."
            : "Profil ini akan dihapus permanen dan tidak bisa dikembalikan."
        }
        variant={
          isDeleteActive(
            profiles.find((p) => p.id === confirmModal.payload) ?? {},
          )
            ? "danger"
            : "danger"
        }
        confirmLabel="Ya, Hapus"
        onConfirm={() => handleDelete(confirmModal.payload)}
        onCancel={() =>
          setConfirmModal({ open: false, type: "", payload: null })
        }
      />

      {/* Migrate confirm */}
      <ConfirmModal
        open={confirmModal.open && confirmModal.type === "migrate"}
        title="Migrasi Cookie Lama?"
        message="Ini akan membaca file cookie dari folder userData/cookie dan membuat profil baru untuk setiap file yang ditemukan (instagram.txt, twitter.txt, threads.txt)."
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

      {/* Migration banner — hanya kalau belum migrasi */}
      {migrationChecked && hasOldCookies && !migrationStatus && (
        <div className="flex items-start gap-3 px-4 py-3 bg-amber-500/8 border border-amber-500/20 rounded-xl">
          <span className="text-amber-400 shrink-0">🔄</span>
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
            disabled={isItemLoading("migrate")}
            className="text-[10px] font-bold text-amber-400 border border-amber-500/30 rounded-lg px-2.5 py-1 hover:bg-amber-500/10 transition-all shrink-0 disabled:opacity-50"
          >
            {isItemLoading("migrate")
              ? "..."
              : t("profileManagement.migrateNow")}
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
              ? t("profileManagement.activeProfileLabel", {
                  name: activeProfile.profile_name,
                })
              : t("profileManagement.noActiveProfile")}
          </p>
          <p className="text-[10px] text-slate-600">
            {activeProfile
              ? t("profileManagement.activeProfileHint", { platform })
              : t("profileManagement.fallbackHint")}
          </p>
        </div>
      </div>

      {/* Add profile form */}
      <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-5 flex flex-col gap-3">
        <p className="text-xs font-black text-slate-400 uppercase tracking-widest">
          {t("profileManagement.addProfile")}
        </p>

        {/* Profile name */}
        <div>
          <input
            type="text"
            value={profileName}
            onChange={(e) => setProfileName(e.target.value)}
            placeholder={t("profileManagement.profileNamePlaceholder")}
            maxLength={100}
            className="w-full bg-[#0c1220] border border-white/[0.08] rounded-xl px-4 py-2.5 text-sm text-slate-200 placeholder-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 transition-all"
          />
          {profileName.length > 80 && (
            <p className="text-[10px] text-amber-500 mt-1">
              {profileName.length}/100 karakter
            </p>
          )}
        </div>

        {/* Cookie textarea */}
        <div className="flex flex-col gap-1.5">
          <textarea
            value={cookieContent}
            onChange={(e) => handleCookieChange(e.target.value)}
            placeholder={t("profileManagement.cookieContentPlaceholder")}
            rows={6}
            className={`w-full bg-[#0c1220] border rounded-xl px-4 py-2.5 text-xs text-slate-200 placeholder-slate-700 font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500/40 transition-all resize-none ${
              cookieContent.trim() && !isValidCookieFormat(cookieContent)
                ? "border-red-500/40"
                : "border-white/[0.08]"
            }`}
          />
          {/* Real-time cookie validity feedback */}
          <div className="flex items-center justify-between">
            <CookieValidityBadge info={cookieInfo} content={cookieContent} />
            <p className="text-[10px] text-slate-700">
              Format: Netscape HTTP Cookie File
            </p>
          </div>
        </div>

        <button
          onClick={handleAddProfile}
          disabled={
            isItemLoading("add") || !profileName.trim() || !cookieContent.trim()
          }
          className="self-start px-5 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:hover:bg-indigo-600 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2"
        >
          {isItemLoading("add") && (
            <svg
              className="animate-spin w-3 h-3"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
          )}
          {isItemLoading("add")
            ? "Menambahkan..."
            : t("profileManagement.addProfileBtn")}
        </button>
      </div>

      {/* Profiles list */}
      <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl overflow-hidden">
        <div className="px-5 py-3 border-b border-white/[0.06] flex items-center justify-between">
          <p className="text-xs font-black text-slate-400 uppercase tracking-widest">
            {t("profileManagement.profilesList")} —{" "}
            {PLATFORM_OPTIONS.find((p) => p.value === platform)?.label}
          </p>
          <span className="text-[10px] text-slate-600">
            {profiles.length} {t("profileManagement.profileCount")}
          </span>
        </div>

        {listLoading ? (
          <div className="p-8 text-center text-slate-600 text-xs">
            {t("common.loading")}
          </div>
        ) : profiles.length === 0 ? (
          <div className="p-10 text-center">
            <p className="text-slate-700 text-xs">
              {t("profileManagement.noProfilesPlatform")}
            </p>
            <p className="text-slate-800 text-[10px] mt-1">
              Tambah profil baru menggunakan form di atas.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-white/[0.04]">
            {profiles.map((profile) => (
              <div key={profile.id} className="flex flex-col">
                {/* Profile row */}
                <div className="px-5 py-3.5 flex items-center gap-3 hover:bg-white/[0.02] transition-colors">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-slate-200 truncate">
                        {profile.profile_name}
                      </p>
                      {activeProfile?.id === profile.id && (
                        <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full text-[9px] font-black uppercase shrink-0">
                          {t("profileManagement.activeProfile")}
                        </span>
                      )}
                      {activeProfile?.id === profile.id && (
                        <span
                          className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0"
                          title="Profil ini sedang digunakan untuk automation"
                        />
                      )}
                    </div>
                    <p className="text-[10px] text-slate-600 mt-0.5">
                      {t("profileManagement.createdAt")}{" "}
                      {new Date(profile.created_at).toLocaleDateString()}
                    </p>
                  </div>

                  <div className="flex gap-1.5 shrink-0">
                    {/* Edit cookie button */}
                    <button
                      onClick={() =>
                        editingId === profile.id
                          ? cancelEdit()
                          : startEdit(profile)
                      }
                      disabled={
                        isItemLoading(profile.id) ||
                        isItemLoading(`edit-${profile.id}`)
                      }
                      className={`px-3 py-1.5 rounded-lg text-[10px] font-bold border transition-all ${
                        editingId === profile.id
                          ? "bg-slate-500/10 text-slate-400 border-slate-500/20 hover:bg-slate-500/20"
                          : "bg-white/[0.04] text-slate-500 border-white/[0.08] hover:text-slate-300 hover:border-white/[0.12]"
                      }`}
                    >
                      {editingId === profile.id ? "Batal" : "Edit Cookie"}
                    </button>

                    {/* Set active */}
                    {activeProfile?.id !== profile.id && (
                      <button
                        onClick={() => handleSetActive(profile.id)}
                        disabled={isItemLoading(profile.id)}
                        className="px-3 py-1.5 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/20 rounded-lg text-[10px] font-bold transition-all disabled:opacity-40 flex items-center gap-1.5"
                      >
                        {isItemLoading(profile.id) && (
                          <svg
                            className="animate-spin w-2.5 h-2.5"
                            fill="none"
                            viewBox="0 0 24 24"
                          >
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                            />
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                            />
                          </svg>
                        )}
                        {t("profileManagement.setActive")}
                      </button>
                    )}

                    {/* Delete */}
                    <button
                      onClick={() =>
                        setConfirmModal({
                          open: true,
                          type: "delete",
                          payload: profile.id,
                        })
                      }
                      disabled={isItemLoading(profile.id)}
                      className={`px-3 py-1.5 border rounded-lg text-[10px] font-bold transition-all disabled:opacity-40 ${
                        activeProfile?.id === profile.id
                          ? "bg-red-600/15 hover:bg-red-600/25 text-red-300 border-red-500/30"
                          : "bg-red-500/10 hover:bg-red-500/20 text-red-400 border-red-500/20"
                      }`}
                    >
                      {t("common.delete")}
                    </button>
                  </div>
                </div>

                {/* Edit cookie panel — inline expand */}
                {editingId === profile.id && (
                  <div className="px-5 pb-4 bg-[#0a0f1a] border-t border-white/[0.04] flex flex-col gap-2.5">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest pt-3">
                      Perbarui Isi Cookie
                    </p>
                    <textarea
                      value={editContent}
                      onChange={(e) => handleEditCookieChange(e.target.value)}
                      rows={6}
                      className={`w-full bg-[#0c1220] border rounded-xl px-4 py-2.5 text-xs text-slate-200 font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500/40 transition-all resize-none ${
                        editContent.trim() && !isValidCookieFormat(editContent)
                          ? "border-red-500/40"
                          : "border-white/[0.08]"
                      }`}
                    />
                    <div className="flex items-center justify-between">
                      <CookieValidityBadge
                        info={editInfo}
                        content={editContent}
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleUpdateCookie(profile.id)}
                        disabled={
                          isItemLoading(`edit-${profile.id}`) ||
                          !editContent.trim()
                        }
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
                      >
                        {isItemLoading(`edit-${profile.id}`) && (
                          <svg
                            className="animate-spin w-3 h-3"
                            fill="none"
                            viewBox="0 0 24 24"
                          >
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                            />
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                            />
                          </svg>
                        )}
                        Simpan Cookie Baru
                      </button>
                      <button
                        onClick={cancelEdit}
                        className="px-4 py-2 text-slate-500 border border-white/[0.08] rounded-xl text-xs font-bold hover:text-slate-300 transition-all"
                      >
                        Batal
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
