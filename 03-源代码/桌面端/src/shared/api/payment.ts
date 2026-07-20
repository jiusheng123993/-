import type { CreateOrderRequest, CreateOrderResponse, OrderDetailResponse } from '../server/types'
import { createAuthHeaders, type AuthSession } from '../auth/devAuthSession'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000'

function createJsonHeaders(authSession: AuthSession): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    ...createAuthHeaders(authSession)
  }
}

async function readError(response: Response, fallback: string): Promise<string> {
  const error = await response.json().catch(() => ({ error: fallback, message: fallback }))
  return error.error || error.message || fallback
}

export async function createOrder(
  request: CreateOrderRequest,
  authSession: AuthSession
): Promise<CreateOrderResponse> {
  const response = await fetch(`${API_BASE}/api/orders`, {
    method: 'POST',
    headers: createJsonHeaders(authSession),
    body: JSON.stringify(request)
  })

  if (!response.ok) {
    throw new Error(await readError(response, 'Failed to create order'))
  }

  return response.json()
}

export async function getOrder(
  orderId: string,
  authSession: AuthSession
): Promise<OrderDetailResponse> {
  const response = await fetch(`${API_BASE}/api/orders/${orderId}`, {
    headers: createAuthHeaders(authSession)
  })
  if (!response.ok) {
    throw new Error(await readError(response, 'Failed to get order'))
  }
  return response.json()
}

export async function getUserOrders(
  userId: string,
  authSession: AuthSession
): Promise<OrderDetailResponse[]> {
  const response = await fetch(`${API_BASE}/api/orders/user/${userId}`, {
    headers: createAuthHeaders(authSession)
  })
  if (!response.ok) {
    throw new Error(await readError(response, 'Failed to get orders'))
  }
  return response.json()
}

export async function refundOrder(
  orderId: string,
  authSession: AuthSession
): Promise<OrderDetailResponse> {
  const response = await fetch(`${API_BASE}/api/orders/${orderId}/refund`, {
    method: 'POST',
    headers: createJsonHeaders(authSession)
  })
  if (!response.ok) {
    throw new Error(await readError(response, 'Failed to refund order'))
  }
  return response.json()
}
