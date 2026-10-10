
import { useMemo, useState } from 'react'
import {
  AlarmClock,
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  Bell,
  Bookmark,
  CalendarDays,
  Check,
  ChevronDown,
  CircleHelp,
  Clock3,
  FileText,
  Filter,
  GraduationCap,
  Heart,
  LayoutDashboard,
  LogOut,
  Plus,
  Search,
  Sparkles,
  Target,
  BriefcaseBusiness,
} from 'lucide-react'
import './App.css'

const initialOpportunities = [
  {
    id: 1,
    title: 'Future Innovators Internship',
    organization: 'BrightTech Labs',
    type: 'Internship',
    deadline: '2026-10-18',
    status: 'Planning',
    color: 'mint',
    icon: BriefcaseBusiness,
    description: 'Build real-world projects with a technology team.',
  },
  {
    id: 2,
    title: 'Women in STEM Scholarship',
    organization: 'Global Learning Fund',
    type: 'Scholarship',
    deadline: '2026-10-24',
    status: 'Saved',
    color: 'cream',
    icon: GraduationCap,
    description: 'Funding opportunities for women pursuing STEM.',
  },
  {
    id: 3,
    title: 'Youth Impact Challenge',
    organization: 'Future Makers',
    type: 'Competition',
    deadline: '2026-11-02',
    status: 'In progress',
    color: 'orange',
    icon: Target,
    description: 'Turn a community problem into an innovative solution.',
  },
]

const filters = ['All', 'Internship', 'Scholarship', 'Job', 'Competition']

