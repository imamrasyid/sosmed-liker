export function isPostLiked(db, platform, postId) {
  return new Promise((resolve, reject) => {
    db.get(
      'SELECT id FROM liked_posts WHERE platform = ? AND post_id = ?',
      [platform, postId],
      (err, row) => {
        if (err) reject(err)
        else resolve(!!row)
      }
    )
  })
}

export function saveLikedPost(db, platform, targetProfile, postId) {
  return new Promise((resolve, reject) => {
    db.run(
      'INSERT INTO liked_posts (platform, target_profile, post_id) VALUES (?, ?, ?)',
      [platform, targetProfile, postId],
      function (err) {
        if (err) reject(err)
        else resolve(this.lastID)
      }
    )
  })
}

export function getAllLikedPosts(db) {
  return new Promise((resolve, reject) => {
    db.all(
      'SELECT * FROM liked_posts ORDER BY liked_at DESC',
      [],
      (err, rows) => {
        if (err) reject(err)
        else resolve(rows || [])
      }
    )
  })
}

export function deleteLikedPost(db, id) {
  return new Promise((resolve, reject) => {
    db.run(
      'DELETE FROM liked_posts WHERE id = ?',
      [id],
      (err) => {
        if (err) reject(err)
        else resolve(true)
      }
    )
  })
}

export function clearLikedPosts(db) {
  return new Promise((resolve, reject) => {
    db.run(
      'DELETE FROM liked_posts',
      [],
      (err) => {
        if (err) reject(err)
        else resolve(true)
      }
    )
  })
}

export function getDbStats(db) {
  return new Promise((resolve, reject) => {
    db.get(
      `SELECT 
        COUNT(id) as total_liked,
        COUNT(DISTINCT target_profile) as total_profiles,
        (SELECT COUNT(id) FROM liked_posts WHERE liked_at >= date('now', '-1 day')) as liked_today
       FROM liked_posts`,
      [],
      (err, row) => {
        if (err) reject(err)
        else resolve(row || { total_liked: 0, total_profiles: 0, liked_today: 0 })
      }
    )
  })
}

export function getConfig(db, key) {
  return new Promise((resolve, reject) => {
    db.get('SELECT value FROM config WHERE key = ?', [key], (err, row) => {
      if (err) reject(err)
      else resolve(row ? row.value : null)
    })
  })
}

export function saveConfig(db, key, value) {
  return new Promise((resolve, reject) => {
    db.run(
      'REPLACE INTO config (key, value) VALUES (?, ?)',
      [key, value],
      (err) => {
        if (err) reject(err)
        else resolve(true)
      }
    )
  })
}

// Profile Lists (Blacklist/Whitelist) operations
export function isProfileBlacklisted(db, platform, profileUrl) {
  return new Promise((resolve, reject) => {
    db.get(
      'SELECT id FROM profile_lists WHERE list_type = ? AND platform = ? AND profile_url = ?',
      ['blacklist', platform, profileUrl],
      (err, row) => {
        if (err) reject(err)
        else resolve(!!row)
      }
    )
  })
}

export function isProfileWhitelisted(db, platform, profileUrl) {
  return new Promise((resolve, reject) => {
    db.get(
      'SELECT id FROM profile_lists WHERE list_type = ? AND platform = ? AND profile_url = ?',
      ['whitelist', platform, profileUrl],
      (err, row) => {
        if (err) reject(err)
        else resolve(!!row)
      }
    )
  })
}

export function addToBlacklist(db, platform, profileUrl, profileName = null) {
  return new Promise((resolve, reject) => {
    db.run(
      'INSERT OR REPLACE INTO profile_lists (list_type, platform, profile_url, profile_name) VALUES (?, ?, ?, ?)',
      ['blacklist', platform, profileUrl, profileName],
      function (err) {
        if (err) reject(err)
        else resolve(this.lastID)
      }
    )
  })
}

