import { vercelClient } from '../client.js'

/**
 * Handles administrator login.
 */
export async function loginAdmin(credentials) {
  const login = String(credentials.email ?? credentials.login ?? '').trim()
  
  const response = await vercelClient.post('/api/auth/login', {
    login,
    email: login,
    password: credentials.password,
  })

  const payload = response.data
  
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
