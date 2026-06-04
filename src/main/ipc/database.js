import { ipcMain, app, dialog } from 'electron'
import { join } from 'path'
import { existsSync, copyFileSync } from 'fs'
import { initDb, getDbPath } from '../db/setup.js'
import * as dbQueries from '../db/queries.js'

/**
 * Daftarkan IPC handler untuk backup, restore, migrasi, dan batch jobs.
 * @param {() => import('sqlite3').Database | null} getDb
 * @param {(db: import('sqlite3').Database) => void} setDb
 * @param {() => import('../automation/manager.js').AutomationManager | null} getManager
 * @param {() => Electron.BrowserWindow | null} getWindow
 */
export function registerDatabaseHandlers(getDb, setDb, getManager, getWindow) {
    // ── Batch Jobs ────────────────────────────────────────────────────────────

    ipcMain.handle('create-batch-job', async (_event, name, platform, urls, configOverride) => {
        try {
            const db = getDb()
            if (!db) return { success: false, error: 'Database not initialized' }
            const batchId = await dbQueries.createBatchJob(db, name, platform, urls, configOverride || null)
            return { success: true, batchId }
        } catch (err) {
            return { success: false, error: err.message }
        }
    })

    ipcMain.handle('get-batch-jobs', async () => {
        try {
            const db = getDb()
            if (!db) return { success: false, error: 'Database not initialized' }
            const jobs = await dbQueries.getBatchJobs(db)
            return { success: true, data: jobs }
        } catch (err) {
            return { success: false, error: err.message }
        }
    })

    ipcMain.handle('get-batch-job', async (_event, batchId) => {
        try {
            const db = getDb()
            if (!db) return { success: false, error: 'Database not initialized' }
            const job = await dbQueries.getBatchJob(db, batchId)
            return { success: true, data: job }
        } catch (err) {
            return { success: false, error: err.message }
        }
    })

    ipcMain.handle('get-batch-urls', async (_event, batchId) => {
        try {
            const db = getDb()
            if (!db) return { success: false, error: 'Database not initialized' }
            const urls = await dbQueries.getBatchUrls(db, batchId)
            return { success: true, data: urls }
        } catch (err) {
            return { success: false, error: err.message }
        }
    })

    ipcMain.handle('delete-batch-job', async (_event, batchId) => {
        try {
            const db = getDb()
            if (!db) return { success: false, error: 'Database not initialized' }
            await dbQueries.deleteBatchJob(db, batchId)
            return { success: true }
        } catch (err) {
            return { success: false, error: err.message }
        }
    })

    // ── Migration ─────────────────────────────────────────────────────────────

    ipcMain.handle('get-migration-status', async () => {
        try {
            const db = getDb()
            if (!db) return { success: false, error: 'Database not initialized' }
            const status = await dbQueries.getMigrationStatus(db)
            return { success: true, migrated: status }
        } catch (err) {
            return { success: false, error: err.message }
        }
    })

    ipcMain.handle('migrate-cookies-to-profiles', async () => {
        try {
            const db = getDb()
            if (!db) return { success: false, error: 'Database not initialized' }
            const cookieFolder = join(app.getPath('userData'), 'cookie')
            const result = await dbQueries.migrateCookiesToProfiles(db, cookieFolder)
            return { success: true, ...result }
        } catch (err) {
            return { success: false, error: err.message }
        }
    })

    // ── Backup & Restore ──────────────────────────────────────────────────────

    ipcMain.handle('backup-database', async () => {
        try {
            const dbPath = getDbPath()
            if (!existsSync(dbPath)) return { success: false, error: 'Database file does not exist' }

            const { filePath } = await dialog.showSaveDialog(getWindow(), {
                title: 'Pilih Lokasi Simpan Cadangan Database',
                defaultPath: join(
                    app.getPath('downloads'),
                    `sosmed-liker-backup-${new Date().toISOString().slice(0, 10)}.bak`
                ),
                filters: [
                    { name: 'Backup Files', extensions: ['bak'] },
                    { name: 'SQLite Files', extensions: ['sqlite', 'db'] },
                    { name: 'All Files', extensions: ['*'] }
                ]
            })

            if (!filePath) return { success: false, cancelled: true }
            copyFileSync(dbPath, filePath)
            return { success: true, path: filePath }
        } catch (err) {
            console.error('Backup database failed:', err)
            return { success: false, error: err.message }
        }
    })

    ipcMain.handle('restore-database', async () => {
        try {
            const { filePaths } = await dialog.showOpenDialog(getWindow(), {
                title: 'Pilih File Cadangan Database untuk Dipulihkan',
                filters: [
                    { name: 'Backup Files', extensions: ['bak', 'sqlite', 'db'] },
                    { name: 'All Files', extensions: ['*'] }
                ],
                properties: ['openFile']
            })

            if (!filePaths || filePaths.length === 0) return { success: false, cancelled: true }

            const dbPath = getDbPath()

            // Tutup koneksi aktif agar tidak file-lock
            const currentDb = getDb()
            if (currentDb) {
                await new Promise((resolve, reject) => {
                    currentDb.close((err) => { if (err) reject(err); else resolve() })
                })
                setDb(null)
            }

            copyFileSync(filePaths[0], dbPath)

            // Reinisialisasi via initDb() — ESM-safe
            const newDb = await initDb()
            setDb(newDb)

            const manager = getManager()
            if (manager) manager.db = newDb

            return { success: true }
        } catch (err) {
            console.error('Restore database failed:', err)
            return { success: false, error: err.message }
        }
    })
}
