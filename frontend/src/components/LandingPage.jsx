import { useState } from 'react'
import {
  ArrowRight,
  BellRing,
  BookmarkCheck,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronDown,
  FileText,
  GraduationCap,
  Link2,
  LoaderCircle,
  Mail,
  NotebookPen,
  ShieldCheck,
  Sparkles,
  Target,
  WandSparkles,
  X,
} from 'lucide-react'

import '../LandingPage.css'
import SiteFooter from './SiteFooter'

const features = [
  {
    title: 'AI-powered extraction',
    description: 'Paste an opportunity link or its text and turn scattered information into a useful draft.',
    detail: 'Review the title, organization, eligibility, documents, and deadline before saving.',
    icon: WandSparkles,
    color: 'mint',
  },
  {
    title: 'Deadline tracking',
    description: 'Keep upcoming applications in one place instead of chasing dates across tabs.',
    detail: 'Track the opportunities that need attention and get reminders through your verified email.',
    icon: CalendarDays,
    color: 'cream',
  },
  {
    title: 'Notes & reminders',
    description: 'Save the details, links, and ideas you do not want to lose.',
    detail: 'Add personal notes and schedule an email reminder for a future time window.',
    icon: NotebookPen,
    color: 'peach',
  },
  {
    title: 'One organized dashboard',
    description: 'Manage scholarships, internships, grants, jobs, and competitions together.',
    detail: 'Move opportunities from saved to in progress and submitted as you take action.',
    icon: BookmarkCheck,
    color: 'sky',
  },
]

const plans = [
  {
    name: 'Free',
    price: '$0',
    description: 'Start organizing opportunities today.',
    features: [
      'Save and track opportunities',
      'AI-assisted extraction',
      'Deadline email reminders',
      'Personal notes and reminders',
    ],
    available: true,
  },
  {
    name: 'Student Plus',
    price: '$3',
    description: 'A proposed plan for active applicants.',
    features: [
      'Everything in Free',
      'Higher AI extraction allowances',
      'Enhanced planning tools',
      'More customization options',
    ],
    available: false,
    featured: true,
  },
  {
    name: 'Pro',
    price: '$7',
    description: 'A proposed plan for power users.',
    features: [
      'Everything in Student Plus',
      'Advanced application insights',
      'Export and integration options',
      'Priority support options',
    ],
    available: false,
  },
]

function formatDeadline(value) {
  if (!value) return 'Not found — add it manually'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return String(value)
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  })
}

function displayText(value) {
  if (Array.isArray(value)) {
    return value.length ? value.join(', ') : 'Not found — add it manually'
  }
  if (value && typeof value === 'object') return 'Review in your dashboard'
  return String(value || '').trim() || 'Not found — add it manually'
}

