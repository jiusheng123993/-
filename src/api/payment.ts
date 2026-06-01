import type { CreateOrderRequest, CreateOrderResponse, OrderDetailResponse } from '../server/types'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000'

export async function createOrder(request: CreateOrderRequest): Promise<CreateOrderResponse> {
  const response = await fetch(`${API_BASE}/api/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request)
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Failed to create order' }))
    throw new Error(error.message || 'Failed to create order')
  }

  return response.json()
}

export async function getOrder(orderId: string): Promise<OrderDetailResponse> {
  const response = await fetch(`${API_BASE}/api/orders/${orderId}`)
  if (!response.ok) {
    throw new Error('Failed to get order')
  }
  return response.json()
}

export async function getUserOrders(userId: string): Promise<OrderDetailResponse[]> {
  const response = await fetch(`${API_BASE}/api/orders/user/${userId}`)
  if (!response.ok) {
    throw new Error('Failed to get orders')
  }
  return response.json()
}
