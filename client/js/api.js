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