export function addToWhitelist(db, platform, profileUrl, profileName = null) {
  return new Promise((resolve, reject) => {
    db.run(
      'INSERT OR REPLACE INTO profile_lists (list_type, platform, profile_url, profile_name) VALUES (?, ?, ?, ?)',
      ['whitelist', platform, profileUrl, profileName],
      function (err) {
        if (err) reject(err)
        else resolve(this.lastID)
      }
    )
  })
}

export function removeFromList(db, listType, platform, profileUrl) {
  return new Promise((resolve, reject) => {
    db.run(
      'DELETE FROM profile_lists WHERE list_type = ? AND platform = ? AND profile_url = ?',
      [listType, platform, profileUrl],
      (err) => {
        if (err) reject(err)
        else resolve(true)
      }
    )
  })
}

export function getBlacklist(db, platform = null) {
  return new Promise((resolve, reject) => {
    const query = platform
      ? 'SELECT * FROM profile_lists WHERE list_type = ? AND platform = ? ORDER BY created_at DESC'
      : 'SELECT * FROM profile_lists WHERE list_type = ? ORDER BY created_at DESC'
    const params = platform ? ['blacklist', platform] : ['blacklist']

    db.all(query, params, (err, rows) => {
      if (err) reject(err)
      else resolve(rows || [])
    })
  })
}

export function getWhitelist(db, platform = null) {
  return new Promise((resolve, reject) => {
    const query = platform
      ? 'SELECT * FROM profile_lists WHERE list_type = ? AND platform = ? ORDER BY created_at DESC'
      : 'SELECT * FROM profile_lists WHERE list_type = ? ORDER BY created_at DESC'
    const params = platform ? ['whitelist', platform] : ['whitelist']

    db.all(query, params, (err, rows) => {
      if (err) reject(err)
      else resolve(rows || [])
    })
  })
}

export function hasWhitelistEnabled(db, platform) {
  return new Promise((resolve, reject) => {
    db.get(
      'SELECT COUNT(*) as count FROM profile_lists WHERE list_type = ? AND platform = ?',
      ['whitelist', platform],
      (err, row) => {
        if (err) reject(err)
        else resolve((row?.count || 0) > 0)
      }
    )
  })
}

// Profiles CRUD operations
export function getProfiles(db, platform = null) {
  return new Promise((resolve, reject) => {
    const query = platform
      ? 'SELECT * FROM profiles WHERE platform = ? ORDER BY created_at DESC'
      : 'SELECT * FROM profiles ORDER BY created_at DESC'
    const params = platform ? [platform] : []

    db.all(query, params, (err, rows) => {
      if (err) reject(err)
      else resolve(rows || [])
    })
  })
}

export function getActiveProfile(db, platform) {
  return new Promise((resolve, reject) => {
    db.get(
      'SELECT * FROM profiles WHERE platform = ? AND is_active = 1',
      [platform],
      (err, row) => {
        if (err) reject(err)
        else resolve(row || null)
      }
    )
  })
}

export function saveProfile(db, platform, profileName, cookieContent) {
  return new Promise((resolve, reject) => {
    db.run(
      'INSERT OR REPLACE INTO profiles (platform, profile_name, cookie_content) VALUES (?, ?, ?)',
      [platform, profileName, cookieContent],
      function (err) {
        if (err) reject(err)
        else resolve(this.lastID)
      }
    )
  })
}

export function deleteProfile(db, profileId) {
  return new Promise((resolve, reject) => {
    db.run(
      'DELETE FROM profiles WHERE id = ?',
      [profileId],
      (err) => {
        if (err) reject(err)
        else resolve(true)
      }
    )
  })
}

export function setActiveProfile(db, profileId) {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // First, deactivate all profiles for the same platform
      db.run(
        'UPDATE profiles SET is_active = 0 WHERE platform = (SELECT platform FROM profiles WHERE id = ?)',
        [profileId],
        (err) => {
          if (err) {
            reject(err)
            return
          }
          // Then activate the selected profile
          db.run(
            'UPDATE profiles SET is_active = 1 WHERE id = ?',
            [profileId],
            (err) => {
              if (err) reject(err)
              else resolve(true)
            }
          )
        }
      )
    })
  })
}

