import { useState, useCallback } from 'react'
import { TOAST_TYPES } from '../utils/constants.js'

export function useToast() {
  const [toast, setToast] = useState({ show: false, message: '', type: TOAST_TYPES.SUCCESS })

  const showToast = useCallback((message, type = TOAST_TYPES.SUCCESS) => {
    setToast({ show: true, message, type })
    setTimeout(() => {
      setToast({ show: false, message: '', type: TOAST_TYPES.SUCCESS })
    }, 4000)
  }, [])

  const hideToast = useCallback(() => {
    setToast({ show: false, message: '', type: TOAST_TYPES.SUCCESS })
  }, [])

  return { toast, showToast, hideToast }
}
