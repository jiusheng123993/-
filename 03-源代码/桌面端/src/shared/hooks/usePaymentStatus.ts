import { useEffect, useState } from 'react'
import { paymentWebSocket } from '../services/websocket'

interface PaymentStatus {
  orderId: string
  status: 'pending' | 'paid' | 'failed' | 'refunded'
  tradeNo?: string
}

export function usePaymentStatus(orderId: string | undefined) {
  const [status, setStatus] = useState<PaymentStatus | null>(null)

  useEffect(() => {
    if (!orderId) return

    const unsubscribe = paymentWebSocket.onPaymentStatus((data) => {
      if (data.orderId === orderId) {
        setStatus({
          orderId: data.orderId,
          status: data.status,
          tradeNo: data.tradeNo
        })
      }
    })

    return () => unsubscribe()
  }, [orderId])

  return status
}
