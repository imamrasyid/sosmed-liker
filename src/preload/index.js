import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

/**
 * API bridge — dikelompokkan per domain agar mudah ditemukan dan di-typecheck.
 *
 * Namespace:
 *   window.api.automation.*  — kontrol bot (start, stop, status, batch)
 *   window.api.config.*      — baca/tulis konfigurasi
 *   window.api.history.*     — riwayat like & statistik DB
 *   window.api.profiles.*    — multi-profile management
 *   window.api.proxies.*     — proxy management
 *   window.api.lists.*       — blacklist & whitelist
 *   window.api.batch.*       — batch job management
 *   window.api.templates.*   — comment template management
 *   window.api.analytics.*   — data analitik
 *   window.api.database.*    — backup, restore, migrasi
 *   window.api.app.*         — versi, update checker, window controls
 */
const api = {

  // ── Automation ────────────────────────────────────────────────────────────
  automation: {
    start: (targetUrl) => ipcRenderer.invoke('start-automation', targetUrl),
    stop: () => ipcRenderer.invoke('stop-automation'),
    getStatus: () => ipcRenderer.invoke('get-automation-status'),
    startBatch: (batchId) => ipcRenderer.invoke('start-batch-job', batchId),
    ping: () => ipcRenderer.invoke('ping'),

    onLog: (callback) => {
      const subscription = (_event, value) => callback(value)
      ipcRenderer.on('automation-log', subscription)
      return () => ipcRenderer.off('automation-log', subscription)
    },
    onDone: (callback) => {
      const subscription = () => callback()
      ipcRenderer.on('automation-done', subscription)
      return () => ipcRenderer.off('automation-done', subscription)
    },
    onStopped: (callback) => {
      const subscription = () => callback()
      ipcRenderer.on('automation-stopped', subscription)
      return () => ipcRenderer.off('automation-stopped', subscription)
    },
  },

  // ── Config ────────────────────────────────────────────────────────────────
  config: {
    get: (key) => ipcRenderer.invoke('get-config', key),
    getAll: () => ipcRenderer.invoke('get-all-config'),
    save: (key, value) => ipcRenderer.invoke('save-config', key, value),
  },

  // ── History ───────────────────────────────────────────────────────────────
  history: {
    getLikedPosts: () => ipcRenderer.invoke('get-liked-posts'),
    deleteLikedPost: (id) => ipcRenderer.invoke('delete-liked-post', id),
    clearHistory: () => ipcRenderer.invoke('clear-history'),
    getDbStats: () => ipcRenderer.invoke('get-db-stats'),
  },

  // ── Profiles ──────────────────────────────────────────────────────────────
  profiles: {
    getAll: (platform) => ipcRenderer.invoke('get-profiles', platform),
    getActive: (platform) => ipcRenderer.invoke('get-active-profile', platform),
    save: (platform, profileName, cookieContent) => ipcRenderer.invoke('save-profile', platform, profileName, cookieContent),
    delete: (profileId) => ipcRenderer.invoke('delete-profile', profileId),
    setActive: (profileId) => ipcRenderer.invoke('set-active-profile', profileId),
    updateCookie: (profileId, cookieContent) => ipcRenderer.invoke('update-profile-cookie', profileId, cookieContent),
  },

  // ── Proxies ───────────────────────────────────────────────────────────────
  proxies: {
    getAll: () => ipcRenderer.invoke('get-proxies'),
    getActive: () => ipcRenderer.invoke('get-active-proxy'),
    save: (proxyType, host, port, username, password) => ipcRenderer.invoke('save-proxy', proxyType, host, port, username, password),
    delete: (proxyId) => ipcRenderer.invoke('delete-proxy', proxyId),
    setActive: (proxyId) => ipcRenderer.invoke('set-active-proxy', proxyId),
  },

  // ── Lists (blacklist / whitelist) ─────────────────────────────────────────
  lists: {
    addToBlacklist: (platform, profileUrl, profileName) => ipcRenderer.invoke('add-to-blacklist', platform, profileUrl, profileName),
    addToWhitelist: (platform, profileUrl, profileName) => ipcRenderer.invoke('add-to-whitelist', platform, profileUrl, profileName),
    removeFromList: (listType, platform, profileUrl) => ipcRenderer.invoke('remove-from-list', listType, platform, profileUrl),
    getBlacklist: (platform) => ipcRenderer.invoke('get-blacklist', platform),
    getWhitelist: (platform) => ipcRenderer.invoke('get-whitelist', platform),
    hasWhitelistEnabled: (platform) => ipcRenderer.invoke('has-whitelist-enabled', platform),
  },

  // ── Batch jobs ────────────────────────────────────────────────────────────
  batch: {
    create: (name, platform, urls, configOverride) => ipcRenderer.invoke('create-batch-job', name, platform, urls, configOverride),
    getAll: () => ipcRenderer.invoke('get-batch-jobs'),
    getOne: (batchId) => ipcRenderer.invoke('get-batch-job', batchId),
    getUrls: (batchId) => ipcRenderer.invoke('get-batch-urls', batchId),
    delete: (batchId) => ipcRenderer.invoke('delete-batch-job', batchId),
  },

  // ── Comment templates ─────────────────────────────────────────────────────
  templates: {
    getAll: (platform) => ipcRenderer.invoke('get-comment-templates', platform),
    getActive: (platform) => ipcRenderer.invoke('get-active-comment-template', platform),
    save: (platform, templateName, commentText) => ipcRenderer.invoke('save-comment-template', platform, templateName, commentText),
    delete: (templateId) => ipcRenderer.invoke('delete-comment-template', templateId),
    setActive: (templateId) => ipcRenderer.invoke('set-active-comment-template', templateId),
  },

  // ── Analytics ─────────────────────────────────────────────────────────────
  analytics: {
    getByPlatform: (days) => ipcRenderer.invoke('get-liked-posts-by-platform', days),
    getCountByPlatform: () => ipcRenderer.invoke('get-liked-posts-count-by-platform'),
    getDaily: (days) => ipcRenderer.invoke('get-liked-posts-daily', days),
    getBatchStats: () => ipcRenderer.invoke('get-batch-job-stats'),
  },

  // ── Database ──────────────────────────────────────────────────────────────
  database: {
    backup: () => ipcRenderer.invoke('backup-database'),
    restore: () => ipcRenderer.invoke('restore-database'),
    getMigrationStatus: () => ipcRenderer.invoke('get-migration-status'),
    migrateCookiesToProfiles: () => ipcRenderer.invoke('migrate-cookies-to-profiles'),
  },

  // ── App / window ──────────────────────────────────────────────────────────
  app: {
    getVersion: () => ipcRenderer.invoke('get-app-version'),
    checkForUpdates: () => ipcRenderer.invoke('check-for-updates'),
    minimize: () => ipcRenderer.invoke('minimize-window'),
    maximize: () => ipcRenderer.invoke('maximize-window'),
    close: () => ipcRenderer.invoke('close-window'),
    openExternal: (url) => ipcRenderer.invoke('open-external', url),
  },
}

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  window.electron = electronAPI
  window.api = api
}
