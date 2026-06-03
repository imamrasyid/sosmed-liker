import { PLATFORM_DOMAINS } from './constants.js'

/**
 * Build a post URL that can be opened in browser
 */
export function formatPostUrl(item) {
  switch (item.platform) {
    case 'instagram':
      return `${PLATFORM_DOMAINS.instagram}/p/${item.post_id}/`
    case 'twitter':
      return `https://x.com/x/status/${item.post_id}`
    case 'threads':
      return `${PLATFORM_DOMAINS.threads}/post/${item.post_id}`
    default:
      return `${PLATFORM_DOMAINS.instagram}/p/${item.post_id}/`
  }
}

/**
 * Format a date string to locale-aware string
 */
export function formatDate(dateString) {
  if (!dateString) return ''
  return new Date(dateString).toLocaleString('id-ID')
}

/**
 * Format a number with locale-aware thousand separators
 */
export function formatNumber(num) {
  if (typeof num !== 'number') return '0'
  return num.toLocaleString()
}

/**
 * Truncate text with ellipsis
 */
export function truncateText(text, maxLength = 50) {
  if (!text || typeof text !== 'string') return ''
  return text.length <= maxLength ? text : text.slice(0, maxLength) + '...'
}

/**
 * Format percentage from part/total
 */
export function formatPercentage(value, total) {
  if (!total) return '0%'
  return Math.round((value / total) * 100) + '%'
}
