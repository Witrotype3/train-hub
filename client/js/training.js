// Training management API client

import { apiGet, apiPost } from './api.js'

/**
 * Get all trainings
 */
export async function getTrainings() {
  try {
    const res = await apiGet('/trainings')
    if (res && res.ok) {
      return res.trainings || []
    }
    return []
  } catch (e) {
    console.error('getTrainings error', e)
    return []
  }
}

/**
 * Get a single training by ID
 */
export async function getTraining(id) {
  try {
    const res = await apiGet('/training', { id })
    if (res && res.ok) {
      return res.training
    }
    return null
  } catch (e) {
    console.error('getTraining error', e)
    return null
  }
}

/**
 * Create a new training
 */
export async function createTraining(email, training) {
  try {
    const res = await apiPost(`/trainings?email=${encodeURIComponent(email)}`, training)
    if (res && res.ok) {
      return { ok: true, training: res.training }
    }
    return { ok: false, error: res?.error || 'Failed to create training' }
  } catch (e) {
    console.error('createTraining error', e)
    return { ok: false, error: e.message || 'Failed to create training' }
  }
}

/**
 * Update a training
 */
export async function updateTraining(training) {
  try {
    const res = await apiPost('/training/update', training)
    if (res && res.ok) {
      return { ok: true, training: res.training }
    }
    return { ok: false, error: res?.error || 'Failed to update training' }
  } catch (e) {
    console.error('updateTraining error', e)
    return { ok: false, error: e.message || 'Failed to update training' }
  }
}

/**
 * Delete a training (moves to recycling bin)
 */
export async function deleteTraining(id, email) {
  try {
    const res = await apiPost('/training/delete', { id, email })
    return res
  } catch (e) {
    console.error('deleteTraining error', e)
    return { ok: false, error: e.message || 'Failed to delete training' }
  }
}

/**
 * Get deleted trainings (recycling bin)
 */
export async function getDeletedTrainings(email) {
  try {
    const res = await apiGet('/training/deleted', { email })
    if (res && res.ok) {
      return res.trainings || []
    }
    return []
  } catch (e) {
    console.error('getDeletedTrainings error', e)
    return []
  }
}

/**
 * Restore a training from recycling bin
 */
export async function restoreTraining(id, email) {
  try {
    const res = await apiPost('/training/restore', { id, email })
    return res
  } catch (e) {
    console.error('restoreTraining error', e)
    return { ok: false, error: e.message || 'Failed to restore training' }
  }
}

/**
 * Permanently delete a training
 */
export async function permanentDeleteTraining(id, email) {
  try {
    const res = await apiPost('/training/permanent-delete', { id, email })
    return res
  } catch (e) {
    console.error('permanentDeleteTraining error', e)
    return { ok: false, error: e.message || 'Failed to permanently delete training' }
  }
}

/**
 * Upload a video file
 */
export async function uploadVideo(file, email) {
  try {
    const formData = new FormData()
    formData.append('video', file)
    
    const res = await fetch(`/api/upload-video?email=${encodeURIComponent(email)}`, {
      method: 'POST',
      body: formData,
    })
    
    // Check if response is JSON
    const contentType = res.headers.get('content-type')
    if (!contentType || !contentType.includes('application/json')) {
      const text = await res.text()
      console.error('Non-JSON response from server:', text)
      return { ok: false, error: 'Server returned an invalid response. Please try again.' }
    }
    
    const data = await res.json()
    if (data && data.ok) {
      return { ok: true, video_url: data.video_url }
    }
    return { ok: false, error: data?.error || 'Failed to upload video' }
  } catch (e) {
    console.error('uploadVideo error', e)
    // Handle JSON parse errors specifically
    if (e.message && e.message.includes('JSON')) {
      return { ok: false, error: 'Server returned an invalid response. Please try again.' }
    }
    return { ok: false, error: e.message || 'Failed to upload video' }
  }
}

/**
 * Upload an image file (for thumbnails)
 */
export async function uploadImage(file, email) {
  try {
    const formData = new FormData()
    formData.append('image', file)
    
    const res = await fetch(`/api/upload-image?email=${encodeURIComponent(email)}`, {
      method: 'POST',
      body: formData,
    })
    
    // Check if response is JSON
    const contentType = res.headers.get('content-type')
    if (!contentType || !contentType.includes('application/json')) {
      const text = await res.text()
      console.error('Non-JSON response from server:', text)
      return { ok: false, error: 'Server returned an invalid response. Please try again.' }
    }
    
    const data = await res.json()
    if (data && data.ok) {
      return { ok: true, image_url: data.image_url }
    }
    return { ok: false, error: data?.error || 'Failed to upload image' }
  } catch (e) {
    console.error('uploadImage error', e)
    // Handle JSON parse errors specifically
    if (e.message && e.message.includes('JSON')) {
      return { ok: false, error: 'Server returned an invalid response. Please try again.' }
    }
    return { ok: false, error: e.message || 'Failed to upload image' }
  }
}

