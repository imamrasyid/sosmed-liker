import React from "react";
import { useConfig } from "../../hooks/useConfig.js";
import { useAppContext } from "../../context/AppContext.jsx";
import { useTranslation } from "react-i18next";
import { USER_AGENTS } from "../../utils/constants.js";
import { ProfileLists } from "./ProfileLists.jsx";
import { ProfileManagement } from "./ProfileManagement.jsx";
import { ProxyManagement } from "./ProxyManagement.jsx";
import { BatchJobs } from "./BatchJobs.jsx";
import { CommentTemplates } from "./CommentTemplates.jsx";

export function Settings() {
  const { config, handleSaveConfig } = useConfig();
  const { settingsSubTab, setSettingsSubTab, showToast } = useAppContext();
  const { t } = useTranslation();

  const [localConfig, setLocalConfig] = React.useState(config);

  React.useEffect(() => {
    setLocalConfig(config);
  }, [config]);

  const handleConfigChange = async (key, value) => {
    setLocalConfig((prev) => ({ ...prev, [key]: value }));
    const success = await handleSaveConfig(key, value);
    if (success) {
      showToast(t("toast.configSaved"), "success");
    } else {
      showToast(t("toast.configSaveFailed"), "error");
    }
  };

  return (
    <div className="flex-1 flex flex-col gap-6 max-w-6xl mx-auto w-full animate-fadeIn">
      <div>
        <h2 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-200 to-indigo-400 tracking-tight">
          {t("settings.title")}
        </h2>
        <p className="text-slate-400 text-sm mt-1">
          {t("settings.description")}
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 border-b border-slate-800/50">
        <button
          onClick={() => setSettingsSubTab("config")}
          className={`px-4 py-2 text-sm font-bold transition-all border-b-2 -mb-px
            ${
              settingsSubTab === "config"
                ? "text-indigo-400 border-indigo-400"
                : "text-slate-400 border-transparent hover:text-slate-300"
            }
          `}
        >
          {t("settings.config")}
        </button>
        <button
          onClick={() => setSettingsSubTab("lists")}
          className={`px-4 py-2 text-sm font-bold transition-all border-b-2 -mb-px
            ${
              settingsSubTab === "lists"
                ? "text-indigo-400 border-indigo-400"
                : "text-slate-400 border-transparent hover:text-slate-300"
            }
          `}
        >
          {t("settings.blacklistWhitelist")}
        </button>
        <button
          onClick={() => setSettingsSubTab("profiles")}
          className={`px-4 py-2 text-sm font-bold transition-all border-b-2 -mb-px
            ${
              settingsSubTab === "profiles"
                ? "text-indigo-400 border-indigo-400"
                : "text-slate-400 border-transparent hover:text-slate-300"
            }
          `}
        >
          {t("settings.multiProfile")}
        </button>
        <button
          onClick={() => setSettingsSubTab("proxy")}
          className={`px-4 py-2 text-sm font-bold transition-all border-b-2 -mb-px
            ${
              settingsSubTab === "proxy"
                ? "text-indigo-400 border-indigo-400"
                : "text-slate-400 border-transparent hover:text-slate-300"
            }
          `}
        >
          {t("settings.proxy")}
        </button>
        <button
          onClick={() => setSettingsSubTab("batch")}
          className={`px-4 py-2 text-sm font-bold transition-all border-b-2 -mb-px
            ${
              settingsSubTab === "batch"
                ? "text-indigo-400 border-indigo-400"
                : "text-slate-400 border-transparent hover:text-slate-300"
            }
          `}
        >
          {t("settings.batchJobs")}
        </button>
        <button
          onClick={() => setSettingsSubTab("comments")}
          className={`px-4 py-2 text-sm font-bold transition-all border-b-2 -mb-px
            ${
              settingsSubTab === "comments"
                ? "text-indigo-400 border-indigo-400"
                : "text-slate-400 border-transparent hover:text-slate-300"
            }
          `}
        >
          {t("settings.comments")}
        </button>
      </div>

      {/* Tab Content */}
      {settingsSubTab === "config" ? (
        <>
          {/* Informative tips box */}
          <div className="bg-slate-900/20 border border-slate-800 rounded-2xl p-5 flex gap-3 text-xs leading-relaxed text-slate-400 shadow-sm">
            <span className="text-md">💡</span>
            <div>
              <h4 className="font-bold text-slate-300 uppercase tracking-wider text-[10px] mb-1">
                {t("settings.securityTips")}
              </h4>
              {t("settings.securityTipsDesc")}
            </div>
          </div>

          {/* Slider Controls Wrapper */}
          <div className="bg-slate-900/40 backdrop-blur-md rounded-2xl p-6 border border-slate-800/80 flex flex-col gap-8 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/2 rounded-full blur-2xl pointer-events-none"></div>

            {/* SECTION 1: Kecepatan & Jeda */}
            <div className="flex flex-col gap-5">
              <h3 className="text-xs font-black text-indigo-400 uppercase tracking-widest border-b border-slate-800/50 pb-2 flex items-center gap-2">
                <span>⚡</span> {t("settings.speedDelaySection")}
              </h3>

              {/* Rentang Jeda */}
              <div className="flex flex-col gap-3.5">
                <div className="flex justify-between items-center">
                  <div>
                    <span className="text-xs font-bold text-slate-200">
                      {t("settings.delayRange")}
                    </span>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {t("settings.delayRangeDesc")}
                    </p>
                  </div>
                  <span className="px-2.5 py-0.5 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-mono text-xs font-bold rounded-lg">
                    {localConfig.minDelay / 1000}s -{" "}
                    {localConfig.maxDelay / 1000}s
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  {/* Minimum Delay */}
                  <div className="flex flex-col gap-2">
                    <div className="flex justify-between text-[11px] font-semibold text-slate-400">
                      <span>{t("settings.minDelay")}</span>
                      <span>
                        {localConfig.minDelay / 1000} {t("settings.seconds")}
                      </span>
                    </div>
                    <input
                      type="range"
                      min="1000"
                      max="10000"
                      step="1000"
                      value={localConfig.minDelay}
                      onChange={(e) => {
                        const val = parseInt(e.target.value, 10);
                        setLocalConfig((prev) => ({ ...prev, minDelay: val }));
                        handleConfigChange("min_delay", val);
                        if (val > localConfig.maxDelay) {
                          setLocalConfig((prev) => ({
                            ...prev,
                            maxDelay: val + 1000,
                          }));
                          handleConfigChange("max_delay", val + 1000);
                        }
                      }}
                      className="w-full accent-indigo-500 bg-slate-950 h-1.5 rounded-lg cursor-pointer"
                    />
                  </div>

                  {/* Maximum Delay */}
                  <div className="flex flex-col gap-2">
                    <div className="flex justify-between text-[11px] font-semibold text-slate-400">
                      <span>{t("settings.maxDelay")}</span>
                      <span>
                        {localConfig.maxDelay / 1000} {t("settings.seconds")}
                      </span>
                    </div>
                    <input
                      type="range"
                      min="2000"
                      max="20000"
                      step="1000"
                      value={localConfig.maxDelay}
                      onChange={(e) => {
                        const val = parseInt(e.target.value, 10);
                        if (val < localConfig.minDelay) return;
                        setLocalConfig((prev) => ({ ...prev, maxDelay: val }));
                        handleConfigChange("max_delay", val);
                      }}
                      className="w-full accent-indigo-500 bg-slate-950 h-1.5 rounded-lg cursor-pointer"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* SECTION 2: Batas & Pemindaian */}
            <div className="flex flex-col gap-5 border-t border-slate-800/40 pt-5">
              <h3 className="text-xs font-black text-indigo-400 uppercase tracking-widest border-b border-slate-800/50 pb-2 flex items-center gap-2">
                <span>🔍</span> {t("settings.scanningSection")}
              </h3>

              <div className="grid grid-cols-2 gap-6">
                {/* Post Limit */}
                <div className="flex flex-col gap-2">
                  <div className="flex justify-between items-center text-xs font-semibold text-slate-400">
                    <div>
                      <span className="font-bold text-slate-200">
                        {t("settings.postLimitPerProfile")}
                      </span>
                      <p className="text-[10px] text-slate-500 mt-0.5">
                        {t("settings.postLimitDesc")}
                      </p>
                    </div>
                    <span className="px-2 py-0.5 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-mono text-[11px] font-bold rounded-lg">
                      {localConfig.limit} {t("settings.post")}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="5"
                    max="100"
                    step="5"
                    value={localConfig.limit}
                    onChange={(e) => {
                      const val = parseInt(e.target.value, 10);
                      setLocalConfig((prev) => ({ ...prev, limit: val }));
                      handleConfigChange("limit", val);
                      if (localConfig.consecutiveSkipsLimit > val) {
                        setLocalConfig((prev) => ({
                          ...prev,
                          consecutiveSkipsLimit: val,
                        }));
                        handleConfigChange("consecutive_skips_limit", val);
                      }
                    }}
                    className="w-full accent-indigo-500 bg-slate-950 h-1.5 rounded-lg cursor-pointer"
                  />
                </div>

                {/* Consecutive Skips Limit */}
                <div className="flex flex-col gap-2">
                  <div className="flex justify-between items-center text-xs font-semibold text-slate-400">
                    <div>
                      <span className="font-bold text-slate-200">
                        {t("settings.consecutiveSkipsLimit")}
                      </span>
                      <p className="text-[10px] text-slate-500 mt-0.5">
                        {t("settings.consecutiveSkipsDesc")}
                      </p>
                    </div>
                    <span className="px-2 py-0.5 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-mono text-[11px] font-bold rounded-lg">
                      {localConfig.consecutiveSkipsLimit} {t("settings.skips")}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="3"
                    max={localConfig.limit}
                    step="1"
                    value={localConfig.consecutiveSkipsLimit}
                    onChange={(e) => {
                      const val = parseInt(e.target.value, 10);
                      setLocalConfig((prev) => ({
                        ...prev,
                        consecutiveSkipsLimit: val,
                      }));
                      handleConfigChange("consecutive_skips_limit", val);
                    }}
                    className="w-full accent-indigo-500 bg-slate-950 h-1.5 rounded-lg cursor-pointer"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6 mt-2">
                {/* Scroll Step (Pixel Distance) */}
                <div className="flex flex-col gap-2">
                  <div className="flex justify-between items-center text-xs font-semibold text-slate-400">
                    <div>
                      <span className="font-bold text-slate-200">
                        {t("settings.scrollStep")}
                      </span>
                      <p className="text-[10px] text-slate-500 mt-0.5">
                        {t("settings.scrollStepDesc")}
                      </p>
                    </div>
                    <span className="px-2 py-0.5 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-mono text-[11px] font-bold rounded-lg">
                      {localConfig.scrollStep}px
                    </span>
                  </div>
                  <input
                    type="range"
                    min="500"
                    max="1500"
                    step="100"
                    value={localConfig.scrollStep}
                    onChange={(e) => {
                      const val = parseInt(e.target.value, 10);
                      setLocalConfig((prev) => ({ ...prev, scrollStep: val }));
                      handleConfigChange("scroll_step", val);
                    }}
                    className="w-full accent-indigo-500 bg-slate-950 h-1.5 rounded-lg cursor-pointer"
                  />
                </div>

                {/* Max Scroll Attempts */}
                <div className="flex flex-col gap-2">
                  <div className="flex justify-between items-center text-xs font-semibold text-slate-400">
                    <div>
                      <span className="font-bold text-slate-200">
                        {t("settings.maxScrollAttempts")}
                      </span>
                      <p className="text-[10px] text-slate-500 mt-0.5">
                        {t("settings.maxScrollAttemptsDesc")}
                      </p>
                    </div>
                    <span className="px-2 py-0.5 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-mono text-[11px] font-bold rounded-lg">
                      {localConfig.maxScrollAttempts} {t("settings.times")}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="40"
                    step="5"
                    value={localConfig.maxScrollAttempts}
                    onChange={(e) => {
                      const val = parseInt(e.target.value, 10);
                      setLocalConfig((prev) => ({
                        ...prev,
                        maxScrollAttempts: val,
                      }));
                      handleConfigChange("max_scroll_attempts", val);
                    }}
                    className="w-full accent-indigo-500 bg-slate-950 h-1.5 rounded-lg cursor-pointer"
                  />
                </div>
              </div>
            </div>

            {/* SECTION 3: Mode Browser & Privasi */}
            <div className="flex flex-col gap-5 border-t border-slate-800/40 pt-5">
              <h3 className="text-xs font-black text-indigo-400 uppercase tracking-widest border-b border-slate-800/50 pb-2 flex items-center gap-2">
                <span>🛡️</span> {t("settings.browserSection")}
              </h3>

              <div className="flex justify-between items-center">
                <div>
                  <span className="text-xs font-bold text-slate-200">
                    {t("settings.headlessMode")}
                  </span>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {t("settings.headlessModeDesc")}
                  </p>
                </div>

                <button
                  onClick={() => {
                    const nextVal = !localConfig.headless;
                    setLocalConfig((prev) => ({ ...prev, headless: nextVal }));
                    handleConfigChange("headless", nextVal);
                  }}
                  className={`w-12 h-6 rounded-full transition-all duration-300 relative border flex items-center px-1
                ${
                  localConfig.headless
                    ? "bg-gradient-to-r from-indigo-600 to-purple-600 border-indigo-400/20"
                    : "bg-slate-950 border-slate-800"
                }
              `}
                >
                  <span
                    className={`w-4 h-4 rounded-full transition-all duration-300 shadow-lg
                ${
                  localConfig.headless
                    ? "translate-x-6 bg-white shadow-glow shadow-white/30"
                    : "translate-x-0 bg-slate-600"
                }
              `}
                  ></span>
                </button>
              </div>

              <div className="flex flex-col gap-2 border-t border-slate-800/20 pt-4">
                <span className="text-xs font-bold text-slate-200">
                  {t("settings.browserUserAgent")}
                </span>
                <p className="text-[11px] text-slate-500">
                  {t("settings.browserUserAgentDesc")}
                </p>

                <div className="grid grid-cols-4 gap-3 mt-1.5">
                  {[
                    {
                      name: USER_AGENTS.DEFAULT,
                      label: t("settings.playwrightDefault"),
                    },
                    {
                      name: USER_AGENTS.CHROME_WINDOWS,
                      label: t("settings.chromeWindows"),
                    },
                    {
                      name: USER_AGENTS.SAFARI_MACOS,
                      label: t("settings.safariMacos"),
                    },
                    {
                      name: USER_AGENTS.FIREFOX_LINUX,
                      label: t("settings.firefoxLinux"),
                    },
                  ].map((ua) => (
                    <button
                      key={ua.name}
                      onClick={() => {
                        setLocalConfig((prev) => ({
                          ...prev,
                          userAgent: ua.name,
                        }));
                        handleConfigChange("browser_user_agent", ua.name);
                      }}
                      className={`px-3 py-2 rounded-xl text-[10.5px] font-bold border transition-all duration-200 text-center
                    ${
                      localConfig.userAgent === ua.name
                        ? "bg-indigo-600/10 border-indigo-500 text-indigo-300 font-extrabold shadow-md shadow-indigo-500/5"
                        : "bg-slate-950 border-slate-800/80 text-slate-400 hover:border-slate-700 hover:text-slate-350"
                    }
                  `}
                    >
                      {ua.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </>
      ) : settingsSubTab === "lists" ? (
        <ProfileLists />
      ) : settingsSubTab === "profiles" ? (
        <ProfileManagement />
      ) : settingsSubTab === "proxy" ? (
        <ProxyManagement />
      ) : settingsSubTab === "batch" ? (
        <BatchJobs />
      ) : (
        <CommentTemplates />
      )}
    </div>
  );
}
