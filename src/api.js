const rawApiBaseUrl = (import.meta.env.VITE_API_BASE_URL ?? 'https://recipewallah-backend.onrender.com').trim()
const API_BASE_URL = rawApiBaseUrl.replace(/\/+$/, '')
const SESSION_STORAGE_KEY = 'recipewallah-admin-session'

function buildUrl(pathname) {
  if (!pathname) {
    return API_BASE_URL
  }

  const path = pathname.startsWith('/') ? pathname : `/${pathname}`
  return `${API_BASE_URL}${path}`
}

async function parseJsonResponse(response) {
  const contentType = response.headers.get('content-type') ?? ''
  if (!contentType.includes('application/json')) {
    return null
  }

  try {
    return await response.json()
  } catch {
    return null
  }
}

function createRequestError(status, payload) {
  const message = payload?.message ?? `Request failed with status ${status}.`
  const error = new Error(message)
  error.status = status
  error.payload = payload
  return error
}

export async function fetchLatestRelease() {
  const response = await fetch(buildUrl('/api/release'))
  const payload = await parseJsonResponse(response)

  if (!response.ok) {
    throw createRequestError(response.status, payload)
  }

  return payload?.release ?? null
}

export async function loginAdmin(credentials) {
  const login = String(credentials.email ?? credentials.login ?? '').trim()

  const response = await fetch(buildUrl('/api/auth/login'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      login,
      email: login,
      password: credentials.password,
    }),
  })

  const payload = await parseJsonResponse(response)

  if (!response.ok) {
    throw createRequestError(response.status, payload)
  }

  if (!payload?.token || !payload?.user?.email) {
    throw new Error('Invalid login response from server.')
  }

  return {
    token: payload.token,
    user: {
      email: payload.user.email,
    },
  }
}

function readXhrJson(xhr) {
  if (xhr.responseType === 'json' && xhr.response) {
    return xhr.response
  }

  if (!xhr.responseText) {
    return null
  }

  try {
    return JSON.parse(xhr.responseText)
  } catch {
    return null
  }
}

export function uploadRelease({ token, release, file, onProgress }) {
  return new Promise((resolve, reject) => {
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

    const xhr = new XMLHttpRequest()
    xhr.open('POST', buildUrl('/api/release'))
    xhr.responseType = 'json'
    xhr.setRequestHeader('Authorization', `Bearer ${token}`)

    xhr.upload.onprogress = (event) => {
      if (!onProgress || !event.lengthComputable) {
        return
      }

      const progress = Math.round((event.loaded / event.total) * 100)
      onProgress(progress)
    }

    xhr.onload = () => {
      const payload = readXhrJson(xhr)

      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(payload?.release ?? null)
        return
      }

      reject(createRequestError(xhr.status, payload))
    }

    xhr.onerror = () => {
      reject(new Error('Network error. Could not reach API server.'))
    }

    xhr.send(formData)
  })
}

export async function deleteUploadedApk(token) {
  const response = await fetch(buildUrl('/api/release/apk'), {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  const payload = await parseJsonResponse(response)

  if (!response.ok) {
    throw createRequestError(response.status, payload)
  }

  return {
    release: payload?.release ?? null,
    removedFile: Boolean(payload?.removedFile),
  }
}

export async function fetchAdminHistory(token, options = {}) {
  const limit = Number.isFinite(options.limit) ? Number(options.limit) : 25
  const response = await fetch(buildUrl(`/api/admin/history?limit=${limit}`), {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  const payload = await parseJsonResponse(response)

  if (!response.ok) {
    throw createRequestError(response.status, payload)
  }

  return payload?.history ?? []
}

export function getStoredSession() {
  const rawValue = window.localStorage.getItem(SESSION_STORAGE_KEY)
  if (!rawValue) {
    return null
  }

  try {
    const parsedValue = JSON.parse(rawValue)

    if (!parsedValue?.token || !parsedValue?.user?.email) {
      return null
    }

    return {
      token: parsedValue.token,
      user: {
        email: parsedValue.user.email,
      },
    }
  } catch {
    return null
  }
}

export function storeSession(session) {
  window.localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session))
}

export function clearStoredSession() {
  window.localStorage.removeItem(SESSION_STORAGE_KEY)
}

export { API_BASE_URL }
