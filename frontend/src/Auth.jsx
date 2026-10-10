import { useState } from 'react'
import { ArrowRight, CalendarDays, Eye, EyeOff, LoaderCircle, Sparkles } from 'lucide-react'
import { login, register } from './services/api'
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
  const [showPassword, setShowPassword] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const isRegister = mode === 'register'

  const switchMode = (nextMode) => {
    setMode(nextMode)
    setError('')
    setSuccess('')
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setBusy(true)
    setError('')
    setSuccess('')

    try {
      if (isRegister) {
        await register(username.trim(), email.trim(), password)
        // Registration creates the account; log in immediately so the dashboard opens.
        await login(username.trim(), password)
        setSuccess('Account created! Welcome to Opportune.')
      } else {
        await login(username.trim(), password)
      }
      await onAuthenticated?.()
    } catch (err) {
      setError(
        messageFrom(
          err,
          isRegister
            ? 'Could not create your account. Please check your details.'
            : 'Sign in failed. Check your username and password.',
        ),
      )
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
          <CalendarDays size={28} strokeWidth={2.7} />
          <span>✦</span>
        </div>
        <p className="auth-eyebrow"><Sparkles size={15} /> YOUR LITTLE LAUNCHPAD</p>
        <h1>{isRegister ? 'Make room for ' : 'Welcome to '}<span>{isRegister ? 'big dreams.' : 'Opportune.'}</span></h1>
        <p className="auth-description">
          {isRegister
            ? 'Create your account and keep your next big opportunities in one happy place.'
            : 'Track internships, scholarships, jobs and exciting opportunities in one happy place.'}
        </p>

        <div className="auth-tabs" role="tablist" aria-label="Account options">
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

        <form className="auth-form" onSubmit={handleSubmit}>
          <label htmlFor="auth-username">Username</label>
          <input
            id="auth-username"
            autoComplete="username"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            placeholder="Choose your username"
            required
            minLength={2}
          />

          {isRegister && (
            <>
              <label htmlFor="auth-email">Email address</label>
              <input
                id="auth-email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                required
              />
            </>
          )}

          <label htmlFor="auth-password">Password</label>
          <div className="auth-password-wrap">
            <input
              id="auth-password"
              type={showPassword ? 'text' : 'password'}
              autoComplete={isRegister ? 'new-password' : 'current-password'}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder={isRegister ? 'Create a strong password' : 'Your password'}
              required
              minLength={isRegister ? 8 : undefined}
            />
            <button
              type="button"
              className="auth-show-password"
              onClick={() => setShowPassword((shown) => !shown)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          {error && <p className="auth-message auth-error" role="alert">{error}</p>}
          {success && <p className="auth-message auth-success" role="status">{success}</p>}

          <button className="auth-submit" type="submit" disabled={busy}>
            {busy ? <LoaderCircle size={19} className="auth-spin" /> : <ArrowRight size={19} />}
            {busy ? 'Please wait...' : isRegister ? 'Create my account' : 'Sign in to Opportune'}
          </button>
        </form>

        <p className="auth-switch-copy">
          {isRegister ? 'Already have an account?' : 'New to Opportune?'}{' '}
          <button type="button" onClick={() => switchMode(isRegister ? 'login' : 'register')}>
            {isRegister ? 'Sign in' : 'Create an account'}
          </button>
        </p>
        <div className="auth-footnote">MADE WITH ♡ FOR YOUR NEXT BIG THING</div>
      </section>
    </main>
  )
}
