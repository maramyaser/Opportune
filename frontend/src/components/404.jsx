import { CalendarDays, Clock3, ArrowLeft, LayoutDashboard } from 'lucide-react'
import '../404.css'

function NotFound() {
  const goBack = () => {
    if (window.history.length > 1) window.history.back()
    else window.location.href = '/'
  }

  return (
    <div className="nf-page">
      <header className="nf-top">
        <a className="nf-brand" href="/" aria-label="Opportune home">
          <span className="nf-brand-mark">
            <CalendarDays size={25} strokeWidth={2.7} />
            <span className="nf-brand-spark">✦</span>
          </span>
          <span>
            <strong>opportune</strong>
            <small>YOUR FUTURE, ON TRACK</small>
          </span>
        </a>
      </header>

      <main className="nf-main">
        <section className="nf-panel" aria-labelledby="nf-title">
          <div className="nf-digits" aria-hidden="true">
            <div className="nf-digit">4</div>
            <div className="nf-digit">
              <Clock3 strokeWidth={2.6} />
            </div>
            <div className="nf-digit">4</div>
            <span className="nf-spark nf-spark-one">✦</span>
            <span className="nf-spark nf-spark-two">✳</span>
          </div>

          <h1 id="nf-title">This page missed its deadline.</h1>
          <p>
            We couldn't find the page you were looking for. The link may be
            broken, or the page may have moved.
          </p>

          <div className="nf-actions">
            <a className="nf-btn nf-primary" href="/">
              <LayoutDashboard size={17} /> Back to dashboard
            </a>
            <button className="nf-btn nf-secondary" type="button" onClick={goBack}>
              <ArrowLeft size={17} /> Go back
            </button>
          </div>
        </section>
      </main>

      <footer className="nf-footer">OPPORTUNE © {new Date().getFullYear()}</footer>
    </div>
  )
}

export default NotFound