import { useState, useEffect, useCallback } from 'react'
import { DEFAULT_CONFIG } from '../utils/constants.js'
import { validateConfigValue } from '../utils/validators.js'

export function useConfig() {
  const [config, setConfig] = useState(DEFAULT_CONFIG)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const loadConfigurations = useCallback(async () => {
    if (!window.api || !window.api.getConfig) return

    setLoading(true)
    setError(null)
    try {
      const minVal = await window.api.getConfig('min_delay')
      const maxVal = await window.api.getConfig('max_delay')
      const limitVal = await window.api.getConfig('limit')
      const headlessVal = await window.api.getConfig('headless')
      const skipsLimitVal = await window.api.getConfig('consecutive_skips_limit')
      const scrollStepVal = await window.api.getConfig('scroll_step')
      const maxAttemptsVal = await window.api.getConfig('max_scroll_attempts')
      const userAgentVal = await window.api.getConfig('browser_user_agent')

      setConfig({
        minDelay: minVal ? parseInt(minVal, 10) : DEFAULT_CONFIG.MIN_DELAY,
        maxDelay: maxVal ? parseInt(maxVal, 10) : DEFAULT_CONFIG.MAX_DELAY,
        limit: limitVal ? parseInt(limitVal, 10) : DEFAULT_CONFIG.LIMIT,
        headless: headlessVal === 'true',
        consecutiveSkipsLimit: skipsLimitVal ? parseInt(skipsLimitVal, 10) : DEFAULT_CONFIG.CONSECUTIVE_SKIPS_LIMIT,
        scrollStep: scrollStepVal ? parseInt(scrollStepVal, 10) : DEFAULT_CONFIG.SCROLL_STEP,
        maxScrollAttempts: maxAttemptsVal ? parseInt(maxAttemptsVal, 10) : DEFAULT_CONFIG.MAX_SCROLL_ATTEMPTS,
        userAgent: userAgentVal || DEFAULT_CONFIG.BROWSER_USER_AGENT
      })
    } catch (err) {
      console.error('Failed to load configs:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  const handleSaveConfig = useCallback(async (key, value) => {
    if (!window.api || !window.api.saveConfig) return false

    // Validate the value before saving
    if (!validateConfigValue(key, value)) {
      setError(`Invalid value for ${key}`)
      return false
    }

    setLoading(true)
    setError(null)
    try {
      await window.api.saveConfig(key, value.toString())
      // Update local state
      setConfig(prev => ({ ...prev, [key]: value }))
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

  return {
    config,
    loading,
    error,
    loadConfigurations,
    handleSaveConfig
  }
}
