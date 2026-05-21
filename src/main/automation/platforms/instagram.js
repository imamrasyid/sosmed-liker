import { isPostLiked, saveLikedPost } from '../../db/queries.js'

function randomDelay(min = 2000, max = 5000) {
  return new Promise(resolve => setTimeout(resolve, Math.floor(Math.random() * (max - min + 1)) + min))
}

export async function processInstagram(context, db, targetUrl, onLog, options = {}) {
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
    onLog(`[Stage 1] Mengunjungi profil Instagram: ${targetUrl}`)
    await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 60000 })
    await randomDelay(3000, 5000)

    onLog('Menunggu timeline grid postingan Instagram dimuat...')
    await page.waitForSelector('a[href*="/p/"], a[href*="/reel/"]', { timeout: 30000 }).catch(() => {})

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
      const elements = await page.$$('a[href*="/p/"], a[href*="/reel/"]')
      let foundNewOnThisScroll = false

      for (const el of elements) {
        const href = await el.getAttribute('href')
        if (!href) continue
        const match = href.match(/\/(?:p|reel)\/([^\/]+)/)
        if (!match) continue
        const postId = match[1]

        if (processedShortcodes.has(postId)) continue
        processedShortcodes.add(postId)
        foundNewOnThisScroll = true

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

    onLog(`Pemetaan selesai. Menemukan ${toLikeList.length} postingan baru untuk di-like.`)

    // Stage 2: Liking loop
    let successCount = 0
    for (let i = 0; i < toLikeList.length; i++) {
      const post = toLikeList[i]
      onLog(`[Stage 2] [${i + 1}/${toLikeList.length}] Membuka detail postingan: ${post.url}`)
      
      try {
        await page.goto(post.url, { waitUntil: 'domcontentloaded', timeout: 60000 })
        await randomDelay(3000, 5000)

        // Tunggu hingga tombol like/unlike utama dimuat
        const mainButtonsSelector = 'svg[aria-label="Suka"][height="24"], svg[aria-label="Like"][height="24"], svg[aria-label="Batal Suka"][height="24"], svg[aria-label="Unlike"][height="24"]'
        await page.waitForSelector(mainButtonsSelector, { timeout: 15000 }).catch(() => {})

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
            await page.locator(likeSelector).first().click({ force: true })
            
            await saveLikedPost(db, 'instagram', targetUrl, post.id)
            onLog(`[SUKSES] Postingan ${post.id} berhasil di-like.`)
            successCount++
            
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
