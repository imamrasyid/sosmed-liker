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
  
  const lowerUrl = url.toLowerCase()
  
  if (lowerUrl.includes('instagram.com')) {
    return PLATFORMS.INSTAGRAM
  } else if (lowerUrl.includes('twitter.com') || lowerUrl.includes('x.com')) {
    return PLATFORMS.TWITTER
  } else if (lowerUrl.includes('threads.net') || lowerUrl.includes('threads.com')) {
    return PLATFORMS.THREADS
  }
  
  return PLATFORMS.INSTAGRAM
}

/**
 * Get platform placeholder URL
 */
export function getPlatformPlaceholder(platform) {
  return PLATFORM_DOMAINS[platform] || PLATFORM_DOMAINS[PLATFORMS.INSTAGRAM]
}

/**
 * Validate cookie format (basic validation)
 */
export function isValidCookieFormat(cookieContent) {
  if (!cookieContent || typeof cookieContent !== 'string') return false
  
  const lines = cookieContent.split('\n')
  let validLines = 0
  
  for (const line of lines) {
    const trimmed = line.trim()
    if (trimmed === '' || trimmed.startsWith('#')) continue
    
    const parts = trimmed.split('\t')
    if (parts.length === 7) {
      validLines++
    }
  }
  
  return validLines > 0
}

/**
 * Sanitize cookie content
 */
export function sanitizeCookieContent(cookieContent) {
  if (!cookieContent) return ''
  
  return cookieContent
    .split('\n')
    .map(line => line.trim())
    .filter(line => line !== '' && !line.startsWith('#HttpOnly_') && !line.startsWith('#'))
    .join('\n')
}

/**
 * Validate configuration value
 */
export function validateConfigValue(key, value) {
  const numValue = parseInt(value, 10)
  
  switch (key) {
    case 'min_delay':
      return !isNaN(numValue) && numValue >= 1000 && numValue <= 60000
    case 'max_delay':
      return !isNaN(numValue) && numValue >= 2000 && numValue <= 120000
    case 'limit':
      return !isNaN(numValue) && numValue >= 1 && numValue <= 1000
    case 'consecutive_skips_limit':
      return !isNaN(numValue) && numValue >= 1 && numValue <= 100
    case 'scroll_step':
      return !isNaN(numValue) && numValue >= 100 && numValue <= 5000
    case 'max_scroll_attempts':
      return !isNaN(numValue) && numValue >= 5 && numValue <= 100
    case 'headless':
      return value === 'true' || value === 'false'
    case 'browser_user_agent':
      return ['Default', 'Chrome Windows', 'Safari macOS', 'Firefox Linux'].includes(value)
    default:
      return true
  }
}

/**
 * Validate post ID format
 */
export function isValidPostId(postId) {
  if (!postId || typeof postId !== 'string') return false
  return postId.length > 0 && postId.length <= 500
}

/**
 * Sanitize user input
 */
export function sanitizeInput(input) {
  if (typeof input !== 'string') return ''
  return input.trim().slice(0, 1000) // Limit to 1000 characters
}

/**
 * Validate file extension
 */
export function isValidFileExtension(filename, allowedExtensions) {
  if (!filename || !allowedExtensions || !Array.isArray(allowedExtensions)) return false
  
  const extension = filename.toLowerCase().slice(filename.lastIndexOf('.'))
  return allowedExtensions.includes(extension)
}
