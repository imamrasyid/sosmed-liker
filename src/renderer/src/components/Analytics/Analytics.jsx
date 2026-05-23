import React, { useState, useEffect } from "react";
import { useDatabase } from "../../hooks/useDatabase.js";
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

const COLORS = {
  instagram: "#E1306C",
  twitter: "#1DA1F2",
  threads: "#000000",
  completed: "#10B981",
  pending: "#6B7280",
  running: "#3B82F6",
  failed: "#EF4444",
};

export function Analytics() {
  const { stats } = useDatabase();
  const { t } = useTranslation();
  const [dailyData, setDailyData] = useState([]);
  const [platformData, setPlatformData] = useState([]);
  const [batchStats, setBatchStats] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalyticsData();
  }, []);

  const loadAnalyticsData = async () => {
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
              date: new Date(d.date).toLocaleDateString("id-ID", {
                day: "2-digit",
                month: "short",
              }),
              count: d.count,
            }))
            .reverse(),
        );
      }

      if (platformResult.success) {
        setPlatformData(platformResult.data);
      }

      if (batchResult.success) {
        setBatchStats(batchResult.data);
      }
    } catch (err) {
      console.error("Failed to load analytics:", err);
    } finally {
      setLoading(false);
    }
  };

  const getPlatformColor = (platform) => {
    switch (platform.toLowerCase()) {
      case "instagram":
        return COLORS.instagram;
      case "twitter":
        return COLORS.twitter;
      case "threads":
        return COLORS.threads;
      default:
        return "#6B7280";
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "completed":
        return COLORS.completed;
      case "pending":
        return COLORS.pending;
      case "running":
        return COLORS.running;
      case "failed":
        return COLORS.failed;
      default:
        return "#6B7280";
    }
  };

  return (
    <div className="flex-1 flex flex-col gap-6 max-w-6xl mx-auto w-full">
      <div>
        <h2 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-200 to-indigo-400 tracking-tight">
          {t("analytics.title")}
        </h2>
        <p className="text-slate-400 text-sm mt-1">
          {t("analytics.description")}
        </p>
      </div>

      {/* Dashboard Neon Counter Cards */}
      <div className="grid grid-cols-3 gap-6">
        {/* Stat 1 */}
        <div className="bg-slate-900/40 backdrop-blur-md rounded-2xl p-6 border border-slate-800/80 shadow-xl relative overflow-hidden flex flex-col gap-3">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none"></div>
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-bold text-slate-500 tracking-widest uppercase">
              {t("analytics.totalLikesLabel")}
            </span>
            <span className="text-xl">✅</span>
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <h3 className="text-5xl font-black text-emerald-400 shadow-glow shadow-emerald-400/15 animate-fadeIn">
              {stats.total_liked}
            </h3>
            <span className="text-xs text-slate-500 font-semibold">
              {t("analytics.posts")}
            </span>
          </div>
          <p className="text-xs text-slate-500 leading-relaxed mt-2">
            {t("analytics.totalLikesDesc")}
          </p>
        </div>

        {/* Stat 2 */}
        <div className="bg-slate-900/40 backdrop-blur-md rounded-2xl p-6 border border-slate-800/80 shadow-xl relative overflow-hidden flex flex-col gap-3">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-2xl pointer-events-none"></div>
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-bold text-slate-500 tracking-widest uppercase">
              {t("analytics.totalProfilesLabel")}
            </span>
            <span className="text-xl">🎯</span>
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <h3 className="text-5xl font-black text-indigo-400 shadow-glow shadow-indigo-400/15 animate-fadeIn">
              {stats.total_profiles}
            </h3>
            <span className="text-xs text-slate-500 font-semibold">
              {t("analytics.profiles")}
            </span>
          </div>
          <p className="text-xs text-slate-500 leading-relaxed mt-2">
            {t("analytics.totalProfilesDesc")}
          </p>
        </div>

        {/* Stat 3 */}
        <div className="bg-slate-900/40 backdrop-blur-md rounded-2xl p-6 border border-slate-800/80 shadow-xl relative overflow-hidden flex flex-col gap-3">
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-2xl pointer-events-none"></div>
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-bold text-slate-500 tracking-widest uppercase">
              {t("analytics.likedTodayLabel")}
            </span>
            <span className="text-xl">🔥</span>
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <h3 className="text-5xl font-black text-amber-500 shadow-glow shadow-amber-500/15 animate-fadeIn">
              {stats.liked_today}
            </h3>
            <span className="text-xs text-slate-500 font-semibold">
              {t("analytics.posts")}
            </span>
          </div>
          <p className="text-xs text-slate-500 leading-relaxed mt-2">
            {t("analytics.likedTodayDesc")}
          </p>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-2 gap-6">
        {/* Daily Activity Chart */}
        <div className="bg-slate-900/40 backdrop-blur-md rounded-2xl p-6 border border-slate-800/80 shadow-xl">
          <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider mb-4">
            {t("analytics.dailyLikesChart")}
          </h3>
          {loading ? (
            <div className="h-64 flex items-center justify-center text-slate-500">
              {t("analytics.loading")}
            </div>
          ) : dailyData.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-slate-500">
              {t("analytics.noData")}
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={256}>
              <LineChart data={dailyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} />
                <YAxis stroke="#94a3b8" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#0f172a",
                    border: "1px solid #334155",
                    borderRadius: "8px",
                  }}
                  itemStyle={{ color: "#e2e8f0" }}
                />
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke="#10B981"
                  strokeWidth={2}
                  dot={{ fill: "#10B981" }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Platform Distribution Chart */}
        <div className="bg-slate-900/40 backdrop-blur-md rounded-2xl p-6 border border-slate-800/80 shadow-xl">
          <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider mb-4">
            {t("analytics.platformDistribution")}
          </h3>
          {loading ? (
            <div className="h-64 flex items-center justify-center text-slate-500">
              {t("analytics.loading")}
            </div>
          ) : platformData.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-slate-500">
              {t("analytics.noData")}
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={256}>
              <PieChart>
                <Pie
                  data={platformData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) =>
                    `${name}: ${(percent * 100).toFixed(0)}%`
                  }
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {platformData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={getPlatformColor(entry.platform)}
                    />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#0f172a",
                    border: "1px solid #334155",
                    borderRadius: "8px",
                  }}
                  itemStyle={{ color: "#e2e8f0" }}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Batch Job Stats */}
      <div className="bg-slate-900/40 backdrop-blur-md rounded-2xl p-6 border border-slate-800/80 shadow-xl">
        <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider mb-4">
          {t("analytics.batchJobs")}
        </h3>
        {loading ? (
          <div className="h-48 flex items-center justify-center text-slate-500">
            {t("analytics.loading")}
          </div>
        ) : batchStats.length === 0 ? (
          <div className="h-48 flex items-center justify-center text-slate-500">
            {t("analytics.noBatchJobs")}
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={192}>
            <BarChart data={batchStats}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="status" stroke="#94a3b8" fontSize={12} />
              <YAxis stroke="#94a3b8" fontSize={12} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#0f172a",
                  border: "1px solid #334155",
                  borderRadius: "8px",
                }}
                itemStyle={{ color: "#e2e8f0" }}
              />
              <Legend />
              <Bar
                dataKey="count"
                name={t("analytics.jobCount")}
                fill="#6366f1"
              />
              <Bar
                dataKey="total_urls"
                name={t("analytics.totalUrls")}
                fill="#8b5cf6"
              />
              <Bar
                dataKey="successful_urls"
                name={t("analytics.successful")}
                fill="#10B981"
              />
              <Bar
                dataKey="failed_urls"
                name={t("analytics.failed")}
                fill="#EF4444"
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Additional Analytics Info */}
      <div className="bg-slate-900/40 backdrop-blur-md rounded-2xl p-6 border border-slate-800/80 shadow-xl">
        <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider mb-4">
          {t("analytics.activitySummary")}
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-slate-950/50 rounded-xl p-4 border border-slate-800/60">
            <span className="text-[10px] text-slate-500 font-bold uppercase block mb-2">
              {t("analytics.avgPerDay")}
            </span>
            <span className="text-2xl font-black text-slate-200">
              {stats.total_liked > 0 ? Math.round(stats.total_liked / 30) : 0}
            </span>
            <span className="text-xs text-slate-500 ml-1">
              {t("analytics.avgPerDayDesc")}
            </span>
          </div>
          <div className="bg-slate-950/50 rounded-xl p-4 border border-slate-800/60">
            <span className="text-[10px] text-slate-500 font-bold uppercase block mb-2">
              {t("analytics.activityRate")}
            </span>
            <span className="text-2xl font-black text-slate-200">
              {stats.total_liked > 0
                ? ((stats.liked_today / stats.total_liked) * 100).toFixed(1)
                : 0}
              %
            </span>
            <span className="text-xs text-slate-500 ml-1">
              {t("analytics.activityRateDesc")}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
