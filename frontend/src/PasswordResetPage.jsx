
import { useEffect, useState } from 'react'
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  LoaderCircle,
  LockKeyhole,
  Sparkles,
} from 'lucide-react'

import { confirmPasswordReset } from './services/api'
import './Auth.css'

const getError = (error) => {
  const data = error?.response?.data

  return (
    data?.detail ||
    (data?.new_password
      ? [].concat(data.new_password).join(' ')
      : '') ||
    error?.message ||
    'Could not reset your password.'
  )
}

function getResetCredentials() {
  const params = new URLSearchParams(
    window.location.hash.slice(1)
  )

  return {
    uid: params.get('uid') || '',
    token: params.get('token') || '',
  }
}

export default function PasswordResetPage() {
  const [credentials] = useState(getResetCredentials)

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const [busy, setBusy] = useState(false)
  const [complete, setComplete] = useState(false)
  const [error, setError] = useState('')

  const validLink = Boolean(
    credentials.uid && credentials.token
  )

  // Remove the token from the visible URL after reading it.
  useEffect(() => {
    if (window.location.hash) {
      window.history.replaceState(
        {},
        '',
        window.location.pathname + window.location.search
      )
    }
  }, [])

  const goToLogin = () => {
    window.location.assign('/')
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    if (busy || !validLink) return

    setError('')

    if (password.length < 8) {
      setError(
        'Your password must contain at least 8 characters.'
      )
      return
    }

    if (password !== confirmPassword) {
      setError('Your passwords do not match.')
      return
    }

    setBusy(true)

    try {
      await confirmPasswordReset(
        credentials.uid,
        credentials.token,
        password
      )

      // Clear local tokens after a password change.
      localStorage.removeItem('opportune_access_token')
      localStorage.removeItem('opportune_refresh_token')

      setPassword('')
      setConfirmPassword('')
      setComplete(true)

    } catch (err) {
      setError(getError(err))
    } finally {
      setBusy(false)
    }
  }

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
          {complete ? (
            <CheckCircle2 size={28} strokeWidth={2.7} />
          ) : (
            <CalendarDays size={28} strokeWidth={2.7} />
          )}
          <span>✦</span>
        </div>

        <p className="auth-eyebrow">
          <Sparkles size={15} />
          YOUR LITTLE LAUNCHPAD
        </p>

        {complete ? (
          <>
            <h1>
              Password <span>updated!</span>
            </h1>

            <p className="auth-description">
              Your password has been changed successfully.
              You're ready to get back to your opportunities!
            </p>

            <div className="auth-reset-success">
              <CheckCircle2 size={34} />
              <strong>All done! ✦</strong>
              <span>
                Sign in with your new password.
              </span>
            </div>

            <button
              type="button"
              className="auth-submit"
              onClick={goToLogin}
            >
              <ArrowRight size={19} />
              Back to Opportune
            </button>
          </>
        ) : !validLink ? (
          <>
            <h1>
              Invalid <span>reset link.</span>
            </h1>

            <p className="auth-description">
              This link is missing the information
              needed to reset your password.
              Please request a new link from the sign-in page.
            </p>

            <button
              type="button"
              className="auth-submit"
              onClick={goToLogin}
            >
              <ArrowLeft size={19} />
              Back to sign in
            </button>
          </>
        ) : (
          <>
            <h1>
              A fresh <span>start.</span>
            </h1>

            <p className="auth-description">
              Create a new password for your
              Opportune account.
            </p>

            <div className="auth-forgot-banner">
              <LockKeyhole size={24} />
              <div>
                <strong>Secure your account ✦</strong>
                <span>
                  Choose a strong password you haven't used before.
                </span>
              </div>
            </div>

            <form
              className="auth-form"
              onSubmit={handleSubmit}
            >
              <label htmlFor="reset-password">
                New password
              </label>

              <div className="auth-password-wrap">
                <input
                  id="reset-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  placeholder="Enter your new password"
                  minLength={8}
                  value={password}
                  onChange={(event) =>
                    setPassword(event.target.value)
                  }
                  disabled={busy}
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

              <label htmlFor="reset-confirm-password">
                Confirm new password
              </label>

              <div className="auth-password-wrap">
                <input
                  id="reset-confirm-password"
                  type={showConfirm ? 'text' : 'password'}
                  autoComplete="new-password"
                  placeholder="Confirm your new password"
                  minLength={8}
                  value={confirmPassword}
                  onChange={(event) =>
                    setConfirmPassword(event.target.value)
                  }
                  disabled={busy}
                  required
                />

                <button
                  type="button"
                  className="auth-show-password"
                  onClick={() =>
                    setShowConfirm((value) => !value)
                  }
                  aria-label={
                    showConfirm
                      ? 'Hide password'
                      : 'Show password'
                  }
                >
                  {showConfirm ? (
                    <EyeOff size={18} />
                  ) : (
                    <Eye size={18} />
                  )}
                </button>
              </div>

              {error && (
                <p
                  className="auth-message auth-error"
                  role="alert"
                >
                  {error}
                </p>
              )}

              <button
                className="auth-submit"
                type="submit"
                disabled={busy}
              >
                {busy ? (
                  <LoaderCircle
                    size={19}
                    className="auth-spin"
                  />
                ) : (
                  <KeyRound size={19} />
                )}

                {busy
                  ? 'Updating password...'
                  : 'Reset my password'}
              </button>
            </form>

            <div className="auth-verification-bottom">
              <button
                type="button"
                className="auth-back-button"
                onClick={goToLogin}
                disabled={busy}
              >
                <ArrowLeft size={16} />
                Back to sign in
              </button>
            </div>
          </>
        )}

        <div className="auth-footnote">
          MADE WITH ♡ FOR YOUR NEXT BIG THING
        </div>
      </section>
    </main>
  )
}
