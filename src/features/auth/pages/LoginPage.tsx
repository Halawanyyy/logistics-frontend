import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useMutation } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { useLocation, useNavigate } from 'react-router-dom'
import { Mail, Lock, Eye, EyeOff, ShieldCheck } from 'lucide-react'
import { login } from '../api/auth.api'
import type { LoginRequest } from '../types/auth.types'
import { useAuthStore } from '../store/auth.store'
import { Button } from '../../../shared/components/ui/Button'
import { Input } from '../../../shared/components/ui/Input'
import { getDefaultRouteForUser } from '../../../shared/auth/permissions'
import { FieldError } from '../../../shared/components/forms/FieldError'
import { useFormApiErrors } from '../../../shared/hooks/useFormApiErrors'

type LocationState = {
  from?: {
    pathname?: string
  }
}

export function LoginPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()
  const isMerchantLogin = location.pathname.startsWith('/merchant')
  const state = location.state as LocationState | null
  const setSession = useAuthStore((store) => store.setSession)
  
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)

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
    <div className="auth-form-container">
      <div className="auth-form-header">
        <h2>{t('Sign in to your account')}</h2>
        <p>
          {isMerchantLogin
            ? t('Access your merchant shipping & order dashboard.')
            : t('Access your logistics operations dashboard.')}
        </p>
      </div>

      <form className="form-grid" onSubmit={handleSubmit(onSubmit)}>
        <label className="field">
          <span>{t('Email address')}</span>
          <div className="auth-input-group">
            <Mail className="auth-input-group__icon" size={18} />
            <Input 
              type="email" 
              placeholder={t('name@company.com')} 
              {...register('email', { required: true })} 
            />
          </div>
          <FieldError error={errors.email?.message ?? getFieldError('email') ?? (errors.email ? t('Email is required.') : undefined)} />
        </label>

        <label className="field">
          <span>{t('Password')}</span>
          <div className="auth-input-group">
            <Lock className="auth-input-group__icon" size={18} />
            <Input
              type={showPassword ? 'text' : 'password'}
              placeholder={t('Enter your password')}
              {...register('password', { required: true })}
            />
            <button 
              type="button" 
              className="auth-input-group__toggle"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? t('Hide password') : t('Show password')}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          <FieldError error={errors.password?.message ?? getFieldError('password') ?? (errors.password ? t('Password is required.') : undefined)} />
        </label>

        <div className="auth-options">
          <label className="auth-checkbox-label">
            <input 
              type="checkbox" 
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
            />
            {t('Remember me')}
          </label>
          <a href="#" className="auth-forgot-link">{t('Forgot password?')}</a>
        </div>

        {formError ? <div className="form-error">{formError}</div> : null}

        <Button className="auth-card__submit" type="submit" disabled={loginMutation.isPending}>
          {loginMutation.isPending
            ? t('Signing in...')
            : t('Sign in')}
        </Button>
      </form>

      <div className="auth-security-note">
        <ShieldCheck size={18} />
        {isMerchantLogin
          ? t('Dedicated access for merchant partners.')
          : t('Secure access for your operations team.')}
      </div>

      <div className="auth-footer-note">
        {t('Need access?')} <a href="#">{t('Contact your administrator.')}</a>
      </div>
    </div>
  )
}