// Proxies CRUD operations
export function getProxies(db) {
  return new Promise((resolve, reject) => {
    db.all('SELECT * FROM proxies ORDER BY created_at DESC', (err, rows) => {
      if (err) reject(err)
      else resolve(rows || [])
    })
  })
}

export function getActiveProxy(db) {
  return new Promise((resolve, reject) => {
    db.get('SELECT * FROM proxies WHERE is_active = 1', (err, row) => {
      if (err) reject(err)
      else resolve(row || null)
    })
  })
}

export function saveProxy(db, proxyType, host, port, username = null, password = null) {
  return new Promise((resolve, reject) => {
    db.run(
      'INSERT INTO proxies (proxy_type, host, port, username, password) VALUES (?, ?, ?, ?, ?)',
      [proxyType, host, port, username, password],
      function (err) {
        if (err) reject(err)
        else resolve(this.lastID)
      }
    )
  })
}

export function deleteProxy(db, proxyId) {
  return new Promise((resolve, reject) => {
    db.run(
      'DELETE FROM proxies WHERE id = ?',
      [proxyId],
      (err) => {
        if (err) reject(err)
        else resolve(true)
      }
    )
  })
}

export function setActiveProxy(db, proxyId) {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // First, deactivate all proxies
      db.run('UPDATE proxies SET is_active = 0', (err) => {
        if (err) {
          reject(err)
          return
        }
        // Then activate the selected proxy
        db.run(
          'UPDATE proxies SET is_active = 1 WHERE id = ?',
          [proxyId],
          (err) => {
            if (err) reject(err)
            else resolve(true)
          }
        )
      })
    })
  })
}

// Migration: Cookie files to profiles
export async function migrateCookiesToProfiles(db, cookieFolderPath) {
  const fs = await import('fs')
  const path = await import('path')

  return new Promise((resolve, reject) => {
    try {
      if (!fs.existsSync(cookieFolderPath)) {
        resolve({ success: true, migrated: 0, message: 'Cookie folder not found, nothing to migrate' })
        return
      }

      const files = fs.readdirSync(cookieFolderPath).filter(f => f.endsWith('.txt'))
      if (files.length === 0) {
        resolve({ success: true, migrated: 0, message: 'No cookie files found' })
        return
      }

      let migratedCount = 0

      // Read all cookie files
      for (const file of files) {
        const filePath = path.join(cookieFolderPath, file)
        const content = fs.readFileSync(filePath, 'utf-8')

        // Extract platform from filename (e.g., instagram.txt -> instagram)
        const platform = file.replace('.txt', '').toLowerCase()

        // Check if profile already exists for this platform
        db.get('SELECT id FROM profiles WHERE platform = ?', [platform], (err, row) => {
          if (err) {
            console.error(`Error checking profile for ${platform}:`, err)
            return
          }

          if (!row) {
            // Create new profile from cookie file
            const profileName = `${platform.charAt(0).toUpperCase() + platform.slice(1)} Profile (Migrated)`
            db.run(
              'INSERT INTO profiles (name, platform, cookie_content, is_active) VALUES (?, ?, ?, 1)',
              [profileName, platform, content],
              function (err) {
                if (err) {
                  console.error(`Error migrating ${platform}:`, err)
                } else {
                  migratedCount++
                  console.log(`Migrated ${platform} cookie to profile ID ${this.lastID}`)
                }
              }
            )
          }
        })
      }

      // Mark migration as complete
      setTimeout(() => {
        db.run('UPDATE config SET value = ? WHERE key = ?', ['true', 'migration_cookies_to_profiles'], (err) => {
          if (err) {
            reject(err)
          } else {
            resolve({ success: true, migrated: migratedCount, message: `Migrated ${migratedCount} cookie files to profiles` })
          }
        })
      }, 1000)
    } catch (err) {
      reject(err)
    }
  })
}

