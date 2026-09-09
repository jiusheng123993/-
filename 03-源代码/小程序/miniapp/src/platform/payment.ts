/**
 * 平台适配器 - 支付模块
 * 小程序用 Taro.requestPayment（微信支付）
 * App 端用支付宝支付（H5/JSAPI）
 */
import Taro from '@tarojs/taro'
import { isWeapp } from './detector'

export interface PaymentParams {
  timeStamp: string
  nonceStr: string
  package: string
  signType: string
  paySign: string
}

export interface AlipayPaymentParams {
  orderInfo: string
}

/**
 * 发起微信支付（仅小程序）
 */
export async function requestWechatPayment(params: PaymentParams): Promise<boolean> {
  if (!isWeapp()) {
    throw new Error('微信支付仅支持微信小程序环境')
  }

  return new Promise((resolve, reject) => {
    Taro.requestPayment({
      timeStamp: params.timeStamp,
      nonceStr: params.nonceStr,
      package: params.package,
      signType: params.signType as 'RSA',
      paySign: params.paySign,
      success: () => resolve(true),
      fail: (err: any) => {
        if (err.errMsg?.includes('cancel')) {
          // 用户主动取消：resolve(false)，调用方按「已取消支付」提示
          resolve(false)
        } else {
          // 真实支付失败（签名/参数/网络）：reject 透传原因，调用方 toast err.message
          // （此前与 cancel 同体 resolve(false)，页面一律显示「已取消支付」误导排障）
          reject(new Error(`微信支付失败：${err.errMsg || '未知错误'}`))
        }
      },
    })
  })
}

/**
 * 发起支付宝支付（App/H5 端）
 * 通过后端获取 orderInfo，然后调用支付宝 JSAPI
 */
export async function requestAlipayPayment(orderInfo: string): Promise<boolean> {
  if (typeof (window as any).AlipayJSBridge === 'undefined') {
    throw new Error('支付宝 SDK 未加载')
  }

  return new Promise((resolve) => {
    (window as any).AlipayJSBridge.call(
      'tradePay',
      { tradeNO: orderInfo },
      (result: any) => {
        if (result.resultCode === '9000') {
          resolve(true)
        } else if (result.resultCode === '6001') {
          resolve(false)
        } else {
          resolve(false)
        }
      }
    )
  })
}

/**
 * 统一支付入口
 * 自动根据平台选择支付方式
 */
export async function requestPayment(
  wechatParams: PaymentParams | null,
  alipayOrderInfo?: string
): Promise<boolean> {
  if (isWeapp()) {
    if (!wechatParams) throw new Error('微信支付参数缺失')
    return requestWechatPayment(wechatParams)
  }

  if (alipayOrderInfo) {
    return requestAlipayPayment(alipayOrderInfo)
  }

  throw new Error('App 端暂仅支持支付宝支付')
}