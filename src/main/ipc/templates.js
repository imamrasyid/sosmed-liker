import { ipcMain } from 'electron'
import * as dbQueries from '../db/queries.js'

/**
 * Daftarkan IPC handler untuk comment templates.
 * @param {() => import('sqlite3').Database | null} getDb
 */
export function registerTemplateHandlers(getDb) {
    ipcMain.handle('get-comment-templates', async (_event, platform) => {
        try {
            const db = getDb()
            if (!db) return { success: false, error: 'Database not initialized' }
            const templates = await dbQueries.getCommentTemplates(db, platform)
            return { success: true, data: templates }
        } catch (err) {
            return { success: false, error: err.message }
        }
    })

    ipcMain.handle('get-active-comment-template', async (_event, platform) => {
        try {
            const db = getDb()
            if (!db) return { success: false, error: 'Database not initialized' }
            const template = await dbQueries.getActiveCommentTemplate(db, platform)
            return { success: true, data: template }
        } catch (err) {
            return { success: false, error: err.message }
        }
    })

    ipcMain.handle('save-comment-template', async (_event, platform, templateName, commentText) => {
        try {
            const db = getDb()
            if (!db) return { success: false, error: 'Database not initialized' }
            const id = await dbQueries.saveCommentTemplate(db, platform, templateName, commentText)
            return { success: true, id }
        } catch (err) {
            return { success: false, error: err.message }
        }
    })

    ipcMain.handle('delete-comment-template', async (_event, templateId) => {
        try {
            const db = getDb()
            if (!db) return { success: false, error: 'Database not initialized' }
            await dbQueries.deleteCommentTemplate(db, templateId)
            return { success: true }
        } catch (err) {
            return { success: false, error: err.message }
        }
    })

    ipcMain.handle('set-active-comment-template', async (_event, templateId) => {
        try {
            const db = getDb()
            if (!db) return { success: false, error: 'Database not initialized' }
            await dbQueries.setActiveCommentTemplate(db, templateId)
            return { success: true }
        } catch (err) {
            return { success: false, error: err.message }
        }
    })
}
