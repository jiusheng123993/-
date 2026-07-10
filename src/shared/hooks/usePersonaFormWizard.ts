import { useState, useCallback, useMemo } from 'react'

export interface FormWizardOptions<T> {
  initialData: T
  totalSteps: number
  stepValidators: Record<number, (data: T) => boolean>
}

export interface FormWizardResult<T> {
  formData: T
  step: number
  totalSteps: number
  updateField: <K extends keyof T>(field: K, value: T[K]) => void
  nextStep: () => void
  prevStep: () => void
  goToStep: (s: number) => void
  isStepValid: () => boolean
  isFirstStep: boolean
  isLastStep: boolean
}

export function usePersonaFormWizard<T>(options: FormWizardOptions<T>): FormWizardResult<T> {
  const { initialData, totalSteps, stepValidators } = options

  const [formData, setFormData] = useState<T>(initialData)
  const [step, setStep] = useState(1)

  const updateField = useCallback(<K extends keyof T>(field: K, value: T[K]) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }, [])

  const isStepValid = useCallback(() => {
    const validator = stepValidators[step]
    return validator ? validator(formData) : false
  }, [step, stepValidators, formData])

  const nextStep = useCallback(() => {
    if (step < totalSteps && isStepValid()) {
      setStep((s) => s + 1)
    }
  }, [step, totalSteps, isStepValid])

  const prevStep = useCallback(() => {
    setStep((s) => Math.max(1, s - 1))
  }, [])

  const goToStep = useCallback((s: number) => {
    if (s >= 1 && s <= totalSteps) {
      setStep(s)
    }
  }, [totalSteps])

  const isFirstStep = step === 1
  const isLastStep = step === totalSteps

  return useMemo(() => ({
    formData,
    step,
    totalSteps,
    updateField,
    nextStep,
    prevStep,
    goToStep,
    isStepValid,
    isFirstStep,
    isLastStep,
  }), [formData, step, totalSteps, updateField, nextStep, prevStep, goToStep, isStepValid, isFirstStep, isLastStep])
}
