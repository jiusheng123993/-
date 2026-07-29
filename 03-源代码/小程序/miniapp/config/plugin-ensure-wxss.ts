import { IPluginContext } from '@tarojs/service'
import { execSync } from 'child_process'
import path from 'path'

export default (ctx: IPluginContext) => {
  ctx.onBuildComplete(() => {
    try {
      const scriptPath = path.resolve(__dirname, '..', 'scripts', 'ensure-wxss.js')
      console.log('[plugin-ensure-wxss] 检查缺失的 wxss 文件...')
      execSync(`node "${scriptPath}"`, { stdio: 'inherit' })
    } catch (err) {}
  })
}