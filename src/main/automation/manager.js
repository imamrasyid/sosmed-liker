import { launchBrowserWithCookies } from './browser.js'
import { processInstagram } from './platforms/instagram.js'
import { processTwitter } from './platforms/twitter.js'
import { processThreads } from './platforms/threads.js'
import { join } from 'path'
import { app } from 'electron'
import fs from 'fs'
import * as dbQueries from '../db/queries.js'

export class AutomationManager {
  constructor(db, sendLogToUI) {
    this.db = db
    this.sendLogToUI = sendLogToUI
    this.browser = null
    this.context = null
    this.isRunning = false
  }

  log(message) {
    console.log(`[Manager] ${message}`)
    if (this.sendLogToUI) {
      this.sendLogToUI(message)
    }
  }

  async start(targetUrl) {
    if (this.isRunning) {
      this.log('Otomatisasi sudah berjalan!')
      return false
    }

    this.isRunning = true
    this.log(`Memulai proses untuk target: ${targetUrl}`)

    try {
      // Ambil konfigurasi dinamis dari database SQLite
      this.log('Membaca konfigurasi bot dari database...')
      const minDelay = parseInt(await dbQueries.getConfig(this.db, 'min_delay') || '3000', 10)
      const maxDelay = parseInt(await dbQueries.getConfig(this.db, 'max_delay') || '6000', 10)
      const limit = parseInt(await dbQueries.getConfig(this.db, 'limit') || '20', 10)
      const headless = (await dbQueries.getConfig(this.db, 'headless') || 'false') === 'true'

      // Konfigurasi baru
      const consecutiveSkipsLimit = parseInt(await dbQueries.getConfig(this.db, 'consecutive_skips_limit') || '5', 10)
      const scrollStep = parseInt(await dbQueries.getConfig(this.db, 'scroll_step') || '1000', 10)
      const maxScrollAttempts = parseInt(await dbQueries.getConfig(this.db, 'max_scroll_attempts') || '20', 10)
      const userAgent = await dbQueries.getConfig(this.db, 'browser_user_agent') || 'Default'

      this.log(`Konfigurasi aktif -> Delay: ${minDelay}-${maxDelay}ms, Batas Post: ${limit}, Headless: ${headless}, Skip Limit: ${consecutiveSkipsLimit}, Scroll: ${scrollStep}px, Maks Gulir: ${maxScrollAttempts}, UA: ${userAgent}`)

      // Target the 'cookie' folder in the userData path (accessible for write on production)
      const cookiesFolder = join(app.getPath('userData'), 'cookie')
      
      this.log('Membaca folder cookie dan menyuntikkan sesi...')
      const { browser, context } = await launchBrowserWithCookies(cookiesFolder, headless, userAgent)
      this.browser = browser
      this.context = context

      let normalizedUrl = targetUrl
      const lowerUrl = targetUrl.toLowerCase()
      
      if (lowerUrl.includes('instagram.com')) {
        await processInstagram(this.context, this.db, normalizedUrl, this.log.bind(this), {
          minDelay,
          maxDelay,
          limit,
          consecutiveSkipsLimit,
          scrollStep,
          maxScrollAttempts
        })
      } else if (lowerUrl.includes('twitter.com') || lowerUrl.includes('x.com')) {
        await processTwitter(this.context, this.db, normalizedUrl, this.log.bind(this), {
          minDelay,
          maxDelay,
          limit,
          consecutiveSkipsLimit,
          scrollStep,
          maxScrollAttempts
        })
      } else if (lowerUrl.includes('threads.net') || lowerUrl.includes('threads.com')) {
        if (lowerUrl.includes('threads.com')) {
          normalizedUrl = targetUrl.replace(/threads\.com/i, 'threads.net')
          this.log(`[Manager] Mendeteksi domain threads.com. Mengoreksi otomatis target ke: ${normalizedUrl}`)
        }
        await processThreads(this.context, this.db, normalizedUrl, this.log.bind(this), {
          minDelay,
          maxDelay,
          limit,
          consecutiveSkipsLimit,
          scrollStep,
          maxScrollAttempts
        })
      } else {
        this.log('[ERROR] Platform sosial media tidak dikenali. Pastikan URL target valid untuk Instagram, Twitter / X, atau Threads.')
      }

    } catch (error) {
      this.log(`[KESALAHAN FATAL]: ${error.message}`)
    } finally {
      this.log('Menutup browser...')
      try {
        if (this.browser) {
          await this.browser.close()
        }
      } catch (closeError) {
        this.log(`[INFO] Kendala saat menutup browser: ${closeError.message}`)
      }
      this.browser = null
      this.context = null
      this.isRunning = false
      this.log('Proses otomatisasi selesai.')
    }
    
    return true
  }

  async stop() {
    if (this.isRunning && this.browser) {
      this.log('Menghentikan paksa proses...')
      try {
        await this.browser.close()
      } catch (closeError) {
        this.log(`[INFO] Kendala saat menghentikan paksa browser: ${closeError.message}`)
      }
      this.browser = null
      this.context = null
      this.isRunning = false
      this.log('Proses dihentikan secara manual.')
    }
  }
}
