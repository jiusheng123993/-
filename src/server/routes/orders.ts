import { Router } from 'express'
import { createOrder, getOrderById, getOrdersByUser, refundOrder, orderService } from '../services/orderService'
import type { CreateOrderRequest } from '../types'

export function createOrdersRouter(): Router {
  const router = Router()

  router.post('/', (req, res) => {
    try {
      const result = createOrder(req.body as CreateOrderRequest)
      res.json(result)
    } catch (error) {
      res.status(400).json({ error: (error as Error).message })
    }
  })

  router.get('/:id', (req, res) => {
    try {
      const order = getOrderById(req.params.id)
      if (!order) {
        res.status(404).json({ error: 'Order not found' })
        return
      }
      res.json(order)
    } catch (error) {
      res.status(500).json({ error: (error as Error).message })
    }
  })

  router.get('/user/:userId', (req, res) => {
    try {
      const orders = getOrdersByUser(req.params.userId)
      res.json(orders)
    } catch (error) {
      res.status(500).json({ error: (error as Error).message })
    }
  })

  router.post('/:id/refund', (req, res) => {
    try {
      const order = refundOrder(req.params.id)
      res.json(order)
    } catch (error) {
      res.status(400).json({ error: (error as Error).message })
    }
  })

  router.post('/:id/pay', (req, res) => {
    try {
      const { channelTradeNo } = req.body
      const order = orderService.getOrderById(req.params.id)
      if (!order) {
        res.status(404).json({ error: 'Order not found' })
        return
      }
      orderService.markAsPaid(req.params.id, channelTradeNo || 'mock-trade-no', 'mock receipt')
      res.json(orderService.getOrderById(req.params.id))
    } catch (error) {
      res.status(400).json({ error: (error as Error).message })
    }
  })

  return router
}
