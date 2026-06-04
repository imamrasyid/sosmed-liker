import sqlite3 from 'sqlite3'
import { join } from 'path'
import { app } from 'electron'
import { mkdirSync } from 'fs'
import { run } from './wrapper.js'

export function getDbPath() {
  const userDataPath = app.getPath('userData')
  const dbDir = join(userDataPath, 'db')
  mkdirSync(dbDir, { recursive: true })
  return join(dbDir, 'sosmed-liker.sqlite')
}

const SCHEMA_SQL = `
  CREATE TABLE IF NOT EXISTS liked_posts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    platform TEXT NOT NULL,
    target_profile TEXT NOT NULL,
    post_id TEXT NOT NULL UNIQUE,
    liked_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  CREATE INDEX IF NOT EXISTS idx_liked_posts_platform ON liked_posts(platform);
  CREATE INDEX IF NOT EXISTS idx_liked_posts_target_profile ON liked_posts(target_profile);
  CREATE INDEX IF NOT EXISTS idx_liked_posts_liked_at ON liked_posts(liked_at);

  CREATE TABLE IF NOT EXISTS profile_lists (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    list_type TEXT NOT NULL,
    platform TEXT NOT NULL,
    profile_url TEXT NOT NULL,
    profile_name TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(list_type, platform, profile_url)
  );
  CREATE INDEX IF NOT EXISTS idx_profile_lists_type ON profile_lists(list_type);
  CREATE INDEX IF NOT EXISTS idx_profile_lists_platform ON profile_lists(platform);

  CREATE TABLE IF NOT EXISTS profiles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    platform TEXT NOT NULL,
    profile_name TEXT NOT NULL,
    cookie_content TEXT NOT NULL,
    is_active INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(platform, profile_name)
  );
  CREATE INDEX IF NOT EXISTS idx_profiles_platform ON profiles(platform);
  CREATE INDEX IF NOT EXISTS idx_profiles_active ON profiles(is_active);

  CREATE TABLE IF NOT EXISTS proxies (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    proxy_type TEXT NOT NULL,
    host TEXT NOT NULL,
    port INTEGER NOT NULL,
    username TEXT,
    password TEXT,
    is_active INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  CREATE INDEX IF NOT EXISTS idx_proxies_active ON proxies(is_active);

  CREATE TABLE IF NOT EXISTS batch_jobs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    platform TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    total_urls INTEGER DEFAULT 0,
    processed_urls INTEGER DEFAULT 0,
    successful_urls INTEGER DEFAULT 0,
    failed_urls INTEGER DEFAULT 0,
    -- Config override per batch (JSON). NULL berarti ikut config global.
    config_override TEXT DEFAULT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    started_at DATETIME,
    completed_at DATETIME
  );

  CREATE TABLE IF NOT EXISTS batch_urls (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    batch_id INTEGER NOT NULL,
    url TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    error_message TEXT,
    processed_at DATETIME,
    FOREIGN KEY (batch_id) REFERENCES batch_jobs(id) ON DELETE CASCADE
  );
  CREATE INDEX IF NOT EXISTS idx_batch_jobs_status ON batch_jobs(status);
  CREATE INDEX IF NOT EXISTS idx_batch_urls_batch_id ON batch_urls(batch_id);
  CREATE INDEX IF NOT EXISTS idx_batch_urls_status ON batch_urls(status);

  CREATE TABLE IF NOT EXISTS comment_templates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    platform TEXT NOT NULL,
    template_name TEXT NOT NULL,
    comment_text TEXT NOT NULL,
    is_active INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(platform, template_name)
  );
  CREATE INDEX IF NOT EXISTS idx_comment_templates_platform ON comment_templates(platform);

  CREATE TABLE IF NOT EXISTS config (
    key TEXT PRIMARY KEY,
    value TEXT
  );
`

const DEFAULT_CONFIG = [
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

export function initDb() {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(getDbPath(), async (err) => {
      if (err) return reject(err)

      try {
        // Aktifkan WAL mode untuk performa lebih baik dan foreign key support
        await run(db, 'PRAGMA journal_mode = WAL')
        await run(db, 'PRAGMA foreign_keys = ON')

        // Jalankan semua DDL sekaligus via exec (lebih efisien dari run satu-satu)
        await new Promise((res, rej) => {
          db.exec(SCHEMA_SQL, (err) => { if (err) rej(err); else res() })
        })

        // Seed default config — INSERT OR IGNORE agar tidak overwrite nilai yang sudah ada
        for (const [key, value] of DEFAULT_CONFIG) {
          await run(db, 'INSERT OR IGNORE INTO config (key, value) VALUES (?, ?)', [key, value])
        }

        // Migrasi: tambah kolom config_override ke batch_jobs jika belum ada
        // (ALTER TABLE IF NOT EXISTS belum didukung SQLite, cek via PRAGMA)
        const batchCols = await new Promise((res, rej) => {
          db.all('PRAGMA table_info(batch_jobs)', (err, rows) => {
            if (err) rej(err); else res(rows || [])
          })
        })
        const hasConfigOverride = batchCols.some(col => col.name === 'config_override')
        if (!hasConfigOverride) {
          await run(db, 'ALTER TABLE batch_jobs ADD COLUMN config_override TEXT DEFAULT NULL')
        }

        resolve(db)
      } catch (setupErr) {
        reject(setupErr)
      }
    })
  })
}
