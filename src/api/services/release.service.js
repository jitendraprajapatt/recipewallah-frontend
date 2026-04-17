import { vercelClient, renderClient } from '../client.js'

/**
 * Fetches the most recent app release metadata.
 */
export async function fetchLatestRelease() {
  const response = await vercelClient.get('/api/release')
  return response.data?.release ?? null
}

/**
 * Uploads a new APK release with progress monitoring.
 */
export async function uploadRelease({ token, release, file, onProgress }) {
  const formData = new FormData()
  formData.append('version', release.version)
  formData.append('platform', release.platform)
  formData.append('releaseNotes', release.releaseNotes)
  formData.append('directDownloadUrl', release.directDownloadUrl)
  formData.append('playStoreUrl', release.playStoreUrl)
  formData.append('appStoreUrl', release.appStoreUrl)

  if (file) {
    formData.append('appFile', file)
  }

  const response = await renderClient.post('/api/release', formData, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'multipart/form-data',
    },
    onUploadProgress: (progressEvent) => {
      if (onProgress && progressEvent.total) {
        const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total)
        onProgress(progress)
      }
    },
  })

  return response.data?.release ?? null
}

/**
 * Deletes the APK file from the current release.
 */
export async function deleteUploadedApk(token) {
  const response = await renderClient.delete('/api/release/apk', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  return {
    release: response.data?.release ?? null,
    removedFile: Boolean(response.data?.removedFile),
  }
}

/**
 * Fetches the audit history of app releases.
 */
export async function fetchAdminHistory(token, options = {}) {
  const limit = Number.isFinite(options.limit) ? Number(options.limit) : 25
  const response = await vercelClient.get(`/api/admin/history`, {
    params: { limit },
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  return response.data?.history ?? []
}
