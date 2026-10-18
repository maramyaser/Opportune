
import { useState } from 'react'
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  LoaderCircle,
  Mail,
  MailCheck,
  RefreshCw,
  ShieldCheck,
  Sparkles,
} from 'lucide-react'

import {
  login,
  register,
  verifyEmail,
  resendVerificationCode,
  requestPasswordReset,
} from './services/api'

import './Auth.css'

const messageFrom = (error, fallback) => {
  const data = error?.response?.data

  return (
    data?.detail ||
    data?.message ||
    (data && typeof data === 'object'
      ? Object.values(data).flat().join(' ')
      : '') ||
    error?.message ||
    fallback
  )
}

export default function Auth({ onAuthenticated }) {
  const [mode, setMode] = useState('login')

  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [verificationCode, setVerificationCode] = useState('')

  const [showPassword, setShowPassword] = useState(false)
  const [busy, setBusy] = useState(false)
  const [resending, setResending] = useState(false)

  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const isRegister = mode === 'register'
  const isVerify = mode === 'verify'
  const isRecover = mode === 'recover'
  const isForgot = mode === 'forgot'

  const switchMode = (nextMode) => {
    if (busy || resending) return

    setMode(nextMode)
    setError('')
    setSuccess('')
    setVerificationCode('')
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    if (busy || resending) return

    setBusy(true)
    setError('')
    setSuccess('')

    const cleanUsername = username.trim()
    const cleanEmail = email.trim().toLowerCase()

    try {
      if (isForgot) {
        const response = await requestPasswordReset(cleanEmail)

        setSuccess(
          response?.detail ||
          'If your account exists, a password reset link will be sent.'
        )
        return
      }

      if (isVerify) {
        await verifyEmail(
          cleanUsername,
          cleanEmail,
          verificationCode.trim()
        )

        setPassword('')
        setVerificationCode('')
        setMode('login')

        setSuccess(
          'Your email is verified! You can now sign in.'
        )
        return
      }

      if (isRecover) {
        await resendVerificationCode(
          cleanUsername,
          cleanEmail
        )

        setVerificationCode('')
        setMode('verify')

        setSuccess(
          'If your account needs verification, check your inbox for a code.'
        )
        return
      }

      if (isRegister) {
        await register(
          cleanUsername,
          cleanEmail,
          password
        )

        setPassword('')
        setVerificationCode('')
        setMode('verify')

        setSuccess(
          'Account created! We sent a verification code to your email.'
        )
        return
      }

      await login(cleanUsername, password)
      await onAuthenticated?.()

    } catch (err) {
      const fallback = isForgot
        ? 'Could not request a password reset. Please try again.'
        : isVerify
          ? 'Verification failed. Check your code.'
          : isRecover
            ? 'Could not request a verification code.'
            : isRegister
              ? 'Could not create your account.'
              : 'Sign in failed. Check your credentials.'

      setError(messageFrom(err, fallback))
    } finally {
      setBusy(false)
    }
  }

  const handleResendCode = async () => {
    if (busy || resending) return

    setResending(true)
    setError('')
    setSuccess('')

    try {
      await resendVerificationCode(
        username.trim(),
        email.trim().toLowerCase()
      )

      setVerificationCode('')

      setSuccess(
        'If another code is allowed, check your inbox and spam folder.'
      )
    } catch (err) {
      setError(
        messageFrom(
          err,
          'Could not resend your code. Please try again later.'
        )
      )
    } finally {
      setResending(false)
    }
  }

  const heading = isForgot
    ? <>Forgot your <span>password?</span></>
    : isVerify
      ? <>Check your <span>inbox.</span></>
      : isRecover
        ? <>One more <span>little step.</span></>
        : isRegister
          ? <>Make room for <span>big dreams.</span></>
          : <>Welcome to <span>Opportune.</span></>

  const description = isForgot
    ? "No worries! Enter your registered email and we'll send you a secure link to create a new password."
    : isVerify
      ? 'Enter the six-digit code we sent to your email.'
      : isRecover
        ? "Didn't finish verifying your account? Request another code and pick up where you left off."
        : isRegister
          ? 'Create your account and keep your next big opportunities in one happy place.'
          : 'Track internships, scholarships, jobs and exciting opportunities in one happy place.'

  return (
    <main className="auth-page">
      <div className="auth-decoration auth-decoration-one">
        ✦
      </div>

      <div className="auth-decoration auth-decoration-two">
        ✳
      </div>

      <section className="auth-card">

        <div className="auth-brand-mark">
          {isForgot ? (
            <KeyRound size={28} strokeWidth={2.7} />
          ) : isVerify || isRecover ? (
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

        <h1>{heading}</h1>

        <p className="auth-description">
          {description}
        </p>

        {!isVerify && !isRecover && !isForgot && (
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
              disabled={busy}
            >
              Sign in
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={isRegister}
              className={isRegister ? 'active' : ''}
              onClick={() => switchMode('register')}
              disabled={busy}
            >
              Create account
            </button>
          </div>
        )}

        {isVerify && (
          <div className="auth-verification-info">
            <div className="auth-verification-icon">
              <ShieldCheck size={26} />
            </div>
            <p>Verification code sent to</p>
            <strong>{email}</strong>
            <span>Codes expire after 10 minutes.</span>
          </div>
        )}

        {isForgot && (
          <div className="auth-forgot-banner">
            <Mail size={23} />
            <div>
              <strong>We'll send you a reset link ✦</strong>
              <span>
                The link expires after 30 minutes.
              </span>
            </div>
          </div>
        )}

        <form
          className="auth-form"
          onSubmit={handleSubmit}
        >
          {isForgot ? (
            <>
              <label htmlFor="auth-forgot-email">
                Registered email address
              </label>

              <input
                id="auth-forgot-email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                value={email}
                onChange={(event) =>
                  setEmail(event.target.value)
                }
                disabled={busy}
                required
              />
            </>
          ) : isVerify ? (
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
                placeholder="000000"
                value={verificationCode}
                disabled={busy}
                onChange={(event) =>
                  setVerificationCode(
                    event.target.value
                      .replace(/\D/g, '')
                      .slice(0, 6)
                  )
                }
                required
                autoFocus
              />

              <p className="auth-code-hint">
                Enter the six digits from your email.
              </p>
            </>
          ) : (
            <>
              <label htmlFor="auth-username">
                {isRegister || isRecover
                  ? 'Username'
                  : 'Username or email'}
              </label>

              <input
                id="auth-username"
                autoComplete="username"
                placeholder={
                  isRegister
                    ? 'Choose your username'
                    : isRecover
                      ? 'Enter your username'
                      : 'Enter your username or email'
                }
                value={username}
                onChange={(event) =>
                  setUsername(event.target.value)
                }
                disabled={busy}
                minLength={2}
                required
              />

              {(isRegister || isRecover) && (
                <>
                  <label htmlFor="auth-email">
                    Email address
                  </label>

                  <input
                    id="auth-email"
                    type="email"
                    autoComplete="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(event) =>
                      setEmail(event.target.value)
                    }
                    disabled={busy}
                    required
                  />
                </>
              )}

              {!isRecover && (
                <>
                  <label htmlFor="auth-password">
                    Password
                  </label>

                  <div className="auth-password-wrap">
                    <input
                      id="auth-password"
                      type={
                        showPassword
                          ? 'text'
                          : 'password'
                      }
                      autoComplete={
                        isRegister
                          ? 'new-password'
                          : 'current-password'
                      }
                      placeholder={
                        isRegister
                          ? 'Create a strong password'
                          : 'Your password'
                      }
                      value={password}
                      onChange={(event) =>
                        setPassword(event.target.value)
                      }
                      disabled={busy}
                      minLength={
                        isRegister ? 8 : undefined
                      }
                      required
                    />

                    <button
                      type="button"
                      className="auth-show-password"
                      onClick={() =>
                        setShowPassword((value) => !value)
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
              resending ||
              (isVerify && verificationCode.length !== 6)
            }
          >
            {busy ? (
              <LoaderCircle
                size={19}
                className="auth-spin"
              />
            ) : isForgot ? (
              <Mail size={19} />
            ) : isVerify ? (
              <ShieldCheck size={19} />
            ) : (
              <ArrowRight size={19} />
            )}

            {busy
              ? 'Please wait...'
              : isForgot
                ? 'Send password reset link'
                : isVerify
                  ? 'Verify my email'
                  : isRecover
                    ? 'Send me a new code'
                    : isRegister
                      ? 'Create my account'
                      : 'Sign in to Opportune'}
          </button>
        </form>

        {isVerify && (
          <div className="auth-verification-bottom">
            <p>Didn't receive your code?</p>

            <button
              type="button"
              className="auth-resend-button"
              disabled={busy || resending}
              onClick={handleResendCode}
            >
              {resending ? (
                <LoaderCircle
                  size={16}
                  className="auth-spin"
                />
              ) : (
                <RefreshCw size={16} />
              )}

              {resending
                ? 'Requesting code...'
                : 'Resend verification code'}
            </button>

            <p className="auth-resend-note">
              Wait at least 60 seconds between requests.
              Check your spam folder too.
            </p>
          </div>
        )}

        {!isRegister && !isVerify && !isRecover && !isForgot && (
          <div className="auth-recovery-prompt">
            <button
              type="button"
              onClick={() => switchMode('forgot')}
            >
              <KeyRound size={16} />
              Forgot password?
            </button>

            <button
              type="button"
              onClick={() => switchMode('recover')}
            >
              <MailCheck size={16} />
              Haven't verified your email?
            </button>
          </div>
        )}

        {(isVerify || isRecover || isForgot) && (
          <div className="auth-verification-bottom">
            <button
              type="button"
              className="auth-back-button"
              disabled={busy || resending}
              onClick={() => switchMode('login')}
            >
              <ArrowLeft size={16} />
              Back to sign in
            </button>
          </div>
        )}

        {!isVerify && !isRecover && !isForgot && (
          <p className="auth-switch-copy">
            {isRegister
              ? 'Already have an account?'
              : 'New to Opportune?'}{' '}

            <button
              type="button"
              onClick={() =>
                switchMode(
                  isRegister ? 'login' : 'register'
                )
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
