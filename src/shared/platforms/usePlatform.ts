import { createContext, useContext } from 'react'
import type { PlatformInfo } from './types'
import { getPlatformInfo } from './platformDetect'

export const PlatformContext = createContext<PlatformInfo>(getPlatformInfo())

export function usePlatform(): PlatformInfo {
  return useContext(PlatformContext)
}
