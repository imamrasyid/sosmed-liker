/**
 * Shared automation helpers — dipakai oleh semua platform processor
 */

/**
 * Tunggu durasi acak antara min dan max ms untuk mensimulasikan perilaku manusia.
 * @param {number} min - Minimum delay dalam ms (default 2000)
 * @param {number} max - Maximum delay dalam ms (default 5000)
 * @returns {Promise<void>}
 */
export function randomDelay(min = 2000, max = 5000) {
    return new Promise(resolve =>
        setTimeout(resolve, Math.floor(Math.random() * (max - min + 1)) + min)
    )
}

/**
 * Deteksi platform dari URL.
 * @param {string} url
 * @returns {'instagram'|'twitter'|'threads'|null}
 */
export function detectPlatform(url) {
    if (!url) return null
    const lower = url.toLowerCase()
    if (lower.includes('instagram.com')) return 'instagram'
    if (lower.includes('twitter.com') || lower.includes('x.com')) return 'twitter'
    if (lower.includes('threads.net') || lower.includes('threads.com')) return 'threads'
    return null
}
