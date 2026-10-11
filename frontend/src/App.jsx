import { useCallback, useEffect, useMemo, useState } from 'react'
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
  LoaderCircle,
  X,
  Trash2,
  ExternalLink,
  PanelLeftClose,
  PanelLeftOpen,
  Star,
} from 'lucide-react'
import {
  createOpportunity,
  deleteOpportunity,
  extractOpportunity,
  getOpportunities,
  updateOpportunity,
  logout,
} from './services/api'
import './App.css'
import Auth from './Auth'

const filters = ['All', 'Internship', 'Scholarship', 'Job', 'Competition']

const opportunityColors = {
  internship: 'mint',
  scholarship: 'cream',
  job: 'orange',
  competition: 'orange',
  fellowship: 'mint',
  other: 'cream',
}

const opportunityIcons = {
  internship: BriefcaseBusiness,
  scholarship: GraduationCap,
  job: BriefcaseBusiness,
  competition: Target,
  fellowship: Sparkles,
  other: Bookmark,
}

const getType = (item) => item.opportunity_type || item.type || 'Other'

const getDateDays = (date) => {
  if (!date) return null
  const parsed = new Date(`${String(date).slice(0, 10)}T00:00:00`)
  if (Number.isNaN(parsed.getTime())) return null
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return Math.ceil((parsed.getTime() - today.getTime()) / 86400000)
}

