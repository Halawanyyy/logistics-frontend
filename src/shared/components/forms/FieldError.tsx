type FieldErrorProps = {
  error?: string | null
}

export function FieldError({ error }: FieldErrorProps) {
  if (!error) {
    return null
  }

  return <small className="field-error">{error}</small>
}
