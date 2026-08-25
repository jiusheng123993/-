/**
 * 平台适配器 - 图片/文件模块
 * 小程序用 Taro.chooseMedia/previewImage/uploadFile
 * App/H5 用 HTML input / fetch
 */
import Taro from '@tarojs/taro'
import { isWeapp } from './detector'

export type ImageSourceType = 'album' | 'camera'

export interface ChooseImageResult {
  tempFilePath: string
  size: number
}

export interface UploadFileResult {
  url: string
  [key: string]: any
}

/**
 * 选择图片
 */
export async function chooseImage(params: {
  count?: number
  sourceType?: ImageSourceType[]
}): Promise<ChooseImageResult[]> {
  if (isWeapp()) {
    // chooseImage 自基础库 2.21.0 停止维护、新基础库上实质失效，统一切 chooseMedia
    const res = await new Promise<any>((resolve, reject) => {
      Taro.chooseMedia({
        count: params.count || 1,
        mediaType: ['image'],
        sourceType: params.sourceType || ['album', 'camera'],
        success: resolve,
        fail: reject,
      })
    })
    return (res.tempFiles || []).map((f: any) => ({
      tempFilePath: f.tempFilePath || f.path,
      size: f.size || 0,
    }))
  }

  return new Promise((resolve, reject) => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    if (params.count && params.count > 1) {
      input.multiple = true
    }

    input.onchange = async () => {
      const files = Array.from(input.files || [])
      const results: ChooseImageResult[] = files.map((f) => ({
        tempFilePath: URL.createObjectURL(f),
        size: f.size,
      }))
      resolve(results)
    }

    input.onerror = () => reject(new Error('选择图片失败'))
    input.click()
  })
}

/**
 * 上传文件
 */
export async function uploadFile(params: {
  url: string
  filePath: string | Blob
  name?: string
  header?: Record<string, string>
}): Promise<UploadFileResult> {
  if (isWeapp()) {
    return new Promise((resolve, reject) => {
      Taro.uploadFile({
        url: params.url,
        filePath: params.filePath as string,
        name: params.name || 'file',
        header: params.header,
        success: (res: any) => {
          try {
            resolve(JSON.parse(res.data))
          } catch {
            resolve({ url: res.data })
          }
        },
        fail: reject,
      })
    })
  }

  const formData = new FormData()
  const file = params.filePath instanceof Blob
    ? params.filePath
    : await fetch(params.filePath as string).then(r => r.blob())
  formData.append(params.name || 'file', file)

  const headers: Record<string, string> = { ...(params.header || {}) }
  const res = await fetch(params.url, {
    method: 'POST',
    headers,
    body: formData,
  })
  return res.json()
}

/**
 * 预览图片
 */
export async function previewImage(urls: string[], current?: string): Promise<void> {
  if (isWeapp()) {
    Taro.previewImage({ urls, current: current || urls[0] })
    return
  }

  // H5 端：简单的新窗口预览
  const idx = current ? urls.indexOf(current) : 0
  const url = urls[Math.max(0, idx)]
  window.open(url, '_blank')
}