function getTemplateId(envKey: string, fallback: string): string {
  const value = (process.env as Record<string, string | undefined>)[envKey]
  return value && value !== fallback ? value : fallback
}

export const FOLLOWUP_TEMPLATE_ID = getTemplateId(
  'TARO_APP_FOLLOWUP_TEMPLATE_ID',
  'FOLLOWUP_TEMPLATE_ID_PLACEHOLDER',
)

export const CARE_PLAN_REMINDER_TEMPLATE_ID = getTemplateId(
  'TARO_APP_CARE_PLAN_TEMPLATE_ID',
  'CARE_PLAN_REMINDER_TEMPLATE_ID_PLACEHOLDER',
)

export const HEALTH_CHECKIN_TEMPLATE_ID = getTemplateId(
  'TARO_APP_HEALTH_CHECKIN_TEMPLATE_ID',
  'HEALTH_CHECKIN_TEMPLATE_ID_PLACEHOLDER',
)

export const VACCINE_REMINDER_TEMPLATE_ID = getTemplateId(
  'TARO_APP_VACCINE_REMINDER_TEMPLATE_ID',
  'VACCINE_REMINDER_TEMPLATE_ID_PLACEHOLDER',
)

export const TEMPLATE_IDS = {
  FOLLOWUP: FOLLOWUP_TEMPLATE_ID,
  CARE_PLAN_REMINDER: CARE_PLAN_REMINDER_TEMPLATE_ID,
  HEALTH_CHECKIN: HEALTH_CHECKIN_TEMPLATE_ID,
  VACCINE_REMINDER: VACCINE_REMINDER_TEMPLATE_ID,
} as const

export type TemplateId = typeof TEMPLATE_IDS[keyof typeof TEMPLATE_IDS]