function App() {
  const [opportunities] = useState(initialOpportunities)
  const [query, setQuery] = useState('')
  const [activeFilter, setActiveFilter] = useState('All')
  const [activeNav, setActiveNav] = useState('Dashboard')

  const visibleOpportunities = useMemo(() => {
    return opportunities.filter((item) => {
      const matchesQuery =
        `${item.title} ${item.organization} ${item.type}`
          .toLowerCase()
          .includes(query.toLowerCase())

      const matchesFilter =
        activeFilter === 'All' || item.type === activeFilter

      return matchesQuery && matchesFilter
    })
  }, [opportunities, query, activeFilter])

  const daysUntil = (date) => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const deadline = new Date(`${date}T00:00:00`)
    return Math.ceil((deadline - today) / 86400000)
  }

  const formatDeadline = (date) =>
    new Date(`${date}T12:00:00`).toLocaleDateString('en', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })

  const handleNav = (name) => {
    setActiveNav(name)
    if (name === 'Add opportunity') {
      document.getElementById('add-opportunity')?.scrollIntoView({
        behavior: 'smooth',
      })
    }
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a className="brand" href="#home" aria-label="Opportune home">
          <span className="brand-mark">
            <CalendarDays size={25} strokeWidth={2.7} />
            <span className="brand-spark">✦</span>
          </span>
          <span>
            <strong>opportune</strong>
            <small>YOUR FUTURE, ON TRACK</small>
          </span>
        </a>

        <div className="sidebar-label">WORKSPACE</div>
        <nav className="nav-list" aria-label="Main navigation">
          {[
            { name: 'Dashboard', icon: LayoutDashboard },
            { name: 'My opportunities', icon: Bookmark },
            { name: 'Deadlines', icon: AlarmClock },
          ].map(({ name, icon: Icon }) => (
            <button
              key={name}
              className={`nav-item ${activeNav === name ? 'active' : ''}`}
              onClick={() => handleNav(name)}
            >
              <Icon size={19} />
              <span>{name}</span>
              {name === 'Deadlines' && (
                <span className="nav-count">3</span>
              )}
            </button>
          ))}
        </nav>

        <div className="sidebar-label second-label">YOUR SPACE</div>
        <nav className="nav-list">
          <button
            className={`nav-item ${activeNav === 'Favorites' ? 'active' : ''}`}
            onClick={() => handleNav('Favorites')}
          >
            <Heart size={19} />
            <span>Favorites</span>
          </button>
          <button
            className={`nav-item ${activeNav === 'Documents' ? 'active' : ''}`}
            onClick={() => handleNav('Documents')}
          >
            <FileText size={19} />
            <span>Documents</span>
          </button>
        </nav>

        <div className="sidebar-bottom">
          <div className="mascot-card">
            <div className="mascot-star">✦</div>
            <Sparkles size={24} />
            <strong>Big dreams?</strong>
            <span>Let's keep track of every single one.</span>
            <button onClick={() => handleNav('Add opportunity')}>
              Add one <ArrowRight size={15} />
            </button>
          </div>

          <button className="nav-item help-item" onClick={() => alert('Help center coming soon!')}>
            <CircleHelp size={19} />
            <span>Help & tips</span>
          </button>
          <div className="profile">
            <div className="avatar">O</div>
            <div className="profile-copy">
              <strong>Opportunity hunter</strong>
              <span>Keep shining!</span>
            </div>
            <LogOut size={17} className="logout-icon" />
          </div>
        </div>
      </aside>

      <main className="main-content" id="home">
        <header className="topbar">
          <div className="breadcrumb">
            <span>Workspace</span>
            <span className="breadcrumb-dot">/</span>
            <strong>{activeNav}</strong>
          </div>
          <div className="topbar-right">
            <span className="today-label">
              <CalendarDays size={16} />
              {new Date().toLocaleDateString('en', {
                weekday: 'short',
                day: 'numeric',
                month: 'short',
              })}
            </span>
            <button
              className="icon-button notification-button"
              aria-label="Notifications"
              onClick={() => alert('Reminder notifications are coming soon!')}
            >
              <Bell size={19} />
              <span />
            </button>
            <div className="mini-avatar">O</div>
          </div>
        </header>

        <div className="dashboard-content">
          <section className="welcome-row">
            <div>
              <div className="eyebrow"><Sparkles size={15} /> YOUR LITTLE LAUNCHPAD</div>
              <h1>Your next big thing <span>starts here.</span></h1>
              <p className="welcome-copy">
                Every opportunity deserves a chance. We'll help you remember yours.
              </p>
            </div>
            <div className="welcome-doodle" aria-hidden="true">
              <div className="doodle-circle"><Target size={40} /></div>
              <span className="doodle-star star-one">✦</span>
              <span className="doodle-star star-two">✳</span>
            </div>
          </section>

          <section className="hero-banner">
            <div className="hero-copy">
              <span className="hero-pill"><Sparkles size={14} /> YOUR OPPORTUNITY ASSISTANT</span>
              <h2>Found something exciting?</h2>
              <p>Drop the link. Let AI do the reading.<br />You focus on making it happen.</p>
              <button
                id="add-opportunity"
                className="primary-button"
                onClick={() => alert('Next, we will connect this button to AI extraction.')}
              >
                <Plus size={18} /> Track an opportunity <ArrowRight size={17} />
              </button>
            </div>
            <div className="hero-illustration" aria-hidden="true">
              <div className="illustration-sun" />
              <div className="illustration-paper">
                <div className="paper-top"><span /><span /><span /></div>
                <div className="paper-check"><Check size={25} /></div>
                <div className="paper-line line-long" />
                <div className="paper-line" />
                <div className="paper-line line-short" />
                <div className="paper-star">✦</div>
              </div>
              <div className="illustration-clock"><Clock3 size={29} /></div>
              <span className="illustration-spark spark-a">✦</span>
              <span className="illustration-spark spark-b">✳</span>
            </div>
          </section>

          <section className="stats-grid" aria-label="Opportunity summary">
            <article className="stat-card stat-mint">
              <div className="stat-top"><span>ALL SAVED</span><Bookmark size={19} /></div>
              <div className="stat-number">{opportunities.length.toString().padStart(2, '0')}</div>
              <div className="stat-bottom"><span>Opportunities in your corner</span><ArrowUpRight size={16} /></div>
              <div className="stat-decoration">✳</div>
            </article>
            <article className="stat-card stat-cream">
              <div className="stat-top"><span>CLOSING SOON</span><AlarmClock size={19} /></div>
              <div className="stat-number">
                {opportunities.filter((item) => {
                  const days = daysUntil(item.deadline)
                  return days >= 0 && days <= 14
                }).length.toString().padStart(2, '0')}
              </div>
              <div className="stat-bottom"><span>Time to take action!</span><ArrowDownRight size={16} /></div>
              <div className="stat-decoration">✦</div>
            </article>
            <article className="stat-card stat-peach">
              <div className="stat-top"><span>IN PROGRESS</span><Target size={19} /></div>
              <div className="stat-number">
                {opportunities.filter((item) => item.status === 'In progress').length.toString().padStart(2, '0')}
              </div>
              <div className="stat-bottom"><span>You're making moves</span><ArrowUpRight size={16} /></div>
              <div className="stat-decoration">✳</div>
            </article>
          </section>

          <section className="opportunities-section">
            <div className="section-heading">
              <div>
                <div className="section-kicker">YOUR COLLECTION</div>
                <h2>Opportunities to chase <span>✦</span></h2>
                <p>Little steps today, big wins tomorrow.</p>
              </div>
              <button className="secondary-button" onClick={() => handleNav('My opportunities')}>
                View all <ArrowRight size={16} />
              </button>
            </div>

            <div className="toolbar">
              <label className="search-box">
                <Search size={18} />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search your opportunities..."
                  aria-label="Search opportunities"
                />
              </label>
              <button className="filter-button" onClick={() => setActiveFilter('All')}>
                <Filter size={17} /> Reset filters <ChevronDown size={15} />
              </button>
            </div>

            <div className="filter-tabs" aria-label="Filter by type">
              {filters.map((filter) => (
                <button
                  key={filter}
                  className={`filter-tab ${activeFilter === filter ? 'selected' : ''}`}
                  onClick={() => setActiveFilter(filter)}
                >
                  {filter}
                </button>
              ))}
            </div>

            <div className="opportunity-list">
              {visibleOpportunities.map((item) => {
                const Icon = item.icon
                const days = daysUntil(item.deadline)

                return (
                  <article className="opportunity-card" key={item.id}>
                    <div className={`opportunity-icon ${item.color}`}>
                      <Icon size={24} />
                    </div>
                    <div className="opportunity-info">
                      <div className="opportunity-title-row">
                        <h3>{item.title}</h3>
                        <span className="type-tag">{item.type}</span>
                      </div>
                      <p className="organization">{item.organization}</p>
                      <p className="opportunity-description">{item.description}</p>
                      <div className="opportunity-meta">
                        <span><CalendarDays size={15} /> {formatDeadline(item.deadline)}</span>
                        <span className={days >= 0 && days <= 7 ? 'urgent' : ''}>
                          <Clock3 size={15} />
                          {days < 0 ? 'Deadline passed' : days === 0 ? 'Due today!' : `${days} days left`}
                        </span>
                      </div>
                    </div>
                    <div className="opportunity-actions">
                      <span className={`status-tag ${item.status.toLowerCase().replace(' ', '-')}`}>
                        {item.status}
                      </span>
                      <button
                        className="icon-button open-opportunity"
                        aria-label={`Open ${item.title}`}
                        onClick={() => alert('Opportunity details will be connected to Django next.')}
                      >
                        <ArrowUpRight size={19} />
                      </button>
                    </div>
                  </article>
                )
              })}

              {visibleOpportunities.length === 0 && (
                <div className="empty-state">
                  <Search size={28} />
                  <h3>No matching opportunities yet</h3>
                  <p>Try another search or select a different category.</p>
                  <button className="secondary-button" onClick={() => {
                    setQuery('')
                    setActiveFilter('All')
                  }}>
                    Clear filters
                  </button>
                </div>
              )}
            </div>

            <div className="bottom-note">
              <span className="note-icon"><Sparkles size={18} /></span>
              <p><strong>A little reminder:</strong> saving an opportunity is the first step. Taking action is where the magic happens.</p>
            </div>
          </section>

          <footer className="footer">
            <span>Made with <Heart size={13} fill="currentColor" /> for your next big thing.</span>
            <span>OPPORTUNE © {new Date().getFullYear()}</span>
          </footer>
        </div>
      </main>
    </div>
  )
}

export default App
