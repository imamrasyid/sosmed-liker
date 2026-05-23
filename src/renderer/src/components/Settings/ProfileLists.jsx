import React, { useState, useEffect } from "react";
import { PLATFORMS } from "../../utils/constants.js";
import { useTranslation } from "react-i18next";

export function ProfileLists() {
  const { t } = useTranslation();
  const [listType, setListType] = useState("blacklist");
  const [platform, setPlatform] = useState(PLATFORMS.INSTAGRAM);
  const [profileUrl, setProfileUrl] = useState("");
  const [profileName, setProfileName] = useState("");
  const [lists, setLists] = useState([]);
  const [whitelistEnabled, setWhitelistEnabled] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadLists();
  }, [listType, platform]);

  const loadLists = async () => {
    setLoading(true);
    try {
      const result =
        listType === "blacklist"
          ? await window.api.getBlacklist(platform)
          : await window.api.getWhitelist(platform);
      if (result.success) {
        setLists(result.data || []);
      }
    } catch (err) {
      console.error("Failed to load lists:", err);
    } finally {
      setLoading(false);
    }
  };

  const checkWhitelistStatus = async () => {
    try {
      const result = await window.api.hasWhitelistEnabled(platform);
      if (result.success) {
        setWhitelistEnabled(result.enabled);
      }
    } catch (err) {
      console.error("Failed to check whitelist status:", err);
    }
  };

  useEffect(() => {
    checkWhitelistStatus();
  }, [platform]);

  const handleAdd = async () => {
    if (!profileUrl.trim()) {
      alert(t("profileLists.alertUrlRequired"));
      return;
    }

    setLoading(true);
    try {
      const result =
        listType === "blacklist"
          ? await window.api.addToBlacklist(platform, profileUrl, profileName)
          : await window.api.addToWhitelist(platform, profileUrl, profileName);

      if (result.success) {
        setProfileUrl("");
        setProfileName("");
        loadLists();
        if (listType === "whitelist") {
          checkWhitelistStatus();
        }
      } else {
        alert(result.error || t("profileLists.alertAddFailed"));
      }
    } catch (err) {
      alert(t("profileLists.alertAddFailed") + ": " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (item) => {
    if (
      !confirm(
        t("profileLists.alertDeleteConfirm", {
          url: item.profile_url,
          listType,
        }),
      )
    )
      return;

    setLoading(true);
    try {
      const result = await window.api.removeFromList(
        listType,
        platform,
        item.profile_url,
      );
      if (result.success) {
        loadLists();
        if (listType === "whitelist") {
          checkWhitelistStatus();
        }
      } else {
        alert(result.error || t("profileLists.alertDeleteFailed"));
      }
    } catch (err) {
      alert(t("profileLists.alertDeleteFailed") + ": " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const getPlatformLabel = (p) => {
    switch (p) {
      case PLATFORMS.INSTAGRAM:
        return t("profileLists.instagram");
      case PLATFORMS.TWITTER:
        return t("profileLists.twitterX");
      case PLATFORMS.THREADS:
        return t("profileLists.threads");
      default:
        return p;
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h3 className="text-xl font-bold text-white mb-2">
          {t("profileLists.title")}
        </h3>
        <p className="text-slate-400 text-sm">
          {t("profileLists.description")}
        </p>
      </div>

      {/* Info */}
      <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <span className="text-lg">ℹ️</span>
          <div>
            <p className="text-sm font-bold text-blue-300">
              {t("profileLists.info")}
            </p>
            <ul className="text-xs text-blue-400/90 mt-1 space-y-1">
              <li>• {t("profileLists.infoBlacklist")}</li>
              <li>• {t("profileLists.infoWhitelist")}</li>
              <li>• {t("profileLists.infoPriority")}</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex gap-4 items-end">
        <div className="flex-1">
          <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">
            {t("profileLists.listType")}
          </label>
          <select
            value={listType}
            onChange={(e) => setListType(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500"
          >
            <option value="blacklist">{t("profileLists.blacklist")}</option>
            <option value="whitelist">{t("profileLists.whitelist")}</option>
          </select>
        </div>

        <div className="flex-1">
          <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">
            {t("profileLists.platform")}
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

      {/* Whitelist Status Indicator */}
      {listType === "whitelist" && (
        <div
          className={`p-4 rounded-xl border ${whitelistEnabled ? "bg-emerald-500/10 border-emerald-500/20" : "bg-slate-900/40 border-slate-800"}`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`w-3 h-3 rounded-full ${whitelistEnabled ? "bg-emerald-500" : "bg-slate-600"}`}
            ></div>
            <div>
              <p className="text-sm font-bold text-slate-200">
                {t("profileLists.whitelistMode")}:{" "}
                {whitelistEnabled
                  ? t("profileLists.whitelistActive")
                  : t("profileLists.whitelistInactive")}
              </p>
              <p className="text-xs text-slate-400">
                {whitelistEnabled
                  ? t("profileLists.whitelistActiveDesc")
                  : t("profileLists.whitelistInactiveDesc")}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Add Form */}
      <div className="bg-slate-900/40 backdrop-blur-md rounded-2xl border border-slate-800/80 p-5">
        <h4 className="text-sm font-bold text-slate-200 mb-4">
          {t("profileLists.addTo", {
            listType:
              listType === "blacklist"
                ? t("profileLists.blacklist")
                : t("profileLists.whitelist"),
          })}
        </h4>
        <div className="flex gap-3">
          <div className="flex-1">
            <input
              type="text"
              value={profileUrl}
              onChange={(e) => setProfileUrl(e.target.value)}
              placeholder={t("profileLists.profileUrlPlaceholder")}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 placeholder-slate-600"
            />
          </div>
          <div className="w-48">
            <input
              type="text"
              value={profileName}
              onChange={(e) => setProfileName(e.target.value)}
              placeholder={t("profileLists.profileName")}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 placeholder-slate-600"
            />
          </div>
          <button
            onClick={handleAdd}
            disabled={loading}
            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:hover:bg-indigo-600 text-white rounded-xl text-sm font-bold transition-all"
          >
            {loading ? t("profileLists.adding") : t("profileLists.add")}
          </button>
        </div>
      </div>

      {/* List */}
      <div className="bg-slate-900/40 backdrop-blur-md rounded-2xl border border-slate-800/80 overflow-hidden">
        <div className="p-4 border-b border-slate-800/50">
          <h4 className="text-sm font-bold text-slate-200">
            {t("profileLists.listTitle", {
              listType:
                listType === "blacklist"
                  ? t("profileLists.blacklist")
                  : t("profileLists.whitelist"),
              platform: getPlatformLabel(platform),
            })}
            <span className="ml-2 text-xs text-slate-400">
              ({lists.length} {t("profileLists.itemCount")})
            </span>
          </h4>
        </div>

        {loading ? (
          <div className="p-8 text-center text-slate-400">
            {t("profileLists.loading")}
          </div>
        ) : lists.length === 0 ? (
          <div className="p-8 text-center text-slate-500">
            {listType === "blacklist"
              ? t("profileLists.noBlacklist")
              : t("profileLists.noWhitelist")}
          </div>
        ) : (
          <div className="divide-y divide-slate-800/40">
            {lists.map((item) => (
              <div
                key={item.id}
                className="p-4 flex items-center justify-between hover:bg-slate-900/20 transition-all"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-200 truncate">
                    {item.profile_url}
                  </p>
                  {item.profile_name && (
                    <p className="text-xs text-slate-400">
                      {item.profile_name}
                    </p>
                  )}
                  <p className="text-xs text-slate-500 mt-1">
                    {t("profileLists.added")}:{" "}
                    {new Date(item.created_at).toLocaleDateString("id-ID")}
                  </p>
                </div>
                <button
                  onClick={() => handleRemove(item)}
                  className="ml-4 px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg text-xs font-bold border border-red-500/20 transition-all"
                >
                  {t("profileLists.delete")}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
