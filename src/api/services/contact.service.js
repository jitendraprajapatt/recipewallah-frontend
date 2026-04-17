import { vercelClient } from '../client.js'

/**
 * Submits a new contact query from the website.
 */
export async function submitContactQuery(data) {
  const response = await vercelClient.post('/api/contact', data)
  return response.data
}

/**
 * Fetches all contact queries for the admin dashboard.
 */
export async function fetchAdminQueries(token) {
  const response = await vercelClient.get('/api/admin/contacts', {
    headers: { Authorization: `Bearer ${token}` },
  })
  return response.data?.contacts ?? []
}

/**
 * Updates the status and admin message of a query.
 */
export async function updateQueryStatus(token, id, data) {
  const response = await vercelClient.patch(`/api/admin/contacts/${id}`, data, {
    headers: { Authorization: `Bearer ${token}` },
  })
  return response.data
}

/**
 * Deletes a contact query permanently.
 */
export async function deleteQuery(token, id) {
  const response = await vercelClient.delete(`/api/admin/contacts/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  return response.data
}
