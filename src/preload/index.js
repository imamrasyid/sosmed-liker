import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

const api = {
  ping: () => ipcRenderer.invoke('ping'),
  startAutomation: (targetUrl) => ipcRenderer.invoke('start-automation', targetUrl),
  stopAutomation: () => ipcRenderer.invoke('stop-automation'),
  getLikedPosts: () => ipcRenderer.invoke('get-liked-posts'),
  deleteLikedPost: (id) => ipcRenderer.invoke('delete-liked-post', id),
  clearHistory: () => ipcRenderer.invoke('clear-history'),
  getDbStats: () => ipcRenderer.invoke('get-db-stats'),
  getConfig: (key) => ipcRenderer.invoke('get-config', key),
  saveConfig: (key, value) => ipcRenderer.invoke('save-config', key, value),
  backupDatabase: () => ipcRenderer.invoke('backup-database'),
  restoreDatabase: () => ipcRenderer.invoke('restore-database'),
  checkForUpdates: () => ipcRenderer.invoke('check-for-updates'),
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  minimizeWindow: () => ipcRenderer.invoke('minimize-window'),
  maximizeWindow: () => ipcRenderer.invoke('maximize-window'),
  closeWindow: () => ipcRenderer.invoke('close-window'),
  openExternal: (url) => ipcRenderer.invoke('open-external', url),
  addToBlacklist: (platform, profileUrl, profileName) => ipcRenderer.invoke('add-to-blacklist', platform, profileUrl, profileName),
  addToWhitelist: (platform, profileUrl, profileName) => ipcRenderer.invoke('add-to-whitelist', platform, profileUrl, profileName),
  removeFromList: (listType, platform, profileUrl) => ipcRenderer.invoke('remove-from-list', listType, platform, profileUrl),
  getBlacklist: (platform) => ipcRenderer.invoke('get-blacklist', platform),
  getWhitelist: (platform) => ipcRenderer.invoke('get-whitelist', platform),
  hasWhitelistEnabled: (platform) => ipcRenderer.invoke('has-whitelist-enabled', platform),
  getProfiles: (platform) => ipcRenderer.invoke('get-profiles', platform),
  getActiveProfile: (platform) => ipcRenderer.invoke('get-active-profile', platform),
  saveProfile: (platform, profileName, cookieContent) => ipcRenderer.invoke('save-profile', platform, profileName, cookieContent),
  deleteProfile: (profileId) => ipcRenderer.invoke('delete-profile', profileId),
  setActiveProfile: (profileId) => ipcRenderer.invoke('set-active-profile', profileId),
  getProxies: () => ipcRenderer.invoke('get-proxies'),
  getActiveProxy: () => ipcRenderer.invoke('get-active-proxy'),
  saveProxy: (proxyType, host, port, username, password) => ipcRenderer.invoke('save-proxy', proxyType, host, port, username, password),
  deleteProxy: (proxyId) => ipcRenderer.invoke('delete-proxy', proxyId),
  setActiveProxy: (proxyId) => ipcRenderer.invoke('set-active-proxy', proxyId),
  createBatchJob: (name, platform, urls) => ipcRenderer.invoke('create-batch-job', name, platform, urls),
  getBatchJobs: () => ipcRenderer.invoke('get-batch-jobs'),
  getBatchJob: (batchId) => ipcRenderer.invoke('get-batch-job', batchId),
  getBatchUrls: (batchId) => ipcRenderer.invoke('get-batch-urls', batchId),
  deleteBatchJob: (batchId) => ipcRenderer.invoke('delete-batch-job', batchId),
  startBatchJob: (batchId) => ipcRenderer.invoke('start-batch-job', batchId),
  getLikedPostsByPlatform: (days) => ipcRenderer.invoke('get-liked-posts-by-platform', days),
  getLikedPostsCountByPlatform: () => ipcRenderer.invoke('get-liked-posts-count-by-platform'),
  getLikedPostsDaily: (days) => ipcRenderer.invoke('get-liked-posts-daily', days),
  getBatchJobStats: () => ipcRenderer.invoke('get-batch-job-stats'),
  getCommentTemplates: (platform) => ipcRenderer.invoke('get-comment-templates', platform),
  getActiveCommentTemplate: (platform) => ipcRenderer.invoke('get-active-comment-template', platform),
  saveCommentTemplate: (platform, templateName, commentText) => ipcRenderer.invoke('save-comment-template', platform, templateName, commentText),
  deleteCommentTemplate: (templateId) => ipcRenderer.invoke('delete-comment-template', templateId),
  setActiveCommentTemplate: (templateId) => ipcRenderer.invoke('set-active-comment-template', templateId),
  getMigrationStatus: () => ipcRenderer.invoke('get-migration-status'),
  migrateCookiesToProfiles: () => ipcRenderer.invoke('migrate-cookies-to-profiles'),
  onAutomationLog: (callback) => {
    const subscription = (_event, value) => callback(value)
    ipcRenderer.on('automation-log', subscription)
    return () => {
      ipcRenderer.off('automation-log', subscription)
    }
  }
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
