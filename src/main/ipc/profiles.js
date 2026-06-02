import { ipcMain } from 'electron'
import * as dbQueries from '../db/queries.js'

/**
 * Daftarkan IPC handler untuk profiles dan proxies.
 * @param {() => import('sqlite3').Database | null} getDb
 */
export function registerProfileHandlers(getDb) {
    // ── Profiles ──────────────────────────────────────────────────────────────

    ipcMain.handle('get-profiles', async (_event, platform) => {
        try {
            const db = getDb()
            if (!db) return { success: false, error: 'Database not initialized' }
            const profiles = await dbQueries.getProfiles(db, platform)
            return { success: true, data: profiles }
        } catch (err) {
            return { success: false, error: err.message }
        }
    })

    ipcMain.handle('get-active-profile', async (_event, platform) => {
        try {
            const db = getDb()
            if (!db) return { success: false, error: 'Database not initialized' }
            const profile = await dbQueries.getActiveProfile(db, platform)
            return { success: true, data: profile }
        } catch (err) {
            return { success: false, error: err.message }
        }
    })

    ipcMain.handle('save-profile', async (_event, platform, profileName, cookieContent) => {
        try {
            const db = getDb()
            if (!db) return { success: false, error: 'Database not initialized' }
            const id = await dbQueries.saveProfile(db, platform, profileName, cookieContent)
            return { success: true, id }
        } catch (err) {
            return { success: false, error: err.message }
        }
    })

    ipcMain.handle('delete-profile', async (_event, profileId) => {
        try {
            const db = getDb()
            if (!db) return { success: false, error: 'Database not initialized' }
            await dbQueries.deleteProfile(db, profileId)
            return { success: true }
        } catch (err) {
            return { success: false, error: err.message }
        }
    })

    ipcMain.handle('set-active-profile', async (_event, profileId) => {
        try {
            const db = getDb()
            if (!db) return { success: false, error: 'Database not initialized' }
            await dbQueries.setActiveProfile(db, profileId)
            return { success: true }
        } catch (err) {
            return { success: false, error: err.message }
        }
    })

    // ── Proxies ───────────────────────────────────────────────────────────────

    ipcMain.handle('get-proxies', async () => {
        try {
            const db = getDb()
            if (!db) return { success: false, error: 'Database not initialized' }
            const proxies = await dbQueries.getProxies(db)
            return { success: true, data: proxies }
        } catch (err) {
            return { success: false, error: err.message }
        }
    })

    ipcMain.handle('get-active-proxy', async () => {
        try {
            const db = getDb()
            if (!db) return { success: false, error: 'Database not initialized' }
            const proxy = await dbQueries.getActiveProxy(db)
            return { success: true, data: proxy }
        } catch (err) {
            return { success: false, error: err.message }
        }
    })

    ipcMain.handle('save-proxy', async (_event, proxyType, host, port, username, password) => {
        try {
            const db = getDb()
            if (!db) return { success: false, error: 'Database not initialized' }
            const id = await dbQueries.saveProxy(db, proxyType, host, port, username, password)
            return { success: true, id }
        } catch (err) {
            return { success: false, error: err.message }
        }
    })

    ipcMain.handle('delete-proxy', async (_event, proxyId) => {
        try {
            const db = getDb()
            if (!db) return { success: false, error: 'Database not initialized' }
            await dbQueries.deleteProxy(db, proxyId)
            return { success: true }
        } catch (err) {
            return { success: false, error: err.message }
        }
    })

    ipcMain.handle('set-active-proxy', async (_event, proxyId) => {
        try {
            const db = getDb()
            if (!db) return { success: false, error: 'Database not initialized' }
            await dbQueries.setActiveProxy(db, proxyId)
            return { success: true }
        } catch (err) {
            return { success: false, error: err.message }
        }
    })
}
