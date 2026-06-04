import { isPostLiked, saveLikedPost } from '../../db/queries.js'
import { retryWithBackoff, RetryConfig, isBrowserClosedError } from '../../utils/retry.js'
import { randomDelay } from '../../utils/helpers.js'

export async function processThreads(context, db, targetUrl, onLog, options = {}, isAborted = () => false) {
  const {
    minDelay = 3000,
    maxDelay = 6000,
    limit = 20,
    consecutiveSkipsLimit = 5,
    scrollStep = 1000,
    maxScrollAttempts = 20
  } = options
  const page = await context.newPage()

  try {
    onLog(`[Stage 1] Mengunjungi profil Threads: ${targetUrl}`)
    await page.setViewportSize({ width: 1280, height: 800 })
    await retryWithBackoff(
      () => page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 60000 }),
      { ...RetryConfig.NETWORK, onRetry: (attempt, err, delay) => onLog(`[Retry] Goto attempt ${attempt} failed. Retrying in ${Math.round(delay)}ms: ${err.message}`) }
    )
    await randomDelay(3000, 5000)

    onLog('Menunggu timeline Threads dimuat...')
    await page.waitForSelector('a[href*="/post/"]:has(time)', { timeout: 30000 }).catch(() => { })

    onLog('Memulai pemetaan postingan Threads (Stage 1)...')
    const toLikeList = []
    let consecutiveSkips = 0
    const processedPostIds = new Set()
    let scrollAttempts = 0
    let lastHeight = await page.evaluate(() => document.body.scrollHeight)

    while (toLikeList.length < limit && consecutiveSkips < consecutiveSkipsLimit && scrollAttempts < maxScrollAttempts) {
      // Guard: hentikan pemetaan jika browser ditutup
      if (isAborted()) {
        onLog('[SYSTEM] Proses dihentikan saat pemetaan.')
        break
      }

      try {
        const postLinks = await page.$$('a[href*="/post/"]:has(time)')

        for (const linkElement of postLinks) {
          const href = await linkElement.getAttribute('href')
          if (!href) continue

          const match = href.match(/\/post\/([A-Za-z0-9_-]+)/)
          if (!match) continue

          const postId = match[1]

          if (processedPostIds.has(postId)) continue
          processedPostIds.add(postId)

          const alreadyLiked = await isPostLiked(db, 'threads', postId)
          if (alreadyLiked) {
            consecutiveSkips++
            onLog(`[Map] Postingan Threads ${postId} sudah pernah di-like (ada di DB). Skips berturut-turut: ${consecutiveSkips}`)
            if (consecutiveSkips >= consecutiveSkipsLimit) {
              onLog(`[Map] Menemukan ${consecutiveSkipsLimit} postingan berurutan yang sudah disukai. Menghentikan pemetaan.`)
              break
            }
          } else {
            consecutiveSkips = 0
            const postUrl = `https://www.threads.net/post/${postId}`
            toLikeList.push({ id: postId, url: postUrl })
            onLog(`[Map] Menemukan postingan Threads baru: ${postId}. Total antrean: ${toLikeList.length}/${limit}`)

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

    onLog(`Pemetaan selesai. Menemukan ${toLikeList.length} postingan Threads baru untuk di-like.`)

    // Stage 2: Liking loop
    let successCount = 0
    for (let i = 0; i < toLikeList.length; i++) {
      // Guard: hentikan jika browser ditutup atau stop() dipanggil
      if (isAborted()) {
        onLog('[SYSTEM] Proses dihentikan.')
        break
      }

      const post = toLikeList[i]
      onLog(`[Stage 2] [${i + 1}/${toLikeList.length}] Membuka detail postingan Threads: ${post.url}`)

      try {
        await retryWithBackoff(
          () => page.goto(post.url, { waitUntil: 'domcontentloaded', timeout: 60000 }),
          { ...RetryConfig.NETWORK, onRetry: (attempt, err, delay) => onLog(`[Retry] Goto post attempt ${attempt} failed. Retrying in ${Math.round(delay)}ms: ${err.message}`) }
        )
        await randomDelay(3000, 5000)

        // Tunggu tombol like/unlike
        const likeSelector = 'div[role="button"]:has(svg[aria-label="Suka"]), div[role="button"]:has(svg[aria-label="Like"]), svg[aria-label="Suka"], svg[aria-label="Like"]'
        const unlikeSelector = 'div[role="button"]:has(svg[aria-label="Batal suka"]), div[role="button"]:has(svg[aria-label="Unlike"]), svg[aria-label="Batal suka"], svg[aria-label="Unlike"]'
        await page.waitForSelector(`${likeSelector}, ${unlikeSelector}`, { timeout: 15000 }).catch(() => { })

        // Cek manual unlike
        const unlikeSvg = await page.$(unlikeSelector)
        if (unlikeSvg) {
          onLog(`[SKIP] Postingan Threads ${post.id} sudah di-like secara manual / sebelumnya. Menyimpan ke database...`)
          await saveLikedPost(db, 'threads', targetUrl, post.id)
        } else {
          const likeButton = await page.$(likeSelector)
          if (likeButton) {
            onLog(`[ACTION] Melakukan Like pada postingan Threads ${post.id}...`)
            await likeButton.click({ force: true })

            // Verifikasi: tunggu tombol berubah menjadi "Batal suka" / "Unlike"
            const confirmedUnlike = await page.waitForSelector(
              unlikeSelector,
              { timeout: 5000 }
            ).then(() => true).catch(() => false)

            if (!confirmedUnlike) {
              onLog(`[ERROR] Like pada postingan Threads ${post.id} tidak terkonfirmasi — tombol tidak berubah ke state Unlike. Cookie mungkin expired atau kena rate limit.`)
              continue
            }

            await saveLikedPost(db, 'threads', targetUrl, post.id)
            onLog(`[SUKSES] Postingan Threads ${post.id} berhasil di-like.`)
            successCount++

            await randomDelay(minDelay, maxDelay)
          } else {
            onLog(`[ERROR] Tombol Like tidak ditemukan pada detail postingan Threads ${post.id}.`)
          }
        }
      } catch (err) {
        if (isBrowserClosedError(err)) {
          onLog('[SYSTEM] Browser ditutup. Menghentikan proses Threads.')
          break
        }
        onLog(`[ERROR] Gagal memproses postingan Threads ${post.id}: ${err.message}`)
      }
    }

    onLog(`Proses Threads selesai. Total postingan baru disukai: ${successCount}.`)
  } catch (error) {
    onLog(`[ERROR] Gagal memproses Threads: ${error.message}`)
  } finally {
    await page.close()
  }
}

