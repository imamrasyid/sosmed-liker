import React, { useState, useEffect, useCallback } from "react";
import { useDatabase } from "../../hooks/useDatabase.js";
import { useAppContext } from "../../context/AppContext.jsx";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { useTranslation } from "react-i18next";

const CHART_COLORS = {
  instagram: "#E1306C",
  twitter: "#1DA1F2",
  threads: "#a1a1aa", // zinc-400 — hitam (#000) tidak kontras di dark bg
  completed: "#10B981",
  pending: "#6B7280",
  running: "#3B82F6",
  failed: "#EF4444",
};

const TOOLTIP_STYLE = {
  contentStyle: {
    backgroundColor: "#0c1220",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: "8px",
  },
  itemStyle: { color: "#e2e8f0" },
};

export function Analytics() {
  const { stats } = useDatabase();
  const { language } = useAppContext();
  const { t } = useTranslation();

  const [dailyData, setDailyData] = useState([]);
  const [platformData, setPlatformData] = useState([]);
  const [batchStats, setBatchStats] = useState([]);
  const [loading, setLoading] = useState(true);

  // Locale dinamis mengikuti bahasa yang dipilih user
  const locale = language === "id" ? "id-ID" : "en-US";

  const loadAnalyticsData = useCallback(async () => {
    setLoading(true);
    try {
      const [dailyResult, platformResult, batchResult] = await Promise.all([
        window.api.getLikedPostsDaily(30),
        window.api.getLikedPostsCountByPlatform(),
        window.api.getBatchJobStats(),
      ]);

      if (dailyResult.success) {
        setDailyData(
          dailyResult.data
            .map((d) => ({
              date: new Date(d.date).toLocaleDateString(locale, {
                day: "2-digit",
                month: "short",
              }),
              count: d.count,
            }))
            .reverse(),
        );
      }
      if (platformResult.success) setPlatformData(platformResult.data);
      if (batchResult.success) setBatchStats(batchResult.data);
    } catch (err) {
      console.error("Failed to load analytics:", err);
    } finally {
      setLoading(false);
    }
  }, [locale]);

  // Load on mount
  useEffect(() => {
    loadAnalyticsData();
  }, [loadAnalyticsData]);

  // Auto-refresh chart setelah automation selesai
  useEffect(() => {
    if (!window.api?.onAutomationDone) return;
    const unsub = window.api.onAutomationDone(() => loadAnalyticsData());
    return () => {
      if (unsub) unsub();
    };
  }, [loadAnalyticsData]);

  const getPlatformColor = (platform) =>
    CHART_COLORS[platform?.toLowerCase()] ?? "#6B7280";

  // ── Stat cards ─────────────────────────────────────────────────────────────
  const statCards = [
    {
      label: t("analytics.totalLikesLabel"),
      value: stats.total_liked,
      unit: t("analytics.posts"),
      color: "text-emerald-400",
      glow: "bg-emerald-500/5",
      icon: "✅",
    },
    {
      label: t("analytics.totalProfilesLabel"),
      value: stats.total_profiles,
      unit: t("analytics.profiles"),
      color: "text-indigo-400",
      glow: "bg-indigo-500/5",
      icon: "🎯",
    },
    {
      label: t("analytics.likedTodayLabel"),
      value: stats.liked_today,
      unit: t("analytics.posts"),
      color: "text-amber-400",
      glow: "bg-amber-500/5",
      icon: "🔥",
    },
  ];

  return (
    <div className="flex-1 flex flex-col gap-5 max-w-5xl mx-auto w-full">
      {/* Page header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-black text-white">
            {t("analytics.title")}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {t("analytics.description")}
          </p>
        </div>
        <button
          onClick={loadAnalyticsData}
          disabled={loading}
          className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 border border-white/[0.08] rounded-xl px-3 py-1.5 hover:bg-white/[0.04] hover:text-slate-300 transition-all disabled:opacity-40"
        >
          <svg
            className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2.5"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
          Refresh
        </button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-3 gap-4">
        {statCards.map((s) => (
          <div
            key={s.label}
            className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-5 flex flex-col gap-3 relative overflow-hidden"
          >
            <div
              className={`absolute top-0 right-0 w-28 h-28 ${s.glow} rounded-full blur-2xl pointer-events-none`}
            />
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">
                {s.label}
              </span>
              <span className="text-lg">{s.icon}</span>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className={`text-4xl font-black ${s.color} animate-fadeIn`}>
                {s.value}
              </span>
              <span className="text-xs text-slate-600 font-semibold">
                {s.unit}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Charts grid */}
      <div className="grid grid-cols-2 gap-4">
        {/* Daily chart */}
        <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-5">
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">
            {t("analytics.dailyLikesChart")}
          </p>
          {loading ? (
            <div className="h-52 flex items-center justify-center text-slate-600 text-xs">
              {t("analytics.loading")}
            </div>
          ) : dailyData.length === 0 ? (
            <div className="h-52 flex items-center justify-center text-slate-700 text-xs">
              {t("analytics.noData")}
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={208}>
              <LineChart data={dailyData}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="rgba(255,255,255,0.05)"
                />
                <XAxis
                  dataKey="date"
                  stroke="#475569"
                  fontSize={10}
                  tick={{ fill: "#475569" }}
                />
                <YAxis
                  stroke="#475569"
                  fontSize={10}
                  tick={{ fill: "#475569" }}
                />
                <Tooltip {...TOOLTIP_STYLE} />
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke="#10B981"
                  strokeWidth={2}
                  dot={{ fill: "#10B981", r: 3 }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Platform distribution */}
        <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-5">
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">
            {t("analytics.platformDistribution")}
          </p>
          {loading ? (
            <div className="h-52 flex items-center justify-center text-slate-600 text-xs">
              {t("analytics.loading")}
            </div>
          ) : platformData.length === 0 ? (
            <div className="h-52 flex items-center justify-center text-slate-700 text-xs">
              {t("analytics.noData")}
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={208}>
              <PieChart>
                <Pie
                  data={platformData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) =>
                    `${name}: ${(percent * 100).toFixed(0)}%`
                  }
                  outerRadius={75}
                  dataKey="count"
                >
                  {platformData.map((entry, i) => (
                    <Cell
                      key={`cell-${i}`}
                      fill={getPlatformColor(entry.platform)}
                    />
                  ))}
                </Pie>
                <Tooltip {...TOOLTIP_STYLE} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Batch job stats */}
      <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-5">
        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">
          {t("analytics.batchJobs")}
        </p>
        {loading ? (
          <div className="h-40 flex items-center justify-center text-slate-600 text-xs">
            {t("analytics.loading")}
          </div>
        ) : batchStats.length === 0 ? (
          <div className="h-40 flex items-center justify-center text-slate-700 text-xs">
            {t("analytics.noBatchJobs")}
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={batchStats}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="rgba(255,255,255,0.05)"
              />
              <XAxis
                dataKey="status"
                stroke="#475569"
                fontSize={10}
                tick={{ fill: "#475569" }}
              />
              <YAxis
                stroke="#475569"
                fontSize={10}
                tick={{ fill: "#475569" }}
              />
              <Tooltip {...TOOLTIP_STYLE} />
              <Legend wrapperStyle={{ fontSize: "10px", color: "#64748b" }} />
              <Bar
                dataKey="count"
                name={t("analytics.jobCount")}
                fill="#6366f1"
                radius={[3, 3, 0, 0]}
              />
              <Bar
                dataKey="total_urls"
                name={t("analytics.totalUrls")}
                fill="#8b5cf6"
                radius={[3, 3, 0, 0]}
              />
              <Bar
                dataKey="successful_urls"
                name={t("analytics.successful")}
                fill="#10B981"
                radius={[3, 3, 0, 0]}
              />
              <Bar
                dataKey="failed_urls"
                name={t("analytics.failed")}
                fill="#EF4444"
                radius={[3, 3, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Activity summary */}
      <div className="grid grid-cols-2 gap-4">
        {[
          {
            label: t("analytics.avgPerDay"),
            value:
              stats.total_liked > 0 ? Math.round(stats.total_liked / 30) : 0,
            desc: t("analytics.avgPerDayDesc"),
          },
          {
            label: t("analytics.activityRate"),
            value: `${stats.total_liked > 0 ? ((stats.liked_today / stats.total_liked) * 100).toFixed(1) : 0}%`,
            desc: t("analytics.activityRateDesc"),
          },
        ].map((item) => (
          <div
            key={item.label}
            className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-5"
          >
            <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-2">
              {item.label}
            </p>
            <span className="text-3xl font-black text-slate-200">
              {item.value}
            </span>
            <p className="text-[11px] text-slate-600 mt-1">{item.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
