import { apiClient } from '../../shared/api/client'

const BASE = '/api/v1/admin'

/** Drop empty params so URLs stay clean. */
function clean(params) {
  return Object.fromEntries(Object.entries(params).filter(([, v]) => v !== '' && v !== null && v !== undefined))
}

export async function fetchSubOrders(params) {
  const { data } = await apiClient.get(`${BASE}/sub-orders`, { params: clean(params) })
  return data
}
export async function fetchSubOrder(id) {
  const { data } = await apiClient.get(`${BASE}/sub-orders/${id}`)
  return data.sub_order
}
/** @param {{ id: number, version: number, lines: Array<{ sub_order_item_id: number, qty: number }> }} p */
export async function createChallan({ id, version, lines }) {
  const { data } = await apiClient.post(`${BASE}/sub-orders/${id}/challans`, { expected_version: version, lines })
  return data
}
export async function cancelSubOrderQty({ id, version, lines }) {
  const { data } = await apiClient.post(`${BASE}/sub-orders/${id}/cancel`, { expected_version: version, lines })
  return data
}

export async function fetchChallans(params) {
  const { data } = await apiClient.get(`${BASE}/challans`, { params: clean(params) })
  return data
}
export async function fetchChallan(id) {
  const { data } = await apiClient.get(`${BASE}/challans/${id}`)
  return data.challan
}
export async function retryPush({ pushId, confirmed }) {
  const { data } = await apiClient.post(`${BASE}/b2b-pushes/${pushId}/retry`, { confirmed_not_received: confirmed })
  return data.challan
}
export async function resolvePush({ pushId, recordId, note }) {
  const { data } = await apiClient.post(`${BASE}/b2b-pushes/${pushId}/resolve`, {
    b2c_order_record_id: recordId?.trim() || null,
    note: note?.trim() || null,
  })
  return data.challan
}

export async function fetchInvoices(params) {
  const { data } = await apiClient.get(`${BASE}/invoices`, { params: clean(params) })
  return data
}
export async function fetchInvoice(id) {
  const { data } = await apiClient.get(`${BASE}/invoices/${id}`)
  return data.invoice
}
export async function previewInvoice(challanIds) {
  const { data } = await apiClient.post(`${BASE}/invoices/preview`, { challan_ids: challanIds })
  return data.preview
}
export async function createInvoice(challanIds) {
  const { data } = await apiClient.post(`${BASE}/invoices`, { challan_ids: challanIds })
  return data.invoice
}