export function getMigrationStatus(db) {
  return new Promise((resolve, reject) => {
    db.get('SELECT value FROM config WHERE key = ?', ['migration_cookies_to_profiles'], (err, row) => {
      if (err) reject(err)
      else resolve(row ? row.value === 'true' : false)
    })
  })
}

// Batch Jobs CRUD operations
export function createBatchJob(db, name, platform, urls) {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // Create the batch job
      db.run(
        'INSERT INTO batch_jobs (name, platform, status, total_urls) VALUES (?, ?, ?, ?)',
        [name, platform, 'pending', urls.length],
        function (err) {
          if (err) {
            reject(err)
            return
          }
          const batchId = this.lastID

          // Insert all URLs
          const stmt = db.prepare('INSERT INTO batch_urls (batch_id, url) VALUES (?, ?)')
          urls.forEach(url => {
            stmt.run(batchId, url)
          })
          stmt.finalize((err) => {
            if (err) reject(err)
            else resolve(batchId)
          })
        }
      )
    })
  })
}

export function getBatchJobs(db) {
  return new Promise((resolve, reject) => {
    db.all('SELECT * FROM batch_jobs ORDER BY created_at DESC', (err, rows) => {
      if (err) reject(err)
      else resolve(rows || [])
    })
  })
}

export function getBatchJob(db, batchId) {
  return new Promise((resolve, reject) => {
    db.get('SELECT * FROM batch_jobs WHERE id = ?', [batchId], (err, row) => {
      if (err) reject(err)
      else resolve(row || null)
    })
  })
}

export function getBatchUrls(db, batchId) {
  return new Promise((resolve, reject) => {
    db.all('SELECT * FROM batch_urls WHERE batch_id = ? ORDER BY id', [batchId], (err, rows) => {
      if (err) reject(err)
      else resolve(rows || [])
    })
  })
}

export function updateBatchJobStatus(db, batchId, status) {
  return new Promise((resolve, reject) => {
    const updates = ['status = ?']
    const params = [status]

    if (status === 'running') {
      updates.push('started_at = CURRENT_TIMESTAMP')
    } else if (status === 'completed' || status === 'failed') {
      updates.push('completed_at = CURRENT_TIMESTAMP')
    }

    db.run(
      `UPDATE batch_jobs SET ${updates.join(', ')} WHERE id = ?`,
      [...params, batchId],
      (err) => {
        if (err) reject(err)
        else resolve(true)
      }
    )
  })
}

export function updateBatchJobProgress(db, batchId, processed, successful, failed) {
  return new Promise((resolve, reject) => {
    db.run(
      'UPDATE batch_jobs SET processed_urls = ?, successful_urls = ?, failed_urls = ? WHERE id = ?',
      [processed, successful, failed, batchId],
      (err) => {
        if (err) reject(err)
        else resolve(true)
      }
    )
  })
}

export function updateBatchUrlStatus(db, urlId, status, errorMessage = null) {
  return new Promise((resolve, reject) => {
    const updates = ['status = ?']
    const params = [status]

    if (status === 'completed' || status === 'failed') {
      updates.push('processed_at = CURRENT_TIMESTAMP')
    }

    if (errorMessage) {
      updates.push('error_message = ?')
      params.push(errorMessage)
    }

    params.push(urlId)

    db.run(
      `UPDATE batch_urls SET ${updates.join(', ')} WHERE id = ?`,
      params,
      (err) => {
        if (err) reject(err)
        else resolve(true)
      }
    )
  })
}

export function deleteBatchJob(db, batchId) {
  return new Promise((resolve, reject) => {
    db.run('DELETE FROM batch_jobs WHERE id = ?', [batchId], (err) => {
      if (err) reject(err)
      else resolve(true)
    })
  })
}

