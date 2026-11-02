
import {
  ArrowRight,
  CalendarDays,
  Check,
  Clock3,
  FileText,
  Mail,
  Sparkles,
  Target,
} from 'lucide-react'

import '../LandingPage.css'

export default function LandingPage({
  onSignIn,
  onGetStarted,
}) {
  return (
    <div className="landing-page">
      <header className="landing-navbar">
        <a className="landing-brand" href="/">
          <span className="landing-brand-icon">
            <CalendarDays size={23} />
          </span>
          <span>opportune<span className="landing-dot">.</span></span>
        </a>

        <div className="landing-nav-actions">
          <button
            type="button"
            className="landing-signin"
            onClick={onSignIn}
          >
            Sign in
          </button>

          <button
            type="button"
            className="landing-button landing-button-small"
            onClick={onGetStarted}
          >
            Get started <ArrowRight size={16} />
          </button>
        </div>
      </header>

      <main>
        <section className="landing-hero">
          <div className="landing-hero-copy">
            <h1>
              Big dreams.
              <br />
              <span>Zero missed</span>
              <br />
              opportunities.
            </h1>

            <p>
              Scholarships, internships, jobs, grants and
              competitions. keep them all in one
              space. Let Opportune help you organize the
              details and stay on top of deadlines.
            </p>

            <div className="landing-hero-actions">
              <button
                type="button"
                className="landing-button"
                onClick={onGetStarted}
              >
                Start for free <ArrowRight size={18} />
              </button>
              <a className="landing-learn" href="#features">
  Explore features
</a>
            </div>

          </div>

          <div className="landing-hero-visual" aria-label="Example opportunity tracker preview">
            <div className="landing-decoration landing-decoration-one" />
            <div className="landing-decoration landing-decoration-two" />

            <div className="landing-preview">
              <div className="landing-preview-header">
                <span className="landing-preview-logo">
                  <CalendarDays size={20} />
                </span>
                <div>
                  <strong>My opportunities</strong>
                  <small>Your future, organized ✦</small>
                </div>
              </div>

              <div className="landing-preview-summary">
                <div>
                  <small>YOUR SPACE</small>
                  <strong>Dreams in progress ✨</strong>
                </div>
                <span className="landing-preview-count">03</span>
              </div>

              <div className="landing-preview-item">
                <span className="landing-preview-item-icon mint">
                  <Target size={19} />
                </span>
                <div>
                  <strong>Scholarship application</strong>
                  <small>Planning to apply</small>
                </div>
                <span className="landing-preview-status">Saved</span>
              </div>

              <div className="landing-preview-item">
                <span className="landing-preview-item-icon orange">
                  <FileText size={19} />
                </span>
                <div>
                  <strong>Software internship</strong>
                  <small>Application in progress</small>
                </div>
                <Check size={18} className="landing-preview-check" />
              </div>

              <div className="landing-preview-item">
                <span className="landing-preview-item-icon cream">
                  <Sparkles size={19} />
                </span>
                <div>
                  <strong>Creative grant</strong>
                  <small>Documents to prepare</small>
                </div>
                <Clock3 size={18} color="#df875c" />
              </div>
            </div>

            <div className="landing-floating-note">
              <span>✦</span> Stay ahead of deadlines!
            </div>
          </div>
        </section>

        <section id="features" className="landing-features">
          <div className="landing-section-heading">
            <h2>Less organizing. More achieving.</h2>
            <p>
              Spend less time tracking details and more time
              applying for opportunities that matter.
            </p>
          </div>

          <div className="landing-feature-grid">
            <article className="landing-feature-card feature-mint">
              <span className="landing-feature-icon">
                <Sparkles size={25} />
              </span>
              <h3>Smart extraction</h3>
              <p>
                Paste an opportunity link or its text, and let
                AI organize the important application details.
              </p>
            </article>

            <article className="landing-feature-card feature-cream">
              <span className="landing-feature-icon">
                <CalendarDays size={25} />
              </span>
              <h3>Deadline tracking</h3>
              <p>
                Keep your application deadlines visible and
                know what needs your attention.
              </p>
            </article>

            <article className="landing-feature-card feature-peach">
              <span className="landing-feature-icon">
                <Mail size={25} />
              </span>
              <h3>Email reminders</h3>
              <p>
                Connect a verified email address to receive
                deadline reminders for your saved opportunities.
              </p>
            </article>
          </div>
        </section>

        <section className="landing-cta">
          <Sparkles size={30} />
          <h2>Your next opportunity is waiting.</h2>
          <p>Give your ambitions a place to grow.</p>
          <button
            type="button"
            className="landing-button"
            onClick={onGetStarted}
          >
            Get started <ArrowRight size={18} />
          </button>
        </section>
      </main>

      <footer className="landing-footer">
        <span>© {new Date().getFullYear()} Opportune</span>
        <span>Made for your next big thing ✦</span>
      </footer>
    </div>
  )
}
