import { useCallback, useEffect, useMemo, useState } from 'react'
import NotFound from './components/404'
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
  Pencil,
} from 'lucide-react'
import {
  createOpportunity,
  deleteOpportunity,
  extractOpportunity,
  getOpportunities,
  updateOpportunity,
  logout,
  restoreSession,
} from './services/api'
import './App.css'
import Auth from './Auth'
import HelpSupport from './components/HelpSupport'
import Sidebar from './components/layout/Sidebar'
import Topbar from './components/layout/Topbar'
import OpportunityModals from './components/modals/OpportunityModals'
import DashboardOverview from './components/dashboard/DashboardOverview'
import OpportunityCollection from './components/opportunities/OpportunityCollection'
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

function App() {
  const currentPath = window.location.pathname
  const isKnownPath =
     currentPath === '/' ||
     currentPath === '/index.html'
  const [opportunities, setOpportunities] = useState([])
  const [query, setQuery] = useState('')
  const [activeFilter, setActiveFilter] = useState('All')
  const [activeNav, setActiveNav] = useState('Dashboard')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [authRequired, setAuthRequired] = useState(true)
  const [checkingSession, setCheckingSession] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [showNotifications, setShowNotifications] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [sourceUrl, setSourceUrl] = useState('')
  const [pastedText, setPastedText] = useState('')
  const [draft, setDraft] = useState(null)
  const [extracting, setExtracting] = useState(false)
  const [saving, setSaving] = useState(false)
  const [extractError, setExtractError] = useState('')
  const [editingOpportunityId, setEditingOpportunityId] = useState(null)
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
  
  
useEffect(() => {
  const handleSessionExpired = () => {
    setAuthRequired(true)
    setOpportunities([])
  }

  window.addEventListener(
    'opportune:session-expired',
    handleSessionExpired
  )

  return () => {
    window.removeEventListener(
      'opportune:session-expired',
      handleSessionExpired
    )
  }
}, [])


useEffect(() => {
  let mounted = true

  async function checkExistingSession() {
    try {
      const authenticated = await restoreSession()

      if (mounted) {
        setAuthRequired(!authenticated)
      }
    } catch (error) {
      console.error(
        'Could not restore Opportune session:',
        error
      )

      if (mounted) {
        setAuthRequired(true)
      }
    } finally {
      if (mounted) {
        setCheckingSession(false)
      }
    }
  }

  checkExistingSession()

  return () => {
    mounted = false
  }
}, [])



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
  if (name === 'Deadlines' || name === 'Favorites') {
    setActiveFilter('All')
  }
  if (name === 'Dashboard') {
    setActiveFilter('All')
    setQuery('')
  }
}
const openAddModal = () => {
  setEditingOpportunityId(null)
  setSourceUrl('')
  setPastedText('')
  setDraft(null)
  setExtractError('')
  setSelectedOpportunity(null)
  setShowAddModal(true)
}
const openEditModal = (item) => {
  if (!item || item.id == null) {
    console.error('Cannot edit opportunity: missing opportunity or ID.', item)
    setError('Could not open this opportunity for editing.')
    return
  }
  setEditingOpportunityId(item.id)
  setSourceUrl('')
  setPastedText('')
  setExtractError('')
  setDraft({
    ...item,
    title: item.title || '',
    organization: item.organization || '',
    opportunity_type: (item.opportunity_type || item.type || 'other').toLowerCase(),
    source_url: item.source_url || '',
    application_url: item.application_url || '',
    description: item.description || '',
    eligibility: item.eligibility || '',
    location: item.location || '',
    benefits: item.benefits || '',
    required_documents: Array.isArray(item.required_documents) ? item.required_documents : [],
    deadline: item.deadline ? String(item.deadline).slice(0, 10) : '',
    status: item.status || 'saved',
    notes: item.notes || '',
  })
  setSelectedOpportunity(null)
  setShowAddModal(true)
}
const closeOpportunityForm = () => {
  if (saving || extracting) return
  setShowAddModal(false)
  setDraft(null)
  setEditingOpportunityId(null)
  setSourceUrl('')
  setPastedText('')
  setExtractError('')
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
      if (editingOpportunityId !== null) {
          const updated = await updateOpportunity(
             editingOpportunityId,
             payload
         )
        setOpportunities((current) =>
            current.map((item) =>
              item.id === editingOpportunityId
                ? { ...item, ...updated }
                : item
           )
         )
          setSelectedOpportunity(updated)
         setNotice('Opportunity updated successfully!')
        } else {
        await createOpportunity(payload)
       setNotice('Opportunity saved to your collection!')
      }
      setShowAddModal(false)
      setDraft(null)
      setEditingOpportunityId(null)
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
  } finally {
    setSaving(false)
  }
  }
  const handleDelete = async (item) => {
  setDeletingId(item.id)
  setError('')

  try {
    await deleteOpportunity(item.id)

    setOpportunities((current) =>
      current.filter((opportunity) => opportunity.id !== item.id)
    )

    if (selectedOpportunity?.id === item.id) {
      setSelectedOpportunity(null)
    }

    setNotice('Opportunity deleted.')
  } catch (err) {
    if (err?.response?.status === 401) {
      setAuthRequired(true)
    } else {
      setError(
        getErrorMessage(err, 'Could not delete this opportunity.')
      )
    }
  } finally {
    setDeletingId(null)
  }
}
const STATUS_OPTIONS = [
  { value: 'saved', label: 'Saved' },
  { value: 'planning', label: 'Planning to Apply' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'submitted', label: 'Submitted' },
  { value: 'accepted', label: 'Accepted' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'expired', label: 'Expired' },
]
const formatStatus = (status) => {
  const option = STATUS_OPTIONS.find(
    (item) => item.value === status
  )
  return option?.label || 'Saved'
}
const handleStatusChange = async (item, newStatus) => {
  if (newStatus === item.status) return
  const previousStatus = item.status || 'saved'
  // Update the UI immediately.
  setOpportunities((current) =>
    current.map((opportunity) =>
      opportunity.id === item.id
        ? { ...opportunity, status: newStatus }
        : opportunity
    )
  )
  if (selectedOpportunity?.id === item.id) {
    setSelectedOpportunity((current) =>
      current ? { ...current, status: newStatus } : current
    )
  }
  setError('')
  setNotice('')
  try {
    const updated = await updateOpportunity(item.id, {
      status: newStatus,
    })
    // Keep the UI synchronized with Django's response.
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
    setNotice(`Status updated to ${formatStatus(updated.status)}.`)
  } catch (err) {
    // Restore the old status if the update fails.
    setOpportunities((current) =>
      current.map((opportunity) =>
        opportunity.id === item.id
          ? { ...opportunity, status: previousStatus }
          : opportunity
      )
    )
    if (selectedOpportunity?.id === item.id) {
      setSelectedOpportunity((current) =>
        current
          ? { ...current, status: previousStatus }
          : current
      )
    }
    if (err?.response?.status === 401) {
      setAuthRequired(true)
    } else {
      setError(
        getErrorMessage(
          err,
          'Could not update the opportunity status. Please try again.'
        )
      )
    }
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
  if (!isKnownPath) { return <NotFound /> }
  if (checkingSession) {
    return (
      <div className="session-loading">
        <span>✦</span>
        <p>Opening your Opportune space...</p>
      </div>
    )
  }
  if (authRequired) {
     return <Auth onAuthenticated={() => setAuthRequired(false)} />
    }
  const totalClosingSoon = opportunities.filter((item) => {
    const days = daysUntil(item.deadline)
    return days !== null && days >= 0 && days <= 14
  }).length
  const inProgressCount = opportunities.filter(
  (item) => item.status === 'in_progress'
  ).length
  return (
    <div className={`app-shell ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
      <Sidebar activeNav={activeNav} handleNav={handleNav} totalClosingSoon={totalClosingSoon} openAddModal={openAddModal} handleLogout={handleLogout} />
      <main className="main-content" id="home">
        <Topbar
          activeNav={activeNav}
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          upcomingNotifications={upcomingNotifications}
          showNotifications={showNotifications}
          setShowNotifications={setShowNotifications}
          setSelectedOpportunity={setSelectedOpportunity}
        />
{activeNav === 'Help & tips' ? (
  <HelpSupport />
) : (
  <div className="dashboard-content">
        <div className="dashboard-content">
            
         <DashboardOverview
           notice={notice}
           setNotice={setNotice}
           error={error}
           loadOpportunities={loadOpportunities}
           opportunities={opportunities}
           totalClosingSoon={totalClosingSoon}
          inProgressCount={inProgressCount}
          openAddModal={openAddModal}
          />

          <OpportunityCollection
            activeNav={activeNav}
            handleNav={handleNav}
            query={query}
            setQuery={setQuery}
            activeFilter={activeFilter}
            setActiveFilter={setActiveFilter}
            loading={loading}
            opportunities={opportunities}
            visibleOpportunities={visibleOpportunities}
            error={error}
            getType={getType}
            formatDeadline={formatDeadline}
            daysUntil={daysUntil}
            STATUS_OPTIONS={STATUS_OPTIONS}
            handleStatusChange={handleStatusChange}
            toggleFavorite={toggleFavorite}
            setSelectedOpportunity={setSelectedOpportunity}
            deletingId={deletingId}
            handleDelete={handleDelete}
            openAddModal={openAddModal}
            setActiveNav={setActiveNav}
          />
          <footer className="footer">
            <span>Made with <Heart size={13} fill="currentColor" /> for your next big thing.</span>
            <span>OPPORTUNE © {new Date().getFullYear()}</span>
          </footer>
        </div>
      </div>
      )}
      </main>
      <OpportunityModals
        showAddModal={showAddModal}
        setShowAddModal={setShowAddModal}
        sourceUrl={sourceUrl}
        setSourceUrl={setSourceUrl}
        pastedText={pastedText}
        setPastedText={setPastedText}
        draft={draft}
        setDraft={setDraft}
        extracting={extracting}
        saving={saving}
        extractError={extractError}
        setExtractError={setExtractError}
        editingOpportunityId={editingOpportunityId}
        handleExtract={handleExtract}
        handleSave={handleSave}
        closeOpportunityForm={closeOpportunityForm}
        selectedOpportunity={selectedOpportunity}
        setSelectedOpportunity={setSelectedOpportunity}
        openEditModal={openEditModal}
        STATUS_OPTIONS={STATUS_OPTIONS}
        getType={getType}
        formatDeadline={formatDeadline}
      />
    </div>
  )
}
export default App
