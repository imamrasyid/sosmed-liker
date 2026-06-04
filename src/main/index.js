import { app, shell, BrowserWindow, screen } from 'electron'
import { join } from 'path'
import { existsSync, mkdirSync, copyFileSync, writeFileSync } from 'fs'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import { initDb } from './db/setup.js'
import { AutomationManager } from './automation/manager.js'
import { AUTOMATION_EVENTS } from './utils/constants.js'
import { registerAutomationHandlers } from './ipc/automation.js'
import { registerConfigHandlers } from './ipc/config.js'
import { registerHistoryHandlers } from './ipc/history.js'
import { registerProfileHandlers } from './ipc/profiles.js'
import { registerListHandlers } from './ipc/lists.js'
import { registerAnalyticsHandlers } from './ipc/analytics.js'
import { registerTemplateHandlers } from './ipc/templates.js'
import { registerDatabaseHandlers } from './ipc/database.js'
import { registerAppHandlers } from './ipc/app.js'

// ── State ──────────────────────────────────────────────────────────────────
let mainWindow = null
let db = null
let automationManager = null

// Getter/setter functions diteruskan ke modul IPC agar mereka bisa akses
// state terbaru tanpa circular dependency.
const getWindow = () => mainWindow
const getDb = () => db
const setDb = (newDb) => { db = newDb }
const getManager = () => automationManager

// ── Inisialisasi folder userData ──────────────────────────────────────────
function initializeUserDataFolder() {
  const userDataPath = app.getPath('userData')
  const cookiesFolder = join(userDataPath, 'cookie')

  if (!existsSync(cookiesFolder)) {
    mkdirSync(cookiesFolder, { recursive: true })
  }

  const readmeDest = join(cookiesFolder, 'README.txt')
  if (!existsSync(readmeDest)) {
    const templateReadmePath = app.isPackaged
      ? join(process.resourcesPath, 'cookie/README.txt')
      : join(app.getAppPath(), 'resources/cookie/README.txt')

    try {
      if (existsSync(templateReadmePath)) {
        copyFileSync(templateReadmePath, readmeDest)
      } else {
        const fallbackText =
          `=== SOSMED LIKER - COOKIE FOLDER ===\n\n` +
          `Letakkan berkas kuki Netscape (.txt) Anda di dalam folder ini.\n` +
          `Misal: instagram_cookie.txt`
        writeFileSync(readmeDest, fallbackText, 'utf-8')
      }
    } catch (err) {
      console.error('Gagal mempopulasi folder cookie awal:', err)
    }
  }
}

// ── Buat window utama ─────────────────────────────────────────────────────
async function createWindow() {
  const { width: screenWidth, height: screenHeight } = screen.getPrimaryDisplay().workAreaSize

  const width = Math.min(1440, screenWidth)
  const height = Math.min(900, screenHeight)

  const iconPath = app.isPackaged
    ? join(process.resourcesPath, 'icon.png')
    : join(__dirname, '../../resources/icon.png')

  mainWindow = new BrowserWindow({
    width,
    height,
    minWidth: 1024,
    minHeight: 700,
    show: false,
    autoHideMenuBar: true,
    icon: iconPath,
    frame: false,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      contextIsolation: true
    }
  })

  mainWindow.on('ready-to-show', () => mainWindow.show())

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// ── App lifecycle ─────────────────────────────────────────────────────────
app.whenReady().then(async () => {
  electronApp.setAppUserModelId('com.sosmed.liker')
  initializeUserDataFolder()

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // Inisialisasi DB dan AutomationManager
  try {
    db = await initDb()
    automationManager = new AutomationManager(db, (message) => {
      if (!mainWindow) return
      // Event status khusus — tidak diteruskan sebagai log biasa ke UI
      if (message === AUTOMATION_EVENTS.DONE) {
        mainWindow.webContents.send('automation-done')
        return
      }
      if (message === AUTOMATION_EVENTS.STOPPED) {
        mainWindow.webContents.send('automation-stopped')
        return
      }
      mainWindow.webContents.send('automation-log', message)
    })
  } catch (error) {
    console.error('Failed to initialize DB:', error)
  }

  // Daftarkan semua IPC handler per domain
  registerAutomationHandlers(getManager)
  registerConfigHandlers(getDb)
  registerHistoryHandlers(getDb)
  registerProfileHandlers(getDb)
  registerListHandlers(getDb)
  registerAnalyticsHandlers(getDb)
  registerTemplateHandlers(getDb)
  registerDatabaseHandlers(getDb, setDb, getManager, getWindow)
  registerAppHandlers(getWindow)

  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
