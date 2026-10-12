import { AlarmClock, ArrowRight, Bell, CalendarDays, PanelLeftClose, PanelLeftOpen, X } from 'lucide-react'

export default function Topbar({ activeNav, sidebarOpen, setSidebarOpen, upcomingNotifications, showNotifications, setShowNotifications, setSelectedOpportunity }) {
  return (
    <>
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
    </>
  )
}
