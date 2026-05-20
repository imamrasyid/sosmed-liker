import React, { useState, useEffect, useRef } from 'react'
import appLogo from './app_logo_icon.png'

function App() {
  // Navigation State
  const [activeTab, setActiveTab] = useState('dashboard') // 'dashboard', 'history', 'analytics', 'settings'

  // Cookie Setup & Status State
  const [cookiesStatus, setCookiesStatus] = useState({ instagram: false, twitter: false, threads: false })
  const [activeSetupPlatform, setActiveSetupPlatform] = useState('instagram')
  const [cookieInput, setCookieInput] = useState('')
  const [setupStep, setSetupStep] = useState(1)
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' })

  // Input & Status State
  const [targetUrl, setTargetUrl] = useState('')
  const [selectedPlatform, setSelectedPlatform] = useState('instagram')
  const [isRunning, setIsRunning] = useState(false)
  
  // Custom Log State
  const [logs, setLogs] = useState([{ type: 'SYSTEM', message: 'Sistem siap. Silakan masukkan URL target.' }])
  const [logSearch, setLogSearch] = useState('')
  const [logFilter, setLogFilter] = useState('ALL') // 'ALL', 'SUKSES', 'SKIP', 'ERROR', 'SYSTEM'
  const [autoScroll, setAutoScroll] = useState(true)
  const logContainerRef = useRef(null)

  // SQLite Database & Stats State
  const [history, setHistory] = useState([])
  const [historySearch, setHistorySearch] = useState('')
  const [stats, setStats] = useState({ total_liked: 0, total_profiles: 0, liked_today: 0 })
  const [confirmClearDb, setConfirmClearDb] = useState(false)
  const [updateInfo, setUpdateInfo] = useState(null)
  const [updateModalOpen, setUpdateModalOpen] = useState(false)
  const [checkingForUpdates, setCheckingForUpdates] = useState(false)
  const [appVersion, setAppVersion] = useState('1.0.0')

  // Config/Settings State
  const [minDelay, setMinDelay] = useState(3000)
  const [maxDelay, setMaxDelay] = useState(6000)
  const [limit, setLimit] = useState(20)
  const [headless, setHeadless] = useState(false)
  const [fbReaction, setFbReaction] = useState('like')
  const [configSaving, setConfigSaving] = useState(false)

  // Advanced Config/Settings State
  const [consecutiveSkipsLimit, setConsecutiveSkipsLimit] = useState(5)
  const [scrollStep, setScrollStep] = useState(1000)
  const [maxScrollAttempts, setMaxScrollAttempts] = useState(20)
  const [userAgent, setUserAgent] = useState('Default')

  // Sidebar Collapsible States
  const [expandedGroups, setExpandedGroups] = useState({
    'dashboard-group': true,
    'campaigns-group': true,
    'credentials-group': true,
    'database-group': true,
    'analytics-group': true,
    'settings-group': true
  })

  const runUpdateCheck = async (silent = false) => {
    if (window.api && window.api.checkForUpdates) {
      if (!silent) setCheckingForUpdates(true)
      try {
        const res = await window.api.checkForUpdates()
        if (res && res.updateAvailable) {
          setUpdateInfo(res)
          setUpdateModalOpen(true)
          if (!silent) {
            showToast('Pembaruan baru tersedia!', 'success')
          }
        } else {
          if (!silent) {
            showToast('Aplikasi Anda sudah menggunakan versi terbaru.', 'success')
          }
        }
      } catch (err) {
        console.error('Failed to check for updates:', err)
        if (!silent) {
          showToast('Gagal memeriksa pembaruan.', 'error')
        }
      } finally {
        if (!silent) setCheckingForUpdates(false)
      }
    }
  }

  // 1. Initial Load: Fetch History, Stats, and Settings from SQLite
  useEffect(() => {
    loadDbStats()
    loadHistory()
    loadConfigurations()
    checkAllCookiesStatus()
    loadAppVersion()
    runUpdateCheck(true)

    // Listen to real-time logs from Playwright main process
    if (window.api && window.api.onAutomationLog) {
      window.api.onAutomationLog((message) => {
        // Parse log type
        let type = 'SYSTEM'
        let cleanMsg = message

        if (message.includes('[SUKSES]')) {
          type = 'SUKSES'
          cleanMsg = message.replace('[SUKSES]', '').trim()
          // Refresh database & stats in real-time on success!
          loadDbStats()
          loadHistory()
        } else if (message.includes('[SKIP]')) {
          type = 'SKIP'
          cleanMsg = message.replace('[SKIP]', '').trim()
          loadDbStats()
          loadHistory()
        } else if (message.includes('[ERROR]')) {
          type = 'ERROR'
          cleanMsg = message.replace('[ERROR]', '').trim()
        } else if (message.includes('[ACTION]')) {
          type = 'ACTION'
          cleanMsg = message.replace('[ACTION]', '').trim()
        }

        setLogs(prev => [...prev, { type, message: cleanMsg, time: new Date().toLocaleTimeString() }])

        if (message.includes('Proses otomatisasi selesai') || message.includes('Proses dihentikan secara manual')) {
          setIsRunning(false)
          loadDbStats()
          loadHistory()
        }
      })
    }
  }, [])

  // Auto-scroll logs
  useEffect(() => {
    if (autoScroll && logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight
    }
  }, [logs, autoScroll, activeTab])

  const loadAppVersion = async () => {
    if (window.api && window.api.getAppVersion) {
      try {
        const version = await window.api.getAppVersion()
        setAppVersion(version)
      } catch (err) {
        console.error('Failed to load app version:', err)
      }
    }
  }

  // Database Load Helpers
  const loadDbStats = async () => {
    if (window.api && window.api.getDbStats) {
      try {
        const dbStats = await window.api.getDbStats()
        setStats(dbStats)
      } catch (err) {
        console.error('Failed to load stats:', err)
      }
    }
  }

  const loadHistory = async () => {
    if (window.api && window.api.getLikedPosts) {
      try {
        const posts = await window.api.getLikedPosts()
        setHistory(posts)
      } catch (err) {
        console.error('Failed to load history:', err)
      }
    }
  }

  const handleUrlChange = (val) => {
    setTargetUrl(val)
    const lower = val.toLowerCase()
    if (lower.includes('instagram.com')) {
      setSelectedPlatform('instagram')
    } else if (lower.includes('twitter.com') || lower.includes('x.com')) {
      setSelectedPlatform('twitter')
    } else if (lower.includes('facebook.com')) {
      // Facebook saat ini dinonaktifkan
    } else if (lower.includes('threads.net') || lower.includes('threads.com')) {
      setSelectedPlatform('threads')
    }
  }

  const handleOpenPostUrl = (item) => {
    let url = ''
    switch (item.platform) {
      case 'instagram':
        url = `https://www.instagram.com/p/${item.post_id}/`
        break
      case 'twitter':
        url = `https://x.com/x/status/${item.post_id.replace('tw_post_', '')}`
        break
      case 'facebook':
        url = `https://www.facebook.com/${item.post_id.replace('fb_post_', '')}`
        break
      case 'threads':
        url = `https://www.threads.net/post/${item.post_id.replace('th_post_', '')}`
        break
      default:
        url = `https://www.instagram.com/p/${item.post_id}/`
    }
    handleOpenExternal(url)
  }

  const getPlaceholder = () => {
    switch (selectedPlatform) {
      case 'instagram': return 'https://www.instagram.com/username/'
      case 'twitter': return 'https://x.com/username/'
      case 'facebook': return 'https://www.facebook.com/username/'
      case 'threads': return 'https://www.threads.net/@username/'
      default: return 'https://www.instagram.com/username/'
    }
  }

  const loadConfigurations = async () => {
    if (window.api && window.api.getConfig) {
      try {
        const minVal = await window.api.getConfig('min_delay')
        const maxVal = await window.api.getConfig('max_delay')
        const limitVal = await window.api.getConfig('limit')
        const headlessVal = await window.api.getConfig('headless')

        if (minVal) setMinDelay(parseInt(minVal, 10))
        if (maxVal) setMaxDelay(parseInt(maxVal, 10))
        if (limitVal) setLimit(parseInt(limitVal, 10))
        if (headlessVal) setHeadless(headlessVal === 'true')

        const fbReactionVal = await window.api.getConfig('fb_reaction')
        if (fbReactionVal) setFbReaction(fbReactionVal)

        // Load new configurations
        const skipsLimitVal = await window.api.getConfig('consecutive_skips_limit')
        if (skipsLimitVal) setConsecutiveSkipsLimit(parseInt(skipsLimitVal, 10))

        const scrollStepVal = await window.api.getConfig('scroll_step')
        if (scrollStepVal) setScrollStep(parseInt(scrollStepVal, 10))

        const maxAttemptsVal = await window.api.getConfig('max_scroll_attempts')
        if (maxAttemptsVal) setMaxScrollAttempts(parseInt(maxAttemptsVal, 10))

        const userAgentVal = await window.api.getConfig('browser_user_agent')
        if (userAgentVal) setUserAgent(userAgentVal)
      } catch (err) {
        console.error('Failed to load configs:', err)
      }
    }
  }

  // Config Update Helper
  const handleSaveConfig = async (key, value) => {
    if (window.api && window.api.saveConfig) {
      setConfigSaving(true)
      try {
        await window.api.saveConfig(key, value.toString())
      } catch (err) {
        console.error('Failed to save config:', err)
      } finally {
        setTimeout(() => setConfigSaving(false), 500)
      }
    }
  }

  const checkAllCookiesStatus = async () => {
    if (window.api && window.api.checkCookiesStatus) {
      try {
        const statuses = await window.api.checkCookiesStatus()
        setCookiesStatus(statuses)
      } catch (err) {
        console.error('Failed to check cookies status:', err)
      }
    }
  }

  const handleSaveCookie = async () => {
    if (!cookieInput.trim()) {
      showToast('Harap tempel isi cookie Netscape Anda.', 'error')
      return
    }

    if (window.api && window.api.saveCookie) {
      try {
        const res = await window.api.saveCookie(activeSetupPlatform, cookieInput)
        if (res.success) {
          showToast(`Cookie ${activeSetupPlatform} berhasil disimpan & dihubungkan!`, 'success')
          setCookieInput('')
          setSetupStep(1)
          checkAllCookiesStatus()
        } else {
          showToast(`Gagal menyimpan cookie: ${res.error}`, 'error')
        }
      } catch (err) {
        showToast(`Terjadi kesalahan: ${err.message}`, 'error')
      }
    }
  }

  const handleDeleteCookie = async (platform) => {
    if (window.api && window.api.deleteCookie) {
      try {
        const res = await window.api.deleteCookie(platform)
        if (res.success) {
          showToast(`Koneksi akun ${platform} berhasil diputus.`, 'success')
          checkAllCookiesStatus()
        } else {
          showToast(`Gagal memutuskan koneksi: ${res.error}`, 'error')
        }
      } catch (err) {
        showToast(`Terjadi kesalahan: ${err.message}`, 'error')
      }
    }
  }

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type })
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 4000)
  }

  // Actions
  const handleStart = async () => {
    if (isRunning) return

    // Safety guard: ensure the account is connected
    if (!cookiesStatus[selectedPlatform]) {
      showToast(`Harap hubungkan akun ${selectedPlatform} Anda terlebih dahulu.`, 'error')
      setActiveTab('accounts')
      setSetupStep(1)
      setActiveSetupPlatform(selectedPlatform)
      return
    }

    setIsRunning(true)
    setLogs([{ type: 'SYSTEM', message: `Memulai otomatisasi untuk target: ${targetUrl}...`, time: new Date().toLocaleTimeString() }])
    
    try {
      const response = await window.api.startAutomation(targetUrl)
      if (!response.success) {
        setLogs(prev => [...prev, { type: 'ERROR', message: response.error, time: new Date().toLocaleTimeString() }])
        setIsRunning(false)
      }
    } catch (error) {
      setLogs(prev => [...prev, { type: 'ERROR', message: error.message, time: new Date().toLocaleTimeString() }])
      setIsRunning(false)
    }
  }

  const handleStop = async () => {
    try {
      setLogs(prev => [...prev, { type: 'SYSTEM', message: 'Menghentikan proses otomatisasi...', time: new Date().toLocaleTimeString() }])
      await window.api.stopAutomation()
    } catch (error) {
      console.error(error)
    }
  }

  const handleDeleteHistoryItem = async (id) => {
    if (window.api && window.api.deleteLikedPost) {
      try {
        const res = await window.api.deleteLikedPost(id)
        if (res.success) {
          loadHistory()
          loadDbStats()
        }
      } catch (err) {
        console.error(err)
      }
    }
  }

  const handleClearAllHistory = async () => {
    if (window.api && window.api.clearHistory) {
      try {
        const res = await window.api.clearHistory()
        if (res.success) {
          setConfirmClearDb(false)
          loadHistory()
          loadDbStats()
        }
      } catch (err) {
        console.error(err)
      }
    }
  }

  const handleDownloadLogs = () => {
    const textContent = logs.map(l => `[${l.time || 'SYSTEM'}] [${l.type}] ${l.message}`).join('\n')
    const blob = new Blob([textContent], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `liker_logs_${new Date().toISOString().slice(0,10)}.txt`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const handleOpenExternal = (url) => {
    if (window.electron && window.electron.ipcRenderer) {
      // Open externally via electron main shell
      window.api.ping().then(() => {
        // Safe check
        window.open(url, '_blank')
      }).catch(() => {
        window.open(url, '_blank')
      })
    } else {
      window.open(url, '_blank')
    }
  }

  // Log Filtering Logic
  const filteredLogs = logs.filter(log => {
    const matchesSearch = log.message.toLowerCase().includes(logSearch.toLowerCase())
    if (logFilter === 'ALL') return matchesSearch
    return log.type === logFilter && matchesSearch
  })

  // History Filtering Logic
  const filteredHistory = history.filter(item => {
    const term = historySearch.toLowerCase()
    return item.target_profile.toLowerCase().includes(term) || item.post_id.toLowerCase().includes(term)
  })

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 font-sans antialiased overflow-hidden select-none bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-950/20 via-slate-950 to-slate-950">
      
      {/* SIDEBAR NAVIGATION */}
      <aside className="w-64 bg-slate-900/60 backdrop-blur-xl border-r border-slate-800/80 flex flex-col justify-between h-full shadow-2xl relative z-10">
        <div>
          {/* Custom App Title Bar Header */}
          <div className="h-10 drag-region flex items-center px-6 border-b border-slate-800/50 bg-slate-950/50">
            <span className="text-[10px] font-black tracking-widest text-slate-500 uppercase">BOT PLATFORM v1.1</span>
          </div>

          {/* Glowing Brand Header */}
          <div className="p-5 border-b border-slate-800/40 bg-slate-950/20">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-pink-500 p-[2px] shadow-lg shadow-indigo-500/20">
                <div className="h-full w-full rounded-[10px] bg-slate-950 flex items-center justify-center overflow-hidden">
                  <img src={appLogo} alt="App Logo" className="h-full w-full object-cover rounded-[10px]" />
                </div>
              </div>
              <div>
                <h1 className="text-md font-bold tracking-tight bg-gradient-to-r from-white via-slate-200 to-indigo-300 bg-clip-text text-transparent">SOSMED LIKER</h1>
                <p className="text-[10px] text-indigo-400/80 font-semibold tracking-wider uppercase">Automation Suite</p>
              </div>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="px-3 py-4 space-y-4 overflow-y-auto max-h-[calc(100vh-210px)] select-none">
            {[
              {
                title: 'Pusat Kendali',
                items: [
                  {
                    id: 'dashboard-group',
                    label: 'Dasbor Utama',
                    icon: (
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2v-4zM14 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2v-4z" />
                      </svg>
                    ),
                    subItems: [
                      { id: 'dashboard-main', label: 'Ringkasan Dasbor', action: () => { setActiveTab('dashboard') } }
                    ]
                  },
                  {
                    id: 'campaigns-group',
                    label: 'Kampanye Liker',
                    icon: (
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    ),
                    subItems: [
                      { id: 'camp-ig', label: 'Instagram Kampanye', action: () => { setActiveTab('dashboard'); setSelectedPlatform('instagram'); } },
                      { id: 'camp-tw', label: 'Twitter / X Kampanye', action: () => { setActiveTab('dashboard'); setSelectedPlatform('twitter'); } },
                      { id: 'camp-th', label: 'Threads Kampanye', action: () => { setActiveTab('dashboard'); setSelectedPlatform('threads'); } }
                    ]
                  }
                ]
              },
              {
                title: 'Manajemen Data',
                items: [
                  {
                    id: 'credentials-group',
                    label: 'Kredensial Sesi',
                    icon: (
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 7a2 2 0 012 2m-2 4a2 2 0 012 2m-2-4a2 2 0 11-4 0 2 2 0 014 0zM8 21h8a2 2 0 002-2v-9a2 2 0 00-2-2H8a2 2 0 00-2 2v9a2 2 0 002 2z" />
                      </svg>
                    ),
                    subItems: [
                      { id: 'cred-ig', label: 'Kuki Instagram', action: () => { setActiveTab('accounts'); setActiveSetupPlatform('instagram'); setSetupStep(1); } },
                      { id: 'cred-tw', label: 'Kuki Twitter / X', action: () => { setActiveTab('accounts'); setActiveSetupPlatform('twitter'); setSetupStep(1); } },
                      { id: 'cred-th', label: 'Kuki Threads', action: () => { setActiveTab('accounts'); setActiveSetupPlatform('threads'); setSetupStep(1); } }
                    ]
                  },
                  {
                    id: 'database-group',
                    label: 'Basis Data SQLite',
                    icon: (
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 7v10c0 2.21 3.58 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.58 4 8 4s8-1.79 8-4M4 7c0 2.21 3.58 4 8 4s8-1.79 8-4M4 7c0-2.21 3.58-4 8-4s8 1.79 8 4m0 5c0 2.21-3.58 4-8 4s-8-1.79-8-4" />
                      </svg>
                    ),
                    subItems: [
                      { id: 'history', label: 'Tabel Riwayat Liker', action: () => { setActiveTab('history'); loadHistory(); } }
                    ]
                  }
                ]
              },
              {
                title: 'Konfigurasi & Analitis',
                items: [
                  {
                    id: 'analytics-group',
                    label: 'Analitis & Statistik',
                    icon: (
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 002 2h2a2 2 0 002-2z" />
                      </svg>
                    ),
                    subItems: [
                      { id: 'analytics', label: 'Ringkasan Laporan', action: () => { setActiveTab('analytics'); loadDbStats(); } }
                    ]
                  },
                  {
                    id: 'settings-group',
                    label: 'Konfigurasi Sistem',
                    icon: (
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      </svg>
                    ),
                    subItems: [
                      { id: 'settings', label: 'Parameter Automaton', action: () => { setActiveTab('settings'); } },
                      { id: 'settings-app', label: 'Sistem & Database', action: () => { setActiveTab('settings-app'); } }
                    ]
                  }
                ]
              }
            ].map((section, sIdx) => (
              <div key={sIdx} className="space-y-2">
                {/* Level 1: Category Header */}
                <span className="text-[10px] font-extrabold tracking-widest text-slate-500 uppercase px-3 block select-none">
                  {section.title}
                </span>
                
                <div className="space-y-1">
                  {section.items.map(item => {
                    const isExpanded = expandedGroups[item.id]
                    // Determine if any child is active
                    const isChildActive = item.subItems.some(sub => {
                      if (sub.id === 'dashboard-main') return activeTab === 'dashboard' && selectedPlatform === 'instagram' // default summary
                      if (sub.id === 'camp-ig') return activeTab === 'dashboard' && selectedPlatform === 'instagram'
                      if (sub.id === 'camp-tw') return activeTab === 'dashboard' && selectedPlatform === 'twitter'
                      if (sub.id === 'camp-th') return activeTab === 'dashboard' && selectedPlatform === 'threads'
                      if (sub.id === 'cred-ig') return activeTab === 'accounts' && activeSetupPlatform === 'instagram'
                      if (sub.id === 'cred-tw') return activeTab === 'accounts' && activeSetupPlatform === 'twitter'
                      if (sub.id === 'cred-th') return activeTab === 'accounts' && activeSetupPlatform === 'threads'
                      return activeTab === sub.id
                    })

                    return (
                      <div key={item.id} className="space-y-0.5">
                        {/* Level 2: Collapsible Main Menu Item */}
                        <button
                          onClick={() => {
                            setExpandedGroups(prev => ({ ...prev, [item.id]: !prev[item.id] }))
                          }}
                          className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all duration-300 group
                            ${isChildActive
                              ? 'bg-indigo-650/15 text-indigo-300 border border-indigo-500/20'
                              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/35 border border-transparent'
                            }
                          `}
                        >
                          <div className="flex items-center gap-2.5">
                            <span className={`transition-transform duration-300 group-hover:scale-110 ${isChildActive ? 'text-indigo-400' : 'text-slate-500 group-hover:text-slate-300'}`}>
                              {item.icon}
                            </span>
                            <span>{item.label}</span>
                          </div>
                          
                          {/* Toggle caret down/right */}
                          <svg
                            className={`w-3 h-3 text-slate-500 transition-transform duration-300 ${isExpanded ? 'rotate-90 text-indigo-400' : ''}`}
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth="2.5"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                          </svg>
                        </button>

                        {/* Level 3: Sub Items */}
                        {isExpanded && (
                          <div className="pl-6 pr-1 py-1 space-y-1 border-l border-slate-800/60 ml-5 transition-all duration-350">
                            {item.subItems.map(sub => {
                              let isActive = false
                              if (sub.id === 'dashboard-main') isActive = activeTab === 'dashboard' && selectedPlatform === 'instagram'
                              else if (sub.id === 'camp-ig') isActive = activeTab === 'dashboard' && selectedPlatform === 'instagram'
                              else if (sub.id === 'camp-tw') isActive = activeTab === 'dashboard' && selectedPlatform === 'twitter'
                              else if (sub.id === 'camp-th') isActive = activeTab === 'dashboard' && selectedPlatform === 'threads'
                              else if (sub.id === 'cred-ig') isActive = activeTab === 'accounts' && activeSetupPlatform === 'instagram'
                              else if (sub.id === 'cred-tw') isActive = activeTab === 'accounts' && activeSetupPlatform === 'twitter'
                              else if (sub.id === 'cred-th') isActive = activeTab === 'accounts' && activeSetupPlatform === 'threads'
                              else isActive = activeTab === sub.id

                              return (
                                <button
                                  key={sub.id}
                                  onClick={sub.action}
                                  className={`w-full flex items-center justify-between py-1.5 px-3 rounded-lg text-[10.5px] font-semibold transition-all duration-205 relative group
                                    ${isActive
                                      ? 'text-indigo-400 font-bold bg-indigo-500/5'
                                      : 'text-slate-500 hover:text-slate-350'
                                    }
                                  `}
                                >
                                  <div className="flex items-center gap-2">
                                    <span className={`w-1 h-1 rounded-full transition-all duration-300 ${isActive ? 'bg-indigo-400 scale-125' : 'bg-slate-700 group-hover:bg-slate-550'}`}></span>
                                    <span>{sub.label}</span>
                                  </div>
                                  
                                  {isActive && (
                                    <span className="w-1 h-1 rounded-full bg-indigo-400 animate-ping"></span>
                                  )}
                                </button>
                              )
                            })}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </nav>
        </div>

        {/* Sidebar Footer Stats */}
        <div className="p-4 border-t border-slate-800/50 bg-slate-950/20">
          <div className="bg-slate-900/80 border border-slate-800/60 rounded-xl p-3.5 flex flex-col gap-1.5 relative overflow-hidden">
            <span className="text-[10px] font-bold text-slate-500 tracking-wider uppercase">DATABASE STATUS</span>
            <div className="flex justify-between items-baseline">
              <span className="text-xl font-black text-indigo-400 shadow-glow shadow-indigo-400/10">{stats.total_liked}</span>
              <span className="text-[11px] font-semibold text-slate-400">Total Likes</span>
            </div>
            <div className="w-full bg-slate-800 h-[3px] rounded-full overflow-hidden mt-1">
              <div className="bg-gradient-to-r from-indigo-500 to-pink-500 h-full rounded-full w-full"></div>
            </div>
          </div>
        </div>
      </aside>

      {/* MAIN CONTAINER CONTENT */}
      <main className="flex-1 flex flex-col h-full overflow-hidden no-drag-region">
        {/* Custom App Frame Header */}
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

        {/* CONTAINER CONTENT PER ACTIVE TAB */}
        <div className="flex-1 p-8 overflow-y-auto min-h-0 flex flex-col gap-6 relative">
          
          {/* TAB 1: DASHBOARD CONTROL CENTER */}
          {activeTab === 'dashboard' && (
            <div className="flex-1 flex flex-col gap-6 max-w-6xl mx-auto w-full">
              {/* Dynamic Header */}
              <div>
                <h2 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-200 to-indigo-400 tracking-tight">
                  Control Center
                </h2>
                <p className="text-slate-400 text-sm mt-1">Sistem otomatisasi interaksi cerdas bertenaga Playwright & SQLite.</p>
              </div>

              {/* PLATFORM SELECTOR TAB BAR */}
              <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 rounded-2xl p-2.5 flex flex-wrap gap-2.5 shadow-xl relative z-10">
                {[
                  { id: 'instagram', name: 'Instagram', activeBg: 'bg-gradient-to-r from-pink-600/80 to-rose-600/80 border-pink-500/30', activeGlow: 'shadow-pink-500/25', icon: (
                    <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                    </svg>
                  )},
                  { id: 'twitter', name: 'Twitter / X', activeBg: 'bg-gradient-to-r from-slate-850 to-slate-950 border-slate-700/50', activeGlow: 'shadow-slate-500/25', icon: (
                    <svg className="w-4.5 h-4.5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                    </svg>
                  )},
                  { id: 'facebook', name: 'Facebook', isDisabled: true, badge: 'OFF', activeBg: 'bg-gradient-to-r from-blue-600 to-indigo-600 border-blue-500/30', activeGlow: 'shadow-blue-500/25', icon: (
                    <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
                    </svg>
                  )},
                  { id: 'threads', name: 'Threads', activeBg: 'bg-gradient-to-r from-zinc-800 to-stone-900 border-zinc-700/50', activeGlow: 'shadow-zinc-500/25', icon: (
                    <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                      <path d="M16 12a4 4 0 1 0-8 0 4 4 0 0 0 8 0zm0 0v1.5a2.5 2.5 0 0 0 5 0V12a9 9 0 1 0-9 9m4.5-1.206a8.959 8.959 0 0 1-4.5 1.206" />
                    </svg>
                  )}
                ].map(platform => (
                  <button
                    key={platform.id}
                    disabled={isRunning || platform.isDisabled}
                    onClick={() => !platform.isDisabled && setSelectedPlatform(platform.id)}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all duration-300 relative group border select-none
                      ${platform.isDisabled 
                        ? 'bg-slate-950/20 text-slate-600 border-slate-950/40 cursor-not-allowed opacity-50'
                        : selectedPlatform === platform.id
                          ? `${platform.activeBg} text-white shadow-lg ${platform.activeGlow}`
                          : 'bg-slate-950/40 text-slate-400 hover:text-slate-200 border-slate-900/60 hover:bg-slate-800/20 disabled:opacity-40 disabled:hover:text-slate-400 disabled:hover:bg-transparent'
                      }
                    `}
                  >
                    {platform.icon}
                    <span>{platform.name}</span>
                    {platform.badge && (
                      <span className="px-1.5 py-0.5 bg-red-500/10 text-red-500 border border-red-500/20 rounded-md text-[9px] font-black uppercase tracking-wider select-none">
                        {platform.badge}
                      </span>
                    )}
                    {selectedPlatform === platform.id && (
                      <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-4 h-[3px] rounded-full bg-white/80 animate-pulse"></span>
                    )}
                  </button>
                ))}
              </div>

              {/* Control Panel Grid */}
              <div className="grid grid-cols-3 gap-6">
                
                {/* Input Card Container (Spans 2 columns) */}
                <div className="col-span-2 bg-slate-900/40 backdrop-blur-md rounded-2xl p-6 border border-slate-800/80 flex flex-col justify-between gap-5 relative overflow-hidden shadow-xl">
                  {/* Decorative glowing gradient radial block */}
                  <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none"></div>
                  
                  <div className="flex flex-col gap-4">
                    <div className="flex justify-between items-center">
                      <label className="text-sm font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                        <span>Target Profile {selectedPlatform === 'twitter' ? 'Twitter / X' : selectedPlatform.charAt(0).toUpperCase() + selectedPlatform.slice(1)}</span>
                      </label>
                      <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border select-none uppercase
                        ${selectedPlatform === 'instagram' ? 'text-pink-400 bg-pink-500/10 border-pink-500/20' : ''}
                        ${selectedPlatform === 'twitter' ? 'text-slate-300 bg-slate-500/10 border-slate-500/20' : ''}
                        ${selectedPlatform === 'facebook' ? 'text-blue-400 bg-blue-500/10 border-blue-500/20' : ''}
                        ${selectedPlatform === 'threads' ? 'text-zinc-400 bg-zinc-500/10 border-zinc-500/20' : ''}
                      `}>
                        {selectedPlatform === 'twitter' ? 'Twitter / X' : selectedPlatform} Platform
                      </span>
                    </div>
                    
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                        </svg>
                      </div>
                      <input 
                        type="url" 
                        value={targetUrl}
                        onChange={(e) => handleUrlChange(e.target.value)}
                        disabled={isRunning}
                        placeholder={getPlaceholder()}
                        className="w-full bg-slate-950/80 border border-slate-800 rounded-xl pl-11 pr-4 py-3.5 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all duration-300 disabled:opacity-50 font-medium placeholder-slate-600"
                      />
                    </div>

                    {/* Facebook Reaction Selector */}
                    {selectedPlatform === 'facebook' && (
                      <div className="flex flex-col gap-2.5 mt-1 border-t border-slate-800/40 pt-4 animate-fadeIn">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                          Pilih Tipe Reaksi Facebook:
                        </span>
                        <div className="grid grid-cols-7 gap-2">
                           {[
                             { id: 'like', label: 'Like', emoji: '👍', activeColor: 'text-blue-400 bg-blue-500/10 border-blue-500/30 shadow-blue-500/10' },
                             { id: 'love', label: 'Love', emoji: '❤️', activeColor: 'text-rose-400 bg-rose-500/10 border-rose-500/30 shadow-rose-500/10' },
                             { id: 'care', label: 'Care', emoji: '🥰', activeColor: 'text-amber-400 bg-amber-500/10 border-amber-500/30 shadow-amber-500/10' },
                             { id: 'haha', label: 'Haha', emoji: '😆', activeColor: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30 shadow-yellow-500/10' },
                             { id: 'wow', label: 'Wow', emoji: '😮', activeColor: 'text-teal-400 bg-teal-500/10 border-teal-500/30 shadow-teal-500/10' },
                             { id: 'sad', label: 'Sad', emoji: '😢', activeColor: 'text-sky-400 bg-sky-500/10 border-sky-500/30 shadow-sky-500/10' },
                             { id: 'angry', label: 'Angry', emoji: '😡', activeColor: 'text-red-400 bg-red-500/10 border-red-500/30 shadow-red-500/10' }
                           ].map(item => (
                             <button
                               key={item.id}
                               disabled={isRunning}
                               onClick={() => {
                                 setFbReaction(item.id)
                                 handleSaveConfig('fb_reaction', item.id)
                               }}
                               className={`flex flex-col items-center justify-center gap-1.5 py-2 rounded-xl border transition-all duration-300 hover:scale-[1.03] select-none cursor-pointer
                                 ${fbReaction === item.id
                                   ? `${item.activeColor} shadow-lg border-opacity-100 font-bold scale-[1.02]`
                                   : 'bg-slate-950/40 text-slate-400 border-slate-900/60 hover:text-slate-200 hover:bg-slate-800/20 disabled:opacity-50 disabled:hover:scale-100'
                                 }
                               `}
                             >
                               <span className="text-xl select-none">{item.emoji}</span>
                               <span className="text-[10px] tracking-wide select-none">{item.label}</span>
                             </button>
                           ))}
                        </div>
                      </div>
                    )}
                  </div>

                    {/* Cookie Status Indicator & Check Button */}
                    <div className="flex items-center justify-between p-3.5 rounded-xl border bg-slate-950/50 mt-2 mb-1 border-slate-800/80">
                      <div className="flex items-center gap-3">
                        <span className={`w-2.5 h-2.5 rounded-full ${cookiesStatus[selectedPlatform] ? 'bg-emerald-500 shadow-glow shadow-emerald-500/50' : 'bg-rose-500 shadow-glow shadow-rose-500/50'}`}></span>
                        <div>
                          <span className="text-xs font-bold text-slate-200 block">
                            Status Kuki Sesi: <span className={cookiesStatus[selectedPlatform] ? 'text-emerald-400' : 'text-rose-400'}>{cookiesStatus[selectedPlatform] ? 'Tersedia & Valid' : 'Belum Dikonfigurasi'}</span>
                          </span>
                          <span className="text-[10px] text-slate-500 block">Otomatisasi memerlukan berkas kuki login.</span>
                        </div>
                      </div>
                      
                      <button
                        onClick={async () => {
                          await checkAllCookiesStatus()
                          if (cookiesStatus[selectedPlatform]) {
                            showToast(`Sistem mendeteksi kuki ${selectedPlatform} valid dan siap digunakan!`, 'success')
                          } else {
                            showToast(`Kuki ${selectedPlatform} tidak ditemukan. Mengalihkan ke halaman konfigurasi...`, 'error')
                            setActiveTab('accounts')
                            setSetupStep(1)
                            setActiveSetupPlatform(selectedPlatform)
                          }
                        }}
                        className={`px-4 py-2 rounded-lg text-[11px] font-bold transition-all duration-300 border flex items-center gap-1.5
                          ${cookiesStatus[selectedPlatform] 
                            ? 'bg-slate-900 border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white' 
                            : 'bg-rose-600/20 border-rose-500/30 text-rose-400 hover:bg-rose-600/30'
                          }
                        `}
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {cookiesStatus[selectedPlatform] ? 'Periksa Kuki' : 'Setup Kuki'}
                      </button>
                    </div>

                  <div className="flex gap-4">
                    <button 
                      onClick={handleStart}
                      disabled={isRunning || !targetUrl}
                      className={`flex-1 py-3.5 px-6 rounded-xl font-bold text-sm text-white transition-all duration-300 shadow-xl flex justify-center items-center gap-2.5 border
                        ${isRunning || !targetUrl
                          ? 'bg-slate-800/40 border-slate-700/50 text-slate-500 cursor-not-allowed shadow-none' 
                          : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 border-indigo-400/20 hover:shadow-indigo-500/20 active:scale-[0.98]'
                        }
                      `}
                    >
                      {isRunning ? (
                        <>
                          <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          <span>PROSES BERJALAN...</span>
                        </>
                      ) : (
                        <>
                          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span>MULAI OTOMATISASI</span>
                        </>
                      )}
                    </button>

                    {isRunning && (
                      <button 
                        onClick={handleStop}
                        className="py-3.5 px-6 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 transition-all duration-300 border border-red-500/20 hover:shadow-red-500/25 shadow-xl active:scale-[0.98]"
                      >
                        HENTIKAN
                      </button>
                    )}
                  </div>
                </div>

                {/* Right Quick Info Card */}
                <div className="bg-slate-900/40 backdrop-blur-md rounded-2xl p-6 border border-slate-800/80 flex flex-col justify-between gap-4 relative overflow-hidden shadow-xl">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 rounded-full blur-2xl pointer-events-none"></div>
                  
                  <span className="text-[10px] font-bold text-slate-500 tracking-widest uppercase">Info Konfigurasi Aktif</span>
                  
                  <div className="flex-1 flex flex-col justify-center gap-3">
                    <div className="flex justify-between items-center border-b border-slate-800/50 pb-2">
                      <span className="text-xs text-slate-400 font-medium">Headless Mode</span>
                      <span className={`text-xs font-bold ${headless ? 'text-amber-400' : 'text-indigo-400'}`}>{headless ? 'AKTIF (Silent)' : 'NONAKTIF (Browser Muncul)'}</span>
                    </div>
                    <div className="flex justify-between items-center border-b border-slate-800/50 pb-2">
                      <span className="text-xs text-slate-400 font-medium">Post Limit</span>
                      <span className="text-xs font-bold text-slate-200">{limit} Post</span>
                    </div>
                    <div className="flex justify-between items-center pb-1">
                      <span className="text-xs text-slate-400 font-medium">Delay Range</span>
                      <span className="text-xs font-bold text-slate-200">{minDelay / 1000}s - {maxDelay / 1000}s</span>
                    </div>
                  </div>
                  
                  <button 
                    onClick={() => setActiveTab('settings')}
                    className="w-full text-center py-2 bg-slate-800/40 hover:bg-slate-800/80 border border-slate-700/40 hover:border-slate-700 transition-all rounded-xl text-xs font-bold text-slate-300"
                  >
                    Ubah Pengaturan
                  </button>
                </div>
              </div>

              {/* System Log Activity 2.0 */}
              <section className="bg-slate-900/40 backdrop-blur-md rounded-2xl p-6 border border-slate-800/80 flex-1 flex flex-col min-h-[350px] shadow-xl relative overflow-hidden">
                <div className="absolute bottom-0 left-0 w-96 h-96 bg-indigo-500/2 rounded-full blur-3xl pointer-events-none"></div>
                
                {/* Log Header Controls */}
                <div className="flex flex-col gap-4 mb-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                      <span>Log Aktivitas Interaktif</span>
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
                    </h3>
                    
                    <div className="flex gap-2">
                      {/* Clear logs screen */}
                      <button 
                        onClick={() => setLogs([])}
                        className="p-1.5 bg-slate-800/50 hover:bg-slate-800 border border-slate-700/50 rounded-lg text-slate-400 hover:text-slate-200 transition-all text-xs font-semibold flex items-center gap-1.5"
                        title="Bersihkan log di layar"
                      >
                        Bersihkan Layar
                      </button>

                      {/* Download Log button */}
                      <button 
                        onClick={handleDownloadLogs}
                        disabled={logs.length === 0}
                        className="p-1.5 bg-slate-800/50 hover:bg-indigo-600/30 hover:text-indigo-200 disabled:opacity-40 disabled:hover:bg-slate-800/50 disabled:hover:text-slate-400 border border-slate-700/50 rounded-lg text-slate-400 hover:text-slate-200 transition-all text-xs font-semibold flex items-center gap-1.5"
                        title="Unduh log berkas .txt"
                      >
                        Unduh Log (.txt)
                      </button>
                    </div>
                  </div>

                  {/* Log Filter & Search Toolbar */}
                  <div className="flex gap-3 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs text-slate-500 font-bold px-2 uppercase">Filter:</span>
                      {['ALL', 'SUKSES', 'SKIP', 'ERROR', 'SYSTEM'].map(filterOption => (
                        <button
                          key={filterOption}
                          onClick={() => setLogFilter(filterOption)}
                          className={`text-[10px] font-bold px-2.5 py-1 rounded-md transition-all uppercase border
                            ${logFilter === filterOption
                              ? 'bg-indigo-600/20 text-indigo-300 border-indigo-500/30'
                              : 'bg-transparent text-slate-400 hover:text-slate-200 border-transparent'
                            }
                          `}
                        >
                          {filterOption}
                        </button>
                      ))}
                    </div>

                    <div className="flex-1 relative">
                      <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-600">
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                      </div>
                      <input 
                        type="text"
                        value={logSearch}
                        onChange={(e) => setLogSearch(e.target.value)}
                        placeholder="Cari log..."
                        className="w-full bg-slate-900/50 border border-slate-800/80 rounded-lg pl-8 pr-3 py-1 text-xs text-slate-300 focus:outline-none focus:border-slate-700 transition-all duration-300 placeholder-slate-700"
                      />
                    </div>

                    <button 
                      onClick={() => setAutoScroll(!autoScroll)}
                      className={`px-3 py-1 rounded-lg text-[10px] font-bold border transition-all uppercase flex items-center gap-1.5
                        ${autoScroll
                          ? 'bg-emerald-600/10 text-emerald-400 border-emerald-500/20'
                          : 'bg-slate-900 text-slate-400 border-slate-800'
                        }
                      `}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${autoScroll ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`}></span>
                      Auto-Scroll: {autoScroll ? 'ON' : 'OFF'}
                    </button>
                  </div>
                </div>

                {/* Log Outputs Terminal */}
                <div 
                  ref={logContainerRef}
                  className="flex-1 bg-slate-950/80 rounded-xl border border-slate-800/80 p-4.5 font-mono text-[12px] text-slate-300 overflow-y-auto space-y-2 max-h-[300px] shadow-inner"
                >
                  {filteredLogs.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-slate-600 select-none">
                      Tidak ada log aktivitas {logSearch && 'yang cocok dengan pencarian Anda'}
                    </div>
                  ) : (
                    filteredLogs.map((log, index) => {
                      let colorClass = 'text-slate-300'
                      let pillClass = 'bg-slate-800 text-slate-400 border-slate-700'
                      let icon = 'ℹ️'

                      if (log.type === 'SUKSES') {
                        colorClass = 'text-emerald-400 font-bold shadow-glow-sm shadow-emerald-400/5'
                        pillClass = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        icon = '✅'
                      } else if (log.type === 'SKIP') {
                        colorClass = 'text-amber-400 font-medium'
                        pillClass = 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                        icon = '⏭️'
                      } else if (log.type === 'ERROR') {
                        colorClass = 'text-rose-400 font-bold shadow-glow-sm shadow-rose-400/5'
                        pillClass = 'bg-rose-500/10 text-rose-400 border-rose-500/20 animate-pulse'
                        icon = '🚨'
                      } else if (log.type === 'ACTION') {
                        colorClass = 'text-sky-300'
                        pillClass = 'bg-sky-500/10 text-sky-400 border-sky-500/20'
                        icon = '⚙️'
                      } else if (log.type === 'SYSTEM') {
                        colorClass = 'text-indigo-300/90 italic'
                        pillClass = 'bg-indigo-500/10 text-indigo-300 border-indigo-500/20'
                        icon = '🤖'
                      }

                      return (
                        <div key={index} className="flex gap-3.5 items-start py-1 px-2 hover:bg-slate-900/30 rounded transition-all">
                          <span className="text-[10px] text-slate-600 select-none font-bold mt-0.5">{log.time || 'SYSTEM'}</span>
                          <span className={`text-[9px] font-black border uppercase px-1.5 py-0.25 rounded tracking-wide ${pillClass} select-none`}>
                            {icon} {log.type}
                          </span>
                          <span className={`break-all leading-relaxed ${colorClass}`}>{log.message}</span>
                        </div>
                      )
                    })
                  )}
                </div>
              </section>
            </div>
          )}

          {/* TAB 2: RIWAYAT SQLITE */}
          {activeTab === 'history' && (
            <div className="flex-1 flex flex-col gap-6 max-w-6xl mx-auto w-full">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-200 to-indigo-400 tracking-tight">
                    Riwayat Database SQLite
                  </h2>
                  <p className="text-slate-400 text-sm mt-1">Daftar semua postingan yang berhasil disukai dan tersimpan di database lokal.</p>
                </div>

                <div className="flex gap-3">
                  <button 
                    onClick={loadHistory}
                    className="px-4 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 transition-all rounded-xl text-xs font-bold text-slate-300 flex items-center gap-2"
                  >
                    Refresh Data
                  </button>

                  <button 
                    onClick={() => setConfirmClearDb(true)}
                    disabled={history.length === 0}
                    className="px-4 py-2 bg-red-600/10 hover:bg-red-600/30 disabled:opacity-40 disabled:hover:bg-red-600/10 border border-red-500/20 hover:border-red-500/30 transition-all rounded-xl text-xs font-bold text-red-400 flex items-center gap-2"
                  >
                    Kosongkan Database
                  </button>
                </div>
              </div>

              {/* Clear DB Confirmation Dialog Overlay */}
              {confirmClearDb && (
                <div className="bg-red-500/5 border border-red-500/20 rounded-2xl p-5 flex flex-col gap-3.5 relative overflow-hidden shadow-glow shadow-red-500/2 animate-fadeIn">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/2 rounded-full blur-2xl pointer-events-none"></div>
                  <div className="flex items-center gap-3">
                    <span className="text-xl">⚠️</span>
                    <h4 className="text-sm font-bold text-red-300 uppercase tracking-wider">Peringatan: Penghapusan Masal!</h4>
                  </div>
                  <p className="text-xs text-red-400/90 leading-relaxed">
                    Apakah Anda yakin ingin mengosongkan seluruh riwayat database? Tindakan ini akan menghapus semua catatan <strong>{history.length} postingan</strong> yang telah tersimpan di SQLite secara permanen. Tindakan ini tidak dapat dibatalkan.
                  </p>
                  <div className="flex gap-3 mt-1">
                    <button 
                      onClick={handleClearAllHistory}
                      className="px-4.5 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-bold shadow-lg"
                    >
                      Ya, Hapus Semua
                    </button>
                    <button 
                      onClick={() => setConfirmClearDb(false)}
                      className="px-4.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold border border-slate-700/50"
                    >
                      Batal
                    </button>
                  </div>
                </div>
              )}

              {/* Search Database bar */}
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input 
                  type="text"
                  value={historySearch}
                  onChange={(e) => setHistorySearch(e.target.value)}
                  placeholder="Cari berdasarkan target profil atau Post ID..."
                  className="w-full bg-slate-900/40 backdrop-blur-md border border-slate-800 rounded-xl pl-11 pr-4 py-3 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all duration-300 placeholder-slate-700"
                />
              </div>

              {/* Data Table */}
              <div className="bg-slate-900/40 backdrop-blur-md rounded-2xl border border-slate-800/80 shadow-xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-left text-sm text-slate-300">
                    <thead>
                      <tr className="bg-slate-950/80 border-b border-slate-800/50 text-[10px] font-bold text-slate-500 tracking-wider uppercase">
                        <th className="px-6 py-4">ID</th>
                        <th className="px-6 py-4">Platform</th>
                        <th className="px-6 py-4">Target Profile</th>
                        <th className="px-6 py-4">Post ID</th>
                        <th className="px-6 py-4">Liked At</th>
                        <th className="px-6 py-4 text-right">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/40">
                      {filteredHistory.length === 0 ? (
                        <tr>
                          <td colSpan="6" className="px-6 py-12 text-center text-slate-600 select-none">
                            {history.length === 0 ? 'Database kosong' : 'Tidak ada riwayat database yang cocok'}
                          </td>
                        </tr>
                      ) : (
                        filteredHistory.map((item, idx) => (
                          <tr key={item.id} className="hover:bg-slate-900/20 transition-all">
                            <td className="px-6 py-4 font-mono text-xs text-slate-500">{idx + 1}</td>
                            <td className="px-6 py-4">
                              {item.platform === 'instagram' && (
                                <span className="px-2.5 py-0.5 bg-pink-500/10 text-pink-400 border border-pink-500/20 rounded-full text-[10px] font-bold uppercase select-none">
                                  instagram
                                </span>
                              )}
                              {item.platform === 'twitter' && (
                                <span className="px-2.5 py-0.5 bg-slate-500/10 text-slate-300 border border-slate-500/20 rounded-full text-[10px] font-bold uppercase select-none">
                                  twitter / x
                                </span>
                              )}
                              {item.platform === 'facebook' && (
                                <span className="px-2.5 py-0.5 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-full text-[10px] font-bold uppercase select-none">
                                  facebook
                                </span>
                              )}
                              {item.platform === 'threads' && (
                                <span className="px-2.5 py-0.5 bg-zinc-500/10 text-zinc-400 border border-zinc-500/20 rounded-full text-[10px] font-bold uppercase select-none">
                                  threads
                                </span>
                              )}
                            </td>
                            <td className="px-6 py-4 font-semibold text-slate-200 break-all">{item.target_profile}</td>
                            <td className="px-6 py-4 font-mono text-xs text-purple-300 break-all">{item.post_id}</td>
                            <td className="px-6 py-4 text-xs text-slate-400">{new Date(item.liked_at).toLocaleString('id-ID')}</td>
                            <td className="px-6 py-4 text-right">
                              <div className="flex justify-end gap-2.5">
                                <button
                                  onClick={() => handleOpenPostUrl(item)}
                                  className="px-2.5 py-1.5 bg-indigo-500/10 hover:bg-indigo-600 text-indigo-300 hover:text-white rounded-lg text-xs font-bold border border-indigo-500/20 transition-all"
                                >
                                  Buka Post
                                </button>
                                <button
                                  onClick={() => handleDeleteHistoryItem(item.id)}
                                  className="px-2.5 py-1.5 bg-red-500/10 hover:bg-red-600 text-red-400 hover:text-white rounded-lg text-xs font-bold border border-red-500/20 transition-all"
                                >
                                  Hapus
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: STATS & ANALYTICS */}
          {activeTab === 'analytics' && (
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
                  <p className="text-xs text-slate-500 leading-relaxed mt-2">Jumlah total postingan instagram yang berhasil disukai secara aman.</p>
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
                  <p className="text-xs text-slate-500 leading-relaxed mt-2">Jumlah akun target instagram berbeda yang pernah dikunjungi dan diproses bot.</p>
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
                  <p className="text-xs text-slate-500 leading-relaxed mt-2">Jumlah interaksi like yang sukses dilakukan dalam 24 jam terakhir.</p>
                </div>
              </div>

              {/* DB System Health Details */}
              <div className="bg-slate-900/40 backdrop-blur-md rounded-2xl p-6 border border-slate-800/80 flex flex-col gap-4 shadow-xl">
                <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider">Spesifikasi Sistem SQLite</h3>
                
                <div className="grid grid-cols-2 gap-6 text-sm">
                  <div className="flex flex-col gap-3.5">
                    <div className="flex justify-between border-b border-slate-800/50 pb-2">
                      <span className="text-slate-400 font-medium">Platform Aktif</span>
                      <span className="text-slate-200 font-bold">Instagram Desktop</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-800/50 pb-2">
                      <span className="text-slate-400 font-medium">Mesin Database</span>
                      <span className="text-indigo-400 font-bold">SQLite v3.x (sqlite3)</span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-3.5">
                    <div className="flex justify-between border-b border-slate-800/50 pb-2">
                      <span className="text-slate-400 font-medium">Batas Maksimal Bot Sesi</span>
                      <span className="text-slate-200 font-bold">{limit} Post / Target</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-800/50 pb-2">
                      <span className="text-slate-400 font-medium">Rata-rata Delay Bot</span>
                      <span className="text-slate-200 font-bold">{(minDelay + maxDelay) / 2000} Detik / Like</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: SETTINGS / CONFIGURATION */}
          {activeTab === 'settings' && (
            <div className="flex-1 flex flex-col gap-6 max-w-6xl mx-auto w-full animate-fadeIn">
              <div>
                <h2 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-200 to-indigo-400 tracking-tight">
                  Parameter Automaton Bot
                </h2>
                <p className="text-slate-400 text-sm mt-1">Konfigurasi dinamis interaksi bot untuk meminimalkan risiko pembatasan (ban).</p>
              </div>

              {/* Slider Controls Wrapper */}
              <div className="bg-slate-900/40 backdrop-blur-md rounded-2xl p-6 border border-slate-800/80 flex flex-col gap-8 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/2 rounded-full blur-2xl pointer-events-none"></div>

                {/* SECTION 1: Kecepatan & Jeda */}
                <div className="flex flex-col gap-5">
                  <h3 className="text-xs font-black text-indigo-400 uppercase tracking-widest border-b border-slate-800/50 pb-2 flex items-center gap-2">
                    <span>⚡</span> 1. Kecepatan & Jeda Interaksi
                  </h3>
                  
                  {/* Rentang Jeda */}
                  <div className="flex flex-col gap-3.5">
                    <div className="flex justify-between items-center">
                      <div>
                        <span className="text-xs font-bold text-slate-200">Rentang Jeda Interaksi (Delay Range)</span>
                        <p className="text-[11px] text-slate-500 mt-0.5">Bot akan berdiam sejenak secara acak di rentang waktu ini setelah menyukai postingan.</p>
                      </div>
                      <span className="px-2.5 py-0.5 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-mono text-xs font-bold rounded-lg">
                        {minDelay / 1000}s - {maxDelay / 1000}s
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                      {/* Minimum Delay */}
                      <div className="flex flex-col gap-2">
                        <div className="flex justify-between text-[11px] font-semibold text-slate-400">
                          <span>Delay Minimum</span>
                          <span>{minDelay / 1000} Detik</span>
                        </div>
                        <input 
                          type="range"
                          min="1000"
                          max="10000"
                          step="1000"
                          value={minDelay}
                          onChange={(e) => {
                            const val = parseInt(e.target.value, 10)
                            setMinDelay(val)
                            handleSaveConfig('min_delay', val)
                            if (val > maxDelay) {
                              setMaxDelay(val + 1000)
                              handleSaveConfig('max_delay', val + 1000)
                            }
                          }}
                          className="w-full accent-indigo-500 bg-slate-950 h-1.5 rounded-lg cursor-pointer"
                        />
                      </div>

                      {/* Maximum Delay */}
                      <div className="flex flex-col gap-2">
                        <div className="flex justify-between text-[11px] font-semibold text-slate-400">
                          <span>Delay Maksimum</span>
                          <span>{maxDelay / 1000} Detik</span>
                        </div>
                        <input 
                          type="range"
                          min="2000"
                          max="20000"
                          step="1000"
                          value={maxDelay}
                          onChange={(e) => {
                            const val = parseInt(e.target.value, 10)
                            if (val < minDelay) return // Prevent invalid ranges
                            setMaxDelay(val)
                            handleSaveConfig('max_delay', val)
                          }}
                          className="w-full accent-indigo-500 bg-slate-950 h-1.5 rounded-lg cursor-pointer"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* SECTION 2: Batas & Pemindaian */}
                <div className="flex flex-col gap-5 border-t border-slate-800/40 pt-5">
                  <h3 className="text-xs font-black text-indigo-400 uppercase tracking-widest border-b border-slate-800/50 pb-2 flex items-center gap-2">
                    <span>🔍</span> 2. Parameter Pemindaian Timeline
                  </h3>

                  <div className="grid grid-cols-2 gap-6">
                    {/* Post Limit */}
                    <div className="flex flex-col gap-2">
                      <div className="flex justify-between items-center text-xs font-semibold text-slate-400">
                        <div>
                          <span className="font-bold text-slate-200">Post Limit per Profil</span>
                          <p className="text-[10px] text-slate-500 mt-0.5">Jumlah postingan baru yang akan dipindai per target.</p>
                        </div>
                        <span className="px-2 py-0.5 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-mono text-[11px] font-bold rounded-lg">{limit} Post</span>
                      </div>
                      <input 
                        type="range"
                        min="5"
                        max="100"
                        step="5"
                        value={limit}
                        onChange={(e) => {
                          const val = parseInt(e.target.value, 10)
                          setLimit(val)
                          handleSaveConfig('limit', val)
                        }}
                        className="w-full accent-indigo-500 bg-slate-950 h-1.5 rounded-lg cursor-pointer"
                      />
                    </div>

                    {/* Consecutive Skips Limit */}
                    <div className="flex flex-col gap-2">
                      <div className="flex justify-between items-center text-xs font-semibold text-slate-400">
                        <div>
                          <span className="font-bold text-slate-200">Batas Skip Berurutan</span>
                          <p className="text-[10px] text-slate-500 mt-0.5">Berhenti memindai jika menemukan N post sudah disukai berturut-turut.</p>
                        </div>
                        <span className="px-2 py-0.5 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-mono text-[11px] font-bold rounded-lg">{consecutiveSkipsLimit} Skips</span>
                      </div>
                      <input 
                        type="range"
                        min="3"
                        max="10"
                        step="1"
                        value={consecutiveSkipsLimit}
                        onChange={(e) => {
                          const val = parseInt(e.target.value, 10)
                          setConsecutiveSkipsLimit(val)
                          handleSaveConfig('consecutive_skips_limit', val)
                        }}
                        className="w-full accent-indigo-500 bg-slate-950 h-1.5 rounded-lg cursor-pointer"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-6 mt-2">
                    {/* Scroll Step (Pixel Distance) */}
                    <div className="flex flex-col gap-2">
                      <div className="flex justify-between items-center text-xs font-semibold text-slate-400">
                        <div>
                          <span className="font-bold text-slate-200">Langkah Gulir (Scroll Step)</span>
                          <p className="text-[10px] text-slate-500 mt-0.5">Jarak tinggi gulir piksel browser saat memindai timeline.</p>
                        </div>
                        <span className="px-2 py-0.5 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-mono text-[11px] font-bold rounded-lg">{scrollStep}px</span>
                      </div>
                      <input 
                        type="range"
                        min="500"
                        max="1500"
                        step="100"
                        value={scrollStep}
                        onChange={(e) => {
                          const val = parseInt(e.target.value, 10)
                          setScrollStep(val)
                          handleSaveConfig('scroll_step', val)
                        }}
                        className="w-full accent-indigo-500 bg-slate-950 h-1.5 rounded-lg cursor-pointer"
                      />
                    </div>

                    {/* Max Scroll Attempts */}
                    <div className="flex flex-col gap-2">
                      <div className="flex justify-between items-center text-xs font-semibold text-slate-400">
                        <div>
                          <span className="font-bold text-slate-200">Maks Gulir Percobaan</span>
                          <p className="text-[10px] text-slate-500 mt-0.5">Batas percobaan gulir ketika tidak ada konten baru terdeteksi.</p>
                        </div>
                        <span className="px-2 py-0.5 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-mono text-[11px] font-bold rounded-lg">{maxScrollAttempts} Kali</span>
                      </div>
                      <input 
                        type="range"
                        min="10"
                        max="40"
                        step="5"
                        value={maxScrollAttempts}
                        onChange={(e) => {
                          const val = parseInt(e.target.value, 10)
                          setMaxScrollAttempts(val)
                          handleSaveConfig('max_scroll_attempts', val)
                        }}
                        className="w-full accent-indigo-500 bg-slate-950 h-1.5 rounded-lg cursor-pointer"
                      />
                    </div>
                  </div>
                </div>

                {/* SECTION 3: Mode Browser & Privasi */}
                <div className="flex flex-col gap-5 border-t border-slate-800/40 pt-5">
                  <h3 className="text-xs font-black text-indigo-400 uppercase tracking-widest border-b border-slate-800/50 pb-2 flex items-center gap-2">
                    <span>🛡️</span> 3. Mode Browser & Keamanan Sesi
                  </h3>

                  <div className="flex justify-between items-center">
                    <div>
                      <span className="text-xs font-bold text-slate-200">Headless Mode (Sembunyikan Browser)</span>
                      <p className="text-[11px] text-slate-500 mt-0.5">Jika aktif, browser otomatisasi akan disembunyikan dan bot berjalan di latar belakang.</p>
                    </div>
                    
                    <button
                      onClick={() => {
                        const nextVal = !headless
                        setHeadless(nextVal)
                        handleSaveConfig('headless', nextVal)
                      }}
                      className={`w-12 h-6 rounded-full transition-all duration-300 relative border flex items-center px-1
                        ${headless 
                          ? 'bg-gradient-to-r from-indigo-600 to-purple-600 border-indigo-400/20' 
                          : 'bg-slate-950 border-slate-800'
                        }
                      `}
                    >
                      <span className={`w-4 h-4 rounded-full transition-all duration-300 shadow-lg
                        ${headless 
                          ? 'translate-x-6 bg-white shadow-glow shadow-white/30' 
                          : 'translate-x-0 bg-slate-600'
                        }
                      `}></span>
                    </button>
                  </div>

                  <div className="flex flex-col gap-2 border-t border-slate-800/20 pt-4">
                    <span className="text-xs font-bold text-slate-200">Browser User-Agent (Anti-Fingerprint)</span>
                    <p className="text-[11px] text-slate-500">Pilih string agen pengguna browser untuk menyamarkan identitas bot dari pelacakan server sosial media.</p>
                    
                    <div className="grid grid-cols-4 gap-3 mt-1.5">
                      {[
                        { name: 'Default', label: 'Playwright Default' },
                        { name: 'Chrome Windows', label: 'Chrome / Windows' },
                        { name: 'Safari macOS', label: 'Safari / macOS' },
                        { name: 'Firefox Linux', label: 'Firefox / Linux' }
                      ].map((ua) => (
                        <button
                          key={ua.name}
                          onClick={() => {
                            setUserAgent(ua.name)
                            handleSaveConfig('browser_user_agent', ua.name)
                          }}
                          className={`px-3 py-2 rounded-xl text-[10.5px] font-bold border transition-all duration-200 text-center
                            ${userAgent === ua.name
                              ? 'bg-indigo-600/10 border-indigo-500 text-indigo-300 font-extrabold shadow-md shadow-indigo-500/5'
                              : 'bg-slate-950 border-slate-800/80 text-slate-400 hover:border-slate-700 hover:text-slate-350'
                            }
                          `}
                        >
                          {ua.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Informative tips box */}
              <div className="bg-slate-900/20 border border-slate-800 rounded-2xl p-5 flex gap-3 text-xs leading-relaxed text-slate-400 shadow-sm">
                <span className="text-md">💡</span>
                <div>
                  <h4 className="font-bold text-slate-300 uppercase tracking-wider text-[10px] mb-1">Tips Keamanan Akun</h4>
                  Untuk menghindari deteksi bot, sangat disarankan menggunakan jeda acak minimal <strong>3-6 detik</strong> dan membatasi pemindaian hingga <strong>20 postingan</strong> per sesi. Gunakan User Agent Chrome/Windows untuk kompatibilitas optimal.
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: SYSTEM & DATABASE CONFIGURATIONS */}
          {activeTab === 'settings-app' && (
            <div className="flex-1 flex flex-col gap-6 max-w-6xl mx-auto w-full animate-fadeIn">
              <div>
                <h2 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-200 to-indigo-400 tracking-tight">
                  Koneksi Sistem & Database
                </h2>
                <p className="text-slate-400 text-sm mt-1">Kelola integrasi database SQLite, pemeliharaan data interaksi, dan cadangan konfigurasi.</p>
              </div>

              <div className="grid grid-cols-3 gap-5">
                {/* Panel 1: Database Status */}
                <div className="bg-slate-900/40 backdrop-blur-md rounded-2xl p-5 border border-slate-800/80 flex flex-col gap-4 shadow-xl col-span-2">
                  <div className="flex items-center gap-2.5 pb-3 border-b border-slate-800/50">
                    <span className="text-lg">🗄️</span>
                    <div>
                      <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">Status & Metadata Database</h3>
                      <p className="text-[10px] text-slate-500">Detail status operasional database SQLite internal.</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/40 flex flex-col gap-1">
                      <span className="text-slate-500 text-[10px] uppercase font-bold tracking-wider">Driver DB</span>
                      <span className="text-slate-300 font-semibold font-mono">SQLite 3 (Local-file)</span>
                    </div>

                    <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/40 flex flex-col gap-1">
                      <span className="text-slate-500 text-[10px] uppercase font-bold tracking-wider">Status Koneksi</span>
                      <span className="text-emerald-400 font-bold flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
                        Aktif / Terhubung
                      </span>
                    </div>

                    <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/40 flex flex-col gap-1">
                      <span className="text-slate-500 text-[10px] uppercase font-bold tracking-wider">Total Baris Riwayat</span>
                      <span className="text-slate-300 font-bold font-mono">{stats.total_liked} Liked Posts</span>
                    </div>

                    <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/40 flex flex-col gap-1">
                      <span className="text-slate-500 text-[10px] uppercase font-bold tracking-wider">Target Unik Terdeteksi</span>
                      <span className="text-slate-300 font-bold font-mono">{stats.total_profiles} Profil</span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 mt-2">
                    <span className="text-xs font-bold text-slate-300">Lokasi File Database:</span>
                    <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-850 font-mono text-[10px] text-slate-400 overflow-x-auto whitespace-nowrap">
                      %USERPROFILE%\AppData\Roaming\sosmed-liker\database.sqlite
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 mt-3 border-t border-slate-800/50 pt-3">
                    <span className="text-xs font-bold text-slate-300">Informasi Pembaruan Aplikasi:</span>
                    <div className="flex justify-between items-center bg-slate-950 p-3 rounded-xl border border-slate-850">
                      <div className="flex items-center gap-3">
                        <div className="flex flex-col gap-0.5">
                          <span className="text-slate-500 text-[9px] uppercase font-bold tracking-wider">Versi Saat Ini</span>
                          <span className="text-slate-300 font-bold text-xs font-mono">v{appVersion}</span>
                        </div>
                        {updateInfo && updateInfo.updateAvailable && (
                          <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold text-[10px] rounded-lg animate-pulse">
                            Pembaruan v{updateInfo.latestVersion} Tersedia!
                          </span>
                        )}
                      </div>
                      <div className="flex gap-2">
                        {updateInfo && updateInfo.updateAvailable && (
                          <button
                            onClick={() => setUpdateModalOpen(true)}
                            className="py-1.5 px-3 bg-emerald-650 hover:bg-emerald-550 text-white rounded-lg text-[10px] font-bold tracking-wide uppercase transition-all duration-300 active:scale-[0.98]"
                          >
                            📥 Lihat Update
                          </button>
                        )}
                        <button
                          disabled={checkingForUpdates}
                          onClick={() => runUpdateCheck(false)}
                          className="py-1.5 px-3 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed text-slate-300 rounded-lg text-[10px] font-bold tracking-wide uppercase transition-all duration-300"
                        >
                          {checkingForUpdates ? 'Memeriksa...' : '🔄 Periksa Pembaruan'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Panel 2: Maintenance Actions */}
                <div className="bg-slate-900/40 backdrop-blur-md rounded-2xl p-5 border border-slate-800/80 flex flex-col gap-4 shadow-xl col-span-1 justify-between">
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center gap-2 pb-3 border-b border-slate-800/50">
                      <span className="text-lg">🛠️</span>
                      <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">Pemeliharaan</h3>
                    </div>
                    <p className="text-[10px] text-slate-550 leading-relaxed">
                      Lakukan pembersihan histori penandaan postingan yang sudah disukai dari database agar bot dapat memproses ulang postingan tersebut.
                    </p>
                  </div>

                  <div className="flex flex-col gap-2 mt-4">
                    {confirmClearDb ? (
                      <div className="flex flex-col gap-2 animate-fadeIn">
                        <span className="text-[9px] font-bold text-rose-400 text-center">Apakah Anda yakin? Tindakan ini menghapus seluruh riwayat di database.</span>
                        <div className="flex gap-2">
                          <button
                            onClick={async () => {
                              if (window.api && window.api.clearHistory) {
                                try {
                                  await window.api.clearHistory()
                                  showToast('Seluruh riwayat berhasil dibersihkan!', 'success')
                                  loadHistory()
                                  loadDbStats()
                                } catch (err) {
                                  console.error(err)
                                  showToast('Gagal membersihkan database.', 'error')
                                } finally {
                                  setConfirmClearDb(false)
                                }
                              }
                            }}
                            className="flex-1 py-2 bg-rose-650 hover:bg-rose-550 border border-rose-500/20 text-white rounded-xl text-[10px] font-bold tracking-wide uppercase transition-all duration-300"
                          >
                            Ya
                          </button>
                          <button
                            onClick={() => setConfirmClearDb(false)}
                            className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-[10px] font-bold tracking-wide uppercase transition-all"
                          >
                            Batal
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => setConfirmClearDb(true)}
                        className="w-full py-3 bg-rose-600/10 hover:bg-rose-650/20 text-rose-400 border border-rose-500/20 rounded-xl text-[10.5px] font-bold tracking-wide uppercase transition-all duration-300 active:scale-[0.98]"
                      >
                        🗑️ Kosongkan Riwayat
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Cadangan Konfigurasi / Backup and Restore Panel */}
              <div className="bg-slate-900/40 backdrop-blur-md rounded-2xl p-6 border border-slate-800/80 flex flex-col gap-5 shadow-xl relative overflow-hidden">
                <div className="flex items-center gap-3 border-b border-slate-800/50 pb-4">
                  <span className="text-xl">💾</span>
                  <div>
                    <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">Pencadangan Database & Konfigurasi</h3>
                    <p className="text-xs text-slate-500 mt-0.5">Ekspor file database utama untuk dicadangkan secara lokal atau dipulihkan di kemudian hari.</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  {/* Backup Card */}
                  <div className="bg-slate-950/40 border border-slate-850 p-4.5 rounded-2xl flex flex-col gap-3 justify-between">
                    <div>
                      <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest block mb-1">Backup SQLite</span>
                      <h4 className="text-xs font-bold text-slate-300">Ekspor Cadangan (.bak)</h4>
                      <p className="text-[10px] text-slate-500 leading-relaxed mt-1">
                        Menyalin database aktif saat ini dan menyimpannya sebagai file cadangan timestamped dalam folder aman.
                      </p>
                    </div>

                    <button
                      onClick={async () => {
                        if (window.api && window.api.backupDatabase) {
                          const res = await window.api.backupDatabase()
                          if (res && res.success) {
                            showToast('Cadangan SQLite berhasil dibuat dan disimpan!', 'success')
                          } else if (res && res.error) {
                            showToast(`Gagal mencadangkan: ${res.error}`, 'error')
                          }
                        } else {
                          showToast('API Backup tidak tersedia.', 'error')
                        }
                      }}
                      className="mt-4 py-2 px-4 bg-indigo-650 hover:bg-indigo-550 text-white rounded-xl text-[10.5px] font-bold tracking-wide uppercase transition-all duration-300 active:scale-[0.98] border border-indigo-500/20"
                    >
                      📁 Buat Cadangan Baru
                    </button>
                  </div>

                  {/* Restore Card */}
                  <div className="bg-slate-950/40 border border-slate-850 p-4.5 rounded-2xl flex flex-col gap-3 justify-between">
                    <div>
                      <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest block mb-1">Restore SQLite</span>
                      <h4 className="text-xs font-bold text-slate-300">Kembalikan dari Cadangan</h4>
                      <p className="text-[10px] text-slate-550 leading-relaxed mt-1">
                        Memilih file cadangan database terlama/terbaru untuk dimuat ulang menggantikan data SQLite yang aktif saat ini.
                      </p>
                    </div>

                    <button
                      onClick={async () => {
                        if (window.api && window.api.restoreDatabase) {
                          const res = await window.api.restoreDatabase()
                          if (res && res.success) {
                            showToast('Database berhasil dipulihkan dari cadangan!', 'success')
                            loadHistory()
                            loadDbStats()
                            loadConfigurations()
                          } else if (res && res.error) {
                            showToast(`Gagal memulihkan: ${res.error}`, 'error')
                          }
                        } else {
                          showToast('API Restore tidak tersedia.', 'error')
                        }
                      }}
                      className="mt-4 py-2 px-4 bg-slate-850 hover:bg-slate-750 text-slate-300 rounded-xl text-[10.5px] font-bold tracking-wide uppercase transition-all duration-300 active:scale-[0.98] border border-slate-800"
                    >
                      🔄 Pulihkan Cadangan Terakhir
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: ACCOUNTS & COOKIES MANAGEMENT */}
          {activeTab === 'accounts' && (
            <div className="flex-1 flex flex-col gap-6 max-w-6xl mx-auto w-full animate-fadeIn">
              {/* Header */}
              <div>
                <h2 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-200 to-indigo-400 tracking-tight">
                  Kelola Akun & Kuki Sesi
                </h2>
                <p className="text-slate-400 text-sm mt-1">Hubungkan akun sosial media Anda secara aman menggunakan cookie sesi browser.</p>
              </div>

              {/* Grid 2 Column */}
              <div className="grid grid-cols-5 gap-6">
                
                {/* LEFT COLUMN: PLATFORMS STATUS (2/5 size) */}
                <div className="col-span-2 flex flex-col gap-4">
                  {[
                    { id: 'instagram', name: 'Instagram', domain: 'https://www.instagram.com', color: 'from-pink-600 to-rose-600', icon: (
                      <svg className="w-6 h-6 text-pink-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                        <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                        <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                      </svg>
                    )},
                    { id: 'twitter', name: 'Twitter / X', domain: 'https://x.com', color: 'from-slate-700 to-slate-900', icon: (
                      <svg className="w-6 h-6 text-slate-300" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                      </svg>
                    )},
                    { id: 'threads', name: 'Threads', domain: 'https://www.threads.net', color: 'from-zinc-800 to-zinc-950', icon: (
                      <svg className="w-6 h-6 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16 12a4 4 0 1 0-8 0 4 4 0 0 0 8 0zm0 0v1.5a2.5 2.5 0 0 0 5 0V12a9 9 0 1 0-9 9m4.5-1.206a8.959 8.959 0 0 1-4.5 1.206" />
                      </svg>
                    )}
                  ].map(platform => {
                    const isConnected = cookiesStatus[platform.id]
                    return (
                      <div 
                        key={platform.id}
                        onClick={() => {
                          setActiveSetupPlatform(platform.id)
                          setSetupStep(1)
                        }}
                        className={`bg-slate-900/40 backdrop-blur-md border rounded-2xl p-5 flex flex-col justify-between gap-4 cursor-pointer transition-all duration-300 hover:scale-[1.01] hover:border-slate-700/80 shadow-lg relative overflow-hidden
                          ${activeSetupPlatform === platform.id
                            ? 'border-indigo-500/50 shadow-indigo-500/5 bg-slate-900/60' 
                            : 'border-slate-800/80'
                          }
                        `}
                      >
                        {/* Status bar marker */}
                        <div className={`absolute left-0 top-0 bottom-0 w-[4px] 
                          ${isConnected ? 'bg-emerald-500' : 'bg-slate-700'}
                        `}></div>

                        <div className="flex justify-between items-center pl-2">
                          <div className="flex items-center gap-3.5">
                            <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
                              {platform.icon}
                            </div>
                            <div>
                              <h3 className="text-md font-bold text-slate-100">{platform.name}</h3>
                              <span className="text-[10px] text-slate-500 font-semibold">{platform.domain}</span>
                            </div>
                          </div>

                          <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-md border tracking-wider select-none uppercase shadow-glow
                            ${isConnected
                              ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20 shadow-emerald-500/5'
                              : 'text-amber-500 bg-amber-500/5 border-amber-500/10 shadow-none'
                            }
                          `}>
                            {isConnected ? 'Aktif' : 'Setup Baru'}
                          </span>
                        </div>

                        <div className="flex gap-2 pl-2 mt-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              setActiveSetupPlatform(platform.id)
                              setSetupStep(1)
                            }}
                            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all duration-300 border
                              ${activeSetupPlatform === platform.id
                                ? 'bg-indigo-600 border-indigo-400/20 text-white shadow-md'
                                : 'bg-slate-950/50 hover:bg-slate-900 border-slate-800 text-slate-300'
                              }
                            `}
                          >
                            Konfigurasi Sesi
                          </button>

                          {isConnected && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                handleDeleteCookie(platform.id)
                              }}
                              className="py-2 px-3 text-xs font-bold rounded-xl bg-red-950/20 border border-red-900/30 hover:bg-red-900/20 text-rose-400 transition-all duration-300"
                              title="Hapus Sesi / Log Out"
                            >
                              Putus Sesi
                            </button>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* RIGHT COLUMN: INTERACTIVE SETUP GUIDE (3/5 size) */}
                <div className="col-span-3 bg-slate-900/40 backdrop-blur-md rounded-2xl border border-slate-800/80 p-7 flex flex-col justify-between shadow-xl relative overflow-hidden min-h-[500px]">
                  {/* Neon background decorations */}
                  <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none"></div>
                  
                  {/* Top Guide Navigation Step Bar */}
                  <div className="flex flex-col gap-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <span className="text-[10px] font-bold text-indigo-400 tracking-wider uppercase">Setup Wizard</span>
                        <h3 className="text-lg font-bold text-slate-100 mt-0.5">
                          Koneksi Akun {activeSetupPlatform.charAt(0).toUpperCase() + activeSetupPlatform.slice(1)}
                        </h3>
                      </div>
                      <span className="px-2.5 py-0.5 bg-slate-950 border border-slate-800 rounded-lg text-xs font-bold text-indigo-400 select-none">
                        Langkah {setupStep} dari 3
                      </span>
                    </div>

                    {/* Progress step markers */}
                    <div className="flex items-center gap-2 mt-1.5">
                      {[1, 2, 3].map(step => (
                        <React.Fragment key={step}>
                          <div 
                            onClick={() => setSetupStep(step)}
                            className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold cursor-pointer transition-all duration-300 border
                              ${setupStep === step
                                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 border-indigo-400/20 text-white shadow-glow shadow-indigo-500/10'
                                : setupStep > step
                                  ? 'bg-emerald-950/40 border-emerald-800/50 text-emerald-400 font-black'
                                  : 'bg-slate-950/80 border-slate-800 text-slate-500'
                              }
                            `}
                          >
                            {setupStep > step ? '✓' : step}
                          </div>
                          {step < 3 && (
                            <div className={`flex-1 h-[2px] transition-all duration-500
                              ${setupStep > step ? 'bg-emerald-800' : 'bg-slate-800'}
                            `}></div>
                          )}
                        </React.Fragment>
                      ))}
                    </div>
                  </div>

                  {/* Step Contents */}
                  <div className="flex-1 flex flex-col justify-center py-6">
                    {setupStep === 1 && (
                      <div className="flex flex-col gap-4 animate-fadeIn">
                        <div className="p-4 rounded-2xl bg-indigo-500/5 border border-indigo-500/10">
                          <h4 className="text-sm font-bold text-indigo-300">Langkah 1: Pasang Ekstensi Browser Exporter</h4>
                          <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                            Playwright memerlukan kuki otentikasi sesi Anda dalam format file teks (Netscape). Pasang ekstensi kuki terpercaya untuk Chrome atau Edge agar Anda dapat mengekspornya dengan mudah.
                          </p>
                        </div>

                        <div className="flex flex-col gap-2.5 mt-2">
                          <span className="text-xs text-slate-400 font-semibold flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400"></span>
                            Rekomendasi Ekstensi Teraman & Tercepat:
                          </span>
                          <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3.5 flex justify-between items-center gap-4">
                            <div>
                              <span className="text-xs font-bold text-slate-200 block">Get cookies.txt locally</span>
                              <span className="text-[10px] text-slate-500 block mt-0.5">Mendukung ekspor kuki format Netscape (teks) secara instan 1-klik.</span>
                            </div>
                            <button
                              onClick={() => handleOpenExternal('https://chromewebstore.google.com/detail/get-cookiestxt-locally/cclelndahbckbenkjhflpdbgdldlbecc')}
                              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-[10px] font-bold tracking-wide uppercase transition-all duration-300 active:scale-[0.98] shadow-md border border-indigo-400/20"
                            >
                              Pasang di Chrome
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {setupStep === 2 && (
                      <div className="flex flex-col gap-4 animate-fadeIn">
                        <div className="p-4 rounded-2xl bg-indigo-500/5 border border-indigo-500/10 flex flex-col gap-3">
                          <h4 className="text-sm font-bold text-indigo-300">Langkah 2: Dapatkan Cookie Netscape</h4>
                          
                          <ol className="text-xs text-slate-400 space-y-2.5 list-decimal pl-4.5 leading-relaxed">
                            <li>
                              Buka tab baru di browser Anda dan kunjungi situs resmi:
                              <button
                                onClick={() => handleOpenExternal(activeSetupPlatform === 'instagram' ? 'https://www.instagram.com' : activeSetupPlatform === 'twitter' ? 'https://x.com' : 'https://www.threads.net')}
                                className="text-indigo-400 hover:text-indigo-300 hover:underline font-bold inline-block ml-1"
                              >
                                {activeSetupPlatform === 'instagram' ? 'instagram.com' : activeSetupPlatform === 'twitter' ? 'x.com' : 'threads.net'} ↗
                              </button>
                            </li>
                            <li>Pastikan Anda sudah <strong>masuk / login</strong> ke akun sosial media Anda secara sukses di browser tersebut.</li>
                            <li>Klik ikon ekstensi <strong>Get cookies.txt locally</strong>, lalu klik tombol <strong>Export As 📥</strong> pada menu yang muncul.</li>
                            <li>Simpan file tersebut ke komputer Anda <strong>tanpa mengubah nama filenya</strong> (biarkan berformat .txt), lalu unggah atau tempel pada langkah selanjutnya.</li>
                          </ol>
                        </div>
                      </div>
                    )}

                    {setupStep === 3 && (
                      <div className="flex flex-col gap-4 animate-fadeIn">
                        <div className="flex flex-col gap-2">
                          <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                            Langkah 3: Unggah atau Tempel Isi Cookie Netscape
                          </span>
                          <p className="text-[11px] text-slate-500 leading-relaxed">
                            Tempelkan data teks hasil ekspor dari ekstensi browser Anda ke dalam kotak input di bawah.
                          </p>
                        </div>

                        {/* File Upload Zone */}
                        <div className="relative border border-dashed border-slate-800 hover:border-slate-700 transition-all rounded-xl p-4 bg-slate-950/40 flex items-center justify-between gap-4">
                          <div className="flex items-center gap-2.5">
                            <span className="text-xl">📄</span>
                            <div>
                              <span className="text-xs font-bold text-slate-300 block">Punya file cookie .txt?</span>
                              <span className="text-[10px] text-slate-500 block mt-0.5">Unggah langsung berkas teks cookie Anda di sini.</span>
                            </div>
                          </div>
                          
                          <label className="px-3.5 py-1.5 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 rounded-lg text-[10px] font-bold tracking-wide uppercase transition-all duration-300 active:scale-[0.98] cursor-pointer">
                            Pilih File
                            <input 
                              type="file"
                              accept=".txt"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files[0]
                                if (file) {
                                  const reader = new FileReader()
                                  reader.onload = (evt) => {
                                    setCookieInput(evt.target.result)
                                    showToast('File cookie berhasil dibaca!', 'success')
                                  }
                                  reader.readAsText(file)
                                }
                              }}
                            />
                          </label>
                        </div>

                        <textarea
                          value={cookieInput}
                          onChange={(e) => setCookieInput(e.target.value)}
                          placeholder="# Netscape HTTP Cookie File&#10;# This file is generated by Cookie-Editor&#10;.instagram.com	TRUE	/	TRUE	1791888888	sessionid	123456789..."
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-[11px] font-mono text-indigo-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 h-28 resize-none placeholder-slate-800"
                        />
                      </div>
                    )}
                  </div>

                  {/* Wizard Footer Controls */}
                  <div className="flex justify-between items-center border-t border-slate-800/50 pt-5">
                    <button
                      disabled={setupStep === 1}
                      onClick={() => setSetupStep(prev => prev - 1)}
                      className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all duration-300 select-none border
                        ${setupStep === 1
                          ? 'bg-slate-950/20 border-slate-950/40 text-slate-600 cursor-not-allowed opacity-30'
                          : 'bg-slate-950/40 hover:bg-slate-800/20 text-slate-300 border-slate-800'
                        }
                      `}
                    >
                      ← Kembali
                    </button>

                    {setupStep < 3 ? (
                      <button
                        onClick={() => setSetupStep(prev => prev + 1)}
                        className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 border border-indigo-400/20 transition-all duration-300 active:scale-[0.98] shadow-md shadow-indigo-500/10"
                      >
                        Langkah Berikutnya →
                      </button>
                    ) : (
                      <button
                        onClick={handleSaveCookie}
                        disabled={!cookieInput.trim()}
                        className={`px-5 py-2.5 rounded-xl text-xs font-bold text-white transition-all duration-300 flex items-center gap-1.5 border
                          ${!cookieInput.trim()
                            ? 'bg-slate-800 border-slate-700/50 text-slate-500 cursor-not-allowed'
                            : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 border-emerald-400/20 active:scale-[0.98] shadow-md shadow-emerald-500/15'
                          }
                        `}
                      >
                        ⚡ Hubungkan Akun Sekarang
                      </button>
                    )}
                  </div>
                </div>

              </div>

              {/* Informative Tips Footer Bar */}
              <div className="bg-slate-900/20 border border-slate-850 rounded-2xl p-5 flex gap-4 text-xs leading-relaxed text-slate-400 shadow-sm relative overflow-hidden">
                <span className="text-lg select-none">🔒</span>
                <div>
                  <h4 className="font-bold text-slate-300 uppercase tracking-wider text-[10px] mb-1">Keamanan & Privasi Data Sesi</h4>
                  Data kuki Anda disimpan secara terenkripsi sandi di dalam direktori penyimpanan internal yang aman di komputer lokal Anda. Data kuki <strong>tidak pernah dikirimkan ke server mana pun selain langsung ke domain sosial media tujuan</strong> untuk memverifikasi proses login browser otomatisasi.
                </div>
              </div>
            </div>
          )}
        </div>

        {/* UPDATE MODAL */}
        {updateModalOpen && updateInfo && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm animate-fadeIn">
            <div className="bg-slate-900 border border-indigo-500/30 rounded-3xl p-6 max-w-md w-full mx-4 shadow-2xl relative">
              <button 
                onClick={() => setUpdateModalOpen(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
              >
                ✕
              </button>
              <div className="flex flex-col items-center text-center gap-4">
                <div className="w-16 h-16 bg-indigo-500/10 border border-indigo-500/30 rounded-2xl flex items-center justify-center text-2xl animate-bounce">
                  🚀
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-200">Pembaruan Versi Tersedia!</h3>
                  <p className="text-slate-400 text-sm mt-1">Versi baru aplikasi telah dirilis di GitHub.</p>
                </div>
                <div className="flex gap-4 text-xs font-semibold py-2 px-4 bg-slate-950 rounded-xl border border-slate-850">
                  <div className="flex flex-col">
                    <span className="text-slate-500 text-[10px]">Versi Saat Ini</span>
                    <span className="text-slate-300 font-mono">{updateInfo.currentVersion}</span>
                  </div>
                  <div className="h-8 w-px bg-slate-800 self-center"></div>
                  <div className="flex flex-col">
                    <span className="text-slate-500 text-[10px]">Versi Terbaru</span>
                    <span className="text-emerald-400 font-extrabold font-mono">{updateInfo.latestVersion}</span>
                  </div>
                </div>
                {updateInfo.releaseNotes && (
                  <div className="w-full text-left text-xs bg-slate-950/60 border border-slate-850/60 rounded-xl p-3.5 max-h-36 overflow-y-auto text-slate-400 leading-relaxed">
                    <strong className="text-slate-350 text-[11px] block mb-1">Catatan Rilis:</strong>
                    <pre className="whitespace-pre-wrap font-sans text-[11px] text-slate-400">{updateInfo.releaseNotes}</pre>
                  </div>
                )}
                <div className="flex gap-3 w-full mt-2">
                  <button
                    onClick={() => {
                      handleOpenExternal(updateInfo.downloadUrl)
                      setUpdateModalOpen(false)
                    }}
                    className="flex-1 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-300 shadow-lg shadow-indigo-500/20 active:scale-[0.98]"
                  >
                    📥 Unduh & Perbarui
                  </button>
                  <button
                    onClick={() => setUpdateModalOpen(false)}
                    className="px-4 py-3 bg-slate-800 hover:bg-slate-750 text-slate-400 hover:text-slate-200 rounded-xl text-xs font-bold uppercase transition-all duration-300"
                  >
                    Nanti
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* FLOATING TOAST FEEDBACK NOTIFICATION */}
        {toast.show && (
          <div className={`fixed bottom-6 right-6 z-50 px-5 py-3.5 rounded-xl border shadow-2xl flex items-center gap-3 animate-slideInRight select-none
            ${toast.type === 'success' 
              ? 'bg-slate-900 border-emerald-500/30 text-emerald-400' 
              : 'bg-slate-900 border-red-500/30 text-rose-400'
            }
          `}>
            <span className="text-md">{toast.type === 'success' ? '✨' : '⚠️'}</span>
            <span className="text-xs font-bold">{toast.message}</span>
          </div>
        )}
      </main>
    </div>
  )
}

export default App
