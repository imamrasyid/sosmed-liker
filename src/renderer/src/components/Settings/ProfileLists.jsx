import React, { useState, useEffect } from "react";
import { PLATFORMS } from "../../utils/constants.js";
import { useAppContext } from "../../context/AppContext.jsx";
import { ConfirmModal } from "../shared/ConfirmModal.jsx";
import { useTranslation } from "react-i18next";

export function ProfileLists() {
  const { t } = useTranslation();
  const { showToast } = useAppContext();
  const [listType, setListType] = useState("blacklist");
  const [platform, setPlatform] = useState(PLATFORMS.INSTAGRAM);
  const [profileUrl, setProfileUrl] = useState("");
  const [profileName, setProfileName] = useState("");
  const [lists, setLists] = useState([]);
  const [whitelistEnabled, setWhitelistEnabled] = useState(false);
  const [loading, setLoading] = useState(false);
  const [deleteModal, setDeleteModal] = useState({ open: false, item: null });

  useEffect(() => {
    loadLists();
  }, [listType, platform]);
  useEffect(() => {
    checkWhitelistStatus();
  }, [platform]);

  const loadLists = async () => {
    setLoading(true);
    try {
      const r =
        listType === "blacklist"
          ? await window.api.lists.getBlacklist(platform)
          : await window.api.lists.getWhitelist(platform);
      if (r.success) setLists(r.data ?? []);
    } catch {
    } finally {
      setLoading(false);
    }
  };

  const checkWhitelistStatus = async () => {
    try {
      const r = await window.api.lists.hasWhitelistEnabled(platform);
      if (r.success) setWhitelistEnabled(r.enabled);
    } catch {}
  };

  const handleAdd = async () => {
    if (!profileUrl.trim()) {
      showToast(t("profileLists.alertUrlRequired"), "error");
      return;
    }
    setLoading(true);
    try {
      const r =
        listType === "blacklist"
          ? await window.api.lists.addToBlacklist(
              platform,
              profileUrl,
              profileName || null,
            )
          : await window.api.lists.addToWhitelist(
              platform,
              profileUrl,
              profileName || null,
            );
      if (r.success) {
        setProfileUrl("");
        setProfileName("");
        await loadLists();
        if (listType === "whitelist") checkWhitelistStatus();
        showToast(t("profileLists.alertAddSuccess"), "success");
      } else {
        showToast(r.error ?? t("profileLists.alertAddFailed"), "error");
      }
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (item) => {
    setLoading(true);
    try {
      const r = await window.api.lists.removeFromList(
        listType,
        platform,
        item.profile_url,
      );
      if (r.success) {
        await loadLists();
        if (listType === "whitelist") checkWhitelistStatus();
        showToast(t("profileLists.alertDeleteSuccess"), "success");
      } else {
        showToast(r.error ?? t("profileLists.alertDeleteFailed"), "error");
      }
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setLoading(false);
      setDeleteModal({ open: false, item: null });
    }
  };

  const platformLabel = {
    [PLATFORMS.INSTAGRAM]: "Instagram",
    [PLATFORMS.TWITTER]: "Twitter / X",
    [PLATFORMS.THREADS]: "Threads",
  };

  return (
    <div className="flex flex-col gap-5">
      <ConfirmModal
        open={deleteModal.open}
        title={`Hapus dari ${listType === "blacklist" ? "Blacklist" : "Whitelist"}?`}
        message={`URL: ${deleteModal.item?.profile_url}`}
        confirmLabel="Ya, Hapus"
        onConfirm={() => handleRemove(deleteModal.item)}
        onCancel={() => setDeleteModal({ open: false, item: null })}
      />

      {/* Controls */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-1 bg-white/[0.04] border border-white/[0.06] rounded-xl p-1">
          {["blacklist", "whitelist"].map((lt) => (
            <button
              key={lt}
              onClick={() => setListType(lt)}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all capitalize ${listType === lt ? (lt === "blacklist" ? "bg-red-600 text-white" : "bg-emerald-600 text-white") : "text-slate-500 hover:text-slate-300"}`}
            >
              {lt === "blacklist" ? "Blacklist" : "Whitelist"}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1 bg-white/[0.04] border border-white/[0.06] rounded-xl p-1">
          {Object.values(PLATFORMS).map((p) => (
            <button
              key={p}
              onClick={() => setPlatform(p)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${platform === p ? "bg-indigo-600 text-white" : "text-slate-500 hover:text-slate-300"}`}
            >
              {platformLabel[p]}
            </button>
          ))}
        </div>
      </div>

      {/* Whitelist mode indicator */}
      {listType === "whitelist" && (
        <div
          className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${whitelistEnabled ? "bg-emerald-500/8 border-emerald-500/20" : "bg-white/[0.02] border-white/[0.06]"}`}
        >
          <span
            className={`w-2 h-2 rounded-full shrink-0 ${whitelistEnabled ? "bg-emerald-500" : "bg-slate-700"}`}
          />
          <div>
            <p
              className={`text-xs font-bold ${whitelistEnabled ? "text-emerald-300" : "text-slate-500"}`}
            >
              Mode Whitelist: {whitelistEnabled ? "Aktif" : "Tidak Aktif"}
            </p>
            <p className="text-[10px] text-slate-600">
              {whitelistEnabled
                ? "Hanya profil di whitelist yang akan diproses"
                : "Tambahkan profil untuk mengaktifkan mode whitelist"}
            </p>
          </div>
        </div>
      )}

      {/* Add form */}
      <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-5 flex flex-col gap-3">
        <p className="text-xs font-black text-slate-400 uppercase tracking-widest">
          Tambah ke {listType === "blacklist" ? "Blacklist" : "Whitelist"}
        </p>
        <div className="flex gap-2">
          <input
            type="text"
            value={profileUrl}
            onChange={(e) => setProfileUrl(e.target.value)}
            placeholder={t("profileLists.profileUrlPlaceholder")}
            className="flex-1 bg-[#0c1220] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-slate-200 placeholder-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
          />
          <input
            type="text"
            value={profileName}
            onChange={(e) => setProfileName(e.target.value)}
            placeholder="Nama (opsional)"
            className="w-40 bg-[#0c1220] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-slate-200 placeholder-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
          />
          <button
            onClick={handleAdd}
            disabled={loading}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white rounded-xl text-xs font-bold transition-all shrink-0"
          >
            {loading ? "..." : "Tambah"}
          </button>
        </div>
      </div>

      {/* List */}
      <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl overflow-hidden">
        <div className="px-5 py-3 border-b border-white/[0.06] flex items-center justify-between">
          <p className="text-xs font-black text-slate-400 uppercase tracking-widest">
            {listType === "blacklist" ? "Blacklist" : "Whitelist"} —{" "}
            {platformLabel[platform]}
          </p>
          <span className="text-[10px] text-slate-600">
            {lists.length} item
          </span>
        </div>
        {loading ? (
          <div className="p-8 text-center text-slate-600 text-xs">
            Memuat...
          </div>
        ) : lists.length === 0 ? (
          <div className="p-8 text-center text-slate-700 text-xs">
            {listType === "blacklist"
              ? t("profileLists.noBlacklist")
              : t("profileLists.noWhitelist")}
          </div>
        ) : (
          <div className="divide-y divide-white/[0.04]">
            {lists.map((item) => (
              <div
                key={item.id}
                className="px-5 py-3 flex items-center gap-3 hover:bg-white/[0.02] transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-slate-300 truncate">
                    {item.profile_url}
                  </p>
                  {item.profile_name && (
                    <p className="text-[10px] text-slate-600">
                      {item.profile_name}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => setDeleteModal({ open: true, item })}
                  className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-lg text-[10px] font-bold transition-all shrink-0"
                >
                  Hapus
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
