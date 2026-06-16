export interface ErrorHandler {
  (err: unknown, userMessage: string): void
}

export interface ErrorHandlerOptions {
  setError?: (msg: string) => void
  addToast?: (toast: { type: string; title: string; message: string }) => void
  moduleName: string
}

export function createErrorHandler(options: ErrorHandlerOptions): ErrorHandler {
  const { setError, addToast, moduleName } = options

  return (err: unknown, userMessage: string) => {
    console.error(`[${moduleName}] ${userMessage}:`, err)
    setError?.(userMessage)
    addToast?.({ type: 'error', title: moduleName, message: userMessage })
  }
}
