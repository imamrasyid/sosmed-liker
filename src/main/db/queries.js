import { run, get, all, transaction } from './wrapper.js'

// ── Liked Posts ───────────────────────────────────────────────────────────────

export async function isPostLiked(db, platform, postId) {
  const row = await get(db, 'SELECT id FROM liked_posts WHERE platform = ? AND post_id = ?', [platform, postId])
  return !!row
}

export async function saveLikedPost(db, platform, targetProfile, postId) {
  const { lastID } = await run(
    db,
    'INSERT INTO liked_posts (platform, target_profile, post_id) VALUES (?, ?, ?)',
    [platform, targetProfile, postId]
  )
  return lastID
}

export function getAllLikedPosts(db) {
  return all(db, 'SELECT * FROM liked_posts ORDER BY liked_at DESC')
}

export async function deleteLikedPost(db, id) {
  await run(db, 'DELETE FROM liked_posts WHERE id = ?', [id])
  return true
}

export async function clearLikedPosts(db) {
  await run(db, 'DELETE FROM liked_posts')
  return true
}

export async function getDbStats(db) {
  const row = await get(db, `
    SELECT
      COUNT(id) as total_liked,
      COUNT(DISTINCT target_profile) as total_profiles,
      (SELECT COUNT(id) FROM liked_posts WHERE liked_at >= date('now', '-1 day')) as liked_today
    FROM liked_posts
  `)
  return row || { total_liked: 0, total_profiles: 0, liked_today: 0 }
}

// ── Config ────────────────────────────────────────────────────────────────────

export async function getConfig(db, key) {
  const row = await get(db, 'SELECT value FROM config WHERE key = ?', [key])
  return row ? row.value : null
}

export async function saveConfig(db, key, value) {
  await run(db, 'REPLACE INTO config (key, value) VALUES (?, ?)', [key, value])
  return true
}

/**
 * Ambil semua config yang dibutuhkan automation dalam 1 query.
 * Menggantikan 8 getConfig() terpisah di manager._processUrl().
 */
export async function getAllAutomationConfig(db) {
  const keys = [
    'min_delay', 'max_delay', 'limit', 'headless',
    'consecutive_skips_limit', 'scroll_step', 'max_scroll_attempts', 'browser_user_agent'
  ]
  const rows = await all(db, `SELECT key, value FROM config WHERE key IN (${keys.map(() => '?').join(',')})`, keys)
  const result = {}
  for (const row of rows) result[row.key] = row.value
  return result
}

// ── Profile Lists (Blacklist / Whitelist) ─────────────────────────────────────

export async function isProfileBlacklisted(db, platform, profileUrl) {
  const row = await get(
    db,
    'SELECT id FROM profile_lists WHERE list_type = ? AND platform = ? AND profile_url = ?',
    ['blacklist', platform, profileUrl]
  )
  return !!row
}

export async function isProfileWhitelisted(db, platform, profileUrl) {
  const row = await get(
    db,
    'SELECT id FROM profile_lists WHERE list_type = ? AND platform = ? AND profile_url = ?',
    ['whitelist', platform, profileUrl]
  )
  return !!row
}

export async function addToBlacklist(db, platform, profileUrl, profileName = null) {
  const { lastID } = await run(
    db,
    'INSERT OR REPLACE INTO profile_lists (list_type, platform, profile_url, profile_name) VALUES (?, ?, ?, ?)',
    ['blacklist', platform, profileUrl, profileName]
  )
  return lastID
}

export async function addToWhitelist(db, platform, profileUrl, profileName = null) {
  const { lastID } = await run(
    db,
    'INSERT OR REPLACE INTO profile_lists (list_type, platform, profile_url, profile_name) VALUES (?, ?, ?, ?)',
    ['whitelist', platform, profileUrl, profileName]
  )
  return lastID
}

export async function removeFromList(db, listType, platform, profileUrl) {
  await run(
    db,
    'DELETE FROM profile_lists WHERE list_type = ? AND platform = ? AND profile_url = ?',
    [listType, platform, profileUrl]
  )
  return true
}

