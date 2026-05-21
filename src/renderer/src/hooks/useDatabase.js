import { useState, useEffect, useCallback } from 'react'

export function useDatabase() {
  const [history, setHistory] = useState([])
  const [stats, setStats] = useState({ total_liked: 0, total_profiles: 0, liked_today: 0 })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const loadHistory = useCallback(async () => {
    if (!window.api || !window.api.getLikedPosts) return
    
    setLoading(true)
    setError(null)
    try {
      const posts = await window.api.getLikedPosts()
      setHistory(posts)
    } catch (err) {
      console.error('Failed to load history:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  const loadDbStats = useCallback(async () => {
    if (!window.api || !window.api.getDbStats) return
    
    setLoading(true)
    setError(null)
    try {
      const dbStats = await window.api.getDbStats()
      setStats(dbStats)
    } catch (err) {
      console.error('Failed to load stats:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  const deleteHistoryItem = useCallback(async (id) => {
    if (!window.api || !window.api.deleteLikedPost) return false
    
    try {
      const res = await window.api.deleteLikedPost(id)
      if (res.success) {
        await loadHistory()
        await loadDbStats()
        return true
      }
      return false
    } catch (err) {
      console.error(err)
      setError(err.message)
      return false
    }
  }, [loadHistory, loadDbStats])

  const clearAllHistory = useCallback(async () => {
    if (!window.api || !window.api.clearHistory) return false
    
    try {
      const res = await window.api.clearHistory()
      if (res.success) {
        await loadHistory()
        await loadDbStats()
        return true
      }
      return false
    } catch (err) {
      console.error(err)
      setError(err.message)
      return false
    }
  }, [loadHistory, loadDbStats])

  useEffect(() => {
    loadHistory()
    loadDbStats()
  }, [loadHistory, loadDbStats])

  return {
    history,
    stats,
    loading,
    error,
    loadHistory,
    loadDbStats,
    deleteHistoryItem,
    clearAllHistory
  }
}
