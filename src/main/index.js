import { app, shell, BrowserWindow, ipcMain, screen, dialog } from 'electron'
import { join } from 'path'
import { existsSync, mkdirSync, copyFileSync, writeFileSync } from 'fs'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import { initDb, getDbPath } from './db/setup.js'
import { AutomationManager } from './automation/manager.js'
import { checkForUpdates } from './services/updater.js'
import * as dbQueries from './db/queries.js'

let mainWindow;
let db;
let automationManager;

// Setup dan populasikan otomatis berkas kuki di AppData pada saat startup
function initializeUserDataFolder() {
  const userDataPath = app.getPath('userData')
  const cookiesFolder = join(userDataPath, 'cookie')

  // Pastikan folder cookie terbuat secara writable
  if (!existsSync(cookiesFolder)) {
    mkdirSync(cookiesFolder, { recursive: true })
  }

  // Salin berkas README.txt template dari folder resources aplikasi jika belum ada
  const readmeDest = join(cookiesFolder, 'README.txt')
  if (!existsSync(readmeDest)) {
    const templateReadmePath = app.isPackaged
      ? join(process.resourcesPath, 'cookie/README.txt')
      : join(app.getAppPath(), 'resources/cookie/README.txt')

    try {
      if (existsSync(templateReadmePath)) {
        copyFileSync(templateReadmePath, readmeDest)
      } else {
        // Fallback jika tidak sengaja hilang
        const fallbackText = `=== SOSMED LIKER - COOKIE FOLDER ===\n\nLetakkan berkas kuki Netscape (.txt) Anda di dalam folder ini.\nMisal: instagram_cookie.txt`
        writeFileSync(readmeDest, fallbackText, 'utf-8')
      }
    } catch (err) {
      console.error('Gagal mempopulasi folder cookie awal:', err)
    }
  }
}

