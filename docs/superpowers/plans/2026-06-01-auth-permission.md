# 鉴权权限模块 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为订单、退款、订单查询和开发支付确认接口加入轻量 Bearer Token 鉴权，阻止横向越权与模拟支付滥用。

**Architecture:** 新增独立 `src/server/auth` 模块解析身份并注入 `req.auth`，订单路由只依赖统一 `AuthContext` 做资源级授权，订单服务保持纯业务状态机。dev token 作为临时 Auth Provider，后续可替换为 JWT verifier。

**Tech Stack:** TypeScript, Express, Vitest, Node.js, existing order service.

---

## File Structure

- Create: `src/server/auth/authTypes.ts`
  - 定义 `AuthRole`、`AuthContext`、`AuthenticatedRequest`。
- Create: `src/server/auth/authMiddleware.ts`
  - 实现 dev Bearer token 解析、`requireAuth`、`isAdmin`、`canAccessUserResource`。
- Create: `src/server/auth/authMiddleware.test.ts`
  - 覆盖缺失 token、非法 token、user/admin token、资源授权工具。
- Modify: `src/server/routes/orders.ts`
  - 对订单创建、查询、用户订单列表、退款、开发支付确认接口加入 `requireAuth` 与资源级授权。
- Modify: `src/server/routes/orders.test.ts`
  - 补齐鉴权上下文测试：401、403、本人、admin、生产禁用、状态边界。

---

### Task 1: Auth Types

**Files:**
- Create: `src/server/auth/authTypes.ts`

- [x] **Step 1: Create auth types file**

Create `src/server/auth/authTypes.ts`:

```ts
import type { Request } from 'express'

export type AuthRole = 'user' | 'admin'

export interface AuthContext {
  userId: string
  role: AuthRole
}

export interface AuthenticatedRequest extends Request {
  auth?: AuthContext
}
```

- [x] **Step 2: Commit**

```bash
git add src/server/auth/authTypes.ts
git commit -m "feat(auth): add auth context types"
```

---

### Task 2: Auth Middleware Tests

**Files:**
- Create: `src/server/auth/authMiddleware.test.ts`

- [x] **Step 1: Write failing tests**

Create `src/server/auth/authMiddleware.test.ts`:

```ts
import { describe, it, expect, vi } from 'vitest'
import { parseBearerToken, requireAuth, isAdmin, canAccessUserResource } from './authMiddleware'
import type { AuthenticatedRequest } from './authTypes'

function createReq(authorization?: string): AuthenticatedRequest {
  return {
    headers: authorization ? { authorization } : {}
  } as AuthenticatedRequest
}

function createRes() {
  const res = {
    statusCode: 200,
    body: undefined as unknown,
    status(code: number) {
      this.statusCode = code
      return this
    },
    json(body: unknown) {
      this.body = body
      return this
    }
  }
  return res
}

describe('authMiddleware', () => {
  describe('parseBearerToken', () => {
    it('parses user dev token', () => {
      expect(parseBearerToken('Bearer dev-user:user-123')).toEqual({
        userId: 'user-123',
        role: 'user'
      })
    })

    it('parses admin dev token', () => {
      expect(parseBearerToken('Bearer dev-admin:admin-001')).toEqual({
        userId: 'admin-001',
        role: 'admin'
      })
    })

    it('returns undefined for missing header', () => {
      expect(parseBearerToken(undefined)).toBeUndefined()
    })

    it('returns undefined for malformed bearer format', () => {
      expect(parseBearerToken('Basic dev-user:user-123')).toBeUndefined()
    })

    it('returns undefined for unsafe user id', () => {
      expect(parseBearerToken('Bearer dev-user:../evil')).toBeUndefined()
    })

    it('returns undefined for unsupported token', () => {
      expect(parseBearerToken('Bearer jwt-token')).toBeUndefined()
    })
  })

  describe('requireAuth', () => {
    it('injects auth and calls next for valid token', () => {
      const req = createReq('Bearer dev-user:user-123')
      const res = createRes()
      const next = vi.fn()

      requireAuth(req, res as never, next)

      expect(req.auth).toEqual({ userId: 'user-123', role: 'user' })
      expect(next).toHaveBeenCalledTimes(1)
    })

    it('returns 401 for missing token', () => {
      const req = createReq()
      const res = createRes()
      const next = vi.fn()

      requireAuth(req, res as never, next)

      expect(res.statusCode).toBe(401)
      expect(res.body).toEqual({ error: 'Unauthorized' })
      expect(next).not.toHaveBeenCalled()
    })
  })

  describe('authorization helpers', () => {
    it('detects admin role', () => {
      expect(isAdmin({ userId: 'admin-001', role: 'admin' })).toBe(true)
      expect(isAdmin({ userId: 'user-123', role: 'user' })).toBe(false)
    })

    it('allows same user resource access', () => {
      expect(canAccessUserResource({ userId: 'user-123', role: 'user' }, 'user-123')).toBe(true)
    })

    it('denies other user resource access', () => {
      expect(canAccessUserResource({ userId: 'user-123', role: 'user' }, 'user-456')).toBe(false)
    })

    it('allows admin resource access', () => {
      expect(canAccessUserResource({ userId: 'admin-001', role: 'admin' }, 'user-456')).toBe(true)
    })
  })
})
```

