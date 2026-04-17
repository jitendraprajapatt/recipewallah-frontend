import axios from 'axios'

const RENDER_BASE_URL = (import.meta.env.VITE_API_RENDER_URL ?? '').trim().replace(/\/+$/, '')
const VERCEL_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? '').trim().replace(/\/+$/, '')

/**
 * Client for general API calls routed to Vercel.
 */
export const vercelClient = axios.create({
  baseURL: VERCEL_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

/**
 * Client for APK and Release management routed to Render.
 */
export const renderClient = axios.create({
  baseURL: RENDER_BASE_URL,
})

// Debugging interceptor
const addLogging = (client, name) => {
  client.interceptors.request.use((config) => {
    if (import.meta.env.DEV) {
      console.log(`[API ${name}] ${config.method?.toUpperCase()} ${config.url}`)
    }
    return config
  })
}

addLogging(vercelClient, 'VERCEL')
addLogging(renderClient, 'RENDER')
