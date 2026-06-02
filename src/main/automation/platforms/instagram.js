import { isPostLiked, saveLikedPost, getActiveCommentTemplate } from '../../db/queries.js'
import { retryWithBackoff, RetryConfig, isRetryableError } from '../../utils/retry.js'
import { randomDelay } from '../../utils/helpers.js'

export async function postComment(page, commentText, onLog) {
  try {
    onLog(`[Comment] Mencoba memposting komentar...`)

    // Find comment input field
    const commentInput = await page.waitForSelector('textarea[aria-label="Add a comment…"], textarea[placeholder="Add a comment…"]', { timeout: 5000 })

    if (!commentInput) {
      onLog(`[Comment] Input komentar tidak ditemukan`)
      return false
    }

    // Type comment with random typing simulation
    await commentInput.click()
    await randomDelay(500, 1000)

    // Type character by character to simulate human typing
    for (let i = 0; i < commentText.length; i++) {
      await commentInput.type(commentText[i])
      await randomDelay(50, 150)
    }

    await randomDelay(1000, 2000)

    // Find and click post button
    const postButton = await page.$('button:has-text("Post"), button[type="submit"]')
    if (postButton) {
      await postButton.click()
      await randomDelay(2000, 3000)
      onLog(`[Comment] Komentar berhasil diposting`)
      return true
    } else {
      onLog(`[Comment] Tombol post tidak ditemukan`)
      return false
    }
  } catch (error) {
    onLog(`[Comment] Gagal memposting komentar: ${error.message}`)
    return false
  }
}

