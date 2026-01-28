// Application constants

export const STORAGE_KEYS = {
  CURRENT_USER: 'trainhub_current_v1',
}

export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  SIGNUP: '/signup',
  INVENTORY: '/inventory',
  TRAINING: '/training',
  TRAINING_MODULES: '/training/modules',
  TRAINING_VIDEOS: '/training/videos',
}

export const API_ENDPOINTS = {
  SIGNUP: '/api/signup',
  LOGIN: '/api/login',
  USER: '/api/user',
}

export const VALIDATION = {
  MIN_PASSWORD_LENGTH: 6,
  MAX_PASSWORD_LENGTH: 128,
  MIN_NAME_LENGTH: 2,
  MAX_NAME_LENGTH: 100,
  MAX_INVENTORY_ITEMS: 1000,
}

export const MESSAGES = {
  SIGNUP_SUCCESS: 'Account created successfully!',
  LOGIN_SUCCESS: 'Signed in successfully',
  LOGOUT_SUCCESS: 'Signed out successfully',
  ITEM_ADDED: 'Item added successfully',
  ITEM_REMOVED: 'Item removed',
  UPDATE_SUCCESS: 'Updated successfully',
  GENERIC_ERROR: 'An error occurred. Please try again.',
  NETWORK_ERROR: 'Unable to connect to server. Please check your connection.',
}

