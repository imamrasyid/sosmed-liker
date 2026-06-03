import { PLATFORMS, PLATFORM_DOMAINS } from './constants.js'

/**
 * Validate URL format
 */
export function isValidUrl(url) {
  if (!url || typeof url !== 'string') return false
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

/**
 * Detect platform from URL
 */
export function detectPlatformFromUrl(url) {
  if (!url) return PLATFORMS.INSTAGRAM
  const lower = url.toLowerCase()
  if (lower.includes('instagram.com')) return PLATFORMS.INSTAGRAM
  if (lower.includes('twitter.com') || lower.includes('x.com')) return PLATFORMS.TWITTER
  if (lower.includes('threads.net') || lower.includes('threads.com')) return PLATFORMS.THREADS
  return PLATFORMS.INSTAGRAM
}

/**
 * Get placeholder URL for a given platform
 */
export function getPlatformPlaceholder(platform) {
  return PLATFORM_DOMAINS[platform] || PLATFORM_DOMAINS[PLATFORMS.INSTAGRAM]
}

/**
 * Validate cookie content format (Netscape HTTP Cookie File)
 */
export function isValidCookieFormat(cookieContent) {
  if (!cookieContent || typeof cookieContent !== 'string') return false
  const lines = cookieContent.split('\n')
  let validLines = 0
  for (const line of lines) {
    const trimmed = line.trim()
    if (trimmed === '' || trimmed.startsWith('#')) continue
    if (trimmed.split('\t').length === 7) validLines++
  }
  return validLines > 0
}

/**
 * Validate configuration value against its constraints
 */
export function validateConfigValue(key, value) {
  const num = typeof value === 'string' ? parseInt(value, 10) : value
  switch (key) {
    case 'min_delay': return Number.isFinite(num) && num >= 1000 && num <= 60000
    case 'max_delay': return Number.isFinite(num) && num >= 2000 && num <= 120000
    case 'limit': return Number.isFinite(num) && num >= 1 && num <= 1000
    case 'consecutive_skips_limit': return Number.isFinite(num) && num >= 1 && num <= 100
    case 'scroll_step': return Number.isFinite(num) && num >= 100 && num <= 5000
    case 'max_scroll_attempts': return Number.isFinite(num) && num >= 5 && num <= 100
    case 'headless': return value === 'true' || value === 'false' || value === true || value === false
    case 'browser_user_agent': return ['Default', 'Chrome Windows', 'Safari macOS', 'Firefox Linux'].includes(value)
    default: return true
  }
}
