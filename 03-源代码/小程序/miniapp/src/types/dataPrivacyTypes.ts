export interface DataExportResult {
  success: boolean
  data?: string
  error?: string
  exportedAt: string
  tables: string[]
  totalRecords: number
}

export interface DataDeleteResult {
  success: boolean
  error?: string
  deletedAt: string
  deletedTables: string[]
  deletedRecords: number
}

export type AccountDeletionReason =
  | 'no_longer_needed'
  | 'privacy_concern'
  | 'found_better_app'
  | 'too_complicated'
  | 'other'

export interface AccountDeletionRequest {
  reason: AccountDeletionReason
  customReason?: string
  confirmCode: string
}

export interface AccountDeletionResult {
  success: boolean
  error?: string
  scheduledDeletionAt?: string
  gracePeriodDays: number
}

export interface DataPrivacyStatus {
  lastExportAt: string | null
  lastDeleteAt: string | null
  accountDeletionRequested: boolean
  accountDeletionScheduledAt: string | null
  totalDataSize: number
  totalRecords: number
}
