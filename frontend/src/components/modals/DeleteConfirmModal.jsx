import './DeleteConfirmModal.css'
import { Trash2, X } from 'lucide-react'

export default function DeleteConfirmModal({
  open,
  title = 'Delete item?',
  message = 'Are you sure you want to delete this item? This action cannot be undone.',
  confirmText = 'Delete',
  cancelText = 'Cancel',
  loading = false,
  onConfirm,
  onClose,
}) {
  if (!open) return null

  return (
    <div
      className="delete-modal-overlay"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-modal-title"
    >
      <div
        className="delete-modal-card"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          className="delete-modal-close"
          onClick={onClose}
          aria-label="Close delete dialog"
          type="button"
        >
          <X size={18} />
        </button>

        <div className="delete-modal-icon">
          <Trash2 size={24} />
        </div>

        <h3 id="delete-modal-title">{title}</h3>
        <p>{message}</p>

        <div className="delete-modal-actions">
          <button
            type="button"
            className="delete-modal-cancel"
            onClick={onClose}
            disabled={loading}
          >
            {cancelText}
          </button>

          <button
            type="button"
            className="delete-modal-confirm"
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? 'Deleting...' : confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}