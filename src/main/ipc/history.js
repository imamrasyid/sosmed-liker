import { ipcMain } from 'electron'
import * as dbQueries from '../db/queries.js'

/**
 * Daftarkan IPC handler untuk liked posts history dan DB stats.
 * @param {() => import('sqlite3').Database | null} getDb
 */
export function registerHistoryHandlers(getDb) {
    function validateId(id) {
        return id && typeof id === 'number' && id > 0
    }

    ipcMain.handle('get-liked-posts', async () => {
        const db = getDb()
        if (!db) return []
        try {
            return await dbQueries.getAllLikedPosts(db)
        } catch (err) {
            console.error(err)
            return []
        }
    })

    ipcMain.handle('delete-liked-post', async (_event, id) => {
        try {
            if (!validateId(id)) return { success: false, error: 'Invalid ID' }
            const db = getDb()
            if (!db) return { success: false, error: 'Database not initialized' }
            await dbQueries.deleteLikedPost(db, id)
            return { success: true }
        } catch (err) {
            console.error('Delete liked post failed:', err)
            return { success: false, error: err.message }
        }
    })

    ipcMain.handle('clear-history', async () => {
        const db = getDb()
        if (!db) return { success: false, error: 'Database not initialized' }
        try {
            await dbQueries.clearLikedPosts(db)
            return { success: true }
        } catch (err) {
            return { success: false, error: err.message }
        }
    })

    ipcMain.handle('get-db-stats', async () => {
        const db = getDb()
        const fallback = { total_liked: 0, total_profiles: 0, liked_today: 0 }
        if (!db) return fallback
        try {
            return await dbQueries.getDbStats(db)
        } catch (err) {
            console.error(err)
            return fallback
        }
    })
}
