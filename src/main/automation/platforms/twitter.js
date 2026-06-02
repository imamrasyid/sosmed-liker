import { isPostLiked, saveLikedPost } from '../../db/queries.js'
import { retryWithBackoff, RetryConfig } from '../../utils/retry.js'
import { randomDelay } from '../../utils/helpers.js'

export async function processTwitter(context, db, targetUrl, onLog, options = {}) {
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
    onLog(`[Stage 1] Mengunjungi profil Twitter / X: ${targetUrl}`)
    await page.setViewportSize({ width: 1280, height: 800 })
    await retryWithBackoff(
      () => page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 60000 }),
      { ...RetryConfig.NETWORK, onRetry: (attempt, err, delay) => onLog(`[Retry] Goto attempt ${attempt} failed. Retrying in ${Math.round(delay)}ms: ${err.message}`) }
    )
    await randomDelay(3000, 5000)

    onLog('Menunggu timeline Tweet dimuat...')
    await page.waitForSelector('article[data-testid="tweet"]', { timeout: 30000 }).catch(() => { })

    onLog('Memulai pemetaan tweet (Stage 1)...')
    const toLikeList = []
    let consecutiveSkips = 0
    const processedTweetIds = new Set()
    let scrollAttempts = 0
    let lastHeight = await page.evaluate(() => document.body.scrollHeight)

    while (toLikeList.length < limit && consecutiveSkips < consecutiveSkipsLimit && scrollAttempts < maxScrollAttempts) {
      try {
        const tweets = await page.$$('article[data-testid="tweet"]')

        for (const tweet of tweets) {
          const linkElement = await tweet.$('a:has(time)')
          if (!linkElement) continue

          const href = await linkElement.getAttribute('href')
          if (!href) continue

          const match = href.match(/\/status\/(\d+)/)
          if (!match) continue

          const tweetId = match[1]

          if (processedTweetIds.has(tweetId)) continue
          processedTweetIds.add(tweetId)

          const alreadyLiked = await isPostLiked(db, 'twitter', tweetId)
          if (alreadyLiked) {
            consecutiveSkips++
            onLog(`[Map] Tweet ${tweetId} sudah pernah di-like (ada di DB). Skips berturut-turut: ${consecutiveSkips}`)
            if (consecutiveSkips >= consecutiveSkipsLimit) {
              onLog(`[Map] Menemukan ${consecutiveSkipsLimit} tweet berurutan yang sudah disukai. Menghentikan pemetaan.`)
              break
            }
          } else {
            consecutiveSkips = 0
            const postUrl = `https://x.com/i/status/${tweetId}`
            toLikeList.push({ id: tweetId, url: postUrl })
            onLog(`[Map] Menemukan tweet baru: ${tweetId}. Total antrean: ${toLikeList.length}/${limit}`)

            if (toLikeList.length >= limit) {
              onLog(`[Map] Antrean tweet baru mencapai batas limit (${limit}). Menghentikan pemetaan.`)
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

    onLog(`Pemetaan selesai. Menemukan ${toLikeList.length} tweet baru untuk di-like.`)

    // Stage 2: Liking loop
    let successCount = 0
    for (let i = 0; i < toLikeList.length; i++) {
      const post = toLikeList[i]
      onLog(`[Stage 2] [${i + 1}/${toLikeList.length}] Membuka detail tweet: ${post.url}`)

      try {
        await retryWithBackoff(
          () => page.goto(post.url, { waitUntil: 'domcontentloaded', timeout: 60000 }),
          { ...RetryConfig.NETWORK, onRetry: (attempt, err, delay) => onLog(`[Retry] Goto post attempt ${attempt} failed. Retrying in ${Math.round(delay)}ms: ${err.message}`) }
        )
        await randomDelay(3000, 5000)

        // Tunggu tombol like/unlike
        const buttonSelector = 'button[data-testid="like"], button[data-testid="unlike"]'
        await retryWithBackoff(
          () => page.waitForSelector(buttonSelector, { timeout: 15000 }),
          { ...RetryConfig.DOM, onRetry: (attempt, err, delay) => onLog(`[Retry] Wait for selector attempt ${attempt} failed. Retrying in ${Math.round(delay)}ms: ${err.message}`) }
        ).catch(() => { })

        // Periksa apakah sudah disukai secara manual
        const unlikeButton = await page.$('button[data-testid="unlike"]')
        if (unlikeButton) {
          onLog(`[SKIP] Tweet ${post.id} sudah di-like secara manual / sebelumnya. Menyimpan ke database...`)
          await saveLikedPost(db, 'twitter', targetUrl, post.id)
        } else {
          const likeButton = await page.$('button[data-testid="like"]')
          if (likeButton) {
            onLog(`[ACTION] Melakukan Like pada tweet ${post.id}...`)
            await retryWithBackoff(
              () => page.click('button[data-testid="like"]', { force: true }),
              { ...RetryConfig.DOM, onRetry: (attempt, err, delay) => onLog(`[Retry] Click like attempt ${attempt} failed. Retrying in ${Math.round(delay)}ms: ${err.message}`) }
            )

            await saveLikedPost(db, 'twitter', targetUrl, post.id)
            onLog(`[SUKSES] Tweet ${post.id} berhasil di-like.`)
            successCount++

            await randomDelay(minDelay, maxDelay)
          } else {
            onLog(`[ERROR] Tombol Like tidak ditemukan pada detail tweet ${post.id}.`)
          }
        }
      } catch (err) {
        onLog(`[ERROR] Gagal memproses tweet ${post.id}: ${err.message}`)
      }
    }

    onLog(`Proses Twitter / X selesai. Total tweet baru disukai: ${successCount}.`)
  } catch (error) {
    onLog(`[ERROR] Gagal memproses Twitter / X: ${error.message}`)
  } finally {
    await page.close()
  }
}