export function getBlacklist(db, platform = null) {
  return platform
    ? all(db, 'SELECT * FROM profile_lists WHERE list_type = ? AND platform = ? ORDER BY created_at DESC', ['blacklist', platform])
    : all(db, 'SELECT * FROM profile_lists WHERE list_type = ? ORDER BY created_at DESC', ['blacklist'])
}

export function getWhitelist(db, platform = null) {
  return platform
    ? all(db, 'SELECT * FROM profile_lists WHERE list_type = ? AND platform = ? ORDER BY created_at DESC', ['whitelist', platform])
    : all(db, 'SELECT * FROM profile_lists WHERE list_type = ? ORDER BY created_at DESC', ['whitelist'])
}

export async function hasWhitelistEnabled(db, platform) {
  const row = await get(
    db,
    'SELECT COUNT(*) as count FROM profile_lists WHERE list_type = ? AND platform = ?',
    ['whitelist', platform]
  )
  return (row?.count || 0) > 0
}

// ── Profiles ──────────────────────────────────────────────────────────────────

export function getProfiles(db, platform = null) {
  return platform
    ? all(db, 'SELECT * FROM profiles WHERE platform = ? ORDER BY created_at DESC', [platform])
    : all(db, 'SELECT * FROM profiles ORDER BY created_at DESC')
}

export async function getActiveProfile(db, platform) {
  const row = await get(db, 'SELECT * FROM profiles WHERE platform = ? AND is_active = 1', [platform])
  return row || null
}

export async function saveProfile(db, platform, profileName, cookieContent) {
  // Cek apakah profil dengan nama ini sudah ada untuk platform ini
  const existing = await get(
    db,
    'SELECT id, is_active FROM profiles WHERE platform = ? AND profile_name = ?',
    [platform, profileName]
  )

  if (existing) {
    // Update content saja, preserve is_active agar profil aktif tidak tiba-tiba nonaktif
    await run(
      db,
      'UPDATE profiles SET cookie_content = ? WHERE id = ?',
      [cookieContent, existing.id]
    )
    return existing.id
  }

  // Profil baru — insert biasa
  const { lastID } = await run(
    db,
    'INSERT INTO profiles (platform, profile_name, cookie_content) VALUES (?, ?, ?)',
    [platform, profileName, cookieContent]
  )
  return lastID
}

export async function deleteProfile(db, profileId) {
  await run(db, 'DELETE FROM profiles WHERE id = ?', [profileId])
  return true
}

export async function getProfileById(db, profileId) {
  const row = await get(db, 'SELECT * FROM profiles WHERE id = ?', [profileId])
  return row || null
}

export async function updateProfileCookie(db, profileId, cookieContent) {
  await run(db, 'UPDATE profiles SET cookie_content = ? WHERE id = ?', [cookieContent, profileId])
  return true
}

export async function setActiveProfile(db, profileId) {
  // Validasi profileId exist sebelum menonaktifkan semua profil
  const target = await get(db, 'SELECT id, platform FROM profiles WHERE id = ?', [profileId])
  if (!target) {
    throw new Error(`Profile ID ${profileId} not found`)
  }

  // Atomik: nonaktifkan semua profil platform ini, lalu aktifkan yang dipilih
  await transaction(db, async () => {
    await run(db, 'UPDATE profiles SET is_active = 0 WHERE platform = ?', [target.platform])
    await run(db, 'UPDATE profiles SET is_active = 1 WHERE id = ?', [profileId])
  })
  return true
}

// ── Proxies ───────────────────────────────────────────────────────────────────

export function getProxies(db) {
  return all(db, 'SELECT * FROM proxies ORDER BY created_at DESC')
}

export async function getActiveProxy(db) {
  const row = await get(db, 'SELECT * FROM proxies WHERE is_active = 1')
  return row || null
}

export async function saveProxy(db, proxyType, host, port, username = null, password = null) {
  const { lastID } = await run(
    db,
    'INSERT INTO proxies (proxy_type, host, port, username, password) VALUES (?, ?, ?, ?, ?)',
    [proxyType, host, port, username, password]
  )
  return lastID
}

