import React from 'react'
import { TOAST_TYPES } from '../../utils/constants.js'

export function Toast({ show, message, type, onClose }) {
  React.useEffect(() => {
    if (show) {
      const timer = setTimeout(() => {
        onClose()
      }, 4000)
      return () => clearTimeout(timer)
    }
  }, [show, onClose])

  if (!show) return null

  return (
    <div className={`fixed bottom-6 right-6 z-50 px-5 py-3.5 rounded-xl border shadow-2xl flex items-center gap-3 animate-slideInRight select-none
      ${type === TOAST_TYPES.SUCCESS 
        ? 'bg-slate-900 border-emerald-500/30 text-emerald-400' 
        : 'bg-slate-900 border-red-500/30 text-rose-400'
      }
    `}>
      <span className="text-md">{type === TOAST_TYPES.SUCCESS ? '✨' : '⚠️'}</span>
      <span className="text-xs font-bold">{message}</span>
    </div>
  )
}
