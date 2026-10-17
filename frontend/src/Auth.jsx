
import { useState } from 'react'
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Eye,
  EyeOff,
  LoaderCircle,
  MailCheck,
  ShieldCheck,
  Sparkles,
} from 'lucide-react'

import { login, register, verifyEmail } from './services/api'
import './Auth.css'

const messageFrom = (error, fallback) =>
  error?.response?.data?.detail ||
  error?.response?.data?.message ||
  (typeof error?.response?.data === 'object'
    ? Object.values(error.response.data).flat().join(' ')
    : '') ||
  error?.message ||
  fallback

export default function Auth({ onAuthenticated }) {
  const [mode, setMode] = useState('login')

  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [verificationCode, setVerificationCode] = useState('')

  const [showPassword, setShowPassword] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const isRegister = mode === 'register'
  const isVerify = mode === 'verify'

  const switchMode = (nextMode) => {
    setMode(nextMode)
    setError('')
    setSuccess('')
    setVerificationCode('')
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    if (busy) return

    setBusy(true)
    setError('')
    setSuccess('')

    try {
      if (isVerify) {
        await verifyEmail(
          username.trim(),
          email.trim().toLowerCase(),
          verificationCode.trim()
        )

        setPassword('')
        setVerificationCode('')
        setMode('login')
        setSuccess(
          'Your email is verified! You can now sign in to Opportune.'
        )

        return
      }

      if (isRegister) {
        await register(
          username.trim(),
          email.trim().toLowerCase(),
          password
        )

        // Do not log in yet. Django creates an inactive account
        // until the email verification code is confirmed.
        setPassword('')
        setVerificationCode('')
        setMode('verify')

        setSuccess(
          'Account created! We sent a verification code to your email.'
        )

        return
      }

      await login(username.trim(), password)
      await onAuthenticated?.()
    } catch (err) {
      const fallback = isVerify
        ? 'Could not verify your email. Please check your code.'
        : isRegister
          ? 'Could not create your account. Please check your details.'
          : 'Sign in failed. Check your username and password.'

      setError(messageFrom(err, fallback))
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="auth-page">
      <div className="auth-decoration auth-decoration-one">✦</div>
      <div className="auth-decoration auth-decoration-two">✳</div>

      <section className="auth-card">
        <div className="auth-brand-mark">
          {isVerify ? (
            <MailCheck size={28} strokeWidth={2.7} />
          ) : (
            <CalendarDays size={28} strokeWidth={2.7} />
          )}
          <span>✦</span>
        </div>

        <p className="auth-eyebrow">
          <Sparkles size={15} />
          YOUR LITTLE LAUNCHPAD
        </p>

        <h1>
          {isVerify ? (
            <>
              Check your <span>inbox.</span>
            </>
          ) : isRegister ? (
            <>
              Make room for <span>big dreams.</span>
            </>
          ) : (
            <>
              Welcome to <span>Opportune.</span>
            </>
          )}
        </h1>

        <p className="auth-description">
          {isVerify
            ? 'One little step before your big adventures begin! Enter the six-digit code we sent to your email.'
            : isRegister
              ? 'Create your account and keep your next big opportunities in one happy place.'
              : 'Track internships, scholarships, jobs and exciting opportunities in one happy place.'}
        </p>

        {isVerify ? (
          <div className="auth-verification-info">
            <div className="auth-verification-icon">
              <ShieldCheck size={26} />
            </div>

            <p>Verification code sent to</p>
            <strong>{email}</strong>

            <span>
              Your code expires in 10 minutes.
            </span>
          </div>
        ) : (
          <div
            className="auth-tabs"
            role="tablist"
            aria-label="Account options"
          >
            <button
              type="button"
              role="tab"
              aria-selected={!isRegister}
              className={!isRegister ? 'active' : ''}
              onClick={() => switchMode('login')}
            >
              Sign in
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={isRegister}
              className={isRegister ? 'active' : ''}
              onClick={() => switchMode('register')}
            >
              Create account
            </button>
          </div>
        )}

        <form className="auth-form" onSubmit={handleSubmit}>
          {isVerify ? (
            <>
              <label htmlFor="auth-verification-code">
                Verification code
              </label>

              <input
                id="auth-verification-code"
                className="auth-code-input"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                pattern="[0-9]{6}"
                maxLength={6}
                value={verificationCode}
                onChange={(event) => {
                  const value = event.target.value
                    .replace(/\D/g, '')
                    .slice(0, 6)

                  setVerificationCode(value)
                }}
                placeholder="000000"
                required
                autoFocus
              />

              <p className="auth-code-hint">
                Enter the six numbers from your verification email.
              </p>
            </>
          ) : (
            <>
              <label htmlFor="auth-username">
                Username
              </label>

              <input
                id="auth-username"
                autoComplete="username"
                value={username}
                onChange={(event) =>
                  setUsername(event.target.value)
                }
                placeholder={
                  isRegister
                    ? 'Choose your username'
                    : 'Enter your username'
                }
                required
                minLength={2}
              />

              {isRegister && (
                <>
                  <label htmlFor="auth-email">
                    Email address
                  </label>

                  <input
                    id="auth-email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(event) =>
                      setEmail(event.target.value)
                    }
                    placeholder="you@example.com"
                    required
                  />
                </>
              )}

              <label htmlFor="auth-password">
                Password
              </label>

              <div className="auth-password-wrap">
                <input
                  id="auth-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete={
                    isRegister
                      ? 'new-password'
                      : 'current-password'
                  }
                  value={password}
                  onChange={(event) =>
                    setPassword(event.target.value)
                  }
                  placeholder={
                    isRegister
                      ? 'Create a strong password'
                      : 'Your password'
                  }
                  required
                  minLength={isRegister ? 8 : undefined}
                />

                <button
                  type="button"
                  className="auth-show-password"
                  onClick={() =>
                    setShowPassword((shown) => !shown)
                  }
                  aria-label={
                    showPassword
                      ? 'Hide password'
                      : 'Show password'
                  }
                >
                  {showPassword ? (
                    <EyeOff size={18} />
                  ) : (
                    <Eye size={18} />
                  )}
                </button>
              </div>
            </>
          )}

          {error && (
            <p
              className="auth-message auth-error"
              role="alert"
            >
              {error}
            </p>
          )}

          {success && (
            <p
              className="auth-message auth-success"
              role="status"
            >
              <CheckCircle2 size={17} />
              {success}
            </p>
          )}

          <button
            className="auth-submit"
            type="submit"
            disabled={
              busy ||
              (isVerify && verificationCode.length !== 6)
            }
          >
            {busy ? (
              <LoaderCircle
                size={19}
                className="auth-spin"
              />
            ) : isVerify ? (
              <ShieldCheck size={19} />
            ) : (
              <ArrowRight size={19} />
            )}

            {busy
              ? 'Please wait...'
              : isVerify
                ? 'Verify my email'
                : isRegister
                  ? 'Create my account'
                  : 'Sign in to Opportune'}
          </button>
        </form>

        {isVerify ? (
          <div className="auth-verification-bottom">
            <p>
              Didn't receive the code? Check your spam folder.
            </p>

            <button
              type="button"
              className="auth-back-button"
              onClick={() => switchMode('login')}
              disabled={busy}
            >
              <ArrowLeft size={16} />
              Back to sign in
            </button>
          </div>
        ) : (
          <p className="auth-switch-copy">
            {isRegister
              ? 'Already have an account?'
              : 'New to Opportune?'}{' '}

            <button
              type="button"
              onClick={() =>
                switchMode(isRegister ? 'login' : 'register')
              }
            >
              {isRegister
                ? 'Sign in'
                : 'Create an account'}
            </button>
          </p>
        )}

        <div className="auth-footnote">
          MADE WITH ♡ FOR YOUR NEXT BIG THING
        </div>
      </section>
    </main>
  )
}
