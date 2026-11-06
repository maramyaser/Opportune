
import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Bell,
  CheckCircle2,
  ExternalLink,
  LoaderCircle,
  NotebookPen,
  Pencil,
  Plus,
  Search,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react'

import {
  getNotes,
  createNote,
  updateNote,
  deleteNote,
} from '../services/api'

import DeleteConfirmModal from './modals/DeleteConfirmModal'

import './NotesPage.css'

const emptyForm = {
  title: '',
  content: '',
  link: '',
  wantsReminder: false,
  reminderAt: '',
}

function localDateTime(value) {
  if (!value) return ''

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return ''
  }

  const local = new Date(
    date.getTime() - date.getTimezoneOffset() * 60000
  )

  return local.toISOString().slice(0, 16)
}

function formatDate(value) {
  if (!value) return ''

  const date = new Date(value)

  return Number.isNaN(date.getTime())
    ? ''
    : date.toLocaleString()
}

function errorMessage(error) {
  const data = error?.response?.data

  if (typeof data?.detail === 'string') {
    return data.detail
  }

  if (data && typeof data === 'object') {
    const message = Object.values(data).flat().join(' ')
    if (message) return message
  }

  return error?.message || 'Something went wrong.'
}

export default function NotesPage() {
  const [notes, setNotes] = useState([])
  const [form, setForm] = useState({ ...emptyForm })

  const [editingId, setEditingId] = useState(null)
  const [query, setQuery] = useState('')

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Custom delete confirmation
  const [noteToDelete, setNoteToDelete] = useState(null)
  const [deletingId, setDeletingId] = useState(null)

  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  /* =========================================
     LOAD NOTES
  ========================================= */

  const loadNotes = useCallback(async () => {
    setLoading(true)
    setError('')

    try {
      const data = await getNotes()

      setNotes(
        Array.isArray(data) ? data : data?.results || []
      )
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadNotes()
  }, [loadNotes])

  /* =========================================
     FORM HELPERS
  ========================================= */

  const updateField = (field, value) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }))
  }

  const resetForm = () => {
    setForm({ ...emptyForm })
    setEditingId(null)
    setError('')
    setSuccess('')
  }

  const startEditing = (note) => {
    const hasFutureReminder =
      note.reminder_at &&
      !note.reminder_sent_at &&
      new Date(note.reminder_at) > new Date()

    setEditingId(note.id)

    setForm({
      title: note.title || '',
      content: note.content || '',
      link: note.link || '',
      wantsReminder: Boolean(hasFutureReminder),
      reminderAt: hasFutureReminder
        ? localDateTime(note.reminder_at)
        : '',
    })

    setError('')
    setSuccess('')

    document.getElementById('notes-editor')?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    })
  }

  /* =========================================
     SAVE OR UPDATE NOTE
  ========================================= */

  const handleSave = async (event) => {
    event.preventDefault()

    if (saving) return

    setError('')
    setSuccess('')

    const title = form.title.trim()
    const content = form.content.trim()
    const link = form.link.trim()

    if (!title && !content && !link) {
      setError('Write something or add a link first.')
      return
    }

    let reminderAt = null

    if (form.wantsReminder) {
      if (!form.reminderAt) {
        setError('Choose a reminder date and time.')
        return
      }

      const chosenDate = new Date(form.reminderAt)

      if (
        Number.isNaN(chosenDate.getTime()) ||
        chosenDate <= new Date()
      ) {
        setError('Please choose a future reminder date.')
        return
      }

      reminderAt = chosenDate.toISOString()
    }

    const payload = {
      title,
      content,
      link,
      reminder_at: reminderAt,
    }

    setSaving(true)

    try {
      if (editingId !== null) {
        const updated = await updateNote(editingId, payload)

        setNotes((current) =>
          current.map((note) =>
            note.id === editingId ? updated : note
          )
        )

        setSuccess('Note updated successfully!')
      } else {
        const created = await createNote(payload)

        setNotes((current) => [created, ...current])

        setSuccess('Note saved successfully!')
      }

      setForm({ ...emptyForm })
      setEditingId(null)
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  /* =========================================
     CUSTOM DELETE CONFIRMATION
  ========================================= */

  const handleAskDelete = (note) => {
    if (deletingId !== null) return

    setNoteToDelete(note)
    setError('')
    setSuccess('')
  }

  const handleCloseDelete = () => {
    if (deletingId !== null) return

    setNoteToDelete(null)
  }

  const handleConfirmDelete = async () => {
    if (!noteToDelete || deletingId !== null) return

    const noteId = noteToDelete.id

    setDeletingId(noteId)
    setError('')
    setSuccess('')

    try {
      await deleteNote(noteId)

      setNotes((current) =>
        current.filter((note) => note.id !== noteId)
      )

      // Reset editor if the deleted note was being edited.
      if (editingId === noteId) {
        setForm({ ...emptyForm })
        setEditingId(null)
      }

      setNoteToDelete(null)
      setSuccess('Note deleted successfully!')
    } catch (err) {
      setNoteToDelete(null)
      setError(errorMessage(err))
    } finally {
      setDeletingId(null)
    }
  }

  /* =========================================
     SEARCH AND SORT
  ========================================= */

  const filteredNotes = useMemo(() => {
    const search = query.trim().toLowerCase()

    return notes
      .filter((note) =>
        `${note.title || ''} ${note.content || ''} ${note.link || ''}`
          .toLowerCase()
          .includes(search)
      )
      .sort(
        (a, b) =>
          new Date(b.updated_at).getTime() -
          new Date(a.updated_at).getTime()
      )
  }, [notes, query])

  /* =========================================
     PAGE
  ========================================= */

  return (
    <div className="notes-page">
      {/* Page header */}

      <header className="notes-header">
        <div>
          <p className="notes-eyebrow">
            <NotebookPen size={16} />
            YOUR PERSONAL SPACE
          </p>

          <h1>
            My Notes{' '}
            <Sparkles
              size={24}
              color="#ff8c52"
              aria-hidden="true"
            />
          </h1>

          <p>
            Save your thoughts, useful links, and things
            you don't want to forget.
          </p>
        </div>

        <button
          type="button"
          className="notes-new-button"
          onClick={() => {
            resetForm()

            document
              .getElementById('notes-editor')
              ?.scrollIntoView({
                behavior: 'smooth',
                block: 'start',
              })
          }}
        >
          <Plus size={18} />
          New note
        </button>
      </header>

      {/* =====================================
          NOTE EDITOR
      ===================================== */}

      <section
        className="notes-editor"
        id="notes-editor"
        aria-labelledby="notes-editor-title"
      >
        <div className="notes-editor-heading">
          <NotebookPen size={23} />

          <div>
            <h2 id="notes-editor-title">
              {editingId !== null
                ? 'Edit your note'
                : 'Write something down'}
            </h2>

            <p>Add text, a link, or both.</p>
          </div>
        </div>

        <form onSubmit={handleSave}>
          <div className="notes-form-row">
            <label>
              Title
              <input
                type="text"
                maxLength={200}
                placeholder="Give your note a title..."
                value={form.title}
                onChange={(event) =>
                  updateField('title', event.target.value)
                }
                disabled={saving}
              />
            </label>

            <label>
              Link (optional)
              <input
                type="url"
                maxLength={2000}
                placeholder="https://example.com"
                value={form.link}
                onChange={(event) =>
                  updateField('link', event.target.value)
                }
                disabled={saving}
              />
            </label>
          </div>

          <label className="notes-content-label">
            Your note
            <textarea
              rows={5}
              placeholder="Write whatever is on your mind..."
              value={form.content}
              onChange={(event) =>
                updateField('content', event.target.value)
              }
              disabled={saving}
            />
          </label>

          {/* =================================
              OPTIONAL EMAIL REMINDER
          ================================= */}

          <div className="notes-reminder-box">
            <label className="notes-reminder-toggle">
              <input
                type="checkbox"
                checked={form.wantsReminder}
                onChange={(event) =>
                  updateField(
                    'wantsReminder',
                    event.target.checked
                  )
                }
                disabled={saving}
              />

              <Bell size={18} />
              <span>Set an email reminder</span>
            </label>

            {form.wantsReminder && (
              <div className="notes-reminder-details">
                <label>
                  Reminder date and time
                  <input
                    type="datetime-local"
                    value={form.reminderAt}
                    min={localDateTime(new Date())}
                    onChange={(event) =>
                      updateField(
                        'reminderAt',
                        event.target.value
                      )
                    }
                    disabled={saving}
                    required
                  />
                </label>

                <p>
              Note reminders use your verified reminder email.
              Make sure email reminders are enabled in the
              sidebar before scheduling.
               </p>
              </div>
            )}
          </div>

          {/* Errors and success messages */}

          {error && (
            <p
              className="notes-message notes-error"
              role="alert"
            >
              {error}
            </p>
          )}

          {success && (
            <p
              className="notes-message notes-success"
              role="status"
            >
              <CheckCircle2 size={17} />
              {success}
            </p>
          )}

          {/* Form buttons */}

          <div className="notes-form-actions">
            <button
              type="submit"
              className="notes-save-button"
              disabled={saving}
            >
              {saving ? (
                <LoaderCircle
                  size={18}
                  className="notes-spinner"
                />
              ) : (
                <CheckCircle2 size={18} />
              )}

              {saving
                ? 'Saving...'
                : editingId !== null
                  ? 'Update note'
                  : 'Save note'}
            </button>

            {editingId !== null && (
              <button
                type="button"
                className="notes-cancel-button"
                onClick={resetForm}
                disabled={saving}
              >
                <X size={17} />
                Cancel
              </button>
            )}
          </div>
        </form>
      </section>

      {/* =====================================
          SAVED NOTES
      ===================================== */}

      <section className="notes-collection">
        <div className="notes-list-header">
          <div>
            <h2>Saved notes</h2>
            <p>
              {notes.length}{' '}
              {notes.length === 1 ? 'note' : 'notes'} in your space
            </p>
          </div>

          <label className="notes-search">
            <Search size={18} />
            <input
              type="search"
              placeholder="Search your notes..."
              aria-label="Search notes"
              value={query}
              onChange={(event) =>
                setQuery(event.target.value)
              }
            />
          </label>
        </div>

        {loading ? (
          <div className="notes-empty">
            <LoaderCircle
              size={28}
              className="notes-spinner"
            />

            <p>Loading your notes...</p>
          </div>
        ) : filteredNotes.length === 0 ? (
          <div className="notes-empty">
            <NotebookPen size={34} />

            <h3>
              {query ? 'No matching notes' : 'No notes yet'}
            </h3>

            <p>
              {query
                ? 'Try searching with another word.'
                : 'Your next idea can start right here.'}
            </p>
          </div>
        ) : (
          <div className="notes-grid">
            {filteredNotes.map((note) => (
              <article
                className="notes-card"
                key={note.id}
              >
                <div className="notes-card-top">
                  <NotebookPen size={20} />

                  <div className="notes-card-actions">
                    {/* Edit */}

                    <button
                      type="button"
                      onClick={() => startEditing(note)}
                      disabled={deletingId !== null}
                      aria-label={`Edit ${note.title || 'note'}`}
                      title="Edit note"
                    >
                      <Pencil size={17} />
                    </button>

                    {/* Delete */}

                    <button
                      type="button"
                      onClick={() => handleAskDelete(note)}
                      disabled={deletingId !== null}
                      aria-label={`Delete ${note.title || 'note'}`}
                      title="Delete note"
                    >
                      {deletingId === note.id ? (
                        <LoaderCircle
                          size={17}
                          className="notes-spinner"
                        />
                      ) : (
                        <Trash2 size={17} />
                      )}
                    </button>
                  </div>
                </div>

                <h3>
                  {note.title || 'Untitled note'}
                </h3>

                {note.content && (
                  <p className="notes-card-content">
                    {note.content}
                  </p>
                )}

                {note.link && (
                  <a
                    className="notes-card-link"
                    href={note.link}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink size={15} />
                    Open saved link
                  </a>
                )}

                {note.reminder_at && (
                  <div className="notes-card-reminder">
                    <Bell size={15} />

                    <span>
                      {note.reminder_sent_at
                        ? 'Reminder sent'
                        : `Reminder date: ${formatDate(
                            note.reminder_at
                          )}`}
                    </span>
                  </div>
                )}

                <div className="notes-card-date">
                  Updated {formatDate(note.updated_at)}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {/* =====================================
          CUSTOM DELETE CONFIRMATION MODAL
      ===================================== */}

      <DeleteConfirmModal
        open={Boolean(noteToDelete)}
        title="Delete this note?"
        message={
          `Are you sure you want to delete "${
            noteToDelete?.title || 'this note'
          }"? This action cannot be undone.`
        }
        confirmText="Delete note"
        cancelText="Keep it"
        loading={
          noteToDelete !== null &&
          deletingId === noteToDelete.id
        }
        onConfirm={handleConfirmDelete}
        onClose={handleCloseDelete}
      />
    </div>
  )
}
