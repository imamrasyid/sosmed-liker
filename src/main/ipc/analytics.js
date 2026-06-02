import { ipcMain } from 'electron'
import * as dbQueries from '../db/queries.js'

/**
 * Daftarkan IPC handler untuk data analitik.
 * @param {() => import('sqlite3').Database | null} getDb
 */
export function registerAnalyticsHandlers(getDb) {
    ipcMain.handle('get-liked-posts-by-platform', async (_event, days) => {
        try {
            const db = getDb()
            if (!db) return { success: false, error: 'Database not initialized' }
            const data = await dbQueries.getLikedPostsByPlatform(db, days || 30)
            return { success: true, data }
        } catch (err) {
            return { success: false, error: err.message }
        }
    })

    ipcMain.handle('get-liked-posts-count-by-platform', async () => {
        try {
            const db = getDb()
            if (!db) return { success: false, error: 'Database not initialized' }
            const data = await dbQueries.getLikedPostsCountByPlatform(db)
            return { success: true, data }
        } catch (err) {
            return { success: false, error: err.message }
        }
    })

    ipcMain.handle('get-liked-posts-daily', async (_event, days) => {
        try {
            const db = getDb()
            if (!db) return { success: false, error: 'Database not initialized' }
            const data = await dbQueries.getLikedPostsDaily(db, days || 30)
            return { success: true, data }
        } catch (err) {
            return { success: false, error: err.message }
        }
    })

    ipcMain.handle('get-batch-job-stats', async () => {
        try {
            const db = getDb()
            if (!db) return { success: false, error: 'Database not initialized' }
            const data = await dbQueries.getBatchJobStats(db)
            return { success: true, data }
        } catch (err) {
            return { success: false, error: err.message }
        }
    })
}
