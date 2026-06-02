import { ipcMain, app, shell } from 'electron'
import { checkForUpdates } from '../services/updater.js'

/**
 * Daftarkan IPC handler untuk kontrol aplikasi:
 * window controls, update, versi, dan open-external.
 * @param {() => Electron.BrowserWindow | null} getWindow
 */
export function registerAppHandlers(getWindow) {
    function validateUrl(url) {
        if (!url || typeof url !== 'string') return false
        try { new URL(url); return true } catch { return false }
    }

    ipcMain.handle('get-app-version', () => app.getVersion())

    ipcMain.handle('check-for-updates', async () => {
        try {
            return await checkForUpdates()
        } catch (err) {
            console.error('Failed to check for updates:', err)
            return { updateAvailable: false, error: err.message }
        }
    })

    ipcMain.handle('minimize-window', () => {
        getWindow()?.minimize()
        return true
    })

    ipcMain.handle('maximize-window', () => {
        const win = getWindow()
        if (win) {
            win.isMaximized() ? win.unmaximize() : win.maximize()
        }
        return true
    })

    ipcMain.handle('close-window', () => {
        getWindow()?.close()
        return true
    })

    ipcMain.handle('open-external', async (_event, url) => {
        try {
            if (!validateUrl(url)) return { success: false, error: 'Invalid URL format' }
            await shell.openExternal(url)
            return { success: true }
        } catch (err) {
            console.error('Failed to open external URL:', err)
            return { success: false, error: err.message }
        }
    })
}
