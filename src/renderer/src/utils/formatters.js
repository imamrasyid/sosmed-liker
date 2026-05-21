import { POST_ID_PREFIXES, PLATFORM_DOMAINS } from './constants.js'

/**
 * Format post URL for opening
 */
export function formatPostUrl(item) {
  let url = ''
  
  switch (item.platform) {
    case 'instagram':
      url = `${PLATFORM_DOMAINS.instagram}/p/${item.post_id}/`
      break
    case 'twitter':
      const cleanTwitterId = item.post_id.replace(POST_ID_PREFIXES.TWITTER, '')
      url = `https://x.com/x/status/${cleanTwitterId}`
      break
    case 'threads':
      const cleanThreadsId = item.post_id.replace(POST_ID_PREFIXES.THREADS, '')
      url = `${PLATFORM_DOMAINS.threads}/post/${cleanThreadsId}`
      break
    default:
      url = `${PLATFORM_DOMAINS.instagram}/p/${item.post_id}/`
  }
  
  return url
}

/**
 * Format date to locale string
 */
export function formatDate(dateString) {
  if (!dateString) return ''
  return new Date(dateString).toLocaleString('id-ID')
}

/**
 * Format time to locale string
 */
export function formatTime(date) {
  if (!date) return ''
  return date.toLocaleTimeString()
}

/**
 * Format delay in milliseconds to seconds
 */
export function formatDelayToSeconds(ms) {
  return (ms / 1000).toFixed(1)
}

/**
 * Format number with commas
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
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength) + '...'
}

/**
 * Format log message for display
 */
export function formatLogMessage(message, type) {
  let cleanMsg = message
  
  if (message.includes(`[${type}]`)) {
    cleanMsg = message.replace(`[${type}]`, '').trim()
  }
  
  return cleanMsg
}

/**
 * Format file size
 */
export function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes'
  
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
}

/**
 * Format percentage
 */
export function formatPercentage(value, total) {
  if (total === 0) return '0%'
  return Math.round((value / total) * 100) + '%'
}