export default function LandingPage({ onSignIn, onGetStarted }) {
  const [url, setUrl] = useState('')
  const [preview, setPreview] = useState(null)
  const [extracting, setExtracting] = useState(false)
  const [demoError, setDemoError] = useState('')
  const [activeFeature, setActiveFeature] = useState(null)

  async function handleExtract(event) {
    event.preventDefault()
    if (extracting) return
    setDemoError('')
    setPreview(null)

    let checkedUrl
    try {
      checkedUrl = new URL(url.trim())
      if (!['http:', 'https:'].includes(checkedUrl.protocol)) throw new Error('Invalid protocol')
    } catch {
      setDemoError('Please paste a complete public link beginning with https:// or http://.')
      return
    }

    const apiBase = (import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api')
      .replace(/\/+$/, '')
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 25000)
    setExtracting(true)

    try {
      // Separate public endpoint required. Do NOT expose the authenticated
      // /opportunities/extract/ endpoint or an AI provider key in the browser.
      const response = await fetch(`${apiBase}/opportunities/preview/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'omit',
        body: JSON.stringify({ url: checkedUrl.toString() }),
        signal: controller.signal,
      })

      let body = null
      try { body = await response.json() } catch { /* Non-JSON response */ }

      if (!response.ok) {
        if ([401, 403, 404].includes(response.status)) {
          throw new Error('Guest extraction is not available yet. Sign in to extract your link.')
        }
        if (response.status === 429) {
          throw new Error('The guest demo limit has been reached. Try again later or create a free account.')
        }
        throw new Error('We couldn’t preview that link right now. You can still create an account and save it manually.')
      }

      const extracted = body?.data ?? body?.draft ?? body?.extracted ?? body?.opportunity ?? body
      if (!extracted || typeof extracted !== 'object' || Array.isArray(extracted)) {
        throw new Error('This link did not provide enough details for a preview. You can still save it after signing in.')
      }
      if (!extracted.title && !extracted.organization && !extracted.deadline) {
        throw new Error('We couldn’t find enough details in that link. You can still save it manually.')
      }
      setPreview(extracted)
    } catch (error) {
      setDemoError(error?.name === 'AbortError'
        ? 'That link took too long to load. Please try again or save it manually after signing in.'
        : error?.message || 'Preview is unavailable right now. Please try again.')
    } finally {
      clearTimeout(timeoutId)
      setExtracting(false)
    }
  }

  const previewFields = preview ? [
    { label: 'Title', value: displayText(preview.title || preview.page_title), icon: FileText },
    { label: 'Organization', value: displayText(preview.organization), icon: GraduationCap },
    { label: 'Deadline', value: formatDeadline(preview.deadline), icon: CalendarDays },
    { label: 'Eligibility', value: displayText(preview.eligibility), icon: Target },
    { label: 'Required documents', value: displayText(preview.required_documents), icon: FileText },
  ] : []

  return (
    <div className="landing-page">
      <header className="landing-navbar">
        <a className="landing-brand" href="/" aria-label="Opportune homepage">
          <span className="landing-brand-icon"><CalendarDays size={22} /></span>
          <span>opportune<span className="landing-dot">.</span></span>
        </a>
        <nav className="landing-nav-links" aria-label="Main navigation">
          <a href="#features">Features</a>
          <a href="#pricing">Pricing</a>
          <a href="#how-it-works">How it works</a>
          <a href="/help">Help</a>
        </nav>
        <div className="landing-nav-actions">
          <button type="button" className="landing-signin" onClick={onSignIn}>Sign in</button>
          <button type="button" className="landing-button landing-button-small" onClick={onGetStarted}>
            Get started <ArrowRight size={16} />
          </button>
        </div>
      </header>

      <main>
        <section className="landing-hero" aria-labelledby="landing-headline">
          <div className="landing-hero-copy">
            <h1 id="landing-headline">
              Big dreams.<br />
              <span>Zero missed</span><br />
              opportunities.
            </h1>
            <p>
              Scholarships, internships, jobs, grants and competitions,
              all in one space. Let Opportune organize the details so
              you can focus on applying.
            </p>
            <div className="landing-hero-actions">
              <button type="button" className="landing-button" onClick={onGetStarted}>
                Start for free <ArrowRight size={18} />
              </button>
            </div>
          </div>

          <section className="landing-demo-card" id="demo" aria-labelledby="landing-demo-heading">
            <div className="landing-demo-heading">
              <span className="landing-demo-icon"><Link2 size={23} /></span>
              <div>
                <h2 id="landing-demo-heading">Try Opportune before signing up</h2>
                <p>Paste a public opportunity link and extract its details before signing up.</p>
              </div>
            </div>

            <form className="landing-demo-form" onSubmit={handleExtract}>
              <label htmlFor="landing-demo-url">Opportunity link</label>
              <div className="landing-demo-form-row">
                <div className="landing-demo-input-wrap">
                  <Link2 size={18} aria-hidden="true" />
                  <input
                    id="landing-demo-url"
                    type="url"
                    inputMode="url"
                    placeholder="https://example.org/opportunity"
                    value={url}
                    maxLength={2000}
                    autoComplete="url"
                    onChange={(event) => {
                      setUrl(event.target.value)
                      setPreview(null)
                      setDemoError('')
                    }}
                    disabled={extracting}
                    required
                  />
                  {url && !extracting && (
                    <button type="button" className="landing-input-clear" aria-label="Clear link" onClick={() => { setUrl(''); setPreview(null); setDemoError('') }}><X size={17} /></button>
                  )}
                </div>
                <button type="submit" className="landing-button landing-extract-button" disabled={extracting}>
                  {extracting ? <LoaderCircle size={17} className="landing-spin" /> : <Sparkles size={17} />}
                  {extracting ? 'Extracting…' : 'Extract'}
                </button>
              </div>
              <p className="landing-demo-hint">Public opportunity links only · Information may need review</p>
            </form>

            {demoError && <div className="landing-demo-error" role="alert"><BellRing size={18} /> <span>{demoError}</span></div>}

            {extracting && (
              <div className="landing-demo-progress" role="status" aria-live="polite">
                <LoaderCircle size={18} className="landing-spin" />
                Extracting opportunity details…
              </div>
            )}

            {preview && (
              <div className="landing-result" aria-live="polite">
                <div className="landing-result-header">
                  <span><CheckCircle2 size={17} /> Opportunity preview ready</span>
                  <span className="landing-result-badge">Preview</span>
                </div>
                <div className="landing-result-fields">
                  {previewFields.map(({ label, value, icon: Icon }, index) => (
                    <div className="landing-result-row" key={label}>
                      <span className={`landing-result-field-icon landing-field-${index}`}>
                        <Icon size={16} />
                      </span>
                      <strong>{label}</strong>
                      <span>{value}</span>
                    </div>
                  ))}
                </div>
                <div className="landing-demo-save">
                  <div>
                    <Sparkles size={17} />
                    <span>Like what you see? Create an account to save and track it.</span>
                  </div>
                  <button type="button" onClick={onGetStarted}>
                    Create account <ArrowRight size={16} />
                  </button>
                </div>
                <p className="landing-demo-disclaimer">
                  AI can miss information. Always verify details against the original source.
                </p>
              </div>
            )}
          </section>
        </section>

        <section id="features" className="landing-features" aria-labelledby="features-title">
          <div className="landing-section-heading">
            <h2 id="features-title">Less organizing.<br /><span>More achieving.</span></h2>
            <p>Everything you need to go from “I found an opportunity” to “I applied!”</p>
          </div>
          <div className="landing-feature-grid">
            {features.map(({ title, description, detail, icon: Icon, color }, index) => (
              <article key={title} className={`landing-feature-card feature-${color} ${activeFeature === index ? 'is-expanded' : ''}`}>
                <span className="landing-feature-icon"><Icon size={27} /></span>
                <h3>{title}</h3>
                <p>{description}</p>
                {activeFeature === index && <p className="landing-feature-detail">{detail}</p>}
                <button type="button" className="landing-feature-more" aria-expanded={activeFeature === index} aria-label={`${activeFeature === index ? 'Show less about' : 'Learn more about'} ${title}`} onClick={() => setActiveFeature(activeFeature === index ? null : index)}>
                  {activeFeature === index ? <ChevronDown size={18} className="landing-chevron-up" /> : <ArrowRight size={18} />}
                </button>
              </article>
            ))}
          </div>
        </section>

        <section className="landing-how" id="how-it-works" aria-labelledby="how-heading">
          <div className="landing-section-heading">
            <h2 id="how-heading">From link to action in three steps.</h2>
          </div>
          <div className="landing-steps">
            <div><span className="landing-step-num">01</span><Link2 size={24} /><h3>Paste a link</h3><p>Start with an opportunity you discover online.</p></div>
            <div><span className="landing-step-num">02</span><WandSparkles size={24} /><h3>Review the details</h3><p>Let AI prepare a draft, then check and edit it.</p></div>
            <div><span className="landing-step-num">03</span><BellRing size={24} /><h3>Take action</h3><p>Save, track your progress, and receive reminders.</p></div>
          </div>
        </section>

        <section className="landing-pricing" id="pricing" aria-labelledby="pricing-heading">
          <div className="landing-section-heading">
            <span className="landing-section-tag">PLANS & PRICING</span>
            <h2 id="pricing-heading">Start free. Grow at your pace.</h2>
            <p>Opportune is free to get started. Paid plans below are concepts we're exploring for the future.</p>
          </div>
          <div className="landing-pricing-grid">
            {plans.map((plan) => (
              <article key={plan.name} className={`landing-plan ${plan.featured ? 'landing-plan-featured' : ''}`}>
                {plan.featured && <span className="landing-plan-highlight"><Sparkles size={13} /> Proposed favorite</span>}
                <div className="landing-plan-top">
                  <span className="landing-plan-name">{plan.name}</span>
                  {!plan.available && <span className="landing-plan-coming">Coming soon</span>}
                </div>
                <p className="landing-plan-desc">{plan.description}</p>
                <div className="landing-plan-price">{plan.price}<span>/month</span></div>
                {!plan.available && <small className="landing-price-disclaimer">Illustrative price — not available for purchase</small>}
                <ul>
                  {plan.features.map((feature) => <li key={feature}><Check size={17} /><span>{feature}</span></li>)}
                </ul>
                {plan.available ? (
                  <button className="landing-button landing-plan-button" type="button" onClick={onGetStarted}>Get started free <ArrowRight size={16} /></button>
                ) : (
                  <button className="landing-plan-unavailable" type="button" disabled aria-label={`${plan.name} plan coming soon`}>Coming soon</button>
                )}
              </article>
            ))}
          </div>
          <p className="landing-pricing-note"><ShieldCheck size={16} /> No paid subscriptions or checkout are available yet. Plans and prices may change.</p>
        </section>

        <section className="landing-cta">
          <h2>Your next opportunity is waiting.</h2>
          <p>Give your ambitions a place to grow.</p>
          <button type="button" className="landing-button" onClick={onGetStarted}>Get started for free <ArrowRight size={18} /></button>
          <div className="landing-cta-note"><Mail size={15} /> Keep your opportunities, notes, and deadline reminders together.</div>
        </section>
      </main>
      <SiteFooter />
    </div>
  )
}
