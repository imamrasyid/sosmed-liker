import { chromium } from 'playwright-core'
import { app, shell } from 'electron'
import fs from 'fs'

export async function parseAllCookiesFromFolder(userDataFolder) {
  const path = require('path')

  // 1. Pastikan folder AppData writable ada
  if (!fs.existsSync(userDataFolder)) {
    fs.mkdirSync(userDataFolder, { recursive: true })
  }

  // 2. Tentukan folder lokal instalasi
  const localFolder = app.isPackaged
    ? path.join(process.resourcesPath, 'cookie')
    : path.join(app.getAppPath(), 'resources/cookie')

  // Pastikan folder lokal juga ada (jika writable, misal dalam mode dev atau portable)
  if (!fs.existsSync(localFolder)) {
    try {
      fs.mkdirSync(localFolder, { recursive: true })
    } catch (e) {
      // Abaikan jika read-only
    }
  }

  // Kumpulkan semua file kuki dari kedua folder
  const sources = [userDataFolder]
  if (fs.existsSync(localFolder) && localFolder !== userDataFolder) {
    sources.push(localFolder)
  }

  // Map untuk menyimpan file unik berdasarkan namanya (key: lowercase filename, value: { filePath, mtime })
  const uniqueCookieFiles = new Map()

  for (const sourceDir of sources) {
    try {
      const files = fs.readdirSync(sourceDir)
      const txtFiles = files.filter(f => f.endsWith('.txt') && f.toLowerCase() !== 'readme.txt')

      for (const file of txtFiles) {
        const filePath = path.join(sourceDir, file)
        const stats = fs.statSync(filePath)
        const key = file.toLowerCase()

        if (uniqueCookieFiles.has(key)) {
          // Jika file kuki dengan nama yang sama ada di kedua folder, pilih yang paling baru dimodifikasi!
          const existing = uniqueCookieFiles.get(key)
          if (stats.mtime > existing.mtime) {
            uniqueCookieFiles.set(key, {
              filePath,
              mtime: stats.mtime
            })
          }
        } else {
          uniqueCookieFiles.set(key, {
            filePath,
            mtime: stats.mtime
          })
        }
      }
    } catch (err) {
      console.error(`Gagal memindai folder kuki di ${sourceDir}:`, err)
    }
  }

  // Jika tidak ditemukan file kuki sama sekali di kedua folder
  if (uniqueCookieFiles.size === 0) {
    // Buka folder AppData agar mempermudah pengguna
    shell.openPath(userDataFolder).catch(() => {})
    throw new Error(`[SISTEM] Tidak ditemukan file cookie (.txt) di folder kerja.\nFolder AppData telah dibuka secara otomatis. Silakan masukkan file cookie Netscape Anda ke dalamnya.`)
  }

  const cookies = []

  for (const [key, fileInfo] of uniqueCookieFiles.entries()) {
    const content = fs.readFileSync(fileInfo.filePath, 'utf-8')
    const lines = content.split('\n')

    for (let line of lines) {
      line = line.trim()
      if (line === '') {
        continue
      }

      let isHttpOnly = false
      if (line.startsWith('#HttpOnly_')) {
        isHttpOnly = true
        line = line.substring(10) // Hilangkan '#HttpOnly_'
      } else if (line.startsWith('#')) {
        continue
      }

      const parts = line.split('\t')
      if (parts.length === 7) {
        cookies.push({
          domain: parts[0],
          path: parts[2],
          secure: parts[3] === 'TRUE',
          expires: parseInt(parts[4], 10) === 0 ? -1 : parseInt(parts[4], 10),
          name: parts[5],
          value: parts[6].replace('\r', ''),
          httpOnly: isHttpOnly
        })
      }
    }
  }

  return cookies
}

export async function launchBrowserWithCookies(cookieFolderPath, headless = false, userAgentName = 'Default') {
  const cookies = await parseAllCookiesFromFolder(cookieFolderPath)
  
  let browser;
  
  // Algoritma self-healing untuk menggunakan browser bawaan komputer pengguna (Chrome / Edge)
  // Ini menghindari keharusan menyertakan binary browser >150MB di dalam installer berkas setup.
  try {
    // 1. Coba jalankan menggunakan Google Chrome bawaan sistem
    browser = await chromium.launch({
      headless: headless,
      channel: 'chrome',
      args: ['--disable-blink-features=AutomationControlled']
    })
  } catch (err) {
    try {
      // 2. Jika gagal/tidak terpasang, coba gunakan Microsoft Edge (100% terpasang di Windows)
      browser = await chromium.launch({
        headless: headless,
        channel: 'msedge',
        args: ['--disable-blink-features=AutomationControlled']
      })
    } catch (err2) {
      // 3. Fallback terakhir jika keduanya tidak terdeteksi, gunakan Playwright Chromium bawaan
      browser = await chromium.launch({
        headless: headless,
        args: ['--disable-blink-features=AutomationControlled']
      })
    }
  }
  
  let uaString = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  if (userAgentName === 'Chrome Windows') {
    uaString = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
  } else if (userAgentName === 'Safari macOS') {
    uaString = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15'
  } else if (userAgentName === 'Firefox Linux') {
    uaString = 'Mozilla/5.0 (X11; Linux x86_64; rv:122.0) Gecko/20100101 Firefox/122.0'
  }
  
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
    userAgent: uaString
  })
  
  await context.addCookies(cookies)
  
  return { browser, context }
}
