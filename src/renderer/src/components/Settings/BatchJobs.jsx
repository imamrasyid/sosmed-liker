import React, { useState, useEffect } from "react";
import { PLATFORMS } from "../../utils/constants.js";
import { useAppContext } from "../../context/AppContext.jsx";
import { ConfirmModal } from "../shared/ConfirmModal.jsx";
import { useTranslation } from "react-i18next";

const STATUS_STYLE = {
  pending: "bg-slate-500/10 text-slate-400 border-slate-500/20",
  running: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  completed: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  failed: "bg-red-500/10 text-red-400 border-red-500/20",
};

export function BatchJobs() {
  const { t } = useTranslation();
  const { showToast } = useAppContext();
  const [batchJobs, setBatchJobs] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);
  const [jobUrls, setJobUrls] = useState([]);
  const [jobName, setJobName] = useState("");
  const [platform, setPlatform] = useState(PLATFORMS.INSTAGRAM);
  const [urlInput, setUrlInput] = useState("");
  const [urlList, setUrlList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modal, setModal] = useState({ open: false, type: "", payload: null });

  useEffect(() => {
    loadBatchJobs();
  }, []);

  const loadBatchJobs = async () => {
    setLoading(true);
    try {
      const r = await window.api.getBatchJobs();
      if (r.success) setBatchJobs(r.data ?? []);
    } catch {
    } finally {
      setLoading(false);
    }
  };

  const handleAddUrl = () => {
    const trimmed = urlInput.trim();
    if (!trimmed) return;
    // Support multi-line paste
    const lines = trimmed
      .split(/\n/)
      .map((l) => l.trim())
      .filter(Boolean);
    setUrlList((prev) => [...prev, ...lines]);
    setUrlInput("");
  };

  const handleCreate = async () => {
    if (!jobName.trim()) {
      showToast(t("batchJobs.alertNameRequired"), "error");
      return;
    }
    if (urlList.length === 0) {
      showToast(t("batchJobs.alertUrlRequired"), "error");
      return;
    }
    setLoading(true);
    try {
      const r = await window.api.createBatchJob(jobName, platform, urlList);
      if (r.success) {
        setJobName("");
        setUrlList([]);
        await loadBatchJobs();
        showToast(t("batchJobs.alertCreateSuccess"), "success");
      } else {
        showToast(r.error ?? t("batchJobs.alertCreateFailed"), "error");
      }
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleStart = async (id) => {
    setLoading(true);
    try {
      const r = await window.api.startBatchJob(id);
      if (r.success) {
        await loadBatchJobs();
        showToast(t("batchJobs.alertStartSuccess"), "success");
      } else {
        showToast(r.error ?? t("batchJobs.alertStartFailed"), "error");
      }
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setLoading(false);
      setModal({ open: false, type: "", payload: null });
    }
  };

  const handleDelete = async (id) => {
    setLoading(true);
    try {
      const r = await window.api.deleteBatchJob(id);
      if (r.success) {
        if (selectedJob?.id === id) {
          setSelectedJob(null);
          setJobUrls([]);
        }
        await loadBatchJobs();
        showToast("Batch job dihapus", "success");
      } else {
        showToast(r.error ?? t("batchJobs.alertDeleteFailed"), "error");
      }
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setLoading(false);
      setModal({ open: false, type: "", payload: null });
    }
  };

  const handleSelectJob = async (job) => {
    if (selectedJob?.id === job.id) {
      setSelectedJob(null);
      setJobUrls([]);
      return;
    }
    setSelectedJob(job);
    try {
      const r = await window.api.getBatchUrls(job.id);
      if (r.success) setJobUrls(r.data ?? []);
    } catch {}
  };

  return (
    <div className="flex flex-col gap-5">
      <ConfirmModal
        open={modal.open && modal.type === "start"}
        title="Mulai Batch Job?"
        message="Semua URL akan diproses secara berurutan. Proses tidak bisa dihentikan di tengah jalan."
        confirmLabel="Ya, Mulai"
        variant="info"
        onConfirm={() => handleStart(modal.payload)}
        onCancel={() => setModal({ open: false, type: "", payload: null })}
      />
      <ConfirmModal
        open={modal.open && modal.type === "delete"}
        title="Hapus Batch Job?"
        message="Batch job dan semua URL di dalamnya akan dihapus permanen."
        confirmLabel="Ya, Hapus"
        onConfirm={() => handleDelete(modal.payload)}
        onCancel={() => setModal({ open: false, type: "", payload: null })}
      />

      {/* Create form */}
      <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-5 flex flex-col gap-3">
        <p className="text-xs font-black text-slate-400 uppercase tracking-widest">
          {t("batchJobs.createNew")}
        </p>
        <div className="grid grid-cols-2 gap-3">
          <input
            type="text"
            value={jobName}
            onChange={(e) => setJobName(e.target.value)}
            placeholder={t("batchJobs.jobNamePlaceholder")}
            className="bg-[#0c1220] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-slate-200 placeholder-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
          />
          <select
            value={platform}
            onChange={(e) => setPlatform(e.target.value)}
            className="bg-[#0c1220] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
          >
            <option value={PLATFORMS.INSTAGRAM}>Instagram</option>
            <option value={PLATFORMS.TWITTER}>Twitter / X</option>
            <option value={PLATFORMS.THREADS}>Threads</option>
          </select>
        </div>
        <div>
          <textarea
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleAddUrl();
              }
            }}
            placeholder={t("batchJobs.urlsPlaceholder")}
            rows={4}
            className="w-full bg-[#0c1220] border border-white/[0.08] rounded-xl px-3 py-2.5 text-xs text-slate-200 placeholder-slate-700 font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500/40 resize-none"
          />
          <p className="text-[9px] text-slate-700 mt-1">
            Ketik URL lalu tekan Enter, atau paste multiple baris sekaligus →
            klik Tambah.
          </p>
        </div>

        {urlList.length > 0 && (
          <div className="bg-[#0c1220] border border-white/[0.06] rounded-xl p-3 max-h-32 overflow-y-auto">
            <p className="text-[9px] text-slate-600 uppercase tracking-wider mb-2">
              {urlList.length} URL siap diproses
            </p>
            <div className="flex flex-wrap gap-1.5">
              {urlList.map((url, i) => (
                <div
                  key={i}
                  className="flex items-center gap-1 bg-white/[0.04] border border-white/[0.06] rounded-lg px-2 py-1"
                >
                  <span className="text-[10px] text-slate-400 truncate max-w-[180px]">
                    {url}
                  </span>
                  <button
                    onClick={() =>
                      setUrlList((p) => p.filter((_, j) => j !== i))
                    }
                    className="text-slate-600 hover:text-red-400 text-xs leading-none ml-0.5"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-2">
          <button
            onClick={handleAddUrl}
            className="px-4 py-2 bg-white/[0.04] hover:bg-white/[0.07] text-slate-300 border border-white/[0.08] rounded-xl text-xs font-bold transition-all"
          >
            Tambah URL
          </button>
          <button
            onClick={handleCreate}
            disabled={loading || !jobName.trim() || urlList.length === 0}
            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white rounded-xl text-xs font-bold transition-all"
          >
            {loading ? "Membuat..." : t("batchJobs.createJob")}
          </button>
        </div>
      </div>

      {/* Jobs list */}
      <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl overflow-hidden">
        <div className="px-5 py-3 border-b border-white/[0.06] flex items-center justify-between">
          <p className="text-xs font-black text-slate-400 uppercase tracking-widest">
            {t("batchJobs.jobsList")}
          </p>
          <span className="text-[10px] text-slate-600">
            {batchJobs.length} job
          </span>
        </div>
        {batchJobs.length === 0 ? (
          <div className="p-8 text-center text-slate-700 text-xs">
            {t("batchJobs.noJobs")}
          </div>
        ) : (
          <div className="divide-y divide-white/[0.04]">
            {batchJobs.map((job) => (
              <div key={job.id}>
                <div
                  onClick={() => handleSelectJob(job)}
                  className="px-5 py-3.5 flex items-center gap-3 hover:bg-white/[0.02] transition-colors cursor-pointer"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-semibold text-slate-200">
                        {job.name}
                      </p>
                      <span
                        className={`px-2 py-0.5 border rounded-full text-[9px] font-black uppercase ${STATUS_STYLE[job.status] ?? STATUS_STYLE.pending}`}
                      >
                        {job.status}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-600">
                      {job.platform} • {job.processed_urls}/{job.total_urls} URL
                      • ✓ {job.successful_urls} ✕ {job.failed_urls}
                    </p>
                    {job.total_urls > 0 && (
                      <div className="mt-1.5 w-full bg-white/[0.05] rounded-full h-1">
                        <div
                          className="bg-indigo-500 h-1 rounded-full transition-all"
                          style={{
                            width: `${Math.round((job.processed_urls / job.total_urls) * 100)}%`,
                          }}
                        />
                      </div>
                    )}
                  </div>
                  <div
                    className="flex gap-1.5 shrink-0"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {job.status === "pending" && (
                      <button
                        onClick={() =>
                          setModal({
                            open: true,
                            type: "start",
                            payload: job.id,
                          })
                        }
                        className="px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 rounded-lg text-[10px] font-bold transition-all"
                      >
                        Mulai
                      </button>
                    )}
                    <button
                      onClick={() =>
                        setModal({
                          open: true,
                          type: "delete",
                          payload: job.id,
                        })
                      }
                      className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-lg text-[10px] font-bold transition-all"
                    >
                      Hapus
                    </button>
                  </div>
                </div>

                {/* URL detail expand */}
                {selectedJob?.id === job.id && (
                  <div className="bg-[#0a0f1a] border-t border-white/[0.04] max-h-52 overflow-y-auto">
                    {jobUrls.length === 0 ? (
                      <p className="p-4 text-center text-xs text-slate-700">
                        Tidak ada URL
                      </p>
                    ) : (
                      jobUrls.map((u) => (
                        <div
                          key={u.id}
                          className="px-5 py-2 flex items-center gap-3 border-b border-white/[0.03] last:border-0"
                        >
                          <p className="flex-1 text-[11px] text-slate-400 truncate">
                            {u.url}
                          </p>
                          <span
                            className={`px-2 py-0.5 border rounded-full text-[9px] font-black uppercase shrink-0 ${STATUS_STYLE[u.status] ?? STATUS_STYLE.pending}`}
                          >
                            {u.status}
                          </span>
                          {u.error_message && (
                            <p className="text-[10px] text-red-400 truncate max-w-[120px]">
                              {u.error_message}
                            </p>
                          )}
                        </div>
                      ))
                    )}
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