export async function deleteProxy(db, proxyId) {
  await run(db, 'DELETE FROM proxies WHERE id = ?', [proxyId])
  return true
}

export async function setActiveProxy(db, proxyId) {
  await transaction(db, async () => {
    await run(db, 'UPDATE proxies SET is_active = 0')
    await run(db, 'UPDATE proxies SET is_active = 1 WHERE id = ?', [proxyId])
  })
  return true
}

// ── Migration ─────────────────────────────────────────────────────────────────

export async function migrateCookiesToProfiles(db, cookieFolderPath) {
  const { existsSync, readdirSync, readFileSync } = await import('fs')
  const { join } = await import('path')

  if (!existsSync(cookieFolderPath)) {
    return { success: true, migrated: 0, message: 'Cookie folder not found, nothing to migrate' }
  }

  const files = readdirSync(cookieFolderPath)
    .filter(f => f.endsWith('.txt') && f.toLowerCase() !== 'readme.txt')

  if (files.length === 0) {
    return { success: true, migrated: 0, message: 'No cookie files found' }
  }

  const VALID_PLATFORMS = ['instagram', 'twitter', 'threads']

  let migratedCount = 0
  let failedCount = 0
  const failedFiles = []

  for (const file of files) {
    const platform = file.replace('.txt', '').toLowerCase()

    if (!VALID_PLATFORMS.includes(platform)) {
      console.log(`Skipping non-platform file: ${file}`)
      continue
    }

    const content = readFileSync(join(cookieFolderPath, file), 'utf-8')

    const existing = await get(db, 'SELECT id FROM profiles WHERE platform = ?', [platform])
    if (!existing) {
      const profileName = `${platform.charAt(0).toUpperCase() + platform.slice(1)} Profile (Migrated)`
      try {
        await run(
          db,
          'INSERT INTO profiles (platform, profile_name, cookie_content, is_active) VALUES (?, ?, ?, 1)',
          [platform, profileName, content]
        )
        migratedCount++
      } catch (err) {
        console.error(`Error migrating ${platform}:`, err)
        failedCount++
        failedFiles.push(file)
      }
    }
  }

  // Set flag migration selesai hanya jika tidak ada yang gagal
  if (failedCount === 0) {
    await run(db, 'UPDATE config SET value = ? WHERE key = ?', ['true', 'migration_cookies_to_profiles'])
  }

  const message = failedCount > 0
    ? `Migrated ${migratedCount} files. Failed: ${failedFiles.join(', ')}`
    : `Migrated ${migratedCount} cookie files to profiles`

  return {
    success: failedCount === 0,
    migrated: migratedCount,
    failed: failedCount,
    message
  }
}

export async function getMigrationStatus(db) {
  const row = await get(db, 'SELECT value FROM config WHERE key = ?', ['migration_cookies_to_profiles'])
  return row ? row.value === 'true' : false
}

// ── Batch Jobs ────────────────────────────────────────────────────────────────

export async function createBatchJob(db, name, platform, urls, configOverride = null) {
  return transaction(db, async () => {
    const { lastID: batchId } = await run(
      db,
      'INSERT INTO batch_jobs (name, platform, status, total_urls, config_override) VALUES (?, ?, ?, ?, ?)',
      [name, platform, 'pending', urls.length, configOverride ? JSON.stringify(configOverride) : null]
    )
    for (const url of urls) {
      await run(db, 'INSERT INTO batch_urls (batch_id, url) VALUES (?, ?)', [batchId, url])
    }
    return batchId
  })
}

export function getBatchJobs(db) {
  return all(db, 'SELECT * FROM batch_jobs ORDER BY created_at DESC')
}

export async function getBatchJob(db, batchId) {
  const row = await get(db, 'SELECT * FROM batch_jobs WHERE id = ?', [batchId])
  return row || null
}

export function getBatchUrls(db, batchId) {
  return all(db, 'SELECT * FROM batch_urls WHERE batch_id = ? ORDER BY id', [batchId])
}

export async function updateBatchJobStatus(db, batchId, status) {
  const extras = status === 'running'
    ? ', started_at = CURRENT_TIMESTAMP'
    : (status === 'completed' || status === 'failed') ? ', completed_at = CURRENT_TIMESTAMP' : ''
  await run(db, `UPDATE batch_jobs SET status = ?${extras} WHERE id = ?`, [status, batchId])
  return true
}

