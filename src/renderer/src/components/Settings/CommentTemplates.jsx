import React, { useState, useEffect } from "react";
import { PLATFORMS } from "../../utils/constants.js";
import { useTranslation } from "react-i18next";

export function CommentTemplates() {
  const { t } = useTranslation();
  const [platform, setPlatform] = useState(PLATFORMS.INSTAGRAM);
  const [templates, setTemplates] = useState([]);
  const [activeTemplate, setActiveTemplate] = useState(null);
  const [templateName, setTemplateName] = useState("");
  const [commentText, setCommentText] = useState("");
  const [loading, setLoading] = useState(false);
  const [showWarning, setShowWarning] = useState(false);

  useEffect(() => {
    loadTemplates();
  }, [platform]);

  const loadTemplates = async () => {
    setLoading(true);
    try {
      const [templatesResult, activeResult] = await Promise.all([
        window.api.getCommentTemplates(platform),
        window.api.getActiveCommentTemplate(platform),
      ]);

      if (templatesResult.success) {
        setTemplates(templatesResult.data || []);
      }
      if (activeResult.success) {
        setActiveTemplate(activeResult.data);
      }
    } catch (err) {
      console.error("Failed to load templates:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddTemplate = async () => {
    if (!templateName.trim()) {
      alert(t("commentTemplates.alertNameRequired"));
      return;
    }
    if (!commentText.trim()) {
      alert(t("commentTemplates.alertTextRequired"));
      return;
    }

    setLoading(true);
    try {
      const result = await window.api.saveCommentTemplate(
        platform,
        templateName,
        commentText,
      );
      if (result.success) {
        setTemplateName("");
        setCommentText("");
        loadTemplates();
        alert(t("commentTemplates.alertAddSuccess"));
      } else {
        alert(result.error || t("commentTemplates.alertAddFailed"));
      }
    } catch (err) {
      alert(t("commentTemplates.alertAddFailed") + ": " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSetActive = async (templateId) => {
    setLoading(true);
    try {
      const result = await window.api.setActiveCommentTemplate(templateId);
      if (result.success) {
        loadTemplates();
      } else {
        alert(result.error || t("commentTemplates.alertSetActiveFailed"));
      }
    } catch (err) {
      alert(t("commentTemplates.alertSetActiveFailed") + ": " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (templateId) => {
    if (!confirm(t("commentTemplates.alertDeleteConfirm"))) return;

    setLoading(true);
    try {
      const result = await window.api.deleteCommentTemplate(templateId);
      if (result.success) {
        loadTemplates();
      } else {
        alert(result.error || t("commentTemplates.alertDeleteFailed"));
      }
    } catch (err) {
      alert(t("commentTemplates.alertDeleteFailed") + ": " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const getPlatformLabel = (p) => {
    switch (p) {
      case PLATFORMS.INSTAGRAM:
        return t("commentTemplates.instagram");
      case PLATFORMS.TWITTER:
        return t("commentTemplates.twitterX");
      case PLATFORMS.THREADS:
        return t("commentTemplates.threads");
      default:
        return p;
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h3 className="text-xl font-bold text-white mb-2">
          {t("commentTemplates.title")}
        </h3>
        <p className="text-slate-400 text-sm">
          {t("commentTemplates.description")}
        </p>
      </div>

      {/* Warning Banner */}
      <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <span className="text-lg">⚠️</span>
          <div>
            <p className="text-sm font-bold text-red-300">
              {t("commentTemplates.warningTitle")}
            </p>
            <ul className="text-xs text-red-400/90 mt-1 space-y-1">
              <li>• {t("commentTemplates.warning1")}</li>
              <li>• {t("commentTemplates.warning2")}</li>
              <li>• {t("commentTemplates.warning3")}</li>
              <li>• {t("commentTemplates.warning4")}</li>
              <li>• {t("commentTemplates.warning5")}</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <span className="text-lg">ℹ️</span>
          <div>
            <p className="text-sm font-bold text-blue-300">
              {t("commentTemplates.info")}
            </p>
            <ul className="text-xs text-blue-400/90 mt-1 space-y-1">
              <li>• {t("commentTemplates.info1")}</li>
              <li>• {t("commentTemplates.info2")}</li>
              <li>• {t("commentTemplates.info3")}</li>
              <li>• {t("commentTemplates.info4")}</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Platform Selector */}
      <div className="flex gap-4 items-end">
        <div className="flex-1">
          <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">
            {t("commentTemplates.platform")}
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

      {/* Active Template Indicator */}
      {activeTemplate ? (
        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
            <div>
              <p className="text-sm font-bold text-emerald-300">
                {t("commentTemplates.activeTemplate", {
                  name: activeTemplate.template_name,
                })}
              </p>
              <p className="text-xs text-emerald-400/90 mt-1 truncate max-w-md">
                {t("commentTemplates.activeTemplateText", {
                  text: activeTemplate.comment_text,
                })}
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
                {t("commentTemplates.noActiveTemplate")}
              </p>
              <p className="text-xs text-slate-400">
                {t("commentTemplates.autoCommentDisabled", {
                  platform: getPlatformLabel(platform),
                })}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Add Template Form */}
      <div className="bg-slate-900/40 backdrop-blur-md rounded-2xl border border-slate-800/80 p-5">
        <h4 className="text-sm font-bold text-slate-200 mb-4">
          {t("commentTemplates.addNewTemplate")}
        </h4>
        <div className="flex flex-col gap-3">
          <div>
            <label className="block text-xs font-bold text-slate-400 mb-2">
              {t("commentTemplates.templateName")}
            </label>
            <input
              type="text"
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              placeholder={t("commentTemplates.templateNamePlaceholder")}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 placeholder-slate-600"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-400 mb-2">
              {t("commentTemplates.commentText")}
            </label>
            <textarea
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder={t("commentTemplates.commentTextPlaceholder")}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 h-32 resize-none placeholder-slate-600"
            />
            <p className="text-xs text-slate-500 mt-1">
              {t("commentTemplates.characters")}: {commentText.length}/280
            </p>
          </div>
          <button
            onClick={handleAddTemplate}
            disabled={loading}
            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:hover:bg-indigo-600 text-white rounded-xl text-sm font-bold transition-all self-start"
          >
            {loading
              ? t("commentTemplates.adding")
              : t("commentTemplates.addTemplate")}
          </button>
        </div>
      </div>

      {/* Templates List */}
      <div className="bg-slate-900/40 backdrop-blur-md rounded-2xl border border-slate-800/80 overflow-hidden">
        <div className="p-4 border-b border-slate-800/50">
          <h4 className="text-sm font-bold text-slate-200">
            {t("commentTemplates.templateList", {
              platform: getPlatformLabel(platform),
            })}
            <span className="ml-2 text-xs text-slate-400">
              ({templates.length} {t("commentTemplates.templateCount")})
            </span>
          </h4>
        </div>

        {loading ? (
          <div className="p-8 text-center text-slate-400">
            {t("commentTemplates.loading")}
          </div>
        ) : templates.length === 0 ? (
          <div className="p-8 text-center text-slate-500">
            {t("commentTemplates.noTemplates")}
          </div>
        ) : (
          <div className="divide-y divide-slate-800/40">
            {templates.map((template) => (
              <div
                key={template.id}
                className="p-4 flex items-center justify-between hover:bg-slate-900/20 transition-all"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-slate-200">
                      {template.template_name}
                    </p>
                    {activeTemplate?.id === template.id && (
                      <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full text-[10px] font-bold uppercase">
                        {t("commentTemplates.active")}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-1 truncate max-w-md">
                    "{template.comment_text}"
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    {t("commentTemplates.added")}:{" "}
                    {new Date(template.created_at).toLocaleDateString("id-ID")}
                  </p>
                </div>
                <div className="flex gap-2 ml-4">
                  {activeTemplate?.id !== template.id && (
                    <button
                      onClick={() => handleSetActive(template.id)}
                      className="px-3 py-1.5 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 rounded-lg text-xs font-bold border border-indigo-500/20 transition-all"
                    >
                      {t("commentTemplates.setActive")}
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(template.id)}
                    className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg text-xs font-bold border border-red-500/20 transition-all"
                  >
                    {t("commentTemplates.delete")}
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
