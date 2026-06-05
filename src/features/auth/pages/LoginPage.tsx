import { useForm } from 'react-hook-form'
import { useMutation } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { useLocation, useNavigate } from 'react-router-dom'
import { login } from '../api/auth.api'
import type { LoginRequest } from '../types/auth.types'
import { useAuthStore } from '../store/auth.store'
import { Button } from '../../../shared/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '../../../shared/components/ui/Card'
import { Input } from '../../../shared/components/ui/Input'
import { getDefaultRouteForUser } from '../../../shared/auth/permissions'
import { FieldError } from '../../../shared/components/forms/FieldError'
import { useFormApiErrors } from '../../../shared/hooks/useFormApiErrors'
import { useBranding } from '../../../shared/branding/useBranding'

type LocationState = {
  from?: {
    pathname?: string
  }
}

export function LoginPage() {
  const { t } = useTranslation()
  const branding = useBranding()
  const navigate = useNavigate()
  const location = useLocation()
  const state = location.state as LocationState | null
  const setSession = useAuthStore((store) => store.setSession)
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginRequest>()
  const loginMutation = useMutation({
    mutationFn: login,
    onSuccess: (response) => {
      setSession(response.token, response.user)
      navigate(state?.from?.pathname ?? getDefaultRouteForUser(response.user), { replace: true })
    },
  })
  const { formError, getFieldError } = useFormApiErrors(loginMutation.error)

  function onSubmit(values: LoginRequest) {
    loginMutation.mutate(values)
  }

  return (
    <Card className="auth-card">
      <CardHeader className="auth-card__header">
        <p className="eyebrow">{t('Secure Login', { defaultValue: 'Secure Login' })}</p>
        <CardTitle>{t('Sign in', { defaultValue: 'Sign in' })}</CardTitle>
        <p>
          {t('Use your internal account to access the {{appName}} admin frontend.', {
            appName: branding.companyName,
            defaultValue: `Use your internal account to access the ${branding.companyName} admin frontend.`,
          })}
        </p>
      </CardHeader>

      <CardContent>
        <form className="form-grid" onSubmit={handleSubmit(onSubmit)}>
          <label className="field">
            <span>{t('Email')}</span>
            <Input type="email" placeholder={t('admin@example.com', { defaultValue: 'admin@example.com' })} {...register('email', { required: true })} />
            <FieldError error={errors.email?.message ?? getFieldError('email') ?? (errors.email ? t('Email is required.', { defaultValue: 'Email is required.' }) : undefined)} />
          </label>

          <label className="field">
            <span>{t('Password')}</span>
            <Input
              type="password"
              placeholder={t('Enter your password', { defaultValue: 'Enter your password' })}
              {...register('password', { required: true })}
            />
            <FieldError error={errors.password?.message ?? getFieldError('password') ?? (errors.password ? t('Password is required.', { defaultValue: 'Password is required.' }) : undefined)} />
          </label>

          {formError ? <div className="form-error">{formError}</div> : null}

          <Button className="auth-card__submit" type="submit" disabled={loginMutation.isPending}>
            {loginMutation.isPending
              ? t('Signing in...', { defaultValue: 'Signing in...' })
              : t('Sign in', { defaultValue: 'Sign in' })}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