- [x] **Step 2: Run tests and verify failure**

Run:

```bash
npm run test -- src/server/auth/authMiddleware.test.ts
```

Expected: fail because `authMiddleware.ts` does not exist.

---

### Task 3: Auth Middleware Implementation

**Files:**
- Create: `src/server/auth/authMiddleware.ts`

- [x] **Step 1: Implement auth middleware**

Create `src/server/auth/authMiddleware.ts`:

```ts
import type { Response, NextFunction } from 'express'
import type { AuthContext, AuthenticatedRequest } from './authTypes'

const TOKEN_PATTERN = /^dev-(user|admin):([a-zA-Z0-9_-]{1,64})$/

export function parseBearerToken(header: string | undefined): AuthContext | undefined {
  if (!header || typeof header !== 'string') return undefined
  const [scheme, token] = header.split(' ')
  if (scheme !== 'Bearer' || !token) return undefined

  const match = TOKEN_PATTERN.exec(token)
  if (!match) return undefined

  return {
    role: match[1] === 'admin' ? 'admin' : 'user',
    userId: match[2]
  }
}

export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const authorization = req.headers.authorization
  const auth = parseBearerToken(Array.isArray(authorization) ? authorization[0] : authorization)

  if (!auth) {
    res.status(401).json({ error: 'Unauthorized' })
    return
  }

  req.auth = auth
  next()
}

export function isAdmin(auth: AuthContext | undefined): boolean {
  return auth?.role === 'admin'
}

export function canAccessUserResource(auth: AuthContext | undefined, targetUserId: string): boolean {
  if (!auth) return false
  return auth.role === 'admin' || auth.userId === targetUserId
}
```

- [x] **Step 2: Run auth tests**

Run:

```bash
npm run test -- src/server/auth/authMiddleware.test.ts
```

Expected: all auth middleware tests pass.

- [x] **Step 3: Commit**

```bash
git add src/server/auth/authMiddleware.ts src/server/auth/authMiddleware.test.ts
git commit -m "feat(auth): add dev bearer auth middleware"
```

---

### Task 4: Orders Router Authorization Tests

**Files:**
- Modify: `src/server/routes/orders.test.ts`

- [x] **Step 1: Update route test helper to support headers**

Modify `MockReq` in `src/server/routes/orders.test.ts`:

```ts
interface MockReq {
  body?: Record<string, unknown>
  params?: Record<string, string>
  headers?: Record<string, string>
}
```

- [x] **Step 2: Add authorization tests**

Add this describe block before `Route registration`:

```ts
  describe('authorization', () => {
    it('should reject missing auth when creating order', async () => {
      const handler = findHandler('post', '/')
      const req: MockReq = { body: { userId: 'user-1', productId: 'study_monthly', channel: 'wechat' }, headers: {} }
      const res = createMockRes()
      await handler(req, res)

      expect(res.statusCode).toBe(401)
    })

    it('should reject user creating order for another user', async () => {
      const handler = findHandler('post', '/')
      const req: MockReq = {
        body: { userId: 'user-2', productId: 'study_monthly', channel: 'wechat' },
        headers: { authorization: 'Bearer dev-user:user-1' }
      }
      const res = createMockRes()
      await handler(req, res)

      expect(res.statusCode).toBe(403)
    })

    it('should allow admin creating order for another user', async () => {
      vi.mocked(mockOrderModule.createOrder).mockReturnValueOnce({
        orderId: 'order-1', amount: 1800, channel: 'wechat', status: 'pending', createdAt: 'x', paymentParams: {}
      })
      const handler = findHandler('post', '/')
      const req: MockReq = {
        body: { userId: 'user-2', productId: 'study_monthly', channel: 'wechat' },
        headers: { authorization: 'Bearer dev-admin:admin-1' }
      }
      const res = createMockRes()
      await handler(req, res)

      expect(res.statusCode).toBe(200)
    })

    it('should reject user querying another user order', async () => {
      vi.mocked(mockOrderModule.getOrderById).mockReturnValueOnce({
        id: VALID_ORDER_ID, userId: 'user-2', productId: 'p1', amount: 100, channel: 'wechat', status: 'paid', createdAt: 'x'
      })
      const handler = findHandler('get', '/:id')
      const req: MockReq = { params: { id: VALID_ORDER_ID }, headers: { authorization: 'Bearer dev-user:user-1' } }
      const res = createMockRes()
      await handler(req, res)

      expect(res.statusCode).toBe(403)
    })

    it('should allow admin querying any order', async () => {
      vi.mocked(mockOrderModule.getOrderById).mockReturnValueOnce({
        id: VALID_ORDER_ID, userId: 'user-2', productId: 'p1', amount: 100, channel: 'wechat', status: 'paid', createdAt: 'x'
      })
      const handler = findHandler('get', '/:id')
      const req: MockReq = { params: { id: VALID_ORDER_ID }, headers: { authorization: 'Bearer dev-admin:admin-1' } }
      const res = createMockRes()
      await handler(req, res)

      expect(res.statusCode).toBe(200)
    })

    it('should reject user listing another user orders', async () => {
      const handler = findHandler('get', '/user/:userId')
      const req: MockReq = { params: { userId: 'user-2' }, headers: { authorization: 'Bearer dev-user:user-1' } }
      const res = createMockRes()
      await handler(req, res)

      expect(res.statusCode).toBe(403)
    })

    it('should reject non-admin dev pay endpoint', async () => {
      vi.mocked(mockOrderModule.orderService.getOrderById).mockReturnValueOnce({
        id: VALID_ORDER_ID, userId: 'user-1', productId: 'p1', amount: 100, channel: 'wechat', status: 'pending', createdAt: 'x'
      })
      const handler = findHandler('post', '/:id/pay')
      const req: MockReq = { params: { id: VALID_ORDER_ID }, body: {}, headers: { authorization: 'Bearer dev-user:user-1' } }
      const res = createMockRes()
      await handler(req, res)

      expect(res.statusCode).toBe(403)
    })
  })
```

- [x] **Step 3: Run tests and verify failure**

Run:

```bash
npm run test -- src/server/routes/orders.test.ts
```

Expected: fail because route handlers do not use `requireAuth` and authorization helpers yet.

---

### Task 5: Orders Router Authorization Implementation

**Files:**
- Modify: `src/server/routes/orders.ts`

- [x] **Step 1: Import auth helpers**

Add imports:

```ts
import { requireAuth, canAccessUserResource, isAdmin } from '../auth/authMiddleware'
import type { AuthenticatedRequest } from '../auth/authTypes'
```

- [x] **Step 2: Apply requireAuth to all sensitive routes**

Change route registrations from:

```ts
router.post('/', asyncHandler((req, res) => {
```

to:

```ts
router.post('/', requireAuth, asyncHandler((req: AuthenticatedRequest, res) => {
```

Apply the same pattern to:

```ts
router.get('/:id', requireAuth, asyncHandler((req: AuthenticatedRequest, res) => {
router.get('/user/:userId', requireAuth, asyncHandler((req: AuthenticatedRequest, res) => {
router.post('/:id/refund', requireAuth, asyncHandler((req: AuthenticatedRequest, res) => {
router.post('/:id/pay', requireAuth, asyncHandler((req: AuthenticatedRequest, res) => {
```

- [x] **Step 3: Add create order user ownership check**

After body validation and before `createOrder`:

```ts
    if (!canAccessUserResource(req.auth, userId)) {
      safeError(res, 403, 'Forbidden')
      return
    }
```

- [x] **Step 4: Add order detail ownership check**

