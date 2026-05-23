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

        // Create indexes for better query performance
        db.run(`CREATE INDEX IF NOT EXISTS idx_liked_posts_platform ON liked_posts(platform)`)
        db.run(`CREATE INDEX IF NOT EXISTS idx_liked_posts_target_profile ON liked_posts(target_profile)`)
        db.run(`CREATE INDEX IF NOT EXISTS idx_liked_posts_liked_at ON liked_posts(liked_at)`)

        db.run(`
          CREATE TABLE IF NOT EXISTS profile_lists (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            list_type TEXT NOT NULL,
            platform TEXT NOT NULL,
            profile_url TEXT NOT NULL,
            profile_name TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(list_type, platform, profile_url)
          )
        `)

        db.run(`CREATE INDEX IF NOT EXISTS idx_profile_lists_type ON profile_lists(list_type)`)
        db.run(`CREATE INDEX IF NOT EXISTS idx_profile_lists_platform ON profile_lists(platform)`)

        db.run(`
          CREATE TABLE IF NOT EXISTS profiles (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            platform TEXT NOT NULL,
            profile_name TEXT NOT NULL,
            cookie_content TEXT NOT NULL,
            is_active INTEGER DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(platform, profile_name)
          )
        `)

        db.run(`CREATE INDEX IF NOT EXISTS idx_profiles_platform ON profiles(platform)`)
        db.run(`CREATE INDEX IF NOT EXISTS idx_profiles_active ON profiles(is_active)`)

        db.run(`
          CREATE TABLE IF NOT EXISTS proxies (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            proxy_type TEXT NOT NULL,
            host TEXT NOT NULL,
            port INTEGER NOT NULL,
            username TEXT,
            password TEXT,
            is_active INTEGER DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
          )
        `)

        db.run(`CREATE INDEX IF NOT EXISTS idx_proxies_active ON proxies(is_active)`)

        db.run(`
          CREATE TABLE IF NOT EXISTS batch_jobs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            platform TEXT NOT NULL,
            status TEXT DEFAULT 'pending',
            total_urls INTEGER DEFAULT 0,
            processed_urls INTEGER DEFAULT 0,
            successful_urls INTEGER DEFAULT 0,
            failed_urls INTEGER DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            started_at DATETIME,
            completed_at DATETIME
          )
        `)

        db.run(`
          CREATE TABLE IF NOT EXISTS batch_urls (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            batch_id INTEGER NOT NULL,
            url TEXT NOT NULL,
            status TEXT DEFAULT 'pending',
            error_message TEXT,
            processed_at DATETIME,
            FOREIGN KEY (batch_id) REFERENCES batch_jobs(id) ON DELETE CASCADE
          )
        `)

        db.run(`CREATE INDEX IF NOT EXISTS idx_batch_jobs_status ON batch_jobs(status)`)
        db.run(`CREATE INDEX IF NOT EXISTS idx_batch_urls_batch_id ON batch_urls(batch_id)`)
        db.run(`CREATE INDEX IF NOT EXISTS idx_batch_urls_status ON batch_urls(status)`)

        db.run(`
          CREATE TABLE IF NOT EXISTS comment_templates (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            platform TEXT NOT NULL,
            template_name TEXT NOT NULL,
            comment_text TEXT NOT NULL,
            is_active INTEGER DEFAULT 1,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(platform, template_name)
          )
        `)

        db.run(`CREATE INDEX IF NOT EXISTS idx_comment_templates_platform ON comment_templates(platform)`)

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
            ['browser_user_agent', 'Default'],
            ['retry_max_attempts', '5'],
            ['retry_base_delay', '1000'],
            ['retry_max_delay', '60000'],
            ['migration_cookies_to_profiles', 'false']
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
