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
  saveCookie: (platform, content) => ipcRenderer.invoke('save-cookie', platform, content),
  deleteCookie: (platform) => ipcRenderer.invoke('delete-cookie', platform),
  checkCookiesStatus: () => ipcRenderer.invoke('check-cookies-status'),
  openExternal: (url) => ipcRenderer.invoke('open-external', url),
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
