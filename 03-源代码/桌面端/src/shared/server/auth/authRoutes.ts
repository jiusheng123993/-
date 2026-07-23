import { Router, type Request, type Response } from 'express'
import { getUserStore } from './userStore'
import { signAccessToken, signRefreshToken, verifyToken, getTokenExpiry } from './jwtService'
import type { AuthProviderKind } from '../../auth/authTypes'

const PHONE_PATTERN = /^1[3-9]\d{9}$/
const DISPLAY_NAME_MAX = 20

export function createAuthRouter(): Router {
  const router = Router()
  const userStore = getUserStore()

  router.post('/register', async (req: Request, res: Response) => {
    const { provider, code, phoneNumber, displayName, age } = req.body

    if (!provider || !['wechat', 'alipay', 'apple'].includes(provider)) {
      res.status(400).json({ error: '无效的登录方式' })
      return
    }

    if (!phoneNumber || !PHONE_PATTERN.test(phoneNumber)) {
      res.status(400).json({ error: '请输入有效的手机号' })
      return
    }

    if (!displayName || typeof displayName !== 'string' || displayName.trim().length === 0) {
      res.status(400).json({ error: '请输入昵称' })
      return
    }

    const trimmedName = displayName.trim().slice(0, DISPLAY_NAME_MAX)

    const existingPhone = await userStore.findByPhoneNumber(phoneNumber)
    if (existingPhone) {
      res.status(409).json({ error: '该手机号已注册' })
      return
    }

    const providerUserId = `${provider}-${code || Date.now().toString(36)}`

    const existingProvider = await userStore.findByProviderUserId(provider as AuthProviderKind, providerUserId)
    if (existingProvider) {
      res.status(409).json({ error: '该账号已注册' })
      return
    }

    const user = await userStore.createUser({
      provider: provider as AuthProviderKind,
      providerUserId,
      displayName: trimmedName,
      phoneNumber,
      age: typeof age === 'number' && age > 0 && age <= 150 ? age : undefined
    })

    const accessToken = signAccessToken(user.userId, user.role, user.provider)
    const refreshToken = signRefreshToken(user.userId, user.role, user.provider)
    const { accessExpiresIn } = getTokenExpiry()

    res.status(201).json({
      userId: user.userId,
      role: user.role,
      displayName: user.displayName,
      phoneNumber: user.phoneNumber,
      avatarUrl: user.avatarUrl,
      accessToken,
      refreshToken,
      expiresIn: accessExpiresIn
    })
  })

  router.post('/login', async (req: Request, res: Response) => {
    const { provider, code, phoneNumber } = req.body

    if (!provider || !['wechat', 'alipay', 'apple'].includes(provider)) {
      res.status(400).json({ error: '无效的登录方式' })
      return
    }

    const providerUserId = `${provider}-${code || Date.now().toString(36)}`

    let user = await userStore.findByProviderUserId(provider as AuthProviderKind, providerUserId)

    if (!user && phoneNumber) {
      user = await userStore.findByPhoneNumber(phoneNumber)
    }

    if (!user) {
      res.status(404).json({
        error: '用户未注册',
        needRegister: true,
        providerUserId
      })
      return
    }

    const accessToken = signAccessToken(user.userId, user.role, user.provider)
    const refreshToken = signRefreshToken(user.userId, user.role, user.provider)
    const { accessExpiresIn } = getTokenExpiry()

    res.json({
      userId: user.userId,
      role: user.role,
      displayName: user.displayName,
      phoneNumber: user.phoneNumber,
      avatarUrl: user.avatarUrl,
      accessToken,
      refreshToken,
      expiresIn: accessExpiresIn
    })
  })

  router.post('/refresh', async (req: Request, res: Response) => {
    const { refreshToken } = req.body

    if (!refreshToken) {
      res.status(400).json({ error: '缺少 refreshToken' })
      return
    }

    const payload = verifyToken(refreshToken)
    if (!payload) {
      res.status(401).json({ error: 'refreshToken 无效或已过期' })
      return
    }

    const user = await userStore.findByUserId(payload.userId)
    if (!user) {
      res.status(401).json({ error: '用户不存在' })
      return
    }

    const newAccessToken = signAccessToken(user.userId, user.role, user.provider)
    const newRefreshToken = signRefreshToken(user.userId, user.role, user.provider)
    const { accessExpiresIn } = getTokenExpiry()

    res.json({
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      expiresIn: accessExpiresIn
    })
  })

  router.post('/logout', (_req: Request, res: Response) => {
    res.json({ success: true })
  })

  router.get('/session', async (req: Request, res: Response) => {
    const authHeader = req.headers.authorization
    if (!authHeader) {
      res.status(401).json({ error: '未登录' })
      return
    }

    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader
    const payload = verifyToken(token)
    if (!payload) {
      res.status(401).json({ error: 'Token 无效或已过期' })
      return
    }

    const user = await userStore.findByUserId(payload.userId)
    if (!user) {
      res.status(401).json({ error: '用户不存在' })
      return
    }

    res.json({
      userId: user.userId,
      role: user.role,
      displayName: user.displayName,
      phoneNumber: user.phoneNumber,
      avatarUrl: user.avatarUrl,
      provider: user.provider
    })
  })

  router.post('/bind-device', async (req: Request, res: Response) => {
    const authHeader = req.headers.authorization
    if (!authHeader) {
      res.status(401).json({ error: '未登录' })
      return
    }

    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader
    const payload = verifyToken(token)
    if (!payload) {
      res.status(401).json({ error: 'Token 无效或已过期' })
      return
    }

    const { deviceName } = req.body
    if (!deviceName || typeof deviceName !== 'string') {
      res.status(400).json({ error: '缺少设备名称' })
      return
    }

    const device = await userStore.bindDevice(payload.userId, deviceName)
    if (!device) {
      res.status(404).json({ error: '用户不存在' })
      return
    }

    res.status(201).json(device)
  })

  router.get('/devices', async (req: Request, res: Response) => {
    const authHeader = req.headers.authorization
    if (!authHeader) {
      res.status(401).json({ error: '未登录' })
      return
    }

    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader
    const payload = verifyToken(token)
    if (!payload) {
      res.status(401).json({ error: 'Token 无效或已过期' })
      return
    }

    const devices = await userStore.getDevices(payload.userId)
    res.json(devices)
  })

  return router
}