const formatDeadline = (date) => {
  if (!date) return 'No deadline set'
  const parsed = new Date(`${String(date).slice(0, 10)}T12:00:00`)
  if (Number.isNaN(parsed.getTime())) return String(date)
  return parsed.toLocaleDateString('en', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

const getErrorMessage = (error, fallback) =>
  error?.response?.data?.detail ||
  error?.response?.data?.message ||
  error?.message ||
  fallback

const modalBackdropStyle = {
  position: 'fixed',
  inset: 0,
  zIndex: 1000,
  background: 'rgba(26, 65, 65, 0.48)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '20px',
  overflowY: 'auto',
}

const modalStyle = {
  width: 'min(620px, 100%)',
  maxHeight: '90vh',
  overflowY: 'auto',
  background: '#fffdf7',
  border: '2px solid #245d5d',
  borderRadius: '24px',
  boxShadow: '8px 8px 0 #245d5d',
  padding: '26px',
  color: '#245d5d',
}

const fieldStyle = {
  display: 'block',
  width: '100%',
  boxSizing: 'border-box',
  marginTop: '7px',
  marginBottom: '16px',
  padding: '12px 14px',
  border: '1.5px solid #b6d9d5',
  borderRadius: '12px',
  background: '#fff',
  color: '#245d5d',
  font: 'inherit',
}

function App() {
  const [opportunities, setOpportunities] = useState([])
  const [query, setQuery] = useState('')
  const [activeFilter, setActiveFilter] = useState('All')
  const [activeNav, setActiveNav] = useState('Dashboard')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [authRequired, setAuthRequired] = useState(() => !localStorage.getItem('opportune_access_token'))
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [showNotifications, setShowNotifications] = useState(false)

  const [showAddModal, setShowAddModal] = useState(false)
  const [sourceUrl, setSourceUrl] = useState('')
  const [pastedText, setPastedText] = useState('')
  const [extracting, setExtracting] = useState(false)
  const [saving, setSaving] = useState(false)
  const [extractError, setExtractError] = useState('')
  const [draft, setDraft] = useState(null)
  const [deletingId, setDeletingId] = useState(null)
  const [selectedOpportunity, setSelectedOpportunity] = useState(null)

  const loadOpportunities = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const data = await getOpportunities()
      const results = Array.isArray(data) ? data : data?.results || []
      setOpportunities(results)
      setAuthRequired(false)
    } catch (err) {
      if (err?.response?.status === 401) {
        setAuthRequired(true)
      } else {
        setError(
          getErrorMessage(
            err,
            'Could not load your opportunities. Check that the Django backend is running.',
          ),
        )
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!authRequired) loadOpportunities()
  }, [authRequired, loadOpportunities])

  
const visibleOpportunities = useMemo(() => {
  return opportunities.filter((item) => {
    const type = getType(item)

    const matchesQuery = `${item.title || ''} ${item.organization || ''} ${type}`
      .toLowerCase()
      .includes(query.toLowerCase())

    const matchesFilter =
      activeFilter === 'All' ||
      type.toLowerCase() === activeFilter.toLowerCase()

    const matchesNav =
      activeNav !== 'Favorites' || item.is_favorite === true

    const matchesDeadlines =
      activeNav !== 'Deadlines' ||
      (getDateDays(item.deadline) !== null &&
        getDateDays(item.deadline) >= 0)

    return matchesQuery && matchesFilter && matchesNav && matchesDeadlines
  })
}, [opportunities, query, activeFilter, activeNav])


  const handleNav = (name) => {
    setActiveNav(name)
    if (name === 'Add opportunity') {
      openAddModal()
    }
    if (name === 'My opportunities') {
      setActiveFilter('All')
      setQuery('')
    }
    if (name === 'Deadlines') {
      setActiveFilter('All')
    }
  }

  const openAddModal = () => {
    setSourceUrl('')
    setPastedText('')
    setDraft(null)
    setExtractError('')
    setShowAddModal(true)
  }

  const handleLogout = () => {
    logout()
    setOpportunities([])
    setAuthRequired(true)
    setActiveNav('Dashboard')
  }

  const handleExtract = async (event) => {
    event.preventDefault()
    setExtractError('')
    if (!sourceUrl.trim() && !pastedText.trim()) {
      setExtractError('Paste an opportunity link or the opportunity text first.')
      return
    }

    setExtracting(true)
    try {
      const result = await extractOpportunity({
        url: sourceUrl.trim() || undefined,
        text: sourceUrl.trim() ? undefined : pastedText.trim(),
      })
      const details = result?.opportunity || result?.data || result
      setDraft({
        ...details,
        title: details?.title || '',
        organization: details?.organization || '',
        opportunity_type: details?.opportunity_type || details?.type || 'Other',
        source_url: details?.source_url || sourceUrl.trim(),
        application_url: details?.application_url || sourceUrl.trim(),
        description: details?.description || '',
        eligibility: details?.eligibility || '',
        location: details?.location || '',
        benefits: details?.benefits || '',
        required_documents: Array.isArray(details?.required_documents)
           ? details.required_documents
          : [],
        deadline: details?.deadline ? String(details.deadline).slice(0, 10) : '',
        notes: details?.notes || '',
      })
    } catch (err) {
      if (err?.response?.status === 401) setAuthRequired(true)
      setExtractError(
        getErrorMessage(
          err,
          'Could not extract the details. Try another link or paste the opportunity text.',
        ),
      )
    } finally {
      setExtracting(false)
    }
  }

  const handleSave = async (event) => {
    event.preventDefault()
    if (!draft?.title?.trim()) {
      setExtractError('Please add an opportunity title before saving.')
      return
    }

    setSaving(true)
    setExtractError('')
    try {
      const payload = {
        title: draft.title.trim(),
        organization: draft.organization || '',
        opportunity_type: (draft.opportunity_type || 'other').toLowerCase(),
        source_url: draft.source_url || sourceUrl.trim() || '',
        application_url: draft.application_url || sourceUrl.trim() || '',
        description: draft.description || '',
        eligibility: draft.eligibility || '',
        location: draft.location || '',
        benefits: draft.benefits || '',
        required_documents: Array.isArray(draft.required_documents)
          ? draft.required_documents
          : [],
        deadline: draft.deadline || null,
        notes: draft.notes || '',
        status: (draft.status || 'saved').toLowerCase().replace(/\s+/g, '_'),
      }
      await createOpportunity(payload)
      setShowAddModal(false)
      setDraft(null)
      setNotice('Opportunity saved to your collection!')
      setActiveNav('Dashboard')
      await loadOpportunities()
    } catch (err) {
  console.error('Save opportunity failed:', {
    status: err?.response?.status,
    data: err?.response?.data,
    message: err?.message,
  })

  if (err?.response?.status === 401) setAuthRequired(true)

  setExtractError(
    getErrorMessage(err, 'Could not save this opportunity. Please try again.')
    )
   }
  }

  const handleDelete = async (item) => {
    if (!window.confirm(`Delete "${item.title}" from your opportunities?`)) return
    setDeletingId(item.id)
    setError('')
    try {
      await deleteOpportunity(item.id)
      setOpportunities((current) => current.filter((opportunity) => opportunity.id !== item.id))
      if (selectedOpportunity?.id === item.id) setSelectedOpportunity(null)
      setNotice('Opportunity deleted.')
    } catch (err) {
      if (err?.response?.status === 401) setAuthRequired(true)
      else setError(getErrorMessage(err, 'Could not delete this opportunity.'))
    } finally {
      setDeletingId(null)
    }
  }

  
const toggleFavorite = async (item) => {
  const nextFavorite = !item.is_favorite

  try {
    const updated = await updateOpportunity(item.id, {
      is_favorite: nextFavorite,
    })

    setOpportunities((current) =>
      current.map((opportunity) =>
        opportunity.id === item.id
          ? { ...opportunity, ...updated }
          : opportunity
      )
    )

    if (selectedOpportunity?.id === item.id) {
      setSelectedOpportunity((current) =>
        current ? { ...current, ...updated } : current
      )
    }

    setNotice(
      nextFavorite
        ? 'Added to favorites!'
        : 'Removed from favorites.'
    )
    setError('')
  } catch (err) {
    console.error('Failed to update favorite:', err)
    setError(
      err.response?.data?.detail ||
      'Could not update favorite. Please try again.'
    )
  }
}


  const daysUntil = (date) => getDateDays(date)
  
const upcomingNotifications = useMemo(() => {
  return opportunities
    .map((item) => ({
      ...item,
      daysLeft: daysUntil(item.deadline),
    }))
    .filter(
      (item) =>
        item.daysLeft !== null &&
        item.daysLeft >= 0 &&
        item.daysLeft <= 7
    )
    .sort((a, b) => a.daysLeft - b.daysLeft)
}, [opportunities])

  if (authRequired) {
    return <Auth onAuthenticated={() => setAuthRequired(false)} />
  }

  const totalClosingSoon = opportunities.filter((item) => {
    const days = daysUntil(item.deadline)
    return days !== null && days >= 0 && days <= 14
  }).length

  const inProgressCount = opportunities.filter((item) =>
    ['in progress', 'in-progress'].includes((item.status || '').toLowerCase()),
  ).length

  return (
    <div className={`app-shell ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
      <aside className="sidebar">
        <a className="brand" href="#home" aria-label="Opportune home" onClick={() => setActiveNav('Dashboard')}>
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
              {name === 'Deadlines' && <span className="nav-count">{totalClosingSoon}</span>}
            </button>
          ))}
        </nav>

        <div className="sidebar-label second-label">YOUR SPACE</div>
        <nav className="nav-list">
          <button className={`nav-item ${activeNav === 'Favorites' ? 'active' : ''}`} onClick={() => handleNav('Favorites')}>
            <Heart size={19} />
            <span>Favorites</span>
          </button>
          <button className={`nav-item ${activeNav === 'Documents' ? 'active' : ''}`} onClick={() => handleNav('Documents')}>
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
            <button onClick={openAddModal}>Add one <ArrowRight size={15} /></button>
          </div>

          <button className="nav-item help-item" onClick={() => window.alert('Help center coming soon!')}>
            <CircleHelp size={19} />
            <span>Help & tips</span>
          </button>
          <button className="profile profile-button" onClick={handleLogout} title="Sign out">
            <div className="avatar">O</div>
            <div className="profile-copy">
              <strong>Opportunity hunter</strong>
              <span>Sign out of Opportune</span>
            </div>
            <LogOut size={17} className="logout-icon" />
          </button>
        </div>
      </aside>

      <main className="main-content" id="home">
        <header className="topbar">
          <button type="button" className="icon-button sidebar-toggle"
                  aria-label={sidebarOpen ? 'Close sidebar' : 'Open sidebar'}
                  aria-expanded={sidebarOpen}
                  title={sidebarOpen ? 'Close sidebar' : 'Open sidebar'}
                   onClick={() => setSidebarOpen((open) => !open)}
          >
            {sidebarOpen ? <PanelLeftClose size={19} /> : <PanelLeftOpen size={19} />}</button>
          <div className="breadcrumb">
            <span>Workspace</span>
            <span className="breadcrumb-dot">/</span>
            <strong>{activeNav}</strong>
          </div>
          <div className="topbar-right">
            <span className="today-label">
              <CalendarDays size={16} />
              {new Date().toLocaleDateString('en', { weekday: 'short', day: 'numeric', month: 'short' })}
            </span>
            
           <button type="button" className="icon-button notification-button" aria-label={`Upcoming deadline notifications: ${upcomingNotifications.length}`} aria-expanded={showNotifications}
                  title="Upcoming deadline notifications" onClick={() => setShowNotifications((open) => !open)} >
                 <Bell size={19} />
                {upcomingNotifications.length > 0 && (
                 <span className="notification-dot" />
                 )}
           </button>

            <div className="mini-avatar">O</div>
          </div>
        </header>
        
{showNotifications && (
  <section
    className="notification-panel"
    aria-label="Upcoming deadline notifications"
  >
    <div className="notification-panel-heading">
      <div>
        <strong>Coming up soon</strong>
        <p>Opportunities due within 7 days</p>
      </div>
      <button
        type="button"
        className="icon-button"
        aria-label="Close notifications"
        onClick={() => setShowNotifications(false)}
      >
        <X size={17} />
      </button>
    </div>

    {upcomingNotifications.length === 0 ? (
      <p className="notification-empty">
        You're all caught up! No deadlines in the next 7 days.
      </p>
    ) : (
      <div className="notification-list">
        {upcomingNotifications.map((item) => (
          <button
            type="button"
            className="notification-item"
            key={item.id}
            onClick={() => {
              setSelectedOpportunity(item)
              setShowNotifications(false)
            }}
          >
            <span className="notification-item-icon">
              <AlarmClock size={18} />
            </span>
            <span className="notification-item-copy">
              <strong>{item.title}</strong>
              <small>
                {item.daysLeft === 0
                  ? 'Due today!'
                  : item.daysLeft === 1
                    ? 'Due tomorrow'
                    : `Due in ${item.daysLeft} days`}
              </small>
            </span>
            <ArrowRight size={16} />
          </button>
        ))}
      </div>
    )}
  </section>
)}


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
              <button id="add-opportunity" className="primary-button" onClick={openAddModal}>
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

          {notice && (
            <div role="status" style={{ padding: '12px 16px', marginBottom: 18, borderRadius: 12, background: '#e8f8f4', color: '#245d5d', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Check size={18} /> {notice}
              <button aria-label="Dismiss notification" onClick={() => setNotice('')} style={{ marginLeft: 'auto', border: 0, background: 'transparent', cursor: 'pointer', color: 'inherit' }}><X size={16} /></button>
            </div>
          )}
          {error && (
            <div role="alert" style={{ padding: '12px 16px', marginBottom: 18, borderRadius: 12, background: '#fff0e9', color: '#9b3c25', display: 'flex', alignItems: 'center', gap: 8 }}>
              {error}
              <button onClick={loadOpportunities} className="secondary-button">Try again</button>
            </div>
          )}

          <section className="stats-grid" aria-label="Opportunity summary">
            <article className="stat-card stat-mint">
              <div className="stat-top"><span>ALL SAVED</span><Bookmark size={19} /></div>
              <div className="stat-number">{String(opportunities.length).padStart(2, '0')}</div>
              <div className="stat-bottom"><span>Opportunities in your corner</span><ArrowUpRight size={16} /></div>
              <div className="stat-decoration">✳</div>
            </article>
            <article className="stat-card stat-cream">
              <div className="stat-top"><span>CLOSING SOON</span><AlarmClock size={19} /></div>
              <div className="stat-number">{String(totalClosingSoon).padStart(2, '0')}</div>
              <div className="stat-bottom"><span>Time to take action!</span><ArrowDownRight size={16} /></div>
              <div className="stat-decoration">✦</div>
            </article>
            <article className="stat-card stat-peach">
              <div className="stat-top"><span>IN PROGRESS</span><Target size={19} /></div>
              <div className="stat-number">{String(inProgressCount).padStart(2, '0')}</div>
              <div className="stat-bottom"><span>You're making moves</span><ArrowUpRight size={16} /></div>
              <div className="stat-decoration">✳</div>
            </article>
          </section>

          <section className="opportunities-section">
            <div className="section-heading">
              <div>
                <div className="section-kicker">YOUR COLLECTION</div>
                <h2>{activeNav === 'Deadlines' ? 'Deadlines to watch' : activeNav === 'Favorites' ? 'Your favorite opportunities' : 'Opportunities to chase'} <span>✦</span></h2>
                <p>Little steps today, big wins tomorrow.</p>
              </div>
              <button className="secondary-button" onClick={() => handleNav('My opportunities')}>
                View all <ArrowRight size={16} />
              </button>
            </div>

            <div className="toolbar">
              <label className="search-box">
                <Search size={18} />
                <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search your opportunities..." aria-label="Search opportunities" />
              </label>
            </div>

            <div className="filter-tabs" aria-label="Filter by type">
              {filters.map((filter) => (
                <button key={filter} className={`filter-tab ${activeFilter === filter ? 'selected' : ''}`} onClick={() => setActiveFilter(filter)}>
                  {filter}
                </button>
              ))}
            </div>

            <div className="opportunity-list">
              {loading && opportunities.length === 0 && (
                <div className="empty-state">
                  <LoaderCircle size={28} className="spin" />
                  <h3>Gathering your opportunities...</h3>
                  <p>Just a moment while we get everything ready.</p>
                </div>
              )}

              {!loading && visibleOpportunities.map((item) => {
                const type = getType(item)
                const typeKey = type.toLowerCase()
                const Icon = opportunityIcons[typeKey] || Bookmark
                const color = opportunityColors[typeKey] || 'cream'
                const days = daysUntil(item.deadline)
                const status = item.status || 'Saved'
                return (
                  <article className="opportunity-card" key={item.id}>
                    <div className={`opportunity-icon ${color}`}>
                      <Icon size={24} />
                    </div>
                    <div className="opportunity-info">
                      <div className="opportunity-title-row">
                        <h3>{item.title || 'Untitled opportunity'}</h3>
                        <span className="type-tag">{type}</span>
                      </div>
                      <p className="organization">{item.organization || 'Organization not specified'}</p>
                      <p className="opportunity-description">{item.description || 'Open the details to review eligibility, benefits, and application information.'}</p>
                      <div className="opportunity-meta">
                        <span><CalendarDays size={15} /> {formatDeadline(item.deadline)}</span>
                        <span className={days !== null && days >= 0 && days <= 7 ? 'urgent' : ''}>
                          <Clock3 size={15} />
                          {days === null ? 'No deadline' : days < 0 ? 'Deadline passed' : days === 0 ? 'Due today!' : `${days} days left`}
                        </span>
                      </div>
                    </div>
                    <div className="opportunity-actions">
                      <span className={`status-tag ${(status || 'saved').toLowerCase().replace(/\s+/g, '-')}`}>
                        {status}
                      </span>
                      
<button
  type="button"
  className={`icon-button favorite-button ${item.is_favorite ? 'is-favorite' : ''}`}
  aria-label={
    item.is_favorite
      ? `Remove ${item.title} from favorites`
      : `Add ${item.title} to favorites`
  }
  aria-pressed={Boolean(item.is_favorite)}
  title={item.is_favorite ? 'Remove from favorites' : 'Add to favorites'}
  onClick={() => toggleFavorite(item)}
>
  <Star
    size={18}
    fill={item.is_favorite ? 'currentColor' : 'none'}
  />
</button>

                      <button className="icon-button open-opportunity" aria-label={`Open ${item.title}`} title="View details" onClick={() => setSelectedOpportunity(item)}>
                        <ArrowUpRight size={19} />
                      </button>
                      <button className="icon-button open-opportunity" aria-label={`Delete ${item.title}`} title="Delete opportunity" disabled={deletingId === item.id} onClick={() => handleDelete(item)}>
                        {deletingId === item.id ? <LoaderCircle size={17} className="spin" /> : <Trash2 size={17} />}
                      </button>
                    </div>
                  </article>
                )
              })}

              {!loading && visibleOpportunities.length === 0 && !error && (
                <div className="empty-state">
                  <Search size={28} />
                  <h3>{opportunities.length === 0 ? 'Your collection is ready for its first opportunity' : 'No matching opportunities yet'}</h3>
                  <p>{opportunities.length === 0 ? 'Paste an opportunity link and let Opportune help you keep track.' : 'Try another search or select a different category.'}</p>
                  {opportunities.length === 0 ? (
                    <button className="primary-button" onClick={openAddModal}><Plus size={18} /> Track an opportunity</button>
                  ) : (
                    <button className="secondary-button" onClick={() => { setQuery(''); setActiveFilter('All'); setActiveNav('Dashboard') }}>Clear filters</button>
                  )}
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

      {showAddModal && (
        <div style={modalBackdropStyle} onMouseDown={() => !extracting && !saving && setShowAddModal(false)}>
          <section style={modalStyle} role="dialog" aria-modal="true" aria-labelledby="add-modal-title" onMouseDown={(event) => event.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'flex-start' }}>
              <div>
                <div className="eyebrow"><Sparkles size={15} /> YOUR OPPORTUNITY ASSISTANT</div>
                <h2 id="add-modal-title" style={{ margin: '10px 0 6px' }}>{draft ? 'Review the details' : 'Track an opportunity'}</h2>
                <p style={{ marginTop: 0 }}>Paste a link or text. AI will help identify the important details.</p>
              </div>
              <button className="icon-button" aria-label="Close" onClick={() => setShowAddModal(false)} disabled={extracting || saving}><X size={19} /></button>
            </div>

            {!draft ? (
              <form onSubmit={handleExtract}>
                <label htmlFor="opportunity-url">Opportunity URL</label>
                <input id="opportunity-url" style={fieldStyle} type="url" placeholder="https://example.com/opportunity" value={sourceUrl} onChange={(event) => setSourceUrl(event.target.value)} />
                <div style={{ textAlign: 'center', margin: '0 0 14px', fontWeight: 800, opacity: 0.65 }}>OR PASTE THE DESCRIPTION</div>
                <label htmlFor="opportunity-text">Opportunity text</label>
                <textarea id="opportunity-text" style={{ ...fieldStyle, resize: 'vertical' }} rows={5} placeholder="Paste the opportunity description here..." value={pastedText} onChange={(event) => setPastedText(event.target.value)} />
                {extractError && <p role="alert" style={{ color: '#b83d2a' }}>{extractError}</p>}
                <button className="primary-button" type="submit" disabled={extracting}>
                  {extracting ? <LoaderCircle size={18} className="spin" /> : <Sparkles size={18} />}
                  {extracting ? 'Extracting details...' : 'Extract details'}
                </button>
              </form>
            ) : (
              <form onSubmit={handleSave}>
                <label htmlFor="draft-title">Title *</label>
                <input id="draft-title" style={fieldStyle} required value={draft.title || ''} onChange={(event) => setDraft({ ...draft, title: event.target.value })} />
                <label htmlFor="draft-org">Organization</label>
                <input id="draft-org" style={fieldStyle} value={draft.organization || ''} onChange={(event) => setDraft({ ...draft, organization: event.target.value })} />
                <label htmlFor="draft-type">Opportunity type</label>
                <select id="draft-type" style={fieldStyle} value={draft.opportunity_type || 'other'} onChange={(event) => setDraft({ ...draft, opportunity_type: event.target.value })}>
                  {['Internship', 'Scholarship', 'Job', 'Fellowship', 'Competition', 'Other'].map((type) => <option key={type} value={type.toLowerCase()}>{type}</option>)}
                </select>
                <label htmlFor="draft-deadline">Deadline</label>
                <input id="draft-deadline" style={fieldStyle} type="date" value={draft.deadline || ''} onChange={(event) => setDraft({ ...draft, deadline: event.target.value })} />
                <label htmlFor="draft-description">Description</label>
                <textarea id="draft-description" style={{ ...fieldStyle, resize: 'vertical' }} rows={3} value={draft.description || ''} onChange={(event) => setDraft({ ...draft, description: event.target.value })} />
                <label htmlFor="draft-eligibility">Eligibility</label>
                <textarea id="draft-eligibility" style={{ ...fieldStyle, resize: 'vertical' }} rows={2} value={draft.eligibility || ''} onChange={(event) => setDraft({ ...draft, eligibility: event.target.value })} />
                {extractError && <p role="alert" style={{ color: '#b83d2a' }}>{extractError}</p>}
                <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                  <button type="button" className="secondary-button" onClick={() => { setDraft(null); setExtractError('') }} disabled={saving}>Back</button>
                  <button type="submit" className="primary-button" disabled={saving}>
                    {saving ? <LoaderCircle size={18} className="spin" /> : <Check size={18} />}
                    {saving ? 'Saving...' : 'Save opportunity'}
                  </button>
                </div>
              </form>
            )}
          </section>
        </div>
      )}

      {selectedOpportunity && (
        <div style={modalBackdropStyle} onMouseDown={() => setSelectedOpportunity(null)}>
          <section style={modalStyle} role="dialog" aria-modal="true" aria-labelledby="details-title" onMouseDown={(event) => event.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16 }}>
              <div>
                <div className="eyebrow"><Bookmark size={15} /> OPPORTUNITY DETAILS</div>
                <h2 id="details-title" style={{ marginBottom: 6 }}>{selectedOpportunity.title}</h2>
                <p style={{ marginTop: 0 }}>{selectedOpportunity.organization || 'Organization not specified'}</p>
              </div>
              <button className="icon-button" aria-label="Close details" onClick={() => setSelectedOpportunity(null)}><X size={19} /></button>
            </div>
            {[
              ['Type', getType(selectedOpportunity)],
              ['Deadline', formatDeadline(selectedOpportunity.deadline)],
              ['Location', selectedOpportunity.location || 'Not specified'],
              ['Description', selectedOpportunity.description || 'Not specified'],
              ['Eligibility', selectedOpportunity.eligibility || 'Not specified'],
              ['Benefits', selectedOpportunity.benefits || 'Not specified'],
              [
                'Required documents',
                 Array.isArray(selectedOpportunity.required_documents) &&
                 selectedOpportunity.required_documents.length > 0
                     ? selectedOpportunity.required_documents.join(', ')
                     : 'Not specified',
             ],
            ].map(([label, value]) => (
              <div key={label} style={{ padding: '12px 0', borderBottom: '1px solid #e0eeeb' }}>
                <strong style={{ display: 'block', marginBottom: 5 }}>{label}</strong>
                <span>{value}</span>
              </div>
            ))}
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 20, flexWrap: 'wrap' }}>
              <button className="secondary-button" onClick={() => setSelectedOpportunity(null)}>Close</button>
              {(selectedOpportunity.application_url || selectedOpportunity.source_url) && (
                <a className="primary-button" href={selectedOpportunity.application_url || selectedOpportunity.source_url} target="_blank" rel="noreferrer" style={{ textDecoration: 'none' }}>
                  Open opportunity <ExternalLink size={17} />
                </a>
              )}
            </div>
          </section>
        </div>
      )}
    </div>
  )
}

export default App
