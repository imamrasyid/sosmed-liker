import { app, net } from 'electron'

const GITHUB_REPO = 'EyeTracker/sosmed-liker'

function isNewerVersion(current, latest) {
  const cleanCurrent = current.replace(/^[vV]/, '')
  const cleanLatest = latest.replace(/^[vV]/, '')

  // Pisahkan SemVer utama dan suffix (misal: "1.0.0-B20260520" -> ["1.0.0", "B20260520"])
  const [versionCurrent, suffixCurrent = ''] = cleanCurrent.split('-')
  const [versionLatest, suffixLatest = ''] = cleanLatest.split('-')

  const currentParts = versionCurrent.split('.').map(Number)
  const latestParts = versionLatest.split('.').map(Number)

  // 1. Bandingkan versi mayor.minor.patch
  for (let i = 0; i < 3; i++) {
    const cur = currentParts[i] || 0
    const lat = latestParts[i] || 0
    if (lat > cur) return true
    if (cur > lat) return false
  }

  // 2. Jika SemVer sama, bandingkan angka pada suffix (misal: B20260520 vs B20260521)
  if (suffixLatest && suffixCurrent) {
    const numCurrent = parseInt(suffixCurrent.replace(/[^0-9]/g, ''), 10) || 0
    const numLatest = parseInt(suffixLatest.replace(/[^0-9]/g, ''), 10) || 0
    if (numLatest > numCurrent) return true
  } else if (suffixLatest && !suffixCurrent) {
    // Jika rilis baru punya build number terbaru sedangkan lokal tidak punya, anggap rilis baru lebih baru
    return true
  }

  return false
}

export async function checkForUpdates() {
  return new Promise((resolve) => {
    const currentVersion = app.getVersion()
    
    const request = net.request({
      method: 'GET',
      protocol: 'https:',
      hostname: 'api.github.com',
      path: `/repos/${GITHUB_REPO}/releases/latest`,
      headers: {
        'User-Agent': 'Sosmed-Liker-Updater',
        'Accept': 'application/vnd.github.v3+json'
      }
    })

    request.on('response', (response) => {
      let data = ''

      response.on('data', (chunk) => {
        data += chunk
      })

      response.on('end', () => {
        try {
          if (response.statusCode !== 200) {
            resolve({
              updateAvailable: false,
              currentVersion,
              error: `GitHub API returned status code ${response.statusCode}`
            })
            return
          }

          const release = JSON.parse(data)
          const latestVersion = release.tag_name
          const updateAvailable = isNewerVersion(currentVersion, latestVersion)

          // Cari asset berupa file installer .exe untuk Windows
          let downloadUrl = release.html_url
          if (release.assets && Array.isArray(release.assets)) {
            const exeAsset = release.assets.find(asset => asset.name && asset.name.endsWith('.exe'))
            if (exeAsset) {
              downloadUrl = exeAsset.browser_download_url
            }
          }

          resolve({
            updateAvailable,
            currentVersion,
            latestVersion,
            releaseName: release.name || latestVersion,
            releaseNotes: release.body || '',
            downloadUrl: downloadUrl,
            publishedAt: release.published_at
          })
        } catch (err) {
          resolve({
            updateAvailable: false,
            currentVersion,
            error: `Gagal memproses data rilis: ${err.message}`
          })
        }
      })
    })

    request.on('error', (err) => {
      resolve({
        updateAvailable: false,
        currentVersion,
        error: `Kesalahan jaringan: ${err.message}`
      })
    })

    request.end()
  })
}
