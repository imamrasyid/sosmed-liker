import sqlite3 from 'sqlite3'
import { join } from 'path'
import { app } from 'electron'
import { mkdirSync } from 'fs'

export function getDbPath() {
  const userDataPath = app.getPath('userData')
  const dbDir = join(userDataPath, 'db')
  mkdirSync(dbDir, { recursive: true })
  return join(dbDir, 'sosmed-liker.sqlite')
}

export function initDb() {
  return new Promise((resolve, reject) => {
    const dbPath = getDbPath()
    const db = new sqlite3.Database(dbPath, (err) => {
      if (err) return reject(err)
      
      db.serialize(() => {
        db.run(`
          CREATE TABLE IF NOT EXISTS liked_posts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            platform TEXT NOT NULL,
            target_profile TEXT NOT NULL,
            post_id TEXT NOT NULL UNIQUE,
            liked_at DATETIME DEFAULT CURRENT_TIMESTAMP
          )
        `)
        
        db.run(`
          CREATE TABLE IF NOT EXISTS config (
            key TEXT PRIMARY KEY,
            value TEXT
          )
        `, (err) => {
          if (err) {
            return reject(err)
          }

          // Seed default configurations if not exists
          const defaults = [
            ['min_delay', '3000'],
            ['max_delay', '6000'],
            ['limit', '20'],
            ['headless', 'false'],
            ['consecutive_skips_limit', '5'],
            ['scroll_step', '1000'],
            ['max_scroll_attempts', '20'],
            ['browser_user_agent', 'Default']
          ]

          db.serialize(() => {
            const stmt = db.prepare('INSERT OR IGNORE INTO config (key, value) VALUES (?, ?)')
            for (const [k, v] of defaults) {
              stmt.run(k, v)
            }
            stmt.finalize((err) => {
              if (err) reject(err)
              else resolve(db)
            })
          })
        })
      })
    })
  })
}
