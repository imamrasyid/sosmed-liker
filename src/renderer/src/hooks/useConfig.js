import { useState, useEffect, useCallback } from 'react'
import { DEFAULT_CONFIG } from '../utils/constants.js'
import { validateConfigValue } from '../utils/validators.js'

/** Mapping snake_case DB key → camelCase state key */
const KEY_MAP = {
  min_delay: 'minDelay',
  max_delay: 'maxDelay',
  limit: 'limit',
  headless: 'headless',
  consecutive_skips_limit: 'consecutiveSkipsLimit',
  scroll_step: 'scrollStep',
  max_scroll_attempts: 'maxScrollAttempts',
  browser_user_agent: 'userAgent'
}

/** Parse raw string values dari DB ke tipe yang benar */
function parseConfigData(raw) {
  return {
    minDelay: raw.min_delay ? parseInt(raw.min_delay, 10) : DEFAULT_CONFIG.MIN_DELAY,
    maxDelay: raw.max_delay ? parseInt(raw.max_delay, 10) : DEFAULT_CONFIG.MAX_DELAY,
    limit: raw.limit ? parseInt(raw.limit, 10) : DEFAULT_CONFIG.LIMIT,
    headless: raw.headless === 'true',
    consecutiveSkipsLimit: raw.consecutive_skips_limit
      ? parseInt(raw.consecutive_skips_limit, 10)
      : DEFAULT_CONFIG.CONSECUTIVE_SKIPS_LIMIT,
    scrollStep: raw.scroll_step ? parseInt(raw.scroll_step, 10) : DEFAULT_CONFIG.SCROLL_STEP,
    maxScrollAttempts: raw.max_scroll_attempts
      ? parseInt(raw.max_scroll_attempts, 10)
      : DEFAULT_CONFIG.MAX_SCROLL_ATTEMPTS,
    userAgent: raw.browser_user_agent || DEFAULT_CONFIG.BROWSER_USER_AGENT
  }
}

export function useConfig() {
  const [config, setConfig] = useState(DEFAULT_CONFIG)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const loadConfigurations = useCallback(async () => {
    if (!window.api) return

    setLoading(true)
    setError(null)
    try {
      // 1 round-trip via get-all-config, bukan 8 call terpisah
      const result = await window.api.getAllConfig()
      if (result?.success) {
        setConfig(parseConfigData(result.data))
      } else {
        throw new Error(result?.error || 'Failed to load config')
      }
    } catch (err) {
      console.error('Failed to load configs:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  const handleSaveConfig = useCallback(async (key, value) => {
    if (!window.api?.saveConfig) return false

    if (!validateConfigValue(key, value)) {
      setError(`Invalid value for ${key}`)
      return false
    }

    setLoading(true)
    setError(null)
    try {
      const result = await window.api.saveConfig(key, value.toString())
      if (!result?.success) throw new Error(result?.error || 'Save failed')

      const stateKey = KEY_MAP[key] || key
      setConfig(prev => ({ ...prev, [stateKey]: value }))
      return true
    } catch (err) {
      console.error('Failed to save config:', err)
      setError(err.message)
      return false
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadConfigurations()
  }, [loadConfigurations])

  return { config, loading, error, loadConfigurations, handleSaveConfig }
}
