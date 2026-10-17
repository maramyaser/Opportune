import { useEffect, useState } from 'react'
import { BellRing, CheckCircle2, Mail, ShieldCheck, X } from 'lucide-react'
import '../EmailReminderCard.css'
import { getEmailReminderPreferences, requestEmailVerification, patchEmailReminderPreferences, disconnectEmailReminders } from '../services/api'

const DAYS = [7, 3, 1]
export default function EmailReminderCard({ onClose }) {
  const [prefs, setPrefs] = useState(null)
  const [days, setDays] = useState([7,3,1])
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const refresh = async () => { const data = await getEmailReminderPreferences(); setPrefs(data); setDays(data.reminder_days || [7,3,1]) }
  useEffect(() => { refresh().catch(e => setError(e?.response?.data?.detail || 'Could not load settings.')) }, [])
  const run = async fn => { setBusy(true); setError(''); setMessage(''); try { const result = await fn(); setMessage(result?.detail || 'Settings updated.'); await refresh() } catch(e) { setError(e?.response?.data?.detail || 'Something went wrong. Try again.') } finally { setBusy(false) } }
  if (!prefs) return <div className="email-reminder-overlay" role="dialog" aria-modal="true"><section className="email-reminder-modal">Loading email settings…</section></div>
  return <div className="email-reminder-overlay" role="dialog" aria-modal="true" aria-labelledby="email-reminder-title">
    <section className="email-reminder-modal">
      <button className="email-reminder-close" onClick={onClose} aria-label="Close"><X size={20}/></button>
      <div className="email-reminder-heading-icon"><BellRing size={25}/></div>
      <p className="email-reminder-eyebrow">YOUR FUTURE, ON TRACK</p>
      <h2 id="email-reminder-title">Stay notified, don't miss out!</h2>
      <p className="email-reminder-copy">Get helpful reminders before opportunity deadlines.</p>
      <div className="email-reminder-account"><Mail size={20}/><div><strong>{prefs.email || 'No account email found'}</strong><span>{prefs.email_verified ? 'Email verified' : 'Verification required'}</span></div>{prefs.email_verified && <CheckCircle2 size={20}/>}</div>
      {!prefs.email_verified ? <button className="email-reminder-primary" disabled={busy || !prefs.email} onClick={() => run(requestEmailVerification)}><ShieldCheck size={18}/>{busy ? 'Sending…' : 'Send verification link'}</button> : <>
        <h3>When should we remind you?</h3><div className="email-reminder-days">{DAYS.map(day => <label key={day} className={days.includes(day) ? 'selected' : ''}><input type="checkbox" checked={days.includes(day)} onChange={() => setDays(old => old.includes(day) ? old.filter(x => x !== day) : [...old,day])}/><span>{day} day{day === 1 ? '' : 's'} before</span></label>)}</div>
        <button className="email-reminder-primary" disabled={busy || !days.length} onClick={() => run(() => patchEmailReminderPreferences({reminder_days:days,reminders_enabled:true}))}>{busy ? 'Saving…' : prefs.reminders_enabled ? 'Save reminder preferences' : 'Enable email reminders'}</button>
        {prefs.reminders_enabled && <button className="email-reminder-secondary" disabled={busy} onClick={() => run(() => patchEmailReminderPreferences({reminders_enabled:false,reminder_days:days}))}>Pause reminders</button>}
        <button className="email-reminder-danger" disabled={busy} onClick={() => run(disconnectEmailReminders)}>Disconnect email reminders</button>
      </>}
      {message && <p className="email-reminder-message" role="status">{message}</p>}{error && <p className="email-reminder-error" role="alert">{error}</p>}
      <p className="email-reminder-footnote">You can pause or disconnect reminders at any time.</p>
    </section>
  </div>
}