After order not found check:

```ts
    if (!canAccessUserResource(req.auth, order.userId)) {
      safeError(res, 403, 'Forbidden')
      return
    }
```

- [x] **Step 5: Add user list ownership check**

Before reading orders:

```ts
    if (!canAccessUserResource(req.auth, req.params.userId)) {
      safeError(res, 403, 'Forbidden')
      return
    }
```

- [x] **Step 6: Add refund ownership check**

After order not found check and before status check:

```ts
    if (!canAccessUserResource(req.auth, order.userId)) {
      safeError(res, 403, 'Forbidden')
      return
    }
```

- [x] **Step 7: Restrict dev pay endpoint to admin**

After production check and before order id validation:

```ts
    if (!isAdmin(req.auth)) {
      safeError(res, 403, 'Forbidden')
      return
    }
```

- [x] **Step 8: Run route tests**

Run:

```bash
npm run test -- src/server/routes/orders.test.ts
```

Expected: all orders route tests pass after updating existing tests with Authorization headers.

- [ ] **Step 9: Commit**

```bash
git add src/server/routes/orders.ts src/server/routes/orders.test.ts
git commit -m "fix(auth): enforce order resource permissions"
```

---

### Task 6: Update Existing Orders Tests For Auth Headers

**Files:**
- Modify: `src/server/routes/orders.test.ts`

- [ ] **Step 1: Add helper for auth headers**

Add below `VALID_ORDER_ID`:

```ts
const userAuth = (userId = 'user-1') => ({ authorization: `Bearer dev-user:${userId}` })
const adminAuth = (adminId = 'admin-1') => ({ authorization: `Bearer dev-admin:${adminId}` })
```

- [ ] **Step 2: Update successful and parameter validation requests**

For tests that should reach parameter validation or success, add appropriate `headers`:

```ts
headers: userAuth('user-1')
```

For admin cross-user creation, use:

```ts
headers: adminAuth()
```

For refund success and same-user order read, use:

```ts
headers: userAuth('u1')
```

- [ ] **Step 3: Run tests**

Run:

```bash
npm run test -- src/server/routes/orders.test.ts
```

Expected: all route tests pass.

- [ ] **Step 4: Commit if Task 5 did not already include changes**

```bash
git add src/server/routes/orders.test.ts
git commit -m "test(auth): update order route tests for auth"
```

---

### Task 7: Full Verification

**Files:**
- No direct file changes expected.

- [x] **Step 1: Run lint**

```bash
npm run lint
```

Expected: exit code 0. Existing unrelated warning in `ExpandableCard.tsx` may remain.

- [x] **Step 2: Run all tests**

```bash
npm run test
```

Expected: all tests pass.

- [x] **Step 3: Run build**

```bash
npm run build
```

Expected: TypeScript build and Vite build pass.

- [ ] **Step 4: Start server for API smoke test**

```bash
npm run server
```

Expected: server prints `Server running on http://localhost:3000`.

- [ ] **Step 5: Smoke test unauthorized request**

```bash
curl -UseBasicParsing -Method POST -ContentType "application/json" -Body '{"userId":"user-1","productId":"study_monthly","channel":"wechat"}' http://localhost:3000/api/orders
```

Expected: HTTP 401.

- [ ] **Step 6: Smoke test authorized create order**

```bash
curl -UseBasicParsing -Headers @{Authorization="Bearer dev-user:user-1"} -Method POST -ContentType "application/json" -Body '{"userId":"user-1","productId":"study_monthly","channel":"wechat"}' http://localhost:3000/api/orders
```

Expected: HTTP 200 with `orderId`.

- [ ] **Step 7: Final commit if verification caused changes**

```bash
git status
git add -A
git commit -m "chore(auth): verify permission module"
```

Only commit if there are actual changes.

---

## Self-Review

- Spec coverage: AuthContext、requireAuth、dev token、订单归属、admin 权限、生产禁用 `/pay`、401/403/400/404 测试均有任务覆盖。
- Placeholder scan: no TBD/TODO/implement later placeholders remain.
- Type consistency: `AuthContext.userId/role`、`AuthenticatedRequest.auth`、`parseBearerToken`、`requireAuth`、`isAdmin`、`canAccessUserResource` 命名一致。
- Scope: 单一权限模块，不引入完整登录系统，符合 YAGNI。
