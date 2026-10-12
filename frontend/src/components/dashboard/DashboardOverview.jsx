import {
  AlarmClock,
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  Bookmark,
  Check,
  Clock3,
  Plus,
  Sparkles,
  Target,
  X,
} from 'lucide-react'

export default function DashboardOverview({
  notice,
  setNotice,
  error,
  loadOpportunities,
  opportunities,
  totalClosingSoon,
  inProgressCount,
  openAddModal,
}) {
  return (
    <>
      <section className="welcome-row">
        <div>
          <div className="eyebrow">
            <Sparkles size={15} /> YOUR LITTLE LAUNCHPAD
          </div>
          <h1>
            Your next big thing <span>starts here.</span>
          </h1>
          <p className="welcome-copy">
            Every opportunity deserves a chance. We'll help you remember yours.
          </p>
        </div>

        <div className="welcome-doodle" aria-hidden="true">
          <div className="doodle-circle">
            <Target size={40} />
          </div>
          <span className="doodle-star star-one">✦</span>
          <span className="doodle-star star-two">✳</span>
        </div>
      </section>

      <section className="hero-banner">
        <div className="hero-copy">
          <span className="hero-pill">
            <Sparkles size={14} /> YOUR OPPORTUNITY ASSISTANT
          </span>
          <h2>Found something exciting?</h2>
          <p>
            Drop the link. Let AI do the reading.
            <br />
            You focus on making it happen.
          </p>
          <button
            id="add-opportunity"
            className="primary-button"
            onClick={openAddModal}
          >
            <Plus size={18} /> Track an opportunity <ArrowRight size={17} />
          </button>
        </div>

        <div className="hero-illustration" aria-hidden="true">
          <div className="illustration-sun" />
          <div className="illustration-paper">
            <div className="paper-top">
              <span />
              <span />
              <span />
            </div>
            <div className="paper-check">
              <Check size={25} />
            </div>
            <div className="paper-line line-long" />
            <div className="paper-line" />
            <div className="paper-line line-short" />
            <div className="paper-star">✦</div>
          </div>
          <div className="illustration-clock">
            <Clock3 size={29} />
          </div>
          <span className="illustration-spark spark-a">✦</span>
          <span className="illustration-spark spark-b">✳</span>
        </div>
      </section>

      {notice && (
        <div
          role="status"
          style={{
            padding: '12px 16px',
            marginBottom: 18,
            borderRadius: 12,
            background: '#e8f8f4',
            color: '#245d5d',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <Check size={18} />
          {notice}
          <button
            aria-label="Dismiss notification"
            onClick={() => setNotice('')}
            style={{
              marginLeft: 'auto',
              border: 0,
              background: 'transparent',
              cursor: 'pointer',
              color: 'inherit',
            }}
          >
            <X size={16} />
          </button>
        </div>
      )}

      {error && (
        <div
          role="alert"
          style={{
            padding: '12px 16px',
            marginBottom: 18,
            borderRadius: 12,
            background: '#fff0e9',
            color: '#9b3c25',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          {error}
          <button
            onClick={loadOpportunities}
            className="secondary-button"
          >
            Try again
          </button>
        </div>
      )}

      <section className="stats-grid" aria-label="Opportunity summary">
        <article className="stat-card stat-mint">
          <div className="stat-top">
            <span>ALL SAVED</span>
            <Bookmark size={19} />
          </div>
          <div className="stat-number">
            {String(opportunities.length).padStart(2, '0')}
          </div>
          <div className="stat-bottom">
            <span>Opportunities in your corner</span>
            <ArrowUpRight size={16} />
          </div>
          <div className="stat-decoration">✳</div>
        </article>

        <article className="stat-card stat-cream">
          <div className="stat-top">
            <span>CLOSING SOON</span>
            <AlarmClock size={19} />
          </div>
          <div className="stat-number">
            {String(totalClosingSoon).padStart(2, '0')}
          </div>
          <div className="stat-bottom">
            <span>Time to take action!</span>
            <ArrowDownRight size={16} />
          </div>
          <div className="stat-decoration">✦</div>
        </article>

        <article className="stat-card stat-peach">
          <div className="stat-top">
            <span>IN PROGRESS</span>
            <Target size={19} />
          </div>
          <div className="stat-number">
            {String(inProgressCount).padStart(2, '0')}
          </div>
          <div className="stat-bottom">
            <span>You're making moves</span>
            <ArrowUpRight size={16} />
          </div>
          <div className="stat-decoration">✳</div>
        </article>
      </section>
    </>
  )
}
