import { ipcMain } from 'electron'
import * as dbQueries from '../db/queries.js'

const VALID_CONFIG_KEYS = [
    'min_delay', 'max_delay', 'limit', 'headless',
    'consecutive_skips_limit', 'scroll_step', 'max_scroll_attempts', 'browser_user_agent'
]

/**
 * Daftarkan IPC handler untuk konfigurasi aplikasi.
 * Termasuk channel 'get-all-config' untuk batch fetch (menggantikan 8 call terpisah).
 * @param {() => import('sqlite3').Database | null} getDb
 */
export function registerConfigHandlers(getDb) {
    function validateConfigKey(key) {
        return VALID_CONFIG_KEYS.includes(key)
    }

    ipcMain.handle('get-config', async (_event, key) => {
        const db = getDb()
        if (!db) return null
        try {
            return await dbQueries.getConfig(db, key)
        } catch (err) {
            console.error(err)
            return null
        }
    })

    // Batch fetch semua config dalam 1 round-trip — menggantikan 8 IPC call terpisah
    ipcMain.handle('get-all-config', async () => {
        const db = getDb()
        if (!db) return { success: false, error: 'Database not initialized' }
        try {
            const entries = await Promise.all(
                VALID_CONFIG_KEYS.map(async (key) => [key, await dbQueries.getConfig(db, key)])
            )
            return { success: true, data: Object.fromEntries(entries) }
        } catch (err) {
            console.error('Failed to get all config:', err)
            return { success: false, error: err.message }
        }
    })

    ipcMain.handle('save-config', async (_event, key, value) => {
        try {
            if (!validateConfigKey(key)) return { success: false, error: 'Invalid config key' }
            if (value === null || value === undefined) return { success: false, error: 'Config value is required' }

            const valueStr = String(value).trim()
            if (valueStr.length === 0) return { success: false, error: 'Config value cannot be empty' }
            if (valueStr.length > 1000) return { success: false, error: 'Config value too large' }

            const db = getDb()
            if (!db) return { success: false, error: 'Database not initialized' }
            await dbQueries.saveConfig(db, key, valueStr)
            return { success: true }
        } catch (err) {
            console.error('Save config failed:', err)
            return { success: false, error: err.message }
        }
    })
}
