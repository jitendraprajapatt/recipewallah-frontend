const SESSION_STORAGE_KEY = 'recipewallah-admin-session'

/**
 * Retrieves the session from localStorage.
 */
export function getStoredSession() {
  const rawValue = window.localStorage.getItem(SESSION_STORAGE_KEY)
  if (!rawValue) return null

  try {
    const parsedValue = JSON.parse(rawValue)
    if (!parsedValue?.token || !parsedValue?.user?.email) return null
    return parsedValue
  } catch {
    return null
  }
}

/**
 * Saves the session to localStorage.
 */
export function storeSession(session) {
  window.localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session))
}

/**
 * Removes the session from localStorage.
 */
export function clearStoredSession() {
  window.localStorage.removeItem(SESSION_STORAGE_KEY)
}
