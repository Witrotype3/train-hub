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
 * Delete a training
 */
export async function deleteTraining(id) {
  try {
    const res = await apiPost('/training/delete', { id })
    return res
  } catch (e) {
    console.error('deleteTraining error', e)
    return { ok: false, error: e.message || 'Failed to delete training' }
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
    
    const data = await res.json()
    if (data && data.ok) {
      return { ok: true, video_url: data.video_url }
    }
    return { ok: false, error: data?.error || 'Failed to upload video' }
  } catch (e) {
    console.error('uploadVideo error', e)
    return { ok: false, error: e.message || 'Failed to upload video' }
  }
}

