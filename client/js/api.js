// Centralized API client for all server communication

const API_BASE = '/api'

/**
 * Makes an API request and returns the parsed JSON response
 * @param {string} endpoint - API endpoint (e.g., '/signup')
 * @param {Object} options - Fetch options
 * @returns {Promise<Object>} Parsed JSON response
 */
async function apiRequest(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`
  const defaultOptions = {
    headers: {
      'Content-Type': 'application/json',
    },
  }

  const config = {
    ...defaultOptions,
    ...options,
    headers: {
      ...defaultOptions.headers,
      ...(options.headers || {}),
    },
  }

  try {
    const response = await fetch(url, config)

    // Check if response is JSON before parsing
    const contentType = response.headers.get('content-type')
    if (!contentType || !contentType.includes('application/json')) {
      const text = await response.text()
      console.error('Non-JSON response from server:', text.substring(0, 200))
      throw new Error('Server returned an invalid response. Please try again.')
    }

    const data = await response.json()

    if (!response.ok && !data.ok) {
      throw new Error(data.error || `HTTP ${response.status}`)
    }

    return data
  } catch (error) {
    if (error instanceof TypeError) {
      // Network error
      throw new Error('Server unreachable. Please check your connection.')
    }
    // Handle JSON parse errors
    if (error.message && error.message.includes('JSON')) {
      throw new Error('Server returned an invalid response. Please try again.')
    }
    throw error
  }
}

/**
 * POST request helper
 */
export async function apiPost(endpoint, body) {
  return apiRequest(endpoint, {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

/**
 * GET request helper
 */
export async function apiGet(endpoint, params = {}) {
  const queryString = new URLSearchParams(params).toString()
  const url = queryString ? `${endpoint}?${queryString}` : endpoint
  return apiRequest(url, {
    method: 'GET',
  })
}

/**
 * Lookup barcode product information
 */
export async function lookupBarcode(upc) {
  try {
    return await apiGet('/barcode-lookup', { upc })
  } catch (error) {
    console.error('Barcode lookup failed:', error)
    return { ok: false, error: error.message }
  }
}

