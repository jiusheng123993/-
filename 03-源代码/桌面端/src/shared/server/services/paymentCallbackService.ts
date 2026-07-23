import crypto from 'crypto'

export interface PaymentCallbackResult {
  success: boolean
  orderId: string
  tradeNo?: string
  error?: string
}

function isProduction(): boolean {
  return process.env.NODE_ENV === 'production'
}

function requireEnvVar(name: string): string {
  const value = process.env[name]
  if (!value && isProduction()) {
    throw new Error(`Missing required environment variable: ${name}`)
  }
  return value || ''
}

export async function handleWechatCallback(
  orderId: string,
  callbackData: Record<string, string>
): Promise<PaymentCallbackResult> {
  try {
    if (isProduction()) {
      const signature = callbackData.sign
      const expectedSign = generateWechatSign(callbackData)
      if (!signature || signature !== expectedSign) {
        return { success: false, orderId, error: 'Invalid signature' }
      }
    }

    const amount = parseInt(callbackData.total_fee || '0', 10)
    if (amount <= 0) {
      return { success: false, orderId, error: 'Invalid amount' }
    }

    if (isProduction()) {
      return {
        success: true,
        orderId,
        tradeNo: callbackData.transaction_id
      }
    }

    return {
      success: true,
      orderId,
      tradeNo: callbackData.transaction_id || `mock-wechat-trade-${orderId}-${Date.now().toString(36)}`
    }
  } catch (error) {
    return { success: false, orderId, error: (error as Error).message }
  }
}

export async function handleAlipayCallback(
  orderId: string,
  callbackData: Record<string, string>
): Promise<PaymentCallbackResult> {
  try {
    if (isProduction()) {
      const sign = callbackData.sign
      const signType = callbackData.sign_type || 'RSA2'
      if (!sign || !verifyAlipaySign(callbackData, sign, signType)) {
        return { success: false, orderId, error: 'Invalid signature' }
      }
    }

    const tradeStatus = callbackData.trade_status
    if (tradeStatus && tradeStatus !== 'TRADE_SUCCESS' && tradeStatus !== 'TRADE_FINISHED') {
      return { success: false, orderId, error: `Trade status: ${tradeStatus}` }
    }

    if (isProduction()) {
      return {
        success: true,
        orderId,
        tradeNo: callbackData.trade_no
      }
    }

    return {
      success: true,
      orderId,
      tradeNo: callbackData.trade_no || `mock-alipay-trade-${orderId}-${Date.now().toString(36)}`
    }
  } catch (error) {
    return { success: false, orderId, error: (error as Error).message }
  }
}

export async function handleAppleVerify(
  orderId: string,
  receipt: string
): Promise<PaymentCallbackResult> {
  try {
    if (isProduction()) {
      const verificationResult = await verifyAppleReceipt(receipt)
      if (!verificationResult.success) {
        return { success: false, orderId, error: verificationResult.error }
      }
      return { success: true, orderId, tradeNo: verificationResult.transactionId }
    }

    if (!receipt) {
      return { success: false, orderId, error: 'Missing receipt data' }
    }

    return {
      success: true,
      orderId,
      tradeNo: `mock-apple-trade-${orderId}-${Date.now().toString(36)}`
    }
  } catch (error) {
    return { success: false, orderId, error: (error as Error).message }
  }
}

function generateWechatSign(data: Record<string, string>): string {
  const apiKey = requireEnvVar('WECHAT_API_KEY')
  const sortedKeys = Object.keys(data).filter(k => k !== 'sign' && k !== 'sign_type').sort()
  const signStr = sortedKeys.map(k => `${k}=${data[k]}`).join('&') + `&key=${apiKey}`
  return crypto.createHash('md5').update(signStr, 'utf8').hexdigest('upper')
}

function verifyAlipaySign(data: Record<string, string>, sign: string, signType: string): boolean {
  const alipayPublicKey = requireEnvVar('ALIPAY_PUBLIC_KEY')
  if (!alipayPublicKey) return false

  const sortedKeys = Object.keys(data).filter(k => k !== 'sign' && k !== 'sign_type').sort()
  const signStr = sortedKeys.map(k => `${k}=${data[k]}`).join('&')

  try {
    const algorithm = signType === 'RSA2' ? 'RSA-SHA256' : 'RSA-SHA1'
    const verify = crypto.createVerify(algorithm)
    verify.update(signStr, 'utf8')
    return verify.verify(alipayPublicKey, sign, 'base64')
  } catch {
    return false
  }
}

async function verifyAppleReceipt(receipt: string): Promise<{ success: boolean; transactionId?: string; error?: string }> {
  const appleSharedSecret = requireEnvVar('APPLE_SHARED_SECRET')
  if (!appleSharedSecret) {
    return { success: false, error: 'Apple shared secret not configured' }
  }

  const isSandbox = process.env.APPLE_SANDBOX === 'true'
  const verifyUrl = isSandbox
    ? 'https://sandbox.itunes.apple.com/verifyReceipt'
    : 'https://buy.itunes.apple.com/verifyReceipt'

  try {
    const response = await fetch(verifyUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        'receipt-data': receipt,
        password: appleSharedSecret,
        'exclude-old-transactions': true
      })
    })

    const result = await response.json() as { status: number; receipt?: { in_app?: Array<{ transaction_id: string }> } }

    if (result.status === 0 && result.receipt?.in_app?.length) {
      const latestTransaction = result.receipt.in_app[result.receipt.in_app.length - 1]
      return { success: true, transactionId: latestTransaction.transaction_id }
    }

    if (result.status === 21007) {
      return verifyAppleReceiptWithSandbox(receipt, appleSharedSecret)
    }

    return { success: false, error: `Apple verification failed with status: ${result.status}` }
  } catch (error) {
    return { success: false, error: (error as Error).message }
  }
}

async function verifyAppleReceiptWithSandbox(receipt: string, sharedSecret: string): Promise<{ success: boolean; transactionId?: string; error?: string }> {
  try {
    const response = await fetch('https://sandbox.itunes.apple.com/verifyReceipt', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        'receipt-data': receipt,
        password: sharedSecret,
        'exclude-old-transactions': true
      })
    })

    const result = await response.json() as { status: number; receipt?: { in_app?: Array<{ transaction_id: string }> } }

    if (result.status === 0 && result.receipt?.in_app?.length) {
      const latestTransaction = result.receipt.in_app[result.receipt.in_app.length - 1]
      return { success: true, transactionId: latestTransaction.transaction_id }
    }

    return { success: false, error: `Apple sandbox verification failed with status: ${result.status}` }
  } catch (error) {
    return { success: false, error: (error as Error).message }
  }
}
