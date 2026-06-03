// ── Platform ──────────────────────────────────────────────────────────────
export const PLATFORMS = {
  INSTAGRAM: 'instagram',
  TWITTER: 'twitter',
  THREADS: 'threads',
}

export const PLATFORM_NAMES = {
  [PLATFORMS.INSTAGRAM]: 'Instagram',
  [PLATFORMS.TWITTER]: 'Twitter / X',
  [PLATFORMS.THREADS]: 'Threads',
}

export const PLATFORM_DOMAINS = {
  [PLATFORMS.INSTAGRAM]: 'https://www.instagram.com',
  [PLATFORMS.TWITTER]: 'https://x.com',
  [PLATFORMS.THREADS]: 'https://www.threads.net',
}

// ── Navigation tabs ───────────────────────────────────────────────────────
export const TABS = {
  DASHBOARD: 'dashboard',
  HISTORY: 'history',
  ANALYTICS: 'analytics',
  SETTINGS: 'settings',
  SETTINGS_APP: 'settings-app',
  ACCOUNTS: 'accounts',
}

// ── Log types ─────────────────────────────────────────────────────────────
export const LOG_TYPES = {
  ALL: 'ALL',
  SUKSES: 'SUKSES',
  SKIP: 'SKIP',
  ERROR: 'ERROR',
  SYSTEM: 'SYSTEM',
  ACTION: 'ACTION',
}

// ── Default config values ─────────────────────────────────────────────────
export const DEFAULT_CONFIG = {
  MIN_DELAY: 3000,
  MAX_DELAY: 6000,
  LIMIT: 20,
  HEADLESS: false,
  CONSECUTIVE_SKIPS_LIMIT: 5,
  SCROLL_STEP: 1000,
  MAX_SCROLL_ATTEMPTS: 20,
  BROWSER_USER_AGENT: 'Default',
}

// ── User agent options ────────────────────────────────────────────────────
export const USER_AGENTS = {
  DEFAULT: 'Default',
  CHROME_WINDOWS: 'Chrome Windows',
  SAFARI_MACOS: 'Safari macOS',
  FIREFOX_LINUX: 'Firefox Linux',
}

export const USER_AGENT_STRINGS = {
  [USER_AGENTS.DEFAULT]: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  [USER_AGENTS.CHROME_WINDOWS]: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
  [USER_AGENTS.SAFARI_MACOS]: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15',
  [USER_AGENTS.FIREFOX_LINUX]: 'Mozilla/5.0 (X11; Linux x86_64; rv:122.0) Gecko/20100101 Firefox/122.0',
}

// ── Toast ─────────────────────────────────────────────────────────────────
export const TOAST_TYPES = {
  SUCCESS: 'success',
  ERROR: 'error',
}

// ── GitHub (untuk update checker) ─────────────────────────────────────────
export const GITHUB_REPO = 'imamrasyid/sosmed-liker'
