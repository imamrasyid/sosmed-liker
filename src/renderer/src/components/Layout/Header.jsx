import React from 'react'
import { useAppContext } from '../../context/AppContext.jsx'
import { useConfig } from '../../hooks/useConfig.js'
import { useAutomation } from '../../hooks/useAutomation.js'

export function Header() {
  const { activeTab } = useAppContext()
  const { config, loading: configSaving } = useConfig()
  const { isRunning } = useAutomation()

  return (
    <header className="h-10 bg-slate-900/20 border-b border-slate-800/40 flex items-center justify-between px-8 relative z-20 backdrop-blur-md drag-region">
      <div className="flex items-center gap-2.5 no-drag-region">
        <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
        <span className="text-xs font-bold text-slate-400 select-none uppercase tracking-widest">{activeTab}</span>
      </div>

      <div className="flex items-center gap-4 no-drag-region">
        {configSaving && (
          <span className="text-[10px] text-green-400 flex items-center gap-1.5 font-bold">
            <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Syncing SQLite...
          </span>
        )}
        
        {/* Live Mode State Badge */}
        <div className="flex items-center gap-2 bg-slate-900/80 px-3 py-1 rounded-full border border-slate-800">
          <span className={`w-2 h-2 rounded-full ${isRunning ? 'bg-emerald-500 animate-ping' : 'bg-slate-500'}`}></span>
          <span className="text-[10px] font-bold tracking-wider text-slate-300 uppercase">
            {isRunning ? 'BOT AKTIF' : 'BOT STANDBY'}
          </span>
        </div>

        {/* Custom Window Action Controls */}
        <div className="flex items-center gap-1.5 ml-2 border-l border-slate-800/80 pl-4">
          {/* Minimize Button */}
          <button 
            onClick={() => window.api.minimizeWindow()} 
            className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-800/60 transition-all text-slate-400 hover:text-slate-100 active:scale-[0.9]"
            title="Minimize"
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </button>

          {/* Maximize Button */}
          <button 
            onClick={() => window.api.maximizeWindow()} 
            className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-800/60 transition-all text-slate-400 hover:text-slate-100 active:scale-[0.9]"
            title="Maximize/Restore"
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
            </svg>
          </button>

          {/* Close Button */}
          <button 
            onClick={() => window.api.closeWindow()} 
            className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-red-600/20 hover:text-rose-400 transition-all text-slate-400 active:scale-[0.9]"
            title="Close"
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      </div>
    </header>
  )
}
