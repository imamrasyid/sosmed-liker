import React, { useState, useEffect } from "react";
import { PLATFORMS } from "../../utils/constants.js";
import { useTranslation } from "react-i18next";

export function BatchJobs() {
  const { t } = useTranslation();
  const [batchJobs, setBatchJobs] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);
  const [jobUrls, setJobUrls] = useState([]);
  const [jobName, setJobName] = useState("");
  const [platform, setPlatform] = useState(PLATFORMS.INSTAGRAM);
  const [urlInput, setUrlInput] = useState("");
  const [urlList, setUrlList] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadBatchJobs();
  }, []);

  const loadBatchJobs = async () => {
    setLoading(true);
    try {
      const result = await window.api.getBatchJobs();
      if (result.success) {
        setBatchJobs(result.data || []);
      }
    } catch (err) {
      console.error("Failed to load batch jobs:", err);
    } finally {
      setLoading(false);
    }
  };

  const loadJobUrls = async (batchId) => {
    setLoading(true);
    try {
      const result = await window.api.getBatchUrls(batchId);
      if (result.success) {
        setJobUrls(result.data || []);
      }
    } catch (err) {
      console.error("Failed to load job URLs:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddUrl = () => {
    if (!urlInput.trim()) return;
    setUrlList([...urlList, urlInput.trim()]);
    setUrlInput("");
  };

  const handleRemoveUrl = (index) => {
    setUrlList(urlList.filter((_, i) => i !== index));
  };

  const handleCreateJob = async () => {
    if (!jobName.trim()) {
      alert(t("batchJobs.alertNameRequired"));
      return;
    }
    if (urlList.length === 0) {
      alert(t("batchJobs.alertUrlRequired"));
      return;
    }

    setLoading(true);
    try {
      const result = await window.api.createBatchJob(
        jobName,
        platform,
        urlList,
      );
      if (result.success) {
        setJobName("");
        setUrlList([]);
        loadBatchJobs();
        alert(t("batchJobs.alertCreateSuccess"));
      } else {
        alert(result.error || t("batchJobs.alertCreateFailed"));
      }
    } catch (err) {
      alert(t("batchJobs.alertCreateFailed") + ": " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleStartJob = async (batchId) => {
    if (!confirm(t("batchJobs.alertStartConfirm"))) return;

    setLoading(true);
    try {
      const result = await window.api.startBatchJob(batchId);
      if (result.success) {
        alert(t("batchJobs.alertStartSuccess"));
        loadBatchJobs();
      } else {
        alert(result.error || t("batchJobs.alertStartFailed"));
      }
    } catch (err) {
      alert(t("batchJobs.alertStartFailed") + ": " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteJob = async (batchId) => {
    if (!confirm(t("batchJobs.alertDeleteConfirm"))) return;

    setLoading(true);
    try {
      const result = await window.api.deleteBatchJob(batchId);
      if (result.success) {
        if (selectedJob?.id === batchId) {
          setSelectedJob(null);
          setJobUrls([]);
        }
        loadBatchJobs();
      } else {
        alert(result.error || t("batchJobs.alertDeleteFailed"));
      }
    } catch (err) {
      alert(t("batchJobs.alertDeleteFailed") + ": " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectJob = async (job) => {
    setSelectedJob(job);
    await loadJobUrls(job.id);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "pending":
        return "text-slate-400";
      case "running":
        return "text-blue-400";
      case "completed":
        return "text-emerald-400";
      case "failed":
        return "text-red-400";
      default:
        return "text-slate-400";
    }
  };

  const getUrlStatusColor = (status) => {
    switch (status) {
      case "pending":
        return "bg-slate-500/10 text-slate-400 border-slate-500/20";
      case "completed":
        return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
      case "failed":
        return "bg-red-500/10 text-red-400 border-red-500/20";
      default:
        return "bg-slate-500/10 text-slate-400 border-slate-500/20";
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h3 className="text-xl font-bold text-white mb-2">
          {t("batchJobs.title")}
        </h3>
        <p className="text-slate-400 text-sm">{t("batchJobs.description")}</p>
      </div>

      {/* Info */}
      <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <span className="text-lg">ℹ️</span>
          <div>
            <p className="text-sm font-bold text-blue-300">
              {t("batchJobs.info")}
            </p>
            <ul className="text-xs text-blue-400/90 mt-1 space-y-1">
              <li>• {t("batchJobs.info1")}</li>
              <li>• {t("batchJobs.info2")}</li>
              <li>• {t("batchJobs.info3")}</li>
              <li>• {t("batchJobs.info4")}</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Create Batch Job Form */}
      <div className="bg-slate-900/40 backdrop-blur-md rounded-2xl border border-slate-800/80 p-5">
        <h4 className="text-sm font-bold text-slate-200 mb-4">
          {t("batchJobs.createNew")}
        </h4>
        <div className="flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-2">
                {t("batchJobs.jobName")}
              </label>
              <input
                type="text"
                value={jobName}
                onChange={(e) => setJobName(e.target.value)}
                placeholder={t("batchJobs.jobNamePlaceholder")}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 placeholder-slate-600"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-2">
                {t("batchJobs.platform")}
              </label>
              <select
                value={platform}
                onChange={(e) => setPlatform(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500"
              >
                <option value={PLATFORMS.INSTAGRAM}>
                  {t("batchJobs.instagram")}
                </option>
                <option value={PLATFORMS.TWITTER}>
                  {t("batchJobs.twitterX")}
                </option>
                <option value={PLATFORMS.THREADS}>
                  {t("batchJobs.threads")}
                </option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-400 mb-2">
              {t("batchJobs.urls")}
            </label>
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
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 h-32 resize-none font-mono placeholder-slate-600"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleAddUrl}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition-all"
            >
              {t("batchJobs.addUrl")}
            </button>
            <button
              onClick={handleCreateJob}
              disabled={loading}
              className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:hover:bg-indigo-600 text-white rounded-xl text-sm font-bold transition-all"
            >
              {loading ? t("batchJobs.creating") : t("batchJobs.createJob")}
            </button>
          </div>
          {urlList.length > 0 && (
            <div className="bg-slate-950 rounded-xl p-3">
              <p className="text-xs font-bold text-slate-400 mb-2">
                {t("batchJobs.urlsToProcess", { count: urlList.length })}
              </p>
              <div className="flex flex-wrap gap-2">
                {urlList.map((url, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 bg-slate-900 px-3 py-1.5 rounded-lg"
                  >
                    <span className="text-xs text-slate-300 truncate max-w-[200px]">
                      {url}
                    </span>
                    <button
                      onClick={() => handleRemoveUrl(index)}
                      className="text-red-400 hover:text-red-300 text-xs font-bold"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Batch Jobs List */}
      <div className="bg-slate-900/40 backdrop-blur-md rounded-2xl border border-slate-800/80 overflow-hidden">
        <div className="p-4 border-b border-slate-800/50">
          <h4 className="text-sm font-bold text-slate-200">
            {t("batchJobs.jobsList")}
            <span className="ml-2 text-xs text-slate-400">
              ({batchJobs.length} {t("batchJobs.jobCount")})
            </span>
          </h4>
        </div>

        {loading ? (
          <div className="p-8 text-center text-slate-400">
            {t("batchJobs.loading")}
          </div>
        ) : batchJobs.length === 0 ? (
          <div className="p-8 text-center text-slate-500">
            {t("batchJobs.noJobs")}
          </div>
        ) : (
          <div className="divide-y divide-slate-800/40">
            {batchJobs.map((job) => (
              <div
                key={job.id}
                className="p-4 hover:bg-slate-900/20 transition-all cursor-pointer"
                onClick={() => handleSelectJob(job)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-slate-200">
                        {job.name}
                      </p>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${getStatusColor(job.status)} border-current/20`}
                      >
                        {t(
                          "batchJobs.status" +
                            job.status.charAt(0).toUpperCase() +
                            job.status.slice(1),
                        )}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      {job.platform} • {job.total_urls} URLs •{" "}
                      {job.processed_urls}/{job.total_urls}{" "}
                      {t("batchJobs.processed")}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      {t("batchJobs.successful")}: {job.successful_urls} |{" "}
                      {t("batchJobs.failed")}: {job.failed_urls}
                    </p>
                  </div>
                  <div
                    className="flex gap-2 ml-4"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {job.status === "pending" && (
                      <button
                        onClick={() => handleStartJob(job.id)}
                        className="px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 rounded-lg text-xs font-bold border border-emerald-500/20 transition-all"
                      >
                        {t("batchJobs.start")}
                      </button>
                    )}
                    <button
                      onClick={() => handleDeleteJob(job.id)}
                      className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg text-xs font-bold border border-red-500/20 transition-all"
                    >
                      {t("batchJobs.delete")}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Selected Job Details */}
      {selectedJob && (
        <div className="bg-slate-900/40 backdrop-blur-md rounded-2xl border border-slate-800/80 overflow-hidden">
          <div className="p-4 border-b border-slate-800/50 flex items-center justify-between">
            <h4 className="text-sm font-bold text-slate-200">
              {t("batchJobs.detail", { name: selectedJob.name })}
            </h4>
            <button
              onClick={() => {
                setSelectedJob(null);
                setJobUrls([]);
              }}
              className="text-xs text-slate-400 hover:text-slate-300"
            >
              {t("batchJobs.close")}
            </button>
          </div>

          {loading ? (
            <div className="p-8 text-center text-slate-400">
              {t("batchJobs.loading")}
            </div>
          ) : jobUrls.length === 0 ? (
            <div className="p-8 text-center text-slate-500">
              {t("batchJobs.noUrls")}
            </div>
          ) : (
            <div className="divide-y divide-slate-800/40 max-h-96 overflow-y-auto">
              {jobUrls.map((url) => (
                <div
                  key={url.id}
                  className="p-3 flex items-center justify-between"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-slate-300 truncate">{url.url}</p>
                    {url.error_message && (
                      <p className="text-xs text-red-400 mt-1">
                        {url.error_message}
                      </p>
                    )}
                  </div>
                  <span
                    className={`ml-4 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${getUrlStatusColor(url.status)}`}
                  >
                    {t(
                      "batchJobs.status" +
                        url.status.charAt(0).toUpperCase() +
                        url.status.slice(1),
                    )}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
