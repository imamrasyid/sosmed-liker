import { launchBrowserWithCookies } from './browser.js'
import { processInstagram } from './platforms/instagram.js'
import { processTwitter } from './platforms/twitter.js'
import { processThreads } from './platforms/threads.js'
import { join } from 'path'
import { app } from 'electron'
import * as dbQueries from '../db/queries.js'
import { detectPlatform } from '../utils/helpers.js'

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

  /**
   * Deteksi platform dari URL — delegasi ke shared helper.
   * @param {string} url
   * @returns {'instagram'|'twitter'|'threads'|null}
   */
  _detectPlatform(url) {
    return detectPlatform(url)
  }

  /**
   * Method inti: memproses satu URL tanpa menyentuh isRunning.
   * Dipakai oleh start() maupun startBatch().
   */
  async _processUrl(targetUrl) {
    const platform = this._detectPlatform(targetUrl)

    if (!platform) {
      this.log('[ERROR] Platform sosial media tidak dikenali. Pastikan URL target valid untuk Instagram, Twitter / X, atau Threads.')
      return false
    }

    // Check blacklist
    const isBlacklisted = await dbQueries.isProfileBlacklisted(this.db, platform, targetUrl)
    if (isBlacklisted) {
      this.log(`[SKIP] Target URL ada di blacklist. Proses dibatalkan.`)
      return false
    }

    // Check whitelist if enabled
    const whitelistEnabled = await dbQueries.hasWhitelistEnabled(this.db, platform)
    if (whitelistEnabled) {
      const isWhitelisted = await dbQueries.isProfileWhitelisted(this.db, platform, targetUrl)
      if (!isWhitelisted) {
        this.log(`[SKIP] Target URL tidak ada di whitelist (mode whitelist aktif). Proses dibatalkan.`)
        return false
      }
      this.log(`[INFO] Target URL ada di whitelist. Melanjutkan proses.`)
    }

    // Ambil konfigurasi dinamis dari database SQLite
    this.log('Membaca konfigurasi bot dari database...')
    const minDelay = parseInt(await dbQueries.getConfig(this.db, 'min_delay') || '3000', 10)
    const maxDelay = parseInt(await dbQueries.getConfig(this.db, 'max_delay') || '6000', 10)
    const limit = parseInt(await dbQueries.getConfig(this.db, 'limit') || '20', 10)
    const headless = (await dbQueries.getConfig(this.db, 'headless') || 'false') === 'true'
    const consecutiveSkipsLimit = parseInt(await dbQueries.getConfig(this.db, 'consecutive_skips_limit') || '5', 10)
    const scrollStep = parseInt(await dbQueries.getConfig(this.db, 'scroll_step') || '1000', 10)
    const maxScrollAttempts = parseInt(await dbQueries.getConfig(this.db, 'max_scroll_attempts') || '20', 10)
    const userAgent = await dbQueries.getConfig(this.db, 'browser_user_agent') || 'Default'

    this.log(`Konfigurasi aktif -> Delay: ${minDelay}-${maxDelay}ms, Batas Post: ${limit}, Headless: ${headless}, Skip Limit: ${consecutiveSkipsLimit}, Scroll: ${scrollStep}px, Maks Gulir: ${maxScrollAttempts}, UA: ${userAgent}`)

    // Get active profile for the platform
    const activeProfile = await dbQueries.getActiveProfile(this.db, platform)
    if (activeProfile) {
      this.log(`Menggunakan profil aktif: ${activeProfile.profile_name}`)
    } else {
      this.log(`⚠️ PERINGATAN: Tidak ada profil aktif untuk ${platform}.`)
      this.log(`⚠️ Cookie folder fallback sudah DEPRECATED. Silakan migrasi ke sistem multi-profile di Settings > Profiles.`)
      this.log(`Menggunakan cookie dari folder sebagai fallback sementara...`)
    }

    // Get active proxy
    const activeProxy = await dbQueries.getActiveProxy(this.db)
    if (activeProxy) {
      this.log(`Menggunakan proxy: ${activeProxy.proxy_type}://${activeProxy.host}:${activeProxy.port}`)
    } else {
      this.log(`Tidak ada proxy aktif. Koneksi langsung.`)
    }

    const cookiesFolder = join(app.getPath('userData'), 'cookie')

    this.log('Membaca cookie dan menyuntikkan sesi...')
    const { browser, context } = await launchBrowserWithCookies(cookiesFolder, headless, userAgent, activeProfile, activeProxy)
    this.browser = browser
    this.context = context

    const processOptions = { minDelay, maxDelay, limit, consecutiveSkipsLimit, scrollStep, maxScrollAttempts }

    try {
      let normalizedUrl = targetUrl

      if (platform === 'instagram') {
        await processInstagram(this.context, this.db, normalizedUrl, this.log.bind(this), processOptions)
      } else if (platform === 'twitter') {
        await processTwitter(this.context, this.db, normalizedUrl, this.log.bind(this), processOptions)
      } else if (platform === 'threads') {
        if (targetUrl.toLowerCase().includes('threads.com')) {
          normalizedUrl = targetUrl.replace(/threads\.com/i, 'threads.net')
          this.log(`[Manager] Mendeteksi domain threads.com. Mengoreksi otomatis target ke: ${normalizedUrl}`)
        }
        await processThreads(this.context, this.db, normalizedUrl, this.log.bind(this), processOptions)
      }
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
    }

    return true
  }

  async start(targetUrl) {
    if (this.isRunning) {
      this.log('Otomatisasi sudah berjalan!')
      return false
    }

    this.isRunning = true
    this.log(`Memulai proses untuk target: ${targetUrl}`)

    try {
      await this._processUrl(targetUrl)
    } catch (error) {
      this.log(`[KESALAHAN FATAL]: ${error.message}`)
    } finally {
      this.isRunning = false
      this.log('Proses otomatisasi selesai.')
      // Kirim event selesai ke UI (tidak bergantung pada string log)
      if (this.sendLogToUI) {
        this.sendLogToUI('__AUTOMATION_DONE__')
      }
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
      if (this.sendLogToUI) {
        this.sendLogToUI('__AUTOMATION_STOPPED__')
      }
    }
  }

  async startBatch(batchId) {
    if (this.isRunning) {
      this.log('Otomatisasi sudah berjalan!')
      return false
    }

    const batchJob = await dbQueries.getBatchJob(this.db, batchId)
    if (!batchJob) {
      this.log('[ERROR] Batch job tidak ditemukan')
      return false
    }

    this.isRunning = true
    this.log(`Memulai batch job: ${batchJob.name} (${batchJob.total_urls} URLs)`)

    try {
      await dbQueries.updateBatchJobStatus(this.db, batchId, 'running')

      const batchUrls = await dbQueries.getBatchUrls(this.db, batchId)

      let processed = 0
      let successful = 0
      let failed = 0

      for (const batchUrl of batchUrls) {
        this.log(`[${processed + 1}/${batchJob.total_urls}] Memproses: ${batchUrl.url}`)

        try {
          // Gunakan _processUrl agar tidak terhalang guard isRunning
          const result = await this._processUrl(batchUrl.url)

          if (result) {
            await dbQueries.updateBatchUrlStatus(this.db, batchUrl.id, 'completed')
            successful++
          } else {
            await dbQueries.updateBatchUrlStatus(this.db, batchUrl.id, 'failed', 'Skipped by blacklist/whitelist')
            failed++
          }
        } catch (error) {
          await dbQueries.updateBatchUrlStatus(this.db, batchUrl.id, 'failed', error.message)
          failed++
          this.log(`[ERROR] Gagal memproses ${batchUrl.url}: ${error.message}`)
        }

        processed++
        await dbQueries.updateBatchJobProgress(this.db, batchId, processed, successful, failed)

        // Jeda singkat antar URL
        await new Promise(resolve => setTimeout(resolve, 2000))
      }

      await dbQueries.updateBatchJobStatus(this.db, batchId, 'completed')
      this.log(`Batch job selesai: ${successful} berhasil, ${failed} gagal`)

    } catch (error) {
      await dbQueries.updateBatchJobStatus(this.db, batchId, 'failed')
      this.log(`[KESALAHAN FATAL BATCH]: ${error.message}`)
    } finally {
      this.isRunning = false
      this.log('Batch job selesai.')
      if (this.sendLogToUI) {
        this.sendLogToUI('__AUTOMATION_DONE__')
      }
    }

    return true
  }
}
