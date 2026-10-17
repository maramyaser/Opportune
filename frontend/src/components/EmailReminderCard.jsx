
import { useEffect, useState } from 'react'
import {
  ArrowLeft,
  BellRing,
  CheckCircle2,
  LoaderCircle,
  Mail,
  MailCheck,
  RefreshCw,
  ShieldCheck,
  X,
} from 'lucide-react'

import {
  getReminderPreferences,
  updateReminderPreferences,
  requestReminderVerification,
  verifyReminderEmail,
  disconnectReminderEmail,
} from '../services/api'

import '../EmailReminderCard.css'

const DAYS = [7, 3, 1]

const getError = (error) => {
  const data = error?.response?.data

  return (
    data?.detail ||
    (data && typeof data === 'object'
      ? Object.values(data).flat().join(' ')
      : '') ||
    error?.message ||
    'Something went wrong. Please try again.'
  )
}

export default function EmailReminderCard({ onClose }) {
  const [prefs, setPrefs] = useState(null)

  const [choice, setChoice] = useState('account')
  const [otherEmail, setOtherEmail] = useState('')
  const [verificationCode, setVerificationCode] = useState('')
  const [needsCode, setNeedsCode] = useState(false)

  const [days, setDays] = useState(DAYS)

  const [busy, setBusy] = useState(false)
  const [loading, setLoading] = useState(true)

  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const refresh = async () => {
    const data = await getReminderPreferences()

    setPrefs(data)
    setDays(data.reminder_days ?? DAYS)

    return data
  }

  useEffect(() => {
    let mounted = true

    getReminderPreferences()
      .then((data) => {
        if (!mounted) return

        setPrefs(data)
        setDays(data.reminder_days ?? DAYS)

        if (
          data.reminder_email &&
          data.reminder_email.toLowerCase() !==
            (data.account_email || '').toLowerCase()
        ) {
          setChoice('other')
          setOtherEmail(data.reminder_email)

          if (!data.email_verified) {
            setNeedsCode(true)
          }
        }
      })
      .catch((err) => {
        if (mounted) setError(getError(err))
      })
      .finally(() => {
        if (mounted) setLoading(false)
      })

    return () => {
      mounted = false
    }
  }, [])

  const run = async (action, successMessage) => {
    if (busy) return null

    setBusy(true)
    setError('')
    setMessage('')

    try {
      const result = await action()
      await refresh()

      setMessage(
        successMessage ||
        result?.detail ||
        'Settings updated successfully!'
      )

      return result
    } catch (err) {
      setError(getError(err))
      return null
    } finally {
      setBusy(false)
    }
  }

  const chooseEmail = (nextChoice) => {
    if (busy) return

    setChoice(nextChoice)
    setNeedsCode(false)
    setVerificationCode('')
    setError('')
    setMessage('')
  }

  const selectedEmail =
    choice === 'account'
      ? prefs?.account_email || ''
      : otherEmail.trim().toLowerCase()

  const linkedEmail = prefs?.reminder_email || ''

  const isSelectedEmailLinked =
    Boolean(selectedEmail) &&
    linkedEmail.toLowerCase() ===
      selectedEmail.toLowerCase()

  const selectedEmailVerified =
    isSelectedEmailLinked && Boolean(prefs?.email_verified)

  const handleLinkEmail = async () => {
    const email = selectedEmail.trim()

    if (!email) {
      setError('Please enter an email address.')
      return
    }

    const result = await run(
      () => requestReminderVerification(email)
    )

    if (!result) return

    if (result.requires_code) {
      setVerificationCode('')
      setNeedsCode(true)

      setMessage(
        `We sent a six-digit verification code to ${email}.`
      )
    } else {
      setNeedsCode(false)
      setMessage(
        'Your email is linked and verified! Choose your reminder days below.'
      )
    }
  }

  const handleVerifyCode = async () => {
    if (verificationCode.length !== 6) {
      setError('Please enter the six-digit code.')
      return
    }

    const result = await run(
      () => verifyReminderEmail(
        selectedEmail,
        verificationCode
      )
    )

    if (!result) return

    setVerificationCode('')
    setNeedsCode(false)

    setMessage(
      'Email verified successfully! You can now enable deadline reminders.'
    )
  }

  const handleEnableReminders = async () => {
    if (!selectedEmailVerified) {
      setError('Please link and verify your selected email first.')
      return
    }

    if (!days.length) {
      setError('Choose at least one reminder day.')
      return
    }

    await run(
      () => updateReminderPreferences({
        reminder_days: days,
        reminders_enabled: true,
      }),
      'Your deadline reminder preferences are saved!'
    )
  }

  const handlePauseReminders = async () => {
    await run(
      () => updateReminderPreferences({
        reminder_days: days,
        reminders_enabled: false,
      }),
      'Reminders paused. You can enable them again anytime.'
    )
  }

  const handleDisconnect = async () => {
    const result = await run(
      disconnectReminderEmail,
      'Your reminder email has been disconnected.'
    )

    if (!result) return

    setChoice('account')
    setOtherEmail('')
    setVerificationCode('')
    setNeedsCode(false)
  }

  const handleResend = async () => {
    const result = await run(
      () => requestReminderVerification(selectedEmail)
    )

    if (result?.requires_code) {
      setVerificationCode('')
      setNeedsCode(true)
      setMessage(
        'A verification code has been requested. Check your inbox.'
      )
    }
  }

  return (
    <div
      className="email-reminder-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="email-reminder-title"
    >
      <section className="email-reminder-modal">

        <button
          type="button"
          className="email-reminder-close"
          onClick={onClose}
          aria-label="Close"
        >
          <X size={20} />
        </button>

        <div className="email-reminder-heading-icon">
          <BellRing size={25} />
        </div>

        <p className="email-reminder-eyebrow">
          YOUR FUTURE, ON TRACK
        </p>

        <h2 id="email-reminder-title">
          Stay notified, don't miss out!
        </h2>

        <p className="email-reminder-copy">
          Your next big opportunity deserves a little reminder.
          Choose where and when we should notify you.
        </p>

        {loading ? (
          <div className="email-reminder-loading">
            <LoaderCircle
              size={25}
              className="email-reminder-spin"
            />
            Loading email settings...
          </div>
        ) : !prefs ? (
          <>
            <p className="email-reminder-error" role="alert">
              {error || 'Could not load reminder settings.'}
            </p>

            <button
              type="button"
              className="email-reminder-secondary"
              onClick={onClose}
            >
              Close
            </button>
          </>
        ) : (
          <>
            {prefs.reminder_email && (
              <div className="email-reminder-account">
                <Mail size={20} />

                <div>
                  <strong>{prefs.reminder_email}</strong>

                  <span>
                    {prefs.email_verified
                      ? prefs.reminders_enabled
                        ? 'Reminders are active'
                        : 'Verified • Reminders paused'
                      : 'Waiting for email verification'}
                  </span>
                </div>

                {prefs.email_verified && (
                  <CheckCircle2
                    size={20}
                    color="#359FA0"
                  />
                )}
              </div>
            )}

            <h3>Where should we email you?</h3>

            <div className="email-reminder-choices">
              <label
                className={
                  choice === 'account'
                    ? 'email-reminder-choice selected'
                    : 'email-reminder-choice'
                }
              >
                <input
                  type="radio"
                  name="reminder-email-choice"
                  checked={choice === 'account'}
                  disabled={busy}
                  onChange={() => chooseEmail('account')}
                />

                <div>
                  <strong>My account email</strong>

                  <span>
                    {prefs.account_email ||
                      'No account email available'}
                  </span>

                  <small>
                    {prefs.account_email_verified
                      ? 'Already verified'
                      : 'Verification required'}
                  </small>
                </div>

                {prefs.account_email_verified && (
                  <ShieldCheck size={20} />
                )}
              </label>

              <label
                className={
                  choice === 'other'
                    ? 'email-reminder-choice selected'
                    : 'email-reminder-choice'
                }
              >
                <input
                  type="radio"
                  name="reminder-email-choice"
                  checked={choice === 'other'}
                  disabled={busy}
                  onChange={() => chooseEmail('other')}
                />

                <div>
                  <strong>Another email</strong>

                  <span>
                    Use a different email address
                  </span>

                  <small>
                    Requires a verification code
                  </small>
                </div>

                <MailCheck size={20} />
              </label>
            </div>

            {choice === 'other' && (
              <div className="email-reminder-field">
                <label htmlFor="reminder-other-email">
                  Email address
                </label>

                <input
                  id="reminder-other-email"
                  type="email"
                  placeholder="another@gmail.com"
                  value={otherEmail}
                  disabled={busy}
                  onChange={(event) => {
                    setOtherEmail(event.target.value)
                    setNeedsCode(false)
                    setVerificationCode('')
                    setMessage('')
                    setError('')
                  }}
                />
              </div>
            )}

            {!selectedEmailVerified && !needsCode && (
              <button
                type="button"
                className="email-reminder-primary"
                disabled={busy || !selectedEmail}
                onClick={handleLinkEmail}
              >
                {busy ? (
                  <LoaderCircle
                    size={18}
                    className="email-reminder-spin"
                  />
                ) : (
                  <ShieldCheck size={18} />
                )}

                {busy
                  ? 'Please wait...'
                  : choice === 'account' &&
                    prefs.account_email_verified
                    ? 'Use my account email'
                    : 'Send verification code'}
              </button>
            )}

            {needsCode && (
              <div className="email-reminder-verification">
                <div className="email-reminder-verification-heading">
                  <MailCheck size={22} />
                  <strong>Check your inbox! ✦</strong>
                </div>

                <p>
                  Enter the six-digit verification code
                  sent to <strong>{selectedEmail}</strong>.
                </p>

                <label htmlFor="reminder-verification-code">
                  Verification code
                </label>

                <input
                  id="reminder-verification-code"
                  className="email-reminder-code-input"
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
                />

                <button
                  type="button"
                  className="email-reminder-primary"
                  disabled={
                    busy || verificationCode.length !== 6
                  }
                  onClick={handleVerifyCode}
                >
                  <ShieldCheck size={18} />
                  {busy
                    ? 'Verifying...'
                    : 'Verify my email'}
                </button>

                <button
                  type="button"
                  className="email-reminder-secondary"
                  disabled={busy}
                  onClick={handleResend}
                >
                  <RefreshCw size={17} />
                  Resend code
                </button>

                <p className="email-reminder-small-note">
                  Codes expire after 10 minutes.
                  Wait at least 60 seconds before requesting
                  another.
                </p>

                <button
                  type="button"
                  className="email-reminder-back"
                  onClick={() => {
                    setNeedsCode(false)
                    setVerificationCode('')
                  }}
                  disabled={busy}
                >
                  <ArrowLeft size={15} />
                  Change email choice
                </button>
              </div>
            )}

            {selectedEmailVerified && !needsCode && (
              <>
                <div className="email-reminder-verified">
                  <CheckCircle2 size={20} />
                  <div>
                    <strong>Email verified!</strong>
                    <span>
                      You're ready to set your reminders.
                    </span>
                  </div>
                </div>

                <h3>When should we remind you?</h3>

                <div className="email-reminder-days">
                  {DAYS.map((day) => (
                    <label
                      key={day}
                      className={
                        days.includes(day)
                          ? 'selected'
                          : ''
                      }
                    >
                      <input
                        type="checkbox"
                        checked={days.includes(day)}
                        disabled={busy}
                        onChange={() =>
                          setDays((current) =>
                            current.includes(day)
                              ? current.filter(
                                  (d) => d !== day
                                )
                              : [...current, day]
                          )
                        }
                      />

                      <span>
                        {day} day{day === 1 ? '' : 's'} before
                      </span>
                    </label>
                  ))}
                </div>

                <button
                  type="button"
                  className="email-reminder-primary"
                  disabled={busy || !days.length}
                  onClick={handleEnableReminders}
                >
                  {busy ? (
                    <LoaderCircle
                      size={18}
                      className="email-reminder-spin"
                    />
                  ) : (
                    <BellRing size={18} />
                  )}

                  {busy
                    ? 'Saving...'
                    : prefs.reminders_enabled
                      ? 'Save reminder preferences'
                      : 'Enable email reminders'}
                </button>

                {prefs.reminders_enabled && (
                  <button
                    type="button"
                    className="email-reminder-secondary"
                    disabled={busy}
                    onClick={handlePauseReminders}
                  >
                    Pause reminders
                  </button>
                )}
              </>
            )}

            {!!prefs.reminder_email && (
              <button
                type="button"
                className="email-reminder-danger"
                disabled={busy}
                onClick={handleDisconnect}
              >
                Disconnect email reminders
              </button>
            )}

            {message && (
              <p
                className="email-reminder-message"
                role="status"
              >
                {message}
              </p>
            )}

            {error && (
              <p
                className="email-reminder-error"
                role="alert"
              >
                {error}
              </p>
            )}

            <p className="email-reminder-footnote">
              You can pause or disconnect reminders anytime.
              ✦ Made for your next big thing.
            </p>
          </>
        )}
      </section>
    </div>
  )
}
