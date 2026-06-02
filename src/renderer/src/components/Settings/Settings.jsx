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

const TABS = [
  { id: "config", label: "Konfigurasi" },
  { id: "profiles", label: "Multi-Profil" },
  { id: "lists", label: "Blacklist/Whitelist" },
  { id: "proxy", label: "Proxy" },
  { id: "batch", label: "Batch Jobs" },
  { id: "comments", label: "Komentar" },
];

function SliderRow({
  label,
  description,
  valueLabel,
  min,
  max,
  step,
  value,
  onChange,
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold text-slate-300">{label}</p>
          {description && (
            <p className="text-[10px] text-slate-600 mt-0.5">{description}</p>
          )}
        </div>
        <span className="text-[10px] font-black text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded-lg font-mono shrink-0">
          {valueLabel}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={onChange}
        className="w-full accent-indigo-500 h-1.5 rounded-full cursor-pointer"
      />
      <div className="flex justify-between text-[9px] text-slate-700 font-mono">
        <span>{min}</span>
        <span>{max}</span>
      </div>
    </div>
  );
}

export function Settings() {
  const { config, handleSaveConfig } = useConfig();
  const { settingsSubTab, setSettingsSubTab, showToast } = useAppContext();
  const { t } = useTranslation();
  const [local, setLocal] = React.useState(config);

  React.useEffect(() => {
    setLocal(config);
  }, [config]);

  const save = async (key, value) => {
    setLocal((p) => ({ ...p, [snakeToCamel(key)]: value }));
    const ok = await handleSaveConfig(key, value);
    if (ok) showToast(t("toast.configSaved"), "success");
    else showToast(t("toast.configSaveFailed"), "error");
  };

  const snakeToCamel = (k) => k.replace(/_([a-z])/g, (_, c) => c.toUpperCase());

  return (
    <div className="flex-1 flex flex-col gap-5 max-w-5xl mx-auto w-full">
      <div>
        <h1 className="text-xl font-black text-white">{t("settings.title")}</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          {t("settings.description")}
        </p>
      </div>

      {/* Tab nav */}
      <div className="flex items-center gap-0.5 border-b border-white/[0.06] pb-0">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setSettingsSubTab(tab.id)}
            className={`px-4 py-2 text-xs font-bold transition-all border-b-2 -mb-px ${
              settingsSubTab === tab.id
                ? "text-indigo-400 border-indigo-500"
                : "text-slate-600 border-transparent hover:text-slate-400"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex-1">
        {settingsSubTab === "config" && (
          <div className="flex flex-col gap-6">
            {/* Security tip */}
            <div className="flex items-start gap-3 px-4 py-3 bg-indigo-500/5 border border-indigo-500/10 rounded-xl">
              <svg
                className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <p className="text-[11px] text-slate-400">
                {t("settings.securityTipsDesc")}
              </p>
            </div>

            {/* Section 1: Speed & Delay */}
            <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-5 flex flex-col gap-5">
              <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">
                {t("settings.speedDelaySection")}
              </p>

              <div className="grid grid-cols-2 gap-6">
                <SliderRow
                  label={t("settings.minDelay")}
                  description={t("settings.delayRangeDesc")}
                  valueLabel={`${local.minDelay / 1000}s`}
                  min={1000}
                  max={10000}
                  step={500}
                  value={local.minDelay}
                  onChange={(e) => {
                    const v = +e.target.value;
                    setLocal((p) => ({ ...p, minDelay: v }));
                    handleSaveConfig("min_delay", v);
                    if (v > local.maxDelay)
                      handleSaveConfig("max_delay", v + 1000);
                  }}
                />
                <SliderRow
                  label={t("settings.maxDelay")}
                  description={null}
                  valueLabel={`${local.maxDelay / 1000}s`}
                  min={2000}
                  max={20000}
                  step={500}
                  value={local.maxDelay}
                  onChange={(e) => {
                    const v = +e.target.value;
                    if (v < local.minDelay) return;
                    setLocal((p) => ({ ...p, maxDelay: v }));
                    handleSaveConfig("max_delay", v);
                  }}
                />
              </div>
            </div>

            {/* Section 2: Scan params */}
            <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-5 flex flex-col gap-5">
              <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">
                {t("settings.scanningSection")}
              </p>
              <div className="grid grid-cols-2 gap-6">
                <SliderRow
                  label={t("settings.postLimitPerProfile")}
                  description={t("settings.postLimitDesc")}
                  valueLabel={`${local.limit} post`}
                  min={5}
                  max={100}
                  step={5}
                  value={local.limit}
                  onChange={(e) => {
                    const v = +e.target.value;
                    setLocal((p) => ({ ...p, limit: v }));
                    handleSaveConfig("limit", v);
                  }}
                />
                <SliderRow
                  label={t("settings.consecutiveSkipsLimit")}
                  description={t("settings.consecutiveSkipsDesc")}
                  valueLabel={`${local.consecutiveSkipsLimit} skip`}
                  min={3}
                  max={20}
                  step={1}
                  value={local.consecutiveSkipsLimit}
                  onChange={(e) => {
                    const v = +e.target.value;
                    setLocal((p) => ({ ...p, consecutiveSkipsLimit: v }));
                    handleSaveConfig("consecutive_skips_limit", v);
                  }}
                />
                <SliderRow
                  label={t("settings.scrollStep")}
                  description={t("settings.scrollStepDesc")}
                  valueLabel={`${local.scrollStep}px`}
                  min={300}
                  max={1500}
                  step={100}
                  value={local.scrollStep}
                  onChange={(e) => {
                    const v = +e.target.value;
                    setLocal((p) => ({ ...p, scrollStep: v }));
                    handleSaveConfig("scroll_step", v);
                  }}
                />
                <SliderRow
                  label={t("settings.maxScrollAttempts")}
                  description={t("settings.maxScrollAttemptsDesc")}
                  valueLabel={`${local.maxScrollAttempts}×`}
                  min={5}
                  max={50}
                  step={5}
                  value={local.maxScrollAttempts}
                  onChange={(e) => {
                    const v = +e.target.value;
                    setLocal((p) => ({ ...p, maxScrollAttempts: v }));
                    handleSaveConfig("max_scroll_attempts", v);
                  }}
                />
              </div>
            </div>

            {/* Section 3: Browser */}
            <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-5 flex flex-col gap-5">
              <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">
                {t("settings.browserSection")}
              </p>

              {/* Headless toggle */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-300">
                    {t("settings.headlessMode")}
                  </p>
                  <p className="text-[10px] text-slate-600 mt-0.5">
                    {t("settings.headlessModeDesc")}
                  </p>
                </div>
                <button
                  onClick={() => save("headless", !local.headless)}
                  className={`w-11 h-6 rounded-full transition-all duration-300 relative border flex items-center px-1 shrink-0 ${
                    local.headless
                      ? "bg-indigo-600 border-indigo-400/20"
                      : "bg-white/[0.05] border-white/[0.08]"
                  }`}
                >
                  <span
                    className={`w-4 h-4 rounded-full transition-all duration-300 shadow ${local.headless ? "translate-x-5 bg-white" : "translate-x-0 bg-slate-600"}`}
                  />
                </button>
              </div>

              {/* User agent */}
              <div className="flex flex-col gap-2">
                <div>
                  <p className="text-xs font-bold text-slate-300">
                    {t("settings.browserUserAgent")}
                  </p>
                  <p className="text-[10px] text-slate-600 mt-0.5">
                    {t("settings.browserUserAgentDesc")}
                  </p>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { name: USER_AGENTS.DEFAULT, label: "Default" },
                    { name: USER_AGENTS.CHROME_WINDOWS, label: "Chrome / Win" },
                    { name: USER_AGENTS.SAFARI_MACOS, label: "Safari / Mac" },
                    {
                      name: USER_AGENTS.FIREFOX_LINUX,
                      label: "Firefox / Linux",
                    },
                  ].map((ua) => (
                    <button
                      key={ua.name}
                      onClick={() => save("browser_user_agent", ua.name)}
                      className={`py-2 px-3 rounded-xl text-[10px] font-bold border transition-all text-center ${
                        local.userAgent === ua.name
                          ? "bg-indigo-500/10 border-indigo-500/40 text-indigo-300"
                          : "bg-white/[0.02] border-white/[0.06] text-slate-500 hover:text-slate-300 hover:border-white/10"
                      }`}
                    >
                      {ua.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {settingsSubTab === "lists" && <ProfileLists />}
        {settingsSubTab === "profiles" && <ProfileManagement />}
        {settingsSubTab === "proxy" && <ProxyManagement />}
        {settingsSubTab === "batch" && <BatchJobs />}
        {settingsSubTab === "comments" && <CommentTemplates />}
      </div>
    </div>
  );
}
