import { useState } from 'react'
import {
  AlarmClock,
  ArrowRight,
  Bookmark,
  CalendarDays,
  CircleHelp,
  FileText,
  Heart,
  LayoutDashboard,
  LogOut,
  Mail,
  Sparkles,
} from 'lucide-react'

import EmailReminderCard from '../EmailReminderCard'

export default function Sidebar({
  activeNav,
  handleNav,
  totalClosingSoon,
  openAddModal,
  handleLogout,
}) {
  const [showEmailReminder, setShowEmailReminder] = useState(false)

  return (
    <>
      <aside className="sidebar">
        <a
          className="brand"
          href="#home"
          aria-label="Opportune home"
          onClick={() => handleNav('Dashboard')}
        >
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
                <span className="nav-count">{totalClosingSoon}</span>
              )}
            </button>
          ))}
        </nav>

        <div className="sidebar-label second-label">YOUR SPACE</div>

        <nav className="nav-list" aria-label="Your saved items">
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

            <button onClick={openAddModal}>
              Add one <ArrowRight size={15} />
            </button>
          </div>

          <button
            type="button"
            className="email-reminder-cta"
            onClick={() => setShowEmailReminder(true)}
            aria-haspopup="dialog"
            aria-expanded={showEmailReminder}
          >
            <span className="email-reminder-cta-icon">
              <Mail size={18} />
            </span>

            <span>
              <strong>Stay notified, don't miss out!</strong>
              <small>Link your email for deadline reminders.</small>
            </span>

            <span aria-hidden="true">→</span>
          </button>

          <button
            className={`nav-item help-item ${
              activeNav === 'Help & tips' ? 'active' : ''
            }`}
            onClick={() => handleNav('Help & tips')}
          >
            <CircleHelp size={19} />
            <span>Help & tips</span>
          </button>

          <button
            className="profile profile-button"
            onClick={handleLogout}
            title="Sign out"
          >
            <div className="avatar">O</div>

            <div className="profile-copy">
              <strong>Opportunity hunter</strong>
              <span>Sign out of Opportune</span>
            </div>

            <LogOut size={17} className="logout-icon" />
          </button>
        </div>
      </aside>

      {showEmailReminder && (
        <EmailReminderCard
          onClose={() => setShowEmailReminder(false)}
        />
      )}
    </>
  )
}
