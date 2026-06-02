import React, { useState, useEffect } from "react";
import { PLATFORMS } from "../../utils/constants.js";
import { useAppContext } from "../../context/AppContext.jsx";
import { ConfirmModal } from "../shared/ConfirmModal.jsx";
import { useTranslation } from "react-i18next";

export function CommentTemplates() {
  const { t } = useTranslation();
  const { showToast } = useAppContext();
  const [platform, setPlatform] = useState(PLATFORMS.INSTAGRAM);
  const [templates, setTemplates] = useState([]);
  const [activeTemplate, setActiveTemplate] = useState(null);
  const [templateName, setTemplateName] = useState("");
  const [commentText, setCommentText] = useState("");
  const [loading, setLoading] = useState(false);
  const [deleteModal, setDeleteModal] = useState({ open: false, id: null });

  useEffect(() => {
    loadTemplates();
  }, [platform]);

  const loadTemplates = async () => {
    setLoading(true);
    try {
      const [tRes, aRes] = await Promise.all([
        window.api.getCommentTemplates(platform),
        window.api.getActiveCommentTemplate(platform),
      ]);
      if (tRes.success) setTemplates(tRes.data ?? []);
      if (aRes.success) setActiveTemplate(aRes.data);
    } catch {
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async () => {
    if (!templateName.trim()) {
      showToast(t("commentTemplates.alertNameRequired"), "error");
      return;
    }
    if (!commentText.trim()) {
      showToast(t("commentTemplates.alertTextRequired"), "error");
      return;
    }
    setLoading(true);
    try {
      const r = await window.api.saveCommentTemplate(
        platform,
        templateName,
        commentText,
      );
      if (r.success) {
        setTemplateName("");
        setCommentText("");
        await loadTemplates();
        showToast(t("commentTemplates.alertAddSuccess"), "success");
      } else {
        showToast(r.error ?? t("commentTemplates.alertAddFailed"), "error");
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
      const r = await window.api.setActiveCommentTemplate(id);
      if (r.success) {
        await loadTemplates();
        showToast("Template diaktifkan", "success");
      } else {
        showToast(
          r.error ?? t("commentTemplates.alertSetActiveFailed"),
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
      const r = await window.api.deleteCommentTemplate(id);
      if (r.success) {
        await loadTemplates();
        showToast("Template dihapus", "success");
      } else {
        showToast(r.error ?? t("commentTemplates.alertDeleteFailed"), "error");
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
        title="Hapus Template?"
        message="Template komentar ini akan dihapus permanen."
        confirmLabel="Ya, Hapus"
        onConfirm={() => handleDelete(deleteModal.id)}
        onCancel={() => setDeleteModal({ open: false, id: null })}
      />

      {/* Warning */}
      <div className="flex items-start gap-3 px-4 py-3 bg-red-500/8 border border-red-500/20 rounded-xl">
        <svg
          className="w-4 h-4 text-red-400 shrink-0 mt-0.5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
        <div>
          <p className="text-xs font-bold text-red-300">
            {t("commentTemplates.warningTitle")}
          </p>
          <ul className="text-[10px] text-red-400/70 mt-1 space-y-0.5">
            <li>• {t("commentTemplates.warning1")}</li>
            <li>• {t("commentTemplates.warning3")}</li>
            <li>• {t("commentTemplates.warning4")}</li>
          </ul>
        </div>
      </div>

      {/* Platform tabs */}
      <div className="flex items-center gap-1 bg-white/[0.04] border border-white/[0.06] rounded-xl p-1 w-fit">
        {[
          { v: PLATFORMS.INSTAGRAM, l: "Instagram" },
          { v: PLATFORMS.TWITTER, l: "Twitter/X" },
          { v: PLATFORMS.THREADS, l: "Threads" },
        ].map(({ v, l }) => (
          <button
            key={v}
            onClick={() => setPlatform(v)}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${platform === v ? "bg-indigo-600 text-white" : "text-slate-500 hover:text-slate-300"}`}
          >
            {l}
          </button>
        ))}
      </div>

      {/* Active template indicator */}
      <div
        className={`flex items-start gap-3 px-4 py-3 rounded-xl border ${activeTemplate ? "bg-emerald-500/8 border-emerald-500/20" : "bg-white/[0.02] border-white/[0.06]"}`}
      >
        <span
          className={`w-2 h-2 rounded-full shrink-0 mt-1 ${activeTemplate ? "bg-emerald-500" : "bg-slate-700"}`}
        />
        <div className="min-w-0">
          <p
            className={`text-xs font-bold ${activeTemplate ? "text-emerald-300" : "text-slate-500"}`}
          >
            {activeTemplate
              ? `Template Aktif: ${activeTemplate.template_name}`
              : t("commentTemplates.noActiveTemplate")}
          </p>
          {activeTemplate && (
            <p className="text-[10px] text-slate-500 mt-0.5 truncate">
              "{activeTemplate.comment_text}"
            </p>
          )}
        </div>
      </div>

      {/* Add form */}
      <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-5 flex flex-col gap-3">
        <p className="text-xs font-black text-slate-400 uppercase tracking-widest">
          {t("commentTemplates.addNewTemplate")}
        </p>
        <input
          type="text"
          value={templateName}
          onChange={(e) => setTemplateName(e.target.value)}
          placeholder={t("commentTemplates.templateNamePlaceholder")}
          className="bg-[#0c1220] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-slate-200 placeholder-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
        />
        <div>
          <textarea
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            placeholder={t("commentTemplates.commentTextPlaceholder")}
            rows={4}
            className="w-full bg-[#0c1220] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-slate-200 placeholder-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 resize-none"
          />
          <p className="text-[10px] text-slate-600 mt-1">
            {commentText.length}/280 karakter
          </p>
        </div>
        <button
          onClick={handleAdd}
          disabled={loading}
          className="self-start px-5 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white rounded-xl text-xs font-bold transition-all"
        >
          {loading ? "Menambahkan..." : t("commentTemplates.addTemplate")}
        </button>
      </div>

      {/* Templates list */}
      <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl overflow-hidden">
        <div className="px-5 py-3 border-b border-white/[0.06] flex items-center justify-between">
          <p className="text-xs font-black text-slate-400 uppercase tracking-widest">
            {t("commentTemplates.templateList", { platform })}
          </p>
          <span className="text-[10px] text-slate-600">
            {templates.length} template
          </span>
        </div>
        {templates.length === 0 ? (
          <div className="p-8 text-center text-slate-700 text-xs">
            {t("commentTemplates.noTemplates")}
          </div>
        ) : (
          <div className="divide-y divide-white/[0.04]">
            {templates.map((tpl) => (
              <div
                key={tpl.id}
                className="px-5 py-3.5 flex items-center gap-3 hover:bg-white/[0.02] transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-slate-200">
                      {tpl.template_name}
                    </p>
                    {activeTemplate?.id === tpl.id && (
                      <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full text-[9px] font-black uppercase shrink-0">
                        Aktif
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-slate-500 mt-0.5 truncate max-w-md">
                    "{tpl.comment_text}"
                  </p>
                </div>
                <div className="flex gap-2">
                  {activeTemplate?.id !== tpl.id && (
                    <button
                      onClick={() => handleSetActive(tpl.id)}
                      className="px-3 py-1.5 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/20 rounded-lg text-[10px] font-bold transition-all"
                    >
                      Set Aktif
                    </button>
                  )}
                  <button
                    onClick={() => setDeleteModal({ open: true, id: tpl.id })}
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
