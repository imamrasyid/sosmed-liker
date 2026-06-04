import { isPostLiked, saveLikedPost, getActiveCommentTemplate } from '../../db/queries.js'
import { retryWithBackoff, RetryConfig, isBrowserClosedError } from '../../utils/retry.js'
import { randomDelay } from '../../utils/helpers.js'

export async function postComment(page, commentText, onLog) {
  try {
    onLog(`[Comment] Mencoba memposting komentar...`)

    const commentInput = await page.waitForSelector(
      'textarea[aria-label="Add a comment…"], textarea[placeholder="Add a comment…"]',
      { timeout: 5000 }
    )
    if (!commentInput) {
      onLog(`[Comment] Input komentar tidak ditemukan`)
      return false
    }

    await commentInput.click()
    await randomDelay(500, 1000)

    for (let i = 0; i < commentText.length; i++) {
      await commentInput.type(commentText[i])
      await randomDelay(50, 150)
    }

    await randomDelay(1000, 2000)

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

export async function processInstagram(context, db, targetUrl, onLog, options = {}, isAborted = () => false) {
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

  // Load comment template jika fitur komentar aktif
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
    // ── Stage 1: Kunjungi profil & petakan postingan ──────────────────────────
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

    while (
      toLikeList.length < limit &&
      consecutiveSkips < consecutiveSkipsLimit &&
      scrollAttempts < maxScrollAttempts
    ) {
      if (isAborted()) {
        onLog('[SYSTEM] Proses dihentikan saat pemetaan.')
        break
      }

      try {
        const elements = await page.$$('a[href*="/p/"], a[href*="/reel/"]')

        for (const el of elements) {
          const href = await el.getAttribute('href')
          if (!href) continue
          const match = href.match(/\/(?:p|reel)\/([^/]+)/)
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
            toLikeList.push({ id: postId, url: `https://www.instagram.com/p/${postId}/` })
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

      if (consecutiveSkips >= consecutiveSkipsLimit || toLikeList.length >= limit) break

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

    // ── Stage 2: Buka setiap postingan & klik like ────────────────────────────
    //
    // Selector mengacu pada DOM dump nyata dari Instagram (dump.html).
    // Pembeda kunci antara tombol like POST vs tombol like KOMENTAR:
    //   - Post   : berada di dalam <section class="...xrvj5dj..."> (satu-satunya section di halaman)
    //              SVG berukuran height="24" width="24"
    //   - Comment: berada di dalam html-div dengan class xexx8yu xyri2b
    //              SVG berukuran height="16" width="16"
    //
    // Selector 'section.xrvj5dj [role="button"]:has(svg[aria-label="..."])'
    // adalah cara paling andal karena section.xrvj5dj hanya muncul sekali.

    const POST_LIKE_SELECTOR = 'section.xrvj5dj [role="button"]:has(svg[aria-label="Suka"]), section.xrvj5dj [role="button"]:has(svg[aria-label="Like"])'
    const POST_UNLIKE_SELECTOR = 'section.xrvj5dj [role="button"]:has(svg[aria-label="Batal Suka"]), section.xrvj5dj [role="button"]:has(svg[aria-label="Unlike"])'

    let successCount = 0
    for (let i = 0; i < toLikeList.length; i++) {
      if (isAborted()) {
        onLog('[SYSTEM] Proses dihentikan.')
        break
      }

      const post = toLikeList[i]
      onLog(`[Stage 2] [${i + 1}/${toLikeList.length}] Membuka detail postingan: ${post.url}`)

      try {
        await retryWithBackoff(
          () => page.goto(post.url, { waitUntil: 'domcontentloaded', timeout: 60000 }),
          { ...RetryConfig.NETWORK, onRetry: (attempt, err, delay) => onLog(`[Retry] Goto post attempt ${attempt} failed. Retrying in ${Math.round(delay)}ms: ${err.message}`) }
        )
        await randomDelay(3000, 5000)

        // Tunggu action bar muncul
        await page.waitForSelector(
          `${POST_LIKE_SELECTOR}, ${POST_UNLIKE_SELECTOR}`,
          { timeout: 15000 }
        ).catch(() => { })

        // Cek apakah sudah di-like
        const unlikeBtn = await page.$(POST_UNLIKE_SELECTOR)
        if (unlikeBtn) {
          onLog(`[SKIP] Postingan ${post.id} sudah di-like secara manual / sebelumnya. Menyimpan ke database...`)
          await saveLikedPost(db, 'instagram', targetUrl, post.id)
          continue
        }

        // Klik tombol like post
        const likeBtn = await page.$(POST_LIKE_SELECTOR)
        if (!likeBtn) {
          onLog(`[ERROR] Tombol Like tidak ditemukan pada postingan ${post.id}.`)
          continue
        }

        onLog(`[ACTION] Melakukan Like pada postingan ${post.id}...`)
        await likeBtn.click({ force: true })

        // Verifikasi state change: like → unlike
        const confirmed = await page.waitForSelector(POST_UNLIKE_SELECTOR, { timeout: 6000 })
          .then(() => true)
          .catch(() => false)

        if (!confirmed) {
          onLog(`[ERROR] Like pada postingan ${post.id} tidak terkonfirmasi — tombol tidak berubah ke state Unlike. Cookie mungkin expired atau kena rate limit.`)
          continue
        }

        await saveLikedPost(db, 'instagram', targetUrl, post.id)
        onLog(`[SUKSES] Postingan ${post.id} berhasil di-like.`)
        successCount++

        if (enableComments && commentTemplate) {
          await randomDelay(2000, 3000)
          const ok = await postComment(page, commentTemplate.comment_text, onLog)
          onLog(ok
            ? `[Comment] Komentar berhasil diposting untuk ${post.id}`
            : `[Comment] Gagal memposting komentar untuk ${post.id}. Melanjutkan...`
          )
        }

        await randomDelay(minDelay, maxDelay)

      } catch (err) {
        if (isBrowserClosedError(err)) {
          onLog('[SYSTEM] Browser ditutup. Menghentikan proses Instagram.')
          break
        }
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
