import { ipcMain } from 'electron'
import * as dbQueries from '../db/queries.js'

/**
 * Daftarkan IPC handler untuk blacklist dan whitelist profil.
 * @param {() => import('sqlite3').Database | null} getDb
 */
export function registerListHandlers(getDb) {
    ipcMain.handle('add-to-blacklist', async (_event, platform, profileUrl, profileName) => {
        try {
            const db = getDb()
            if (!db) return { success: false, error: 'Database not initialized' }
            const id = await dbQueries.addToBlacklist(db, platform, profileUrl, profileName)
            return { success: true, id }
        } catch (err) {
            return { success: false, error: err.message }
        }
    })

    ipcMain.handle('add-to-whitelist', async (_event, platform, profileUrl, profileName) => {
        try {
            const db = getDb()
            if (!db) return { success: false, error: 'Database not initialized' }
            const id = await dbQueries.addToWhitelist(db, platform, profileUrl, profileName)
            return { success: true, id }
        } catch (err) {
            return { success: false, error: err.message }
        }
    })

    ipcMain.handle('remove-from-list', async (_event, listType, platform, profileUrl) => {
        try {
            const db = getDb()
            if (!db) return { success: false, error: 'Database not initialized' }
            await dbQueries.removeFromList(db, listType, platform, profileUrl)
            return { success: true }
        } catch (err) {
            return { success: false, error: err.message }
        }
    })

    ipcMain.handle('get-blacklist', async (_event, platform) => {
        try {
            const db = getDb()
            if (!db) return { success: false, error: 'Database not initialized' }
            const list = await dbQueries.getBlacklist(db, platform)
            return { success: true, data: list }
        } catch (err) {
            return { success: false, error: err.message }
        }
    })

    ipcMain.handle('get-whitelist', async (_event, platform) => {
        try {
            const db = getDb()
            if (!db) return { success: false, error: 'Database not initialized' }
            const list = await dbQueries.getWhitelist(db, platform)
            return { success: true, data: list }
        } catch (err) {
            return { success: false, error: err.message }
        }
    })

    ipcMain.handle('has-whitelist-enabled', async (_event, platform) => {
        try {
            const db = getDb()
            if (!db) return { success: false, error: 'Database not initialized' }
            const enabled = await dbQueries.hasWhitelistEnabled(db, platform)
            return { success: true, enabled }
        } catch (err) {
            return { success: false, error: err.message }
        }
    })
}
