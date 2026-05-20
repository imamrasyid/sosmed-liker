import { isPostLiked, saveLikedPost } from '../../db/queries.js'

function randomDelay(min = 2000, max = 5000) {
  return new Promise(resolve => setTimeout(resolve, Math.floor(Math.random() * (max - min + 1)) + min))
}

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
    await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 60000 })
    await randomDelay(3000, 5000)

    onLog('Menunggu timeline Tweet dimuat...')
    await page.waitForSelector('article[data-testid="tweet"]', { timeout: 30000 }).catch(() => {})

    onLog('Memulai pemetaan tweet (Stage 1)...')
    const toLikeList = []
    let consecutiveSkips = 0
    const processedTweetIds = new Set()
    let scrollAttempts = 0
    let lastHeight = await page.evaluate(() => document.body.scrollHeight)

    while (toLikeList.length < limit && consecutiveSkips < consecutiveSkipsLimit && scrollAttempts < maxScrollAttempts) {
      const tweets = await page.$$('article[data-testid="tweet"]')
      let foundNewOnThisScroll = false

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
        foundNewOnThisScroll = true

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

      if (consecutiveSkips >= consecutiveSkipsLimit || toLikeList.length >= limit) {
        break
      }

      // Scroll ke bawah untuk memuat konten lebih banyak
      onLog('Scrolling ke bawah...')
      await page.evaluate((step) => window.scrollBy(0, step), scrollStep)
      await randomDelay(3000, 5000)

      const newHeight = await page.evaluate(() => document.body.scrollHeight)
      if (newHeight === lastHeight) {
        scrollAttempts++
        if (scrollAttempts >= 3) {
          onLog('Tinggi halaman tidak bertambah. Berhenti memetakan timeline.')
          break
        }
      } else {
        scrollAttempts = 0
        lastHeight = newHeight
      }
    }

    onLog(`Pemetaan selesai. Menemukan ${toLikeList.length} tweet baru untuk di-like.`)

    // Stage 2: Liking loop
    let successCount = 0
    for (let i = 0; i < toLikeList.length; i++) {
      const post = toLikeList[i]
      onLog(`[Stage 2] [${i + 1}/${toLikeList.length}] Membuka detail tweet: ${post.url}`)
      
      try {
        await page.goto(post.url, { waitUntil: 'domcontentloaded', timeout: 30000 })
        await randomDelay(3000, 5000)

        // Tunggu tombol like/unlike
        const buttonSelector = 'button[data-testid="like"], button[data-testid="unlike"]'
        await page.waitForSelector(buttonSelector, { timeout: 15000 }).catch(() => {})

        // Periksa apakah sudah disukai secara manual
        const unlikeButton = await page.$('button[data-testid="unlike"]')
        if (unlikeButton) {
          onLog(`[SKIP] Tweet ${post.id} sudah di-like secara manual / sebelumnya. Menyimpan ke database...`)
          await saveLikedPost(db, 'twitter', targetUrl, post.id)
        } else {
          const likeButton = await page.$('button[data-testid="like"]')
          if (likeButton) {
            onLog(`[ACTION] Melakukan Like pada tweet ${post.id}...`)
            await page.click('button[data-testid="like"]', { force: true })
            
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

