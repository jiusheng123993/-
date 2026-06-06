export interface PaymentCallbackResult {
  success: boolean
  orderId: string
  tradeNo?: string
  error?: string
}

export async function handleWechatCallback(
  orderId: string,
  callbackData: Record<string, string>
): Promise<PaymentCallbackResult> {
  try {
    const signature = callbackData.sign
    const expectedSign = generateWechatSign(callbackData)
    
    if (signature !== expectedSign) {
      return {
        success: false,
        orderId,
        error: 'Invalid signature'
      }
    }

    const amount = parseInt(callbackData.total_fee || '0', 10)
    if (amount <= 0) {
      return {
        success: false,
        orderId,
        error: 'Invalid amount'
      }
    }

    return {
      success: true,
      orderId,
      tradeNo: callbackData.transaction_id
    }
  } catch (error) {
    return {
      success: false,
      orderId,
      error: (error as Error).message
    }
  }
}

export async function handleAlipayCallback(
  orderId: string,
  callbackData: Record<string, string>
): Promise<PaymentCallbackResult> {
  try {
    const sign = callbackData.sign
    const signType = callbackData.sign_type
    
    if (!verifyAlipaySign(callbackData, sign, signType)) {
      return {
        success: false,
        orderId,
        error: 'Invalid signature'
      }
    }

    const tradeStatus = callbackData.trade_status
    if (tradeStatus !== 'TRADE_SUCCESS' && tradeStatus !== 'TRADE_FINISHED') {
      return {
        success: false,
        orderId,
        error: `Trade status: ${tradeStatus}`
      }
    }

    return {
      success: true,
      orderId,
      tradeNo: callbackData.trade_no
    }
  } catch (error) {
    return {
      success: false,
      orderId,
      error: (error as Error).message
    }
  }
}

export async function handleAppleVerify(
  orderId: string,
  receipt: string
): Promise<PaymentCallbackResult> {
  try {
    const verificationResult = await verifyAppleReceipt(receipt)
    
    if (!verificationResult.success) {
      return {
        success: false,
        orderId,
        error: verificationResult.error
      }
    }

    return {
      success: true,
      orderId,
      tradeNo: verificationResult.transactionId
    }
  } catch (error) {
    return {
      success: false,
      orderId,
      error: (error as Error).message
    }
  }
}

function generateWechatSign(data: Record<string, string>): string {
  const sortedKeys = Object.keys(data).filter(k => k !== 'sign' && k !== 'sign_type').sort()
  const signStr = sortedKeys.map(k => `${k}=${data[k]}`).join('&') + `&key=${process.env.WECHAT_API_KEY}`
  return signStr
}

function verifyAlipaySign(_data: Record<string, string>, _sign: string, _signType: string): boolean {
  console.warn('[SECURITY] Alipay signature verification not implemented - rejecting callback')
  return false
}

async function verifyAppleReceipt(_receipt: string): Promise<{ success: boolean; transactionId?: string; error?: string }> {
  console.warn('[SECURITY] Apple receipt verification not implemented - rejecting receipt')
  return {
    success: false,
    error: 'Apple receipt verification not implemented'
  }
}
