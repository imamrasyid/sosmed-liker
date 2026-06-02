/**
 * useDatabase — thin re-export dari AppContext.
 *
 * Semua state history & stats kini hidup di AppContext sebagai single source of truth.
 * Hook ini dipertahankan untuk backward compatibility komponen yang sudah mengimportnya.
 */
import { useAppContext } from '../context/AppContext.jsx'

export function useDatabase() {
  const {
    history,
    stats,
    historyLoading: loading,
    historyError: error,
    loadHistory,
    loadDbStats,
    deleteHistoryItem,
    clearAllHistory,
  } = useAppContext()

  return {
    history,
    stats,
    loading,
    error,
    loadHistory,
    loadDbStats,
    deleteHistoryItem,
    clearAllHistory,
  }
}
