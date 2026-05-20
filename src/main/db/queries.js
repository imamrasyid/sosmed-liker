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

