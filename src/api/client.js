import axios from 'axios'

const RENDER_BASE_URL = (import.meta.env.VITE_API_RENDER_URL ?? '').trim().replace(/\/+$/, '')
const VERCEL_BASE_URL = (import.meta.env.VITE_AI_VERCEL_URL ?? '').trim().replace(/\/+$/, '')

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
 * Timeout increased to 15 minutes to allow for large APK uploads.
 */
export const renderClient = axios.create({
  baseURL: RENDER_BASE_URL,
  timeout: 15 * 60 * 1000, 
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
