/**
 * useDatabase — thin wrapper di atas DataContext.
 *
 * Dipertahankan untuk backward compatibility komponen yang sudah mengimportnya.
 * Untuk komponen baru, gunakan useDataContext() langsung.
 */
import { useDataContext } from '../context/DataContext.jsx'

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
  } = useDataContext()

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
