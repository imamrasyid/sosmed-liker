import { useState, useCallback, useEffect, useRef } from 'react'

export function useAutomation() {
  const [isRunning, setIsRunning] = useState(false)
  const [logs, setLogs] = useState([{ type: 'SYSTEM', message: 'Sistem siap. Silakan masukkan URL target.' }])
  const [error, setError] = useState(null)
  const stopFallbackRef = useRef(null)

  // Sinkronisasi isRunning dari main process saat mount — mencegah state stuck
  // jika window reload/crash saat automation berjalan
  useEffect(() => {
    if (!window.api?.automation?.getStatus) return
    window.api.automation.getStatus().then((res) => {
      if (res?.isRunning !== undefined) setIsRunning(res.isRunning)
    }).catch(() => { })
  }, [])

  const handleStart = useCallback(async (targetUrl, selectedPlatform, cookiesStatus) => {
    if (isRunning) return false

    if (!cookiesStatus[selectedPlatform]) {
      setError(`Harap hubungkan akun ${selectedPlatform} Anda terlebih dahulu.`)
      return false
    }

    setIsRunning(true)
    setLogs([{ type: 'SYSTEM', message: `Memulai otomatisasi untuk target: ${targetUrl}...`, time: new Date().toLocaleTimeString() }])

    try {
      const response = await window.api.automation.start(targetUrl)
      if (!response.success) {
        setLogs(prev => [...prev, { type: 'ERROR', message: response.error, time: new Date().toLocaleTimeString() }])
        setIsRunning(false)
        setError(response.error)
        return false
      }
      return true
    } catch (err) {
      setLogs(prev => [...prev, { type: 'ERROR', message: err.message, time: new Date().toLocaleTimeString() }])
      setIsRunning(false)
      setError(err.message)
      return false
    }
  }, [isRunning])

  const handleStop = useCallback(async () => {
    try {
      setLogs(prev => [...prev, { type: 'SYSTEM', message: 'Menghentikan proses otomatisasi...', time: new Date().toLocaleTimeString() }])
      await window.api.automation.stop()

      // Fallback: kalau event onAutomationStopped tidak datang dalam 8 detik
      // (misal browser crash sebelum sempat kirim event), set isRunning false secara paksa
      const fallback = setTimeout(() => {
        setIsRunning((current) => {
          if (current) {
            setLogs(prev => [...prev, { type: 'SYSTEM', message: 'Proses dihentikan (timeout fallback).', time: new Date().toLocaleTimeString() }])
          }
          return false
        })
      }, 8000)

      // Simpan timer id agar bisa dibatalkan jika event normal datang lebih dulu
      stopFallbackRef.current = fallback
    } catch (err) {
      console.error(err)
      setError(err.message)
      setIsRunning(false)
    }
  }, [])

  useEffect(() => {
    if (!window.api) return

    const unsubscribers = []

    if (window.api.automation?.onLog) {
      const unsub = window.api.automation.onLog((message) => {
        let type = 'SYSTEM'
        let cleanMsg = message

        if (message.includes('[SUKSES]')) { type = 'SUKSES'; cleanMsg = message.replace('[SUKSES]', '').trim() }
        else if (message.includes('[SKIP]')) { type = 'SKIP'; cleanMsg = message.replace('[SKIP]', '').trim() }
        else if (message.includes('[ERROR]')) { type = 'ERROR'; cleanMsg = message.replace('[ERROR]', '').trim() }
        else if (message.includes('[ACTION]')) { type = 'ACTION'; cleanMsg = message.replace('[ACTION]', '').trim() }

        setLogs(prev => [...prev, { type, message: cleanMsg, time: new Date().toLocaleTimeString() }])
      })
      unsubscribers.push(unsub)
    }

    if (window.api.automation?.onDone) {
      const unsub = window.api.automation.onDone(() => {
        clearTimeout(stopFallbackRef.current)
        setIsRunning(false)
        setLogs(prev => [...prev, { type: 'SYSTEM', message: 'Proses selesai.', time: new Date().toLocaleTimeString() }])
      })
      unsubscribers.push(unsub)
    }

    if (window.api.automation?.onStopped) {
      const unsub = window.api.automation.onStopped(() => {
        clearTimeout(stopFallbackRef.current)
        setIsRunning(false)
        setLogs(prev => [...prev, { type: 'SYSTEM', message: 'Proses dihentikan.', time: new Date().toLocaleTimeString() }])
      })
      unsubscribers.push(unsub)
    }

    return () => unsubscribers.forEach(unsub => { if (unsub) unsub() })
  }, [])

  const clearLogs = useCallback(() => setLogs([]), [])

  return { isRunning, logs, error, handleStart, handleStop, clearLogs }
}
