import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";

export function ProxyManagement() {
  const { t } = useTranslation();
  const [proxies, setProxies] = useState([]);
  const [activeProxy, setActiveProxy] = useState(null);
  const [proxyType, setProxyType] = useState("http");
  const [host, setHost] = useState("");
  const [port, setPort] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadProxies();
  }, []);

  const loadProxies = async () => {
    setLoading(true);
    try {
      const [proxiesResult, activeResult] = await Promise.all([
        window.api.getProxies(),
        window.api.getActiveProxy(),
      ]);

      if (proxiesResult.success) {
        setProxies(proxiesResult.data || []);
      }
      if (activeResult.success) {
        setActiveProxy(activeResult.data);
      }
    } catch (err) {
      console.error("Failed to load proxies:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddProxy = async () => {
    if (!host.trim()) {
      alert(t("proxyManagement.alertHostRequired"));
      return;
    }
    if (!port.trim()) {
      alert(t("proxyManagement.alertPortRequired"));
      return;
    }

    setLoading(true);
    try {
      const result = await window.api.saveProxy(
        proxyType,
        host,
        port,
        username || null,
        password || null,
      );
      if (result.success) {
        setHost("");
        setPort("");
        setUsername("");
        setPassword("");
        loadProxies();
        alert(t("proxyManagement.alertAddSuccess"));
      } else {
        alert(result.error || t("proxyManagement.alertAddFailed"));
      }
    } catch (err) {
      alert(t("proxyManagement.alertAddFailed") + ": " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSetActive = async (proxyId) => {
    setLoading(true);
    try {
      const result = await window.api.setActiveProxy(proxyId);
      if (result.success) {
        loadProxies();
      } else {
        alert(result.error || t("proxyManagement.alertSetActiveFailed"));
      }
    } catch (err) {
      alert(t("proxyManagement.alertSetActiveFailed") + ": " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (proxyId) => {
    if (!confirm(t("proxyManagement.alertDeleteConfirm"))) return;

    setLoading(true);
    try {
      const result = await window.api.deleteProxy(proxyId);
      if (result.success) {
        loadProxies();
      } else {
        alert(result.error || t("proxyManagement.alertDeleteFailed"));
      }
    } catch (err) {
      alert(t("proxyManagement.alertDeleteFailed") + ": " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h3 className="text-xl font-bold text-white mb-2">
          {t("proxyManagement.title")}
        </h3>
        <p className="text-slate-400 text-sm">
          {t("proxyManagement.description")}
        </p>
      </div>

      {/* Info */}
      <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <span className="text-lg">ℹ️</span>
          <div>
            <p className="text-sm font-bold text-blue-300">
              {t("proxyManagement.info")}
            </p>
            <ul className="text-xs text-blue-400/90 mt-1 space-y-1">
              <li>• {t("proxyManagement.info1")}</li>
              <li>• {t("proxyManagement.info2")}</li>
              <li>• {t("proxyManagement.info3")}</li>
              <li>• {t("proxyManagement.info4")}</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Active Proxy Indicator */}
      {activeProxy ? (
        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
            <div>
              <p className="text-sm font-bold text-emerald-300">
                {t("proxyManagement.activeProxy", {
                  type: activeProxy.proxy_type.toUpperCase(),
                  host: activeProxy.host,
                  port: activeProxy.port,
                })}
              </p>
              <p className="text-xs text-emerald-400/90">
                {t("proxyManagement.allConnectionsThroughProxy")}
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
                {t("proxyManagement.noActiveProxy")}
              </p>
              <p className="text-xs text-slate-400">
                {t("proxyManagement.directConnection")}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Add Proxy Form */}
      <div className="bg-slate-900/40 backdrop-blur-md rounded-2xl border border-slate-800/80 p-5">
        <h4 className="text-sm font-bold text-slate-200 mb-4">
          {t("proxyManagement.addNewProxy")}
        </h4>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-slate-400 mb-2">
              {t("proxyManagement.proxyType")}
            </label>
            <select
              value={proxyType}
              onChange={(e) => setProxyType(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500"
            >
              <option value="http">{t("proxyManagement.http")}</option>
              <option value="socks5">{t("proxyManagement.socks5")}</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-400 mb-2">
              {t("proxyManagement.host")}
            </label>
            <input
              type="text"
              value={host}
              onChange={(e) => setHost(e.target.value)}
              placeholder={t("proxyManagement.hostPlaceholder")}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 placeholder-slate-600"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-400 mb-2">
              {t("proxyManagement.port")}
            </label>
            <input
              type="text"
              value={port}
              onChange={(e) => setPort(e.target.value)}
              placeholder={t("proxyManagement.portPlaceholder")}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 placeholder-slate-600"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-400 mb-2">
              {t("proxyManagement.username")}
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder={t("proxyManagement.usernamePlaceholder")}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 placeholder-slate-600"
            />
          </div>
          <div className="col-span-2">
            <label className="block text-xs font-bold text-slate-400 mb-2">
              {t("proxyManagement.password")}
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t("proxyManagement.passwordPlaceholder")}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 placeholder-slate-600"
            />
          </div>
        </div>
        <button
          onClick={handleAddProxy}
          disabled={loading}
          className="mt-4 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:hover:bg-indigo-600 text-white rounded-xl text-sm font-bold transition-all"
        >
          {loading
            ? t("proxyManagement.adding")
            : t("proxyManagement.addProxy")}
        </button>
      </div>

      {/* Proxies List */}
      <div className="bg-slate-900/40 backdrop-blur-md rounded-2xl border border-slate-800/80 overflow-hidden">
        <div className="p-4 border-b border-slate-800/50">
          <h4 className="text-sm font-bold text-slate-200">
            {t("proxyManagement.proxyList")}
            <span className="ml-2 text-xs text-slate-400">
              ({proxies.length} {t("proxyManagement.proxyCount")})
            </span>
          </h4>
        </div>

        {loading ? (
          <div className="p-8 text-center text-slate-400">
            {t("proxyManagement.loading")}
          </div>
        ) : proxies.length === 0 ? (
          <div className="p-8 text-center text-slate-500">
            {t("proxyManagement.noProxies")}
          </div>
        ) : (
          <div className="divide-y divide-slate-800/40">
            {proxies.map((proxy) => (
              <div
                key={proxy.id}
                className="p-4 flex items-center justify-between hover:bg-slate-900/20 transition-all"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-slate-200">
                      {proxy.proxy_type.toUpperCase()}://{proxy.host}:
                      {proxy.port}
                    </p>
                    {activeProxy?.id === proxy.id && (
                      <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full text-[10px] font-bold uppercase">
                        {t("proxyManagement.active")}
                      </span>
                    )}
                  </div>
                  {proxy.username && (
                    <p className="text-xs text-slate-500 mt-1">
                      {t("proxyManagement.usernameLabel")}: {proxy.username}
                    </p>
                  )}
                  <p className="text-xs text-slate-500 mt-1">
                    {t("proxyManagement.added")}:{" "}
                    {new Date(proxy.created_at).toLocaleDateString("id-ID")}
                  </p>
                </div>
                <div className="flex gap-2 ml-4">
                  {activeProxy?.id !== proxy.id && (
                    <button
                      onClick={() => handleSetActive(proxy.id)}
                      className="px-3 py-1.5 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 rounded-lg text-xs font-bold border border-indigo-500/20 transition-all"
                    >
                      {t("proxyManagement.setActive")}
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(proxy.id)}
                    className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg text-xs font-bold border border-red-500/20 transition-all"
                  >
                    {t("proxyManagement.delete")}
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
