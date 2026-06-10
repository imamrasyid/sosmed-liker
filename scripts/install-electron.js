/**
 * install-electron.js
 *
 * Script fallback untuk menginstall Electron binary dari folder vendors/
 * ketika download otomatis (npm install) gagal karena masalah jaringan.
 *
 * Usage:
 *   node scripts/install-electron.js
 *
 * Script ini akan:
 *   1. Baca versi Electron yang dibutuhkan dari node_modules/electron/package.json
 *   2. Cari folder yang cocok di vendors/ (electron-v{version}-win32-x64)
 *   3. Copy ke node_modules/electron/dist/
 *   4. Buat/update path.txt
 */

'use strict'

const { existsSync, readdirSync, cpSync, writeFileSync, readFileSync } = require('fs')
const { join, resolve } = require('path')

const ROOT = resolve(__dirname, '..')

// Baca versi Electron yang dibutuhkan
const electronPkg = JSON.parse(
    readFileSync(join(ROOT, 'node_modules/electron/package.json'), 'utf-8')
)
const version = electronPkg.version
console.log(`[install-electron] Target version: ${version}`)

// Tentukan nama folder yang diharapkan di vendors/
const platform = process.platform === 'win32' ? 'win32' : process.platform === 'darwin' ? 'darwin' : 'linux'
const arch = process.arch === 'x64' ? 'x64' : process.arch
const expectedFolder = `electron-v${version}-${platform}-${arch}`
const vendorsDir = join(ROOT, 'vendors')
const sourcePath = join(vendorsDir, expectedFolder)
const destPath = join(ROOT, 'node_modules/electron/dist')
const pathTxt = join(ROOT, 'node_modules/electron/path.txt')
const binaryName = platform === 'win32' ? 'electron.exe' : 'electron'

// Cek apakah folder vendor tersedia
if (!existsSync(sourcePath)) {
    // Coba cari folder vendor yang versinya cocok (partial match)
    const available = existsSync(vendorsDir) ? readdirSync(vendorsDir).filter(f => f !== 'README.md') : []
    const match = available.find(f => f.startsWith(`electron-v${version}`))

    if (match) {
        console.log(`[install-electron] Menemukan folder alternatif: ${match}`)
        installFrom(join(vendorsDir, match))
    } else {
        console.error(`[install-electron] ERROR: Folder vendor tidak ditemukan: ${sourcePath}`)
        console.error(`[install-electron] Folder tersedia di vendors/: ${available.join(', ') || '(kosong)'}`)
        console.error(`\nUnduh manual dari:`)
        console.error(`  https://github.com/electron/electron/releases/download/v${version}/electron-v${version}-${platform}-${arch}.zip`)
        console.error(`\nExtract ke: vendors/${expectedFolder}/`)
        process.exit(1)
    }
} else {
    installFrom(sourcePath)
}

function installFrom(src) {
    console.log(`[install-electron] Menyalin dari: ${src}`)
    console.log(`[install-electron] Ke: ${destPath}`)

    cpSync(src, destPath, { recursive: true, force: true })
    writeFileSync(pathTxt, binaryName, 'utf-8')

    const binaryPath = join(destPath, binaryName)
    if (existsSync(binaryPath)) {
        console.log(`[install-electron] ✓ Berhasil! Binary tersedia di: ${binaryPath}`)
    } else {
        console.error(`[install-electron] ERROR: Binary tidak ditemukan setelah copy: ${binaryPath}`)
        process.exit(1)
    }
}
