import { useState, type ReactNode } from 'react'
import { Check } from 'lucide-react'
import { Button } from './Button'
import { cn } from '../../utils/cn'

export type StepWizardStep = {
  title: string
  icon?: ReactNode
  component: ReactNode
  validate?: () => boolean | Promise<boolean>
}

type StepWizardProps<TData = undefined> = {
  steps: StepWizardStep[]
  onComplete: (data: TData) => void | Promise<void>
  data?: TData
  activeStep?: number
  initialStep?: number
  onStepChange?: (step: number) => void
  isCompleting?: boolean
  backLabel?: string
  nextLabel?: string
  completeLabel?: string
  secondaryAction?: ReactNode
}

export function StepWizard<TData = undefined>({
  steps,
  onComplete,
  data,
  activeStep,
  initialStep = 0,
  onStepChange,
  isCompleting = false,
  backLabel = 'Back',
  nextLabel = 'Next',
  completeLabel = 'Review & Submit',
  secondaryAction,
}: StepWizardProps<TData>) {
  const [internalStep, setInternalStep] = useState(initialStep)
  const [isValidating, setIsValidating] = useState(false)
  const currentStep = Math.min(Math.max(activeStep ?? internalStep, 0), Math.max(steps.length - 1, 0))

  function changeStep(nextStep: number) {
    const normalizedStep = Math.min(Math.max(nextStep, 0), Math.max(steps.length - 1, 0))
    if (activeStep === undefined) {
      setInternalStep(normalizedStep)
    }
    onStepChange?.(normalizedStep)
  }

  async function handleNext() {
    const validate = steps[currentStep]?.validate
    setIsValidating(true)

    try {
      const isValid = validate ? await validate() : true
      if (isValid) {
        changeStep(currentStep + 1)
      }
    } finally {
      setIsValidating(false)
    }
  }

  if (!steps.length) {
    return null
  }

  const isFinalStep = currentStep === steps.length - 1

  return (
    <div className="step-wizard">
      <ol className="step-wizard__indicator" aria-label="Form progress">
        {steps.map((step, index) => {
          const isComplete = index < currentStep
          const isCurrent = index === currentStep

          return (
            <li
              className={cn(
                'step-wizard__indicator-item',
                isComplete && 'step-wizard__indicator-item--complete',
                isCurrent && 'step-wizard__indicator-item--current',
              )}
              key={step.title}
            >
              {index > 0 ? <span className="step-wizard__connector" aria-hidden="true" /> : null}
              <button
                aria-current={isCurrent ? 'step' : undefined}
                aria-label={`${step.title} (${index + 1} of ${steps.length})`}
                className="step-wizard__step-button"
                disabled={index > currentStep}
                type="button"
                onClick={() => changeStep(index)}
              >
                <span className="step-wizard__circle">
                  {isComplete ? <Check size={16} /> : step.icon ?? index + 1}
                </span>
                <span className="step-wizard__step-copy">
                  <small>{`Step ${index + 1}`}</small>
                  <strong>{step.title}</strong>
                </span>
              </button>
            </li>
          )
        })}
      </ol>

      <div className="step-wizard__content" aria-live="polite">
        {steps[currentStep].component}
      </div>

      <div className="step-wizard__actions">
        <div className="step-wizard__actions-start">
          {secondaryAction}
          <Button
            disabled={currentStep === 0 || isCompleting || isValidating}
            variant="secondary"
            onClick={() => changeStep(currentStep - 1)}
          >
            {backLabel}
          </Button>
        </div>
        {isFinalStep ? (
          <Button loading={isCompleting} onClick={() => void onComplete(data as TData)}>
            {completeLabel}
          </Button>
        ) : (
          <Button loading={isValidating} onClick={() => void handleNext()}>
            {nextLabel}
          </Button>
        )}
      </div>
    </div>
  )
}
