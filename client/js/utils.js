// Utility functions for the client application

/**
 * Shows a loading state on an element
 * @param {HTMLElement} element - Element to show loading state on
 * @param {string} message - Loading message
 */
export function showLoading(element, message = 'Loading...') {
  if (!element) return
  
  const originalContent = element.innerHTML
  element.dataset.originalContent = originalContent
  element.innerHTML = `
    <div style="text-align: center; padding: 2rem;">
      <div style="display: inline-block; width: 2rem; height: 2rem; border: 3px solid #e2e8f0; border-top-color: #2563eb; border-radius: 50%; animation: spin 0.6s linear infinite;"></div>
      <p style="margin-top: 1rem; color: #64748b;">${message}</p>
    </div>
  `
  
  // Add spinner animation if not already in stylesheet
  if (!document.getElementById('spinner-styles')) {
    const style = document.createElement('style')
    style.id = 'spinner-styles'
    style.textContent = `
      @keyframes spin {
        to { transform: rotate(360deg); }
      }
    `
    document.head.appendChild(style)
  }
}

/**
 * Hides loading state and restores original content
 * @param {HTMLElement} element - Element to restore
 */
export function hideLoading(element) {
  if (!element) return
  
  if (element.dataset.originalContent) {
    element.innerHTML = element.dataset.originalContent
    delete element.dataset.originalContent
  }
}

/**
 * Validates email format
 * @param {string} email - Email to validate
 * @returns {boolean} True if valid
 */
export function isValidEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return re.test(email)
}

/**
 * Validates password strength
 * @param {string} password - Password to validate
 * @returns {Object} {valid: boolean, message: string}
 */
export function validatePassword(password) {
  if (!password) {
    return { valid: false, message: 'Password is required' }
  }
  if (password.length < 6) {
    return { valid: false, message: 'Password must be at least 6 characters' }
  }
  if (password.length > 128) {
    return { valid: false, message: 'Password must be less than 128 characters' }
  }
  return { valid: true, message: '' }
}

/**
 * Sanitizes string input
 * @param {string} str - String to sanitize
 * @returns {string} Sanitized string
 */
export function sanitizeInput(str) {
  if (typeof str !== 'string') return ''
  return str.trim().replace(/[<>]/g, '')
}

/**
 * Debounce function
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @returns {Function} Debounced function
 */
export function debounce(func, wait) {
  let timeout
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout)
      func(...args)
    }
    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
  }
}

/**
 * Formats date for display
 * @param {Date|string} date - Date to format
 * @returns {string} Formatted date string
 */
export function formatDate(date) {
  if (!date) return ''
  const d = new Date(date)
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

/**
 * Handles errors gracefully
 * @param {Error} error - Error object
 * @param {string} context - Context where error occurred
 * @returns {string} User-friendly error message
 */
export function handleError(error, context = 'operation') {
  console.error(`Error in ${context}:`, error)
  
  if (error.message.includes('unreachable') || error.message.includes('network')) {
    return 'Unable to connect to server. Please check your internet connection.'
  }
  
  if (error.message.includes('Failed to fetch')) {
    return 'Server is not responding. Please try again later.'
  }
  
  return error.message || `An error occurred during ${context}. Please try again.`
}

