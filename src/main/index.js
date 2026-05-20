import { app, shell, BrowserWindow, ipcMain, screen, dialog } from 'electron'
import { join } from 'path'
import { existsSync, mkdirSync, copyFileSync, writeFileSync, unlinkSync } from 'fs'
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
  let iconPath = join(__dirname, '../../src/renderer/src/app_logo_icon.png')
  if (app.isPackaged) {
    iconPath = join(process.resourcesPath, 'icon.png')
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
      sandbox: false
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

// IPC Handlers
ipcMain.handle('ping', () => 'pong')

ipcMain.handle('save-cookie', async (event, platform, content) => {
  try {
    const userDataPath = app.getPath('userData')
    const cookieDir = join(userDataPath, 'cookie')
    if (!existsSync(cookieDir)) {
      mkdirSync(cookieDir, { recursive: true })
    }
    const filePath = join(cookieDir, `${platform}_cookie.txt`)
    writeFileSync(filePath, content, 'utf-8')
    return { success: true }
  } catch (err) {
    console.error('Failed to save cookie:', err)
    return { success: false, error: err.message }
  }
})

ipcMain.handle('delete-cookie', async (event, platform) => {
  try {
    const userDataPath = app.getPath('userData')
    const filePath = join(userDataPath, 'cookie', `${platform}_cookie.txt`)
    if (existsSync(filePath)) {
      unlinkSync(filePath)
    }
    return { success: true }
  } catch (err) {
    console.error('Failed to delete cookie:', err)
    return { success: false, error: err.message }
  }
})

ipcMain.handle('check-cookies-status', async () => {
  try {
    const userDataPath = app.getPath('userData')
    const localPath = app.isPackaged
      ? join(process.resourcesPath, 'cookie')
      : join(app.getAppPath(), 'resources/cookie')

    const statuses = {
      instagram: false,
      twitter: false,
      threads: false
    }

    const platforms = ['instagram', 'twitter', 'threads']
    for (const platform of platforms) {
      const p1 = join(userDataPath, 'cookie', `${platform}_cookie.txt`)
      const p2 = join(localPath, `${platform}_cookie.txt`)
      const p3 = join(userDataPath, 'cookie', `${platform}.txt`)
      const p4 = join(localPath, `${platform}.txt`)
      if (existsSync(p1) || existsSync(p2) || existsSync(p3) || existsSync(p4)) {
        statuses[platform] = true
      }
    }
    return statuses
  } catch (err) {
    console.error('Failed to check cookies status:', err)
    return { instagram: false, twitter: false, threads: false }
  }
})

ipcMain.handle('start-automation', async (event, targetUrl) => {
  if (automationManager) {
    await automationManager.start(targetUrl)
    return { success: true }
  }
  return { success: false, error: 'Manager not initialized' }
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
  if (db) {
    try {
      await dbQueries.deleteLikedPost(db, id)
      return { success: true }
    } catch (err) {
      return { success: false, error: err.message }
    }
  }
  return { success: false, error: 'Database not initialized' }
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
  if (db) {
    try {
      await dbQueries.saveConfig(db, key, value)
      return { success: true }
    } catch (err) {
      return { success: false, error: err.message }
    }
  }
  return { success: false, error: 'Database not initialized' }
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
      await new Promise((resolve) => db.close(() => resolve()))
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



