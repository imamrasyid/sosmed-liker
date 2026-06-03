import React from "react";
import { useAppContext } from "../../context/AppContext.jsx";
import { useTranslation } from "react-i18next";

// Tab label keys mengikuti i18n — breadcrumb berubah sesuai bahasa user
const TAB_LABEL_KEYS = {
  dashboard: "sidebar.dashboard",
  history: "sidebar.likeHistory",
  analytics: "sidebar.statistics",
  settings: "sidebar.parameters",
  "settings-app": "sidebar.system",
  accounts: "sidebar.profileStatus",
};

export function Header() {
  const { activeTab, language, setLanguage } = useAppContext();
  const { t, i18n } = useTranslation();

  const handleLang = (lang) => {
    setLanguage(lang);
    i18n.changeLanguage(lang);
  };

  const tabLabel = TAB_LABEL_KEYS[activeTab]
    ? t(TAB_LABEL_KEYS[activeTab])
    : activeTab;

  return (
    <header className="h-10 bg-[#0c1220]/80 border-b border-white/[0.06] flex items-center justify-between px-5 drag-region shrink-0 z-20">
      {/* Left: breadcrumb */}
      <div className="flex items-center gap-2 no-drag-region">
        <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">
          Sosmed Liker
        </span>
        <svg
          className="w-3 h-3 text-slate-700"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth="2.5"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
          {tabLabel}
        </span>
      </div>

      {/* Right: actions */}
      <div className="flex items-center gap-1.5 no-drag-region">
        {/* Language toggle */}
        <div className="flex items-center bg-white/[0.04] border border-white/[0.06] rounded-md overflow-hidden">
          {["id", "en"].map((lang) => (
            <button
              key={lang}
              onClick={() => handleLang(lang)}
              className={`px-2.5 py-1 text-[9px] font-black uppercase tracking-widest transition-all ${
                language === lang
                  ? "bg-indigo-600 text-white"
                  : "text-slate-500 hover:text-slate-300"
              }`}
            >
              {lang}
            </button>
          ))}
        </div>

        {/* Separator */}
        <div className="w-px h-4 bg-white/[0.06] mx-1" />

        {/* Window controls */}
        <button
          onClick={() => window.api.minimizeWindow()}
          className="w-7 h-7 flex items-center justify-center rounded-md text-slate-600 hover:text-slate-300 hover:bg-white/[0.06] transition-all"
        >
          <svg
            className="w-3 h-3"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2.5"
          >
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </button>
        <button
          onClick={() => window.api.maximizeWindow()}
          className="w-7 h-7 flex items-center justify-center rounded-md text-slate-600 hover:text-slate-300 hover:bg-white/[0.06] transition-all"
        >
          <svg
            className="w-3 h-3"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2.5"
          >
            <rect x="4" y="4" width="16" height="16" rx="2" />
          </svg>
        </button>
        <button
          onClick={() => window.api.closeWindow()}
          className="w-7 h-7 flex items-center justify-center rounded-md text-slate-600 hover:text-red-400 hover:bg-red-500/10 transition-all"
        >
          <svg
            className="w-3 h-3"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2.5"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>
    </header>
  );
}