export async function updateBatchJobProgress(db, batchId, processed, successful, failed) {
  await run(
    db,
    'UPDATE batch_jobs SET processed_urls = ?, successful_urls = ?, failed_urls = ? WHERE id = ?',
    [processed, successful, failed, batchId]
  )
  return true
}

export async function updateBatchUrlStatus(db, urlId, status, errorMessage = null) {
  const timestamp = (status === 'completed' || status === 'failed') ? ', processed_at = CURRENT_TIMESTAMP' : ''
  const params = errorMessage
    ? [status, errorMessage, urlId]
    : [status, urlId]
  const errorCol = errorMessage ? ', error_message = ?' : ''
  await run(db, `UPDATE batch_urls SET status = ?${errorCol}${timestamp} WHERE id = ?`, params)
  return true
}

export async function deleteBatchJob(db, batchId) {
  await run(db, 'DELETE FROM batch_jobs WHERE id = ?', [batchId])
  return true
}

// ── Analytics ─────────────────────────────────────────────────────────────────

export function getLikedPostsByPlatform(db, days = 30) {
  const safeDays = Math.max(1, Math.min(365, parseInt(days, 10) || 30))
  return all(db, `
    SELECT platform, COUNT(*) as count, DATE(liked_at) as date
    FROM liked_posts
    WHERE liked_at >= datetime('now', '-' || ? || ' days')
    GROUP BY platform, DATE(liked_at)
    ORDER BY date DESC, platform
  `, [safeDays])
}

export function getLikedPostsCountByPlatform(db) {
  return all(db, 'SELECT platform, COUNT(*) as count FROM liked_posts GROUP BY platform')
}

export function getLikedPostsDaily(db, days = 30) {
  const safeDays = Math.max(1, Math.min(365, parseInt(days, 10) || 30))
  return all(db, `
    SELECT DATE(liked_at) as date, COUNT(*) as count
    FROM liked_posts
    WHERE liked_at >= datetime('now', '-' || ? || ' days')
    GROUP BY DATE(liked_at)
    ORDER BY date DESC
  `, [safeDays])
}

export function getBatchJobStats(db) {
  return all(db, `
    SELECT
      status,
      COUNT(*) as count,
      SUM(total_urls) as total_urls,
      SUM(processed_urls) as processed_urls,
      SUM(successful_urls) as successful_urls,
      SUM(failed_urls) as failed_urls
    FROM batch_jobs
    GROUP BY status
  `)
}

// ── Comment Templates ─────────────────────────────────────────────────────────

export function getCommentTemplates(db, platform = null) {
  return platform
    ? all(db, 'SELECT * FROM comment_templates WHERE platform = ? ORDER BY created_at DESC', [platform])
    : all(db, 'SELECT * FROM comment_templates ORDER BY created_at DESC')
}

export async function getActiveCommentTemplate(db, platform) {
  const row = await get(
    db,
    'SELECT * FROM comment_templates WHERE platform = ? AND is_active = 1',
    [platform]
  )
  return row || null
}

export async function saveCommentTemplate(db, platform, templateName, commentText) {
  const { lastID } = await run(
    db,
    'INSERT INTO comment_templates (platform, template_name, comment_text) VALUES (?, ?, ?)',
    [platform, templateName, commentText]
  )
  return lastID
}

export async function deleteCommentTemplate(db, templateId) {
  await run(db, 'DELETE FROM comment_templates WHERE id = ?', [templateId])
  return true
}

export async function setActiveCommentTemplate(db, templateId) {
  const row = await get(db, 'SELECT platform FROM comment_templates WHERE id = ?', [templateId])
  if (!row) throw new Error('Template not found')

  await transaction(db, async () => {
    await run(db, 'UPDATE comment_templates SET is_active = 0 WHERE platform = ?', [row.platform])
    await run(db, 'UPDATE comment_templates SET is_active = 1 WHERE id = ?', [templateId])
  })
  return true
}