export async function processInstagram(context, db, targetUrl, onLog, options = {}) {
  const {
    minDelay = 3000,
    maxDelay = 6000,
    limit = 20,
    consecutiveSkipsLimit = 5,
    scrollStep = 1000,
    maxScrollAttempts = 20,
    enableComments = false
  } = options
  const page = await context.newPage()

  // Get active comment template if comments are enabled
  let commentTemplate = null
  if (enableComments) {
    try {
      commentTemplate = await getActiveCommentTemplate(db, 'instagram')
      if (commentTemplate) {
        onLog(`[Comment] Template aktif ditemukan: ${commentTemplate.template_name}`)
      } else {
        onLog(`[Comment] Tidak ada template aktif untuk Instagram. Comment automation dinonaktifkan.`)
      }
    } catch (err) {
      onLog(`[Comment] Gagal memuat template: ${err.message}`)
    }
  }

  try {
    onLog(`[Stage 1] Mengunjungi profil Instagram: ${targetUrl}`)
    await retryWithBackoff(
      () => page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 60000 }),
      { ...RetryConfig.NETWORK, onRetry: (attempt, err, delay) => onLog(`[Retry] Goto attempt ${attempt} failed. Retrying in ${Math.round(delay)}ms: ${err.message}`) }
    )
    await randomDelay(3000, 5000)

    onLog('Menunggu timeline grid postingan Instagram dimuat...')
    await page.waitForSelector('a[href*="/p/"], a[href*="/reel/"]', { timeout: 30000 }).catch(() => { })

    onLog('Melakukan scroll awal untuk memuat grid postingan...')
    await page.evaluate(() => window.scrollBy(0, 400))
    await randomDelay(2000, 4000)

    onLog('Memulai pemetaan postingan (Stage 1)...')
    const toLikeList = []
    let consecutiveSkips = 0
    const processedShortcodes = new Set()
    let scrollAttempts = 0
    let lastHeight = await page.evaluate(() => document.body.scrollHeight)

    while (toLikeList.length < limit && consecutiveSkips < consecutiveSkipsLimit && scrollAttempts < maxScrollAttempts) {
      try {
        const elements = await page.$$('a[href*="/p/"], a[href*="/reel/"]')

        for (const el of elements) {
          const href = await el.getAttribute('href')
          if (!href) continue
          const match = href.match(/\/(?:p|reel)\/([^\/]+)/)
          if (!match) continue
          const postId = match[1]

          if (processedShortcodes.has(postId)) continue
          processedShortcodes.add(postId)

          const alreadyLiked = await isPostLiked(db, 'instagram', postId)
          if (alreadyLiked) {
            consecutiveSkips++
            onLog(`[Map] Postingan ${postId} sudah pernah di-like (ada di DB). Skips berturut-turut: ${consecutiveSkips}`)
            if (consecutiveSkips >= consecutiveSkipsLimit) {
              onLog(`[Map] Menemukan ${consecutiveSkipsLimit} postingan berurutan yang sudah disukai. Menghentikan pemetaan.`)
              break
            }
          } else {
            consecutiveSkips = 0
            const postUrl = `https://www.instagram.com/p/${postId}/`
            toLikeList.push({ id: postId, url: postUrl })
            onLog(`[Map] Menemukan postingan baru: ${postId}. Total antrean: ${toLikeList.length}/${limit}`)

            if (toLikeList.length >= limit) {
              onLog(`[Map] Antrean postingan baru mencapai batas limit (${limit}). Menghentikan pemetaan.`)
              break
            }
          }
        }
      } catch (queryError) {
        onLog(`[ERROR] Gagal memetakan elemen pada scroll ini: ${queryError.message}`)
        scrollAttempts++
        if (scrollAttempts >= maxScrollAttempts) {
          onLog(`Mencapai batas maksimal percobaan (${maxScrollAttempts}). Berhenti.`)
          break
        }
      }

      if (consecutiveSkips >= consecutiveSkipsLimit || toLikeList.length >= limit) {
        break
      }

      // Scroll ke bawah untuk memuat konten lebih banyak
      onLog('Scrolling ke bawah...')
      try {
        await page.evaluate((step) => window.scrollBy(0, step), scrollStep)
        await randomDelay(3000, 5000)

        const newHeight = await page.evaluate(() => document.body.scrollHeight)
        if (newHeight === lastHeight) {
          scrollAttempts++
          onLog(`Scroll attempt ${scrollAttempts}/${maxScrollAttempts}: Tinggi halaman tidak bertambah.`)
          if (scrollAttempts >= maxScrollAttempts) {
            onLog(`Mencapai batas maksimal scroll (${maxScrollAttempts}). Berhenti memetakan timeline.`)
            break
          }
        } else {
          scrollAttempts = 0
          lastHeight = newHeight
        }
      } catch (scrollError) {
        onLog(`[ERROR] Gagal melakukan scroll: ${scrollError.message}`)
        scrollAttempts++
        if (scrollAttempts >= maxScrollAttempts) {
          onLog(`Mencapai batas maksimal percobaan scroll (${maxScrollAttempts}). Berhenti.`)
          break
        }
      }
    }

    onLog(`Pemetaan selesai. Menemukan ${toLikeList.length} postingan baru untuk di-like.`)

    // Stage 2: Liking loop
    let successCount = 0
    for (let i = 0; i < toLikeList.length; i++) {
      const post = toLikeList[i]
      onLog(`[Stage 2] [${i + 1}/${toLikeList.length}] Membuka detail postingan: ${post.url}`)

      try {
        await retryWithBackoff(
          () => page.goto(post.url, { waitUntil: 'domcontentloaded', timeout: 60000 }),
          { ...RetryConfig.NETWORK, onRetry: (attempt, err, delay) => onLog(`[Retry] Goto post attempt ${attempt} failed. Retrying in ${Math.round(delay)}ms: ${err.message}`) }
        )
        await randomDelay(3000, 5000)

        // Tunggu hingga tombol like/unlike utama dimuat
        const mainButtonsSelector = 'svg[aria-label="Suka"][height="24"], svg[aria-label="Like"][height="24"], svg[aria-label="Batal Suka"][height="24"], svg[aria-label="Unlike"][height="24"]'
        await retryWithBackoff(
          () => page.waitForSelector(mainButtonsSelector, { timeout: 15000 }),
          { ...RetryConfig.DOM, onRetry: (attempt, err, delay) => onLog(`[Retry] Wait for selector attempt ${attempt} failed. Retrying in ${Math.round(delay)}ms: ${err.message}`) }
        ).catch(() => { })

        // Cari tombol unlike
        const unlikeSelector = 'svg[aria-label="Batal Suka"][height="24"], svg[aria-label="Unlike"][height="24"]'
        const unlikeButton = await page.$(unlikeSelector)
        if (unlikeButton) {
          onLog(`[SKIP] Postingan ${post.id} sudah di-like secara manual / sebelumnya. Menyimpan ke database...`)
          await saveLikedPost(db, 'instagram', targetUrl, post.id)
        } else {
          // Cari tombol like
          const likeSelector = 'svg[aria-label="Suka"][height="24"], svg[aria-label="Like"][height="24"], svg[aria-label="Suka"], svg[aria-label="Like"]'
          const likeButton = await page.$(likeSelector)
          if (likeButton) {
            onLog(`[ACTION] Melakukan Like pada postingan ${post.id}...`)
            await retryWithBackoff(
              () => page.locator(likeSelector).first().click({ force: true }),
              { ...RetryConfig.DOM, onRetry: (attempt, err, delay) => onLog(`[Retry] Click like attempt ${attempt} failed. Retrying in ${Math.round(delay)}ms: ${err.message}`) }
            )

            await saveLikedPost(db, 'instagram', targetUrl, post.id)
            onLog(`[SUKSES] Postingan ${post.id} berhasil di-like.`)
            successCount++

            // Post comment if enabled and template is available
            if (enableComments && commentTemplate) {
              await randomDelay(2000, 3000)
              const commentSuccess = await postComment(page, commentTemplate.comment_text, onLog)
              if (commentSuccess) {
                onLog(`[Comment] Komentar berhasil diposting untuk ${post.id}`)
              } else {
                onLog(`[Comment] Gagal memposting komentar untuk ${post.id}. Melanjutkan...`)
              }
            }

            // Delay dinamis antara setiap aksi like
            await randomDelay(minDelay, maxDelay)
          } else {
            onLog(`[ERROR] Tombol Like tidak ditemukan pada postingan ${post.id}.`)
          }
        }
      } catch (err) {
        onLog(`[ERROR] Gagal memproses postingan ${post.id}: ${err.message}`)
      }
    }

    onLog(`Proses Instagram selesai. Total postingan baru disukai: ${successCount}.`)
  } catch (error) {
    onLog(`[ERROR] Gagal memproses Instagram: ${error.message}`)
  } finally {
    await page.close()
  }
}
