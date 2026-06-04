import React, { useState, useEffect } from "react";
import { useAppContext } from "../../context/AppContext.jsx";
import { ConfirmModal } from "../shared/ConfirmModal.jsx";
import { useTranslation } from "react-i18next";

export function ProxyManagement() {
  const { t } = useTranslation();
  const { showToast } = useAppContext();
  const [proxies, setProxies] = useState([]);
  const [activeProxy, setActiveProxy] = useState(null);
  const [proxyType, setProxyType] = useState("http");
  const [host, setHost] = useState("");
  const [port, setPort] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [deleteModal, setDeleteModal] = useState({ open: false, id: null });

  useEffect(() => {
    loadProxies();
  }, []);

  const loadProxies = async () => {
    setLoading(true);
    try {
      const [pRes, aRes] = await Promise.all([
        window.api.proxies.getAll(),
        window.api.proxies.getActive(),
      ]);
      if (pRes.success) setProxies(pRes.data ?? []);
      if (aRes.success) setActiveProxy(aRes.data);
    } catch {
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async () => {
    if (!host.trim()) {
      showToast(t("proxyManagement.alertHostRequired"), "error");
      return;
    }
    if (!port.trim()) {
      showToast(t("proxyManagement.alertPortRequired"), "error");
      return;
    }
    setLoading(true);
    try {
      const r = await window.api.proxies.save(
        proxyType,
        host,
        port,
        username || null,
        password || null,
      );
      if (r.success) {
        setHost("");
        setPort("");
        setUsername("");
        setPassword("");
        await loadProxies();
        showToast(t("proxyManagement.alertAddSuccess"), "success");
      } else {
        showToast(r.error ?? t("proxyManagement.alertAddFailed"), "error");
      }
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleSetActive = async (id) => {
    setLoading(true);
    try {
      const r = await window.api.proxies.setActive(id);
      if (r.success) {
        await loadProxies();
        showToast("Proxy diaktifkan", "success");
      } else {
        showToast(
          r.error ?? t("proxyManagement.alertSetActiveFailed"),
          "error",
        );
      }
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    setLoading(true);
    try {
      const r = await window.api.proxies.delete(id);
      if (r.success) {
        await loadProxies();
        showToast("Proxy dihapus", "success");
      } else {
        showToast(r.error ?? t("proxyManagement.alertDeleteFailed"), "error");
      }
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setLoading(false);
      setDeleteModal({ open: false, id: null });
    }
  };

  return (
    <div className="flex flex-col gap-5">
      <ConfirmModal
        open={deleteModal.open}
        title="Hapus Proxy?"
        message="Proxy ini akan dihapus permanen."
        confirmLabel="Ya, Hapus"
        onConfirm={() => handleDelete(deleteModal.id)}
        onCancel={() => setDeleteModal({ open: false, id: null })}
      />

      {/* Active proxy status */}
      <div
        className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${activeProxy ? "bg-emerald-500/8 border-emerald-500/20" : "bg-white/[0.02] border-white/[0.06]"}`}
      >
        <span
          className={`w-2 h-2 rounded-full shrink-0 ${activeProxy ? "bg-emerald-500" : "bg-slate-700"}`}
        />
        <div>
          <p
            className={`text-xs font-bold ${activeProxy ? "text-emerald-300" : "text-slate-500"}`}
          >
            {activeProxy
              ? `Proxy Aktif: ${activeProxy.proxy_type.toUpperCase()}://${activeProxy.host}:${activeProxy.port}`
              : t("proxyManagement.noActiveProxy")}
          </p>
          <p className="text-[10px] text-slate-600">
            {activeProxy
              ? t("proxyManagement.allConnectionsThroughProxy")
              : t("proxyManagement.directConnection")}
          </p>
        </div>
      </div>

      {/* Add form */}
      <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-5 flex flex-col gap-3">
        <p className="text-xs font-black text-slate-400 uppercase tracking-widest">
          {t("proxyManagement.addNewProxy")}
        </p>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[10px] font-bold text-slate-600 mb-1.5 uppercase tracking-wider">
              {t("proxyManagement.proxyType")}
            </label>
            <select
              value={proxyType}
              onChange={(e) => setProxyType(e.target.value)}
              className="w-full bg-[#0c1220] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
            >
              <option value="http">HTTP</option>
              <option value="socks5">SOCKS5</option>
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-600 mb-1.5 uppercase tracking-wider">
              {t("proxyManagement.host")}
            </label>
            <input
              type="text"
              value={host}
              onChange={(e) => setHost(e.target.value)}
              placeholder={t("proxyManagement.hostPlaceholder")}
              className="w-full bg-[#0c1220] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-slate-200 placeholder-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-600 mb-1.5 uppercase tracking-wider">
              {t("proxyManagement.port")}
            </label>
            <input
              type="text"
              value={port}
              onChange={(e) => setPort(e.target.value)}
              placeholder={t("proxyManagement.portPlaceholder")}
              className="w-full bg-[#0c1220] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-slate-200 placeholder-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-600 mb-1.5 uppercase tracking-wider">
              {t("proxyManagement.username")}
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder={t("proxyManagement.usernamePlaceholder")}
              className="w-full bg-[#0c1220] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-slate-200 placeholder-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
            />
          </div>
          <div className="col-span-2">
            <label className="block text-[10px] font-bold text-slate-600 mb-1.5 uppercase tracking-wider">
              {t("proxyManagement.password")}
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t("proxyManagement.passwordPlaceholder")}
              className="w-full bg-[#0c1220] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-slate-200 placeholder-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
            />
          </div>
        </div>
        <button
          onClick={handleAdd}
          disabled={loading}
          className="self-start px-5 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white rounded-xl text-xs font-bold transition-all"
        >
          {loading
            ? t("proxyManagement.adding")
            : t("proxyManagement.addProxy")}
        </button>
      </div>

      {/* Proxy list */}
      <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl overflow-hidden">
        <div className="px-5 py-3 border-b border-white/[0.06]">
          <p className="text-xs font-black text-slate-400 uppercase tracking-widest">
            {t("proxyManagement.proxyList")} ({proxies.length})
          </p>
        </div>
        {loading ? (
          <div className="p-8 text-center text-slate-600 text-xs">
            Memuat...
          </div>
        ) : proxies.length === 0 ? (
          <div className="p-8 text-center text-slate-700 text-xs">
            {t("proxyManagement.noProxies")}
          </div>
        ) : (
          <div className="divide-y divide-white/[0.04]">
            {proxies.map((proxy) => (
              <div
                key={proxy.id}
                className="px-5 py-3.5 flex items-center gap-3 hover:bg-white/[0.02] transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-slate-200 font-mono">
                      {proxy.proxy_type.toUpperCase()}://{proxy.host}:
                      {proxy.port}
                    </p>
                    {activeProxy?.id === proxy.id && (
                      <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full text-[9px] font-black uppercase">
                        Aktif
                      </span>
                    )}
                  </div>
                  {proxy.username && (
                    <p className="text-[10px] text-slate-600">
                      User: {proxy.username}
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  {activeProxy?.id !== proxy.id && (
                    <button
                      onClick={() => handleSetActive(proxy.id)}
                      className="px-3 py-1.5 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/20 rounded-lg text-[10px] font-bold transition-all"
                    >
                      Set Aktif
                    </button>
                  )}
                  <button
                    onClick={() => setDeleteModal({ open: true, id: proxy.id })}
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
