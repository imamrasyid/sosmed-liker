import React from 'react'
import { useDatabase } from '../../hooks/useDatabase.js'

export function Analytics() {
  const { stats } = useDatabase()

  return (
    <div className="flex-1 flex flex-col gap-6 max-w-6xl mx-auto w-full">
      <div>
        <h2 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-200 to-indigo-400 tracking-tight">
          Analisis & Statistik
        </h2>
        <p className="text-slate-400 text-sm mt-1">Laporan kinerja bot dan parameter database SQLite real-time.</p>
      </div>

      {/* Dashboard Neon Counter Cards */}
      <div className="grid grid-cols-3 gap-6">
        
        {/* Stat 1 */}
        <div className="bg-slate-900/40 backdrop-blur-md rounded-2xl p-6 border border-slate-800/80 shadow-xl relative overflow-hidden flex flex-col gap-3">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none"></div>
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-bold text-slate-500 tracking-widest uppercase">Total Suka Berhasil</span>
            <span className="text-xl">✅</span>
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <h3 className="text-5xl font-black text-emerald-400 shadow-glow shadow-emerald-400/15 animate-fadeIn">
              {stats.total_liked}
            </h3>
            <span className="text-xs text-slate-500 font-semibold">Postingan</span>
          </div>
          <p className="text-xs text-slate-500 leading-relaxed mt-2">Jumlah total postingan yang berhasil disukai secara aman.</p>
        </div>

        {/* Stat 2 */}
        <div className="bg-slate-900/40 backdrop-blur-md rounded-2xl p-6 border border-slate-800/80 shadow-xl relative overflow-hidden flex flex-col gap-3">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-2xl pointer-events-none"></div>
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-bold text-slate-500 tracking-widest uppercase">Target Profil Unik</span>
            <span className="text-xl">🎯</span>
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <h3 className="text-5xl font-black text-indigo-400 shadow-glow shadow-indigo-400/15 animate-fadeIn">
              {stats.total_profiles}
            </h3>
            <span className="text-xs text-slate-500 font-semibold">Profil</span>
          </div>
          <p className="text-xs text-slate-500 leading-relaxed mt-2">Jumlah akun target berbeda yang pernah dikunjungi dan diproses bot.</p>
        </div>

        {/* Stat 3 */}
        <div className="bg-slate-900/40 backdrop-blur-md rounded-2xl p-6 border border-slate-800/80 shadow-xl relative overflow-hidden flex flex-col gap-3">
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-2xl pointer-events-none"></div>
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-bold text-slate-500 tracking-widest uppercase">Disukai Hari Ini</span>
            <span className="text-xl">🔥</span>
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <h3 className="text-5xl font-black text-amber-500 shadow-glow shadow-amber-500/15 animate-fadeIn">
              {stats.liked_today}
            </h3>
            <span className="text-xs text-slate-500 font-semibold">Postingan</span>
          </div>
          <p className="text-xs text-slate-500 leading-relaxed mt-2">Jumlah postingan yang berhasil disukai dalam 24 jam terakhir.</p>
        </div>
      </div>

      {/* Additional Analytics Info */}
      <div className="bg-slate-900/40 backdrop-blur-md rounded-2xl p-6 border border-slate-800/80 shadow-xl">
        <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider mb-4">Ringkasan Aktivitas</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-slate-950/50 rounded-xl p-4 border border-slate-800/60">
            <span className="text-[10px] text-slate-500 font-bold uppercase block mb-2">Rata-rata per Hari</span>
            <span className="text-2xl font-black text-slate-200">
              {stats.total_liked > 0 ? Math.round(stats.total_liked / 30) : 0}
            </span>
            <span className="text-xs text-slate-500 ml-1">post/hari (est.)</span>
          </div>
          <div className="bg-slate-950/50 rounded-xl p-4 border border-slate-800/60">
            <span className="text-[10px] text-slate-500 font-bold uppercase block mb-2">Tingkat Aktivitas</span>
            <span className="text-2xl font-black text-slate-200">
              {stats.total_liked > 0 ? ((stats.liked_today / stats.total_liked) * 100).toFixed(1) : 0}%
            </span>
            <span className="text-xs text-slate-500 ml-1">aktivitas hari ini</span>
          </div>
        </div>
      </div>
    </div>
  )
}
