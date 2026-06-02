import { ipcMain } from 'electron'

/**
 * Daftarkan IPC handler untuk automation (start, stop, batch, status).
 * @param {() => import('../automation/manager.js').AutomationManager | null} getManager
 */
export function registerAutomationHandlers(getManager) {
    function validateUrl(url) {
        if (!url || typeof url !== 'string') return false
        try { new URL(url); return true } catch { return false }
    }

    ipcMain.handle('ping', () => 'pong')

    ipcMain.handle('start-automation', async (_event, targetUrl) => {
        try {
            if (!validateUrl(targetUrl)) return { success: false, error: 'Invalid URL format' }
            const manager = getManager()
            if (!manager) return { success: false, error: 'Manager not initialized' }
            await manager.start(targetUrl)
            return { success: true }
        } catch (err) {
            console.error('Start automation failed:', err)
            return { success: false, error: err.message }
        }
    })

    ipcMain.handle('stop-automation', async () => {
        try {
            const manager = getManager()
            if (!manager) return { success: false, error: 'Manager not initialized' }
            await manager.stop()
            return { success: true }
        } catch (err) {
            return { success: false, error: err.message }
        }
    })

    ipcMain.handle('get-automation-status', () => {
        const manager = getManager()
        return { isRunning: manager ? manager.isRunning : false }
    })

    ipcMain.handle('start-batch-job', async (_event, batchId) => {
        try {
            const manager = getManager()
            if (!manager) return { success: false, error: 'Automation manager not initialized' }
            await manager.startBatch(batchId)
            return { success: true }
        } catch (err) {
            return { success: false, error: err.message }
        }
    })
}