// Analytics queries
export function getLikedPostsByPlatform(db, days = 30) {
  return new Promise((resolve, reject) => {
    const query = `
      SELECT 
        platform,
        COUNT(*) as count,
        DATE(liked_at) as date
      FROM liked_posts
      WHERE liked_at >= datetime('now', '-${days} days')
      GROUP BY platform, DATE(liked_at)
      ORDER BY date DESC, platform
    `
    db.all(query, (err, rows) => {
      if (err) reject(err)
      else resolve(rows || [])
    })
  })
}

export function getLikedPostsCountByPlatform(db) {
  return new Promise((resolve, reject) => {
    const query = `
      SELECT 
        platform,
        COUNT(*) as count
      FROM liked_posts
      GROUP BY platform
    `
    db.all(query, (err, rows) => {
      if (err) reject(err)
      else resolve(rows || [])
    })
  })
}

export function getLikedPostsDaily(db, days = 30) {
  return new Promise((resolve, reject) => {
    const query = `
      SELECT 
        DATE(liked_at) as date,
        COUNT(*) as count
      FROM liked_posts
      WHERE liked_at >= datetime('now', '-${days} days')
      GROUP BY DATE(liked_at)
      ORDER BY date DESC
    `
    db.all(query, (err, rows) => {
      if (err) reject(err)
      else resolve(rows || [])
    })
  })
}

export function getBatchJobStats(db) {
  return new Promise((resolve, reject) => {
    const query = `
      SELECT 
        status,
        COUNT(*) as count,
        SUM(total_urls) as total_urls,
        SUM(processed_urls) as processed_urls,
        SUM(successful_urls) as successful_urls,
        SUM(failed_urls) as failed_urls
      FROM batch_jobs
      GROUP BY status
    `
    db.all(query, (err, rows) => {
      if (err) reject(err)
      else resolve(rows || [])
    })
  })
}

// Comment Templates CRUD operations
export function getCommentTemplates(db, platform) {
  return new Promise((resolve, reject) => {
    const query = platform
      ? 'SELECT * FROM comment_templates WHERE platform = ? ORDER BY created_at DESC'
      : 'SELECT * FROM comment_templates ORDER BY created_at DESC'
    const params = platform ? [platform] : []
    db.all(query, params, (err, rows) => {
      if (err) reject(err)
      else resolve(rows || [])
    })
  })
}

export function getActiveCommentTemplate(db, platform) {
  return new Promise((resolve, reject) => {
    db.get(
      'SELECT * FROM comment_templates WHERE platform = ? AND is_active = 1',
      [platform],
      (err, row) => {
        if (err) reject(err)
        else resolve(row || null)
      }
    )
  })
}

export function saveCommentTemplate(db, platform, templateName, commentText) {
  return new Promise((resolve, reject) => {
    db.run(
      'INSERT INTO comment_templates (platform, template_name, comment_text) VALUES (?, ?, ?)',
      [platform, templateName, commentText],
      function (err) {
        if (err) reject(err)
        else resolve(this.lastID)
      }
    )
  })
}

export function deleteCommentTemplate(db, templateId) {
  return new Promise((resolve, reject) => {
    db.run('DELETE FROM comment_templates WHERE id = ?', [templateId], (err) => {
      if (err) reject(err)
      else resolve(true)
    })
  })
}

export function setActiveCommentTemplate(db, templateId) {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // First, get the platform of the template
      db.get('SELECT platform FROM comment_templates WHERE id = ?', [templateId], (err, row) => {
        if (err) {
          reject(err)
          return
        }
        if (!row) {
          reject(new Error('Template not found'))
          return
        }

        // Deactivate all templates for this platform
        db.run(
          'UPDATE comment_templates SET is_active = 0 WHERE platform = ?',
          [row.platform],
          (err) => {
            if (err) {
              reject(err)
              return
            }
            // Activate the selected template
            db.run(
              'UPDATE comment_templates SET is_active = 1 WHERE id = ?',
              [templateId],
              (err) => {
                if (err) reject(err)
                else resolve(true)
              }
            )
          }
        )
      })
    })
  })
}

