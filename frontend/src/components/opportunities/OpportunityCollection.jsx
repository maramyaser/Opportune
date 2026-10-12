
import { useState } from 'react'
import {
  ArrowRight,
  ArrowUpRight,
  Bookmark,
  CalendarDays,
  Clock3,
  LoaderCircle,
  Plus,
  Search,
  Sparkles,
  Star,
  Target,
  Trash2,
  BriefcaseBusiness,
  GraduationCap,
  AlertTriangle,
  X,
} from 'lucide-react'

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

export default function OpportunityCollection({
  activeNav,
  handleNav,
  query,
  setQuery,
  activeFilter,
  setActiveFilter,
  loading,
  opportunities,
  visibleOpportunities,
  error,
  getType,
  formatDeadline,
  daysUntil,
  STATUS_OPTIONS,
  handleStatusChange,
  toggleFavorite,
  setSelectedOpportunity,
  deletingId,
  handleDelete,
  openAddModal,
  setActiveNav,
}) {
  const [confirmDelete, setConfirmDelete] = useState(null)

  const confirmDeletion = async () => {
    if (!confirmDelete || deletingId === confirmDelete.id) return

    const item = confirmDelete
    await handleDelete(item)
    setConfirmDelete(null)
  }

  return (
    <>
      <section className="opportunities-section">
        <div className="section-heading">
          <div>
            <div className="section-kicker">YOUR COLLECTION</div>
            <h2>
              {activeNav === 'Deadlines'
                ? 'Deadlines to watch'
                : activeNav === 'Favorites'
                  ? 'Your favorite opportunities'
                  : 'Opportunities to chase'}{' '}
              <span>✦</span>
            </h2>
            <p>Little steps today, big wins tomorrow.</p>
          </div>

          <button
            className="secondary-button"
            onClick={() => handleNav('My opportunities')}
          >
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
        </div>

        <div className="filter-tabs" aria-label="Filter by type">
          {filters.map((filter) => (
            <button
              key={filter}
              className={`filter-tab ${
                activeFilter === filter ? 'selected' : ''
              }`}
              onClick={() => setActiveFilter(filter)}
            >
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

          {!loading &&
            visibleOpportunities.map((item) => {
              const type = getType(item)
              const typeKey = type.toLowerCase()
              const Icon = opportunityIcons[typeKey] || Bookmark
              const color = opportunityColors[typeKey] || 'cream'
              const days = daysUntil(item.deadline)
              const status = item.status || 'saved'

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

                    <p className="organization">
                      {item.organization || 'Organization not specified'}
                    </p>

                    <p className="opportunity-description">
                      {item.description ||
                        'Open the details to review eligibility, benefits, and application information.'}
                    </p>

                    <div className="opportunity-meta">
                      <span>
                        <CalendarDays size={15} />
                        {formatDeadline(item.deadline)}
                      </span>

                      <span
                        className={
                          days !== null && days >= 0 && days <= 7
                            ? 'urgent'
                            : ''
                        }
                      >
                        <Clock3 size={15} />
                        {days === null
                          ? 'No deadline'
                          : days < 0
                            ? 'Deadline passed'
                            : days === 0
                              ? 'Due today!'
                              : `${days} days left`}
                      </span>
                    </div>
                  </div>

                  <div className="opportunity-actions">
                    <select
                      className={`status-tag status-${status}`}
                      value={status}
                      aria-label={`Update status for ${item.title}`}
                      title="Change opportunity status"
                      onChange={(event) =>
                        handleStatusChange(item, event.target.value)
                      }
                    >
                      {STATUS_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>

                    <button
                      type="button"
                      className={`icon-button favorite-button ${
                        item.is_favorite ? 'is-favorite' : ''
                      }`}
                      aria-label={
                        item.is_favorite
                          ? `Remove ${item.title} from favorites`
                          : `Add ${item.title} to favorites`
                      }
                      aria-pressed={Boolean(item.is_favorite)}
                      title={
                        item.is_favorite
                          ? 'Remove from favorites'
                          : 'Add to favorites'
                      }
                      onClick={() => toggleFavorite(item)}
                    >
                      <Star
                        size={18}
                        fill={item.is_favorite ? 'currentColor' : 'none'}
                      />
                    </button>

                    <button
                      type="button"
                      className="icon-button open-opportunity"
                      aria-label={`Open ${item.title}`}
                      title="View details"
                      onClick={() => setSelectedOpportunity(item)}
                    >
                      <ArrowUpRight size={19} />
                    </button>

                    <button
                      type="button"
                      className="icon-button delete-opportunity-button"
                      aria-label={`Delete ${item.title}`}
                      title="Delete opportunity"
                      disabled={deletingId === item.id}
                      onClick={() => setConfirmDelete(item)}
                    >
                      {deletingId === item.id ? (
                        <LoaderCircle size={17} className="spin" />
                      ) : (
                        <Trash2 size={17} />
                      )}
                    </button>
                  </div>
                </article>
              )
            })}

          {!loading && visibleOpportunities.length === 0 && !error && (
            <div className="empty-state">
              <Search size={28} />
              <h3>
                {opportunities.length === 0
                  ? 'Your collection is ready for its first opportunity'
                  : 'No matching opportunities yet'}
              </h3>
              <p>
                {opportunities.length === 0
                  ? 'Paste an opportunity link and let Opportune help you keep track.'
                  : 'Try another search or select a different category.'}
              </p>

              {opportunities.length === 0 ? (
                <button className="primary-button" onClick={openAddModal}>
                  <Plus size={18} /> Track an opportunity
                </button>
              ) : (
                <button
                  className="secondary-button"
                  onClick={() => {
                    setQuery('')
                    setActiveFilter('All')
                    setActiveNav('Dashboard')
                  }}
                >
                  Clear filters
                </button>
              )}
            </div>
          )}
        </div>

        <div className="bottom-note">
          <span className="note-icon">
            <Sparkles size={18} />
          </span>
          <p>
            <strong>A little reminder:</strong> saving an opportunity is the
            first step. Taking action is where the magic happens.
          </p>
        </div>
      </section>

      {confirmDelete && (
        <div
          className="delete-modal-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setConfirmDelete(null)
            }
          }}
        >
          <section
            className="delete-modal"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="delete-modal-title"
            aria-describedby="delete-modal-description"
          >
            <button
              type="button"
              className="delete-modal-close"
              aria-label="Cancel deletion"
              onClick={() => setConfirmDelete(null)}
              disabled={deletingId === confirmDelete.id}
            >
              <X size={19} />
            </button>

            <div className="delete-modal-icon">
              <AlertTriangle size={28} />
            </div>

            <div className="delete-modal-content">
              <span className="delete-modal-eyebrow">
                A LITTLE DOUBLE-CHECK
              </span>

              <h2 id="delete-modal-title">
                Let this opportunity go?
              </h2>

              <p id="delete-modal-description">
                You're about to remove{' '}
                <strong>
                  “{confirmDelete.title || 'Untitled opportunity'}”
                </strong>{' '}
                from your collection.
              </p>

              <p className="delete-modal-warning">
                This action cannot be undone.
              </p>
            </div>

            <div className="delete-modal-actions">
              <button
                type="button"
                className="delete-cancel-button"
                onClick={() => setConfirmDelete(null)}
                disabled={deletingId === confirmDelete.id}
              >
                Keep it
              </button>

              <button
                type="button"
                className="delete-confirm-button"
                onClick={confirmDeletion}
                disabled={deletingId === confirmDelete.id}
              >
                {deletingId === confirmDelete.id ? (
                  <>
                    <LoaderCircle size={17} className="spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 size={17} />
                    Yes, delete it
                  </>
                )}
              </button>
            </div>
          </section>
        </div>
      )}
    </>
  )
}