async function createWindow() {
  // Dapatkan ukuran area kerja monitor pengguna (resolusi dikurangi area taskbar/dock)
  const { width: screenWidth, height: screenHeight } = screen.getPrimaryDisplay().workAreaSize

  const defaultWidth = 1440
  const defaultHeight = 900
  const minWidth = 1024
  const minHeight = 700

  // Gunakan nilai terkecil agar pas di layar kecil, namun default ke 1440x900 di layar lebar
  const width = Math.min(defaultWidth, screenWidth)
  const height = Math.min(defaultHeight, screenHeight)

  // Tentukan ikon kustom berdasarkan mode (pengembangan atau produksi)
  let iconPath
  if (app.isPackaged) {
    iconPath = join(process.resourcesPath, 'icon.png')
  } else {
    iconPath = join(__dirname, '../../resources/icon.png')
  }

  mainWindow = new BrowserWindow({
    width: width,
    height: height,
    minWidth: minWidth,
    minHeight: minHeight,
    show: false,
    autoHideMenuBar: true,
    icon: iconPath, // Ikon kustom dinamis untuk taskbar & window
    frame: false, // Menjadikan window benar-benar frameless (tanpa frame & overlay default sistem)
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      contextIsolation: true
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

app.whenReady().then(async () => {
  electronApp.setAppUserModelId('com.sosmed.liker')

  // Panggil fungsi inisialisasi folder cookie writable & file README template
  initializeUserDataFolder()

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // Initialize DB and Manager
  try {
    db = await initDb()
    automationManager = new AutomationManager(db, (message) => {
      if (mainWindow) {
        mainWindow.webContents.send('automation-log', message)
      }
    })
  } catch (error) {
    console.error('Failed to initialize DB:', error)
  }

  createWindow()

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// Input Validation Helpers
function validatePlatform(platform) {
  const validPlatforms = ['instagram', 'twitter', 'threads']
  return validPlatforms.includes(platform)
}

function validateUrl(url) {
  if (!url || typeof url !== 'string') return false
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

function validateId(id) {
  return id && typeof id === 'number' && id > 0
}

function validateConfigKey(key) {
  const validKeys = ['min_delay', 'max_delay', 'limit', 'headless', 'consecutive_skips_limit', 'scroll_step', 'max_scroll_attempts', 'browser_user_agent']
  return validKeys.includes(key)
}

// IPC Handlers
ipcMain.handle('ping', () => 'pong')

ipcMain.handle('start-automation', async (event, targetUrl) => {
  try {
    // Validate URL
    if (!validateUrl(targetUrl)) {
      return { success: false, error: 'Invalid URL format' }
    }

    if (automationManager) {
      await automationManager.start(targetUrl)
      return { success: true }
    }
    return { success: false, error: 'Manager not initialized' }
  } catch (err) {
    console.error('Start automation failed:', err)
    return { success: false, error: err.message }
  }
})

ipcMain.handle('stop-automation', async () => {
  if (automationManager) {
    await automationManager.stop()
    return { success: true }
  }
  return { success: false, error: 'Manager not initialized' }
})

ipcMain.handle('get-liked-posts', async () => {
  if (db) {
    try {
      return await dbQueries.getAllLikedPosts(db)
    } catch (err) {
      console.error(err)
      return []
    }
  }
  return []
})

ipcMain.handle('delete-liked-post', async (event, id) => {
  try {
    // Validate ID
    if (!validateId(id)) {
      return { success: false, error: 'Invalid ID' }
    }

    if (db) {
      await dbQueries.deleteLikedPost(db, id)
      return { success: true }
    }
    return { success: false, error: 'Database not initialized' }
  } catch (err) {
    console.error('Delete liked post failed:', err)
    return { success: false, error: err.message }
  }
})

ipcMain.handle('clear-history', async () => {
  if (db) {
    try {
      await dbQueries.clearLikedPosts(db)
      return { success: true }
    } catch (err) {
      return { success: false, error: err.message }
    }
  }
  return { success: false, error: 'Database not initialized' }
})

ipcMain.handle('get-db-stats', async () => {
  if (db) {
    try {
      return await dbQueries.getDbStats(db)
    } catch (err) {
      console.error(err)
      return { total_liked: 0, total_profiles: 0, liked_today: 0 }
    }
  }
  return { total_liked: 0, total_profiles: 0, liked_today: 0 }
})

ipcMain.handle('get-config', async (event, key) => {
  if (db) {
    try {
      return await dbQueries.getConfig(db, key)
    } catch (err) {
      console.error(err)
      return null
    }
  }
  return null
})

ipcMain.handle('save-config', async (event, key, value) => {
  try {
    // Validate key
    if (!validateConfigKey(key)) {
      return { success: false, error: 'Invalid config key' }
    }

    // Validate value
    if (value === null || value === undefined) {
      return { success: false, error: 'Config value is required' }
    }

    const valueStr = String(value).trim()
    if (valueStr.length === 0) {
      return { success: false, error: 'Config value cannot be empty' }
    }

    if (valueStr.length > 1000) {
      return { success: false, error: 'Config value too large' }
    }

    if (db) {
      await dbQueries.saveConfig(db, key, valueStr)
      return { success: true }
    }
    return { success: false, error: 'Database not initialized' }
  } catch (err) {
    console.error('Save config failed:', err)
    return { success: false, error: err.message }
  }
})

// Profile Lists (Blacklist/Whitelist) IPC handlers
ipcMain.handle('add-to-blacklist', async (event, platform, profileUrl, profileName) => {
  try {
    if (!db) return { success: false, error: 'Database not initialized' }
    const id = await dbQueries.addToBlacklist(db, platform, profileUrl, profileName)
    return { success: true, id }
  } catch (err) {
    return { success: false, error: err.message }
  }
})

ipcMain.handle('add-to-whitelist', async (event, platform, profileUrl, profileName) => {
  try {
    if (!db) return { success: false, error: 'Database not initialized' }
    const id = await dbQueries.addToWhitelist(db, platform, profileUrl, profileName)
    return { success: true, id }
  } catch (err) {
    return { success: false, error: err.message }
  }
})

ipcMain.handle('remove-from-list', async (event, listType, platform, profileUrl) => {
  try {
    if (!db) return { success: false, error: 'Database not initialized' }
    await dbQueries.removeFromList(db, listType, platform, profileUrl)
    return { success: true }
  } catch (err) {
    return { success: false, error: err.message }
  }
})

ipcMain.handle('get-blacklist', async (event, platform) => {
  try {
    if (!db) return { success: false, error: 'Database not initialized' }
    const list = await dbQueries.getBlacklist(db, platform)
    return { success: true, data: list }
  } catch (err) {
    return { success: false, error: err.message }
  }
})

ipcMain.handle('get-whitelist', async (event, platform) => {
  try {
    if (!db) return { success: false, error: 'Database not initialized' }
    const list = await dbQueries.getWhitelist(db, platform)
    return { success: true, data: list }
  } catch (err) {
    return { success: false, error: err.message }
  }
})

ipcMain.handle('has-whitelist-enabled', async (event, platform) => {
  try {
    if (!db) return { success: false, error: 'Database not initialized' }
    const enabled = await dbQueries.hasWhitelistEnabled(db, platform)
    return { success: true, enabled }
  } catch (err) {
    return { success: false, error: err.message }
  }
})

// Profiles IPC handlers
ipcMain.handle('get-profiles', async (event, platform) => {
  try {
    if (!db) return { success: false, error: 'Database not initialized' }
    const profiles = await dbQueries.getProfiles(db, platform)
    return { success: true, data: profiles }
  } catch (err) {
    return { success: false, error: err.message }
  }
})

ipcMain.handle('get-active-profile', async (event, platform) => {
  try {
    if (!db) return { success: false, error: 'Database not initialized' }
    const profile = await dbQueries.getActiveProfile(db, platform)
    return { success: true, data: profile }
  } catch (err) {
    return { success: false, error: err.message }
  }
})

ipcMain.handle('save-profile', async (event, platform, profileName, cookieContent) => {
  try {
    if (!db) return { success: false, error: 'Database not initialized' }
    const id = await dbQueries.saveProfile(db, platform, profileName, cookieContent)
    return { success: true, id }
  } catch (err) {
    return { success: false, error: err.message }
  }
})

ipcMain.handle('delete-profile', async (event, profileId) => {
  try {
    if (!db) return { success: false, error: 'Database not initialized' }
    await dbQueries.deleteProfile(db, profileId)
    return { success: true }
  } catch (err) {
    return { success: false, error: err.message }
  }
})

ipcMain.handle('set-active-profile', async (event, profileId) => {
  try {
    if (!db) return { success: false, error: 'Database not initialized' }
    await dbQueries.setActiveProfile(db, profileId)
    return { success: true }
  } catch (err) {
    return { success: false, error: err.message }
  }
})

// Proxies IPC handlers
ipcMain.handle('get-proxies', async () => {
  try {
    if (!db) return { success: false, error: 'Database not initialized' }
    const proxies = await dbQueries.getProxies(db)
    return { success: true, data: proxies }
  } catch (err) {
    return { success: false, error: err.message }
  }
})

ipcMain.handle('get-active-proxy', async () => {
  try {
    if (!db) return { success: false, error: 'Database not initialized' }
    const proxy = await dbQueries.getActiveProxy(db)
    return { success: true, data: proxy }
  } catch (err) {
    return { success: false, error: err.message }
  }
})

ipcMain.handle('save-proxy', async (event, proxyType, host, port, username, password) => {
  try {
    if (!db) return { success: false, error: 'Database not initialized' }
    const id = await dbQueries.saveProxy(db, proxyType, host, port, username, password)
    return { success: true, id }
  } catch (err) {
    return { success: false, error: err.message }
  }
})

ipcMain.handle('delete-proxy', async (event, proxyId) => {
  try {
    if (!db) return { success: false, error: 'Database not initialized' }
    await dbQueries.deleteProxy(db, proxyId)
    return { success: true }
  } catch (err) {
    return { success: false, error: err.message }
  }
})

ipcMain.handle('set-active-proxy', async (event, proxyId) => {
  try {
    if (!db) return { success: false, error: 'Database not initialized' }
    await dbQueries.setActiveProxy(db, proxyId)
    return { success: true }
  } catch (err) {
    return { success: false, error: err.message }
  }
})

// Batch Jobs IPC handlers
ipcMain.handle('create-batch-job', async (event, name, platform, urls) => {
  try {
    if (!db) return { success: false, error: 'Database not initialized' }
    const batchId = await dbQueries.createBatchJob(db, name, platform, urls)
    return { success: true, batchId }
  } catch (err) {
    return { success: false, error: err.message }
  }
})

ipcMain.handle('get-batch-jobs', async () => {
  try {
    if (!db) return { success: false, error: 'Database not initialized' }
    const jobs = await dbQueries.getBatchJobs(db)
    return { success: true, data: jobs }
  } catch (err) {
    return { success: false, error: err.message }
  }
})

ipcMain.handle('get-batch-job', async (event, batchId) => {
  try {
    if (!db) return { success: false, error: 'Database not initialized' }
    const job = await dbQueries.getBatchJob(db, batchId)
    return { success: true, data: job }
  } catch (err) {
    return { success: false, error: err.message }
  }
})

ipcMain.handle('get-batch-urls', async (event, batchId) => {
  try {
    if (!db) return { success: false, error: 'Database not initialized' }
    const urls = await dbQueries.getBatchUrls(db, batchId)
    return { success: true, data: urls }
  } catch (err) {
    return { success: false, error: err.message }
  }
})

ipcMain.handle('delete-batch-job', async (event, batchId) => {
  try {
    if (!db) return { success: false, error: 'Database not initialized' }
    await dbQueries.deleteBatchJob(db, batchId)
    return { success: true }
  } catch (err) {
    return { success: false, error: err.message }
  }
})

ipcMain.handle('start-batch-job', async (event, batchId) => {
  try {
    if (!automationManager) return { success: false, error: 'Automation manager not initialized' }
    await automationManager.startBatch(batchId)
    return { success: true }
  } catch (err) {
    return { success: false, error: err.message }
  }
})

// Analytics IPC handlers
ipcMain.handle('get-liked-posts-by-platform', async (event, days) => {
  try {
    if (!db) return { success: false, error: 'Database not initialized' }
    const data = await dbQueries.getLikedPostsByPlatform(db, days || 30)
    return { success: true, data }
  } catch (err) {
    return { success: false, error: err.message }
  }
})

ipcMain.handle('get-liked-posts-count-by-platform', async () => {
  try {
    if (!db) return { success: false, error: 'Database not initialized' }
    const data = await dbQueries.getLikedPostsCountByPlatform(db)
    return { success: true, data }
  } catch (err) {
    return { success: false, error: err.message }
  }
})

ipcMain.handle('get-liked-posts-daily', async (event, days) => {
  try {
    if (!db) return { success: false, error: 'Database not initialized' }
    const data = await dbQueries.getLikedPostsDaily(db, days || 30)
    return { success: true, data }
  } catch (err) {
    return { success: false, error: err.message }
  }
})

ipcMain.handle('get-batch-job-stats', async () => {
  try {
    if (!db) return { success: false, error: 'Database not initialized' }
    const data = await dbQueries.getBatchJobStats(db)
    return { success: true, data }
  } catch (err) {
    return { success: false, error: err.message }
  }
})

// Comment Templates IPC handlers
ipcMain.handle('get-comment-templates', async (event, platform) => {
  try {
    if (!db) return { success: false, error: 'Database not initialized' }
    const templates = await dbQueries.getCommentTemplates(db, platform)
    return { success: true, data: templates }
  } catch (err) {
    return { success: false, error: err.message }
  }
})

ipcMain.handle('get-active-comment-template', async (event, platform) => {
  try {
    if (!db) return { success: false, error: 'Database not initialized' }
    const template = await dbQueries.getActiveCommentTemplate(db, platform)
    return { success: true, data: template }
  } catch (err) {
    return { success: false, error: err.message }
  }
})

ipcMain.handle('save-comment-template', async (event, platform, templateName, commentText) => {
  try {
    if (!db) return { success: false, error: 'Database not initialized' }
    const id = await dbQueries.saveCommentTemplate(db, platform, templateName, commentText)
    return { success: true, id }
  } catch (err) {
    return { success: false, error: err.message }
  }
})

ipcMain.handle('delete-comment-template', async (event, templateId) => {
  try {
    if (!db) return { success: false, error: 'Database not initialized' }
    await dbQueries.deleteCommentTemplate(db, templateId)
    return { success: true }
  } catch (err) {
    return { success: false, error: err.message }
  }
})

ipcMain.handle('set-active-comment-template', async (event, templateId) => {
  try {
    if (!db) return { success: false, error: 'Database not initialized' }
    await dbQueries.setActiveCommentTemplate(db, templateId)
    return { success: true }
  } catch (err) {
    return { success: false, error: err.message }
  }
})

// Migration IPC handlers
ipcMain.handle('get-migration-status', async () => {
  try {
    if (!db) return { success: false, error: 'Database not initialized' }
    const status = await dbQueries.getMigrationStatus(db)
    return { success: true, migrated: status }
  } catch (err) {
    return { success: false, error: err.message }
  }
})

ipcMain.handle('migrate-cookies-to-profiles', async () => {
  try {
    if (!db) return { success: false, error: 'Database not initialized' }
    const cookieFolder = join(app.getPath('userData'), 'cookie')
    const result = await dbQueries.migrateCookiesToProfiles(db, cookieFolder)
    return { success: true, ...result }
  } catch (err) {
    return { success: false, error: err.message }
  }
})

ipcMain.handle('backup-database', async () => {
  try {
    const dbPath = getDbPath()
    if (!existsSync(dbPath)) {
      return { success: false, error: 'Database file does not exist' }
    }

    const { filePath } = await dialog.showSaveDialog(mainWindow, {
      title: 'Pilih Lokasi Simpan Cadangan Database',
      defaultPath: join(app.getPath('downloads'), `sosmed-liker-backup-${new Date().toISOString().slice(0, 10)}.bak`),
      filters: [
        { name: 'Backup Files', extensions: ['bak'] },
        { name: 'SQLite Files', extensions: ['sqlite', 'db'] },
        { name: 'All Files', extensions: ['*'] }
      ]
    })

    if (!filePath) {
      return { success: false, cancelled: true }
    }

    copyFileSync(dbPath, filePath)
    return { success: true, path: filePath }
  } catch (err) {
    console.error('Backup database failed:', err)
    return { success: false, error: err.message }
  }
})

ipcMain.handle('restore-database', async () => {
  try {
    const { filePaths } = await dialog.showOpenDialog(mainWindow, {
      title: 'Pilih File Cadangan Database untuk Dipulihkan',
      filters: [
        { name: 'Backup Files', extensions: ['bak', 'sqlite', 'db'] },
        { name: 'All Files', extensions: ['*'] }
      ],
      properties: ['openFile']
    })

    if (!filePaths || filePaths.length === 0) {
      return { success: false, cancelled: true }
    }

    const backupPath = filePaths[0]
    const dbPath = getDbPath()

    // Close active db connection first to avoid file lock
    if (db) {
      await new Promise((resolve, reject) => {
        db.close((err) => {
          if (err) reject(err)
          else resolve()
        })
      })
    }

    // Copy backup file to overwrite current database
    copyFileSync(backupPath, dbPath)

    // Reinitialize DB connection
    const sqlite3 = require('sqlite3')
    db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        console.error('Error re-opening DB after restore:', err)
      } else {
        // Update manager db connection
        if (automationManager) {
          automationManager.db = db
        }
      }
    })

    return { success: true }
  } catch (err) {
    console.error('Restore database failed:', err)
    return { success: false, error: err.message }
  }
})

ipcMain.handle('check-for-updates', async () => {
  try {
    return await checkForUpdates()
  } catch (err) {
    console.error('Failed to check for updates:', err)
    return { updateAvailable: false, error: err.message }
  }
})

ipcMain.handle('get-app-version', () => {
  return app.getVersion()
})

ipcMain.handle('minimize-window', () => {
  if (mainWindow) {
    mainWindow.minimize()
  }
  return true
})

ipcMain.handle('maximize-window', () => {
  if (mainWindow) {
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize()
    } else {
      mainWindow.maximize()
    }
  }
  return true
})

ipcMain.handle('close-window', () => {
  if (mainWindow) {
    mainWindow.close()
  }
  return true
})

ipcMain.handle('open-external', async (event, url) => {
  try {
    // Validate URL
    if (!validateUrl(url)) {
      return { success: false, error: 'Invalid URL format' }
    }

    await shell.openExternal(url)
    return { success: true }
  } catch (err) {
    console.error('Failed to open external URL:', err)
    return { success: false, error: err.message }
  }
})



