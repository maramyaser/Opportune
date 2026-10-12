import { Bookmark, Check, ExternalLink, LoaderCircle, Pencil, Sparkles, X } from 'lucide-react'

const modalBackdropStyle = {
  position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(26, 65, 65, 0.48)',
  display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', overflowY: 'auto',
}
const modalStyle = {
  width: 'min(620px, 100%)', maxHeight: '90vh', overflowY: 'auto', background: '#fffdf7',
  border: '2px solid #245d5d', borderRadius: '24px', boxShadow: '8px 8px 0 #245d5d', padding: '26px', color: '#245d5d',
}
const fieldStyle = {
  display: 'block', width: '100%', boxSizing: 'border-box', marginTop: '7px', marginBottom: '16px',
  padding: '12px 14px', border: '1.5px solid #b6d9d5', borderRadius: '12px', background: '#fff', color: '#245d5d', font: 'inherit',
}

export default function OpportunityModals({
  showAddModal, setShowAddModal, sourceUrl, setSourceUrl, pastedText, setPastedText,
  draft, setDraft, extracting, saving, extractError, setExtractError, editingOpportunityId,
  handleExtract, handleSave, closeOpportunityForm, selectedOpportunity, setSelectedOpportunity,
  openEditModal, STATUS_OPTIONS, getType, formatDeadline,
}) {
  return (
    <>
      {showAddModal && (
        <div style={modalBackdropStyle} onMouseDown={(event) => { if (event.target === event.currentTarget) closeOpportunityForm() }}>
          <section style={modalStyle} role="dialog" aria-modal="true" aria-labelledby="add-modal-title" onMouseDown={(event) => event.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'flex-start' }}>
              <div>
                <div className="eyebrow"><Sparkles size={15} /> YOUR OPPORTUNITY ASSISTANT</div>
                <h2 id="add-modal-title" style={{ margin: '10px 0 6px' }}>{editingOpportunityId !== null ? 'Edit opportunity' : draft ? 'Review the details' : 'Track an opportunity'}</h2>
                <p style={{ marginTop: 0 }}>{editingOpportunityId !== null ? 'Update the details for this opportunity.' : 'Paste a link or text. AI will help identify the important details.'}</p>
              </div>
              <button className="icon-button" aria-label="Close" onClick={closeOpportunityForm} disabled={extracting || saving}><X size={19} /></button>
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
                <label htmlFor="draft-source-url">Source URL</label>
                <input id="draft-source-url" style={fieldStyle} type="url" value={draft.source_url || ''} onChange={(event) => setDraft({ ...draft, source_url: event.target.value })} />
                <label htmlFor="draft-application-url">Application URL</label>
                <input id="draft-application-url" style={fieldStyle} type="url" value={draft.application_url || ''} onChange={(event) => setDraft({ ...draft, application_url: event.target.value })} />
                <label htmlFor="draft-location">Location</label>
                <input id="draft-location" style={fieldStyle} value={draft.location || ''} onChange={(event) => setDraft({ ...draft, location: event.target.value })} />
                <label htmlFor="draft-benefits">Benefits</label>
                <textarea id="draft-benefits" style={{ ...fieldStyle, resize: 'vertical' }} rows={3} value={draft.benefits || ''} onChange={(event) => setDraft({ ...draft, benefits: event.target.value })} />
                <label htmlFor="draft-documents">Required documents (one per line)</label>
                <textarea id="draft-documents" style={{ ...fieldStyle, resize: 'vertical' }} rows={3} placeholder={'CV\nMotivation letter\nAcademic transcript'} value={(draft.required_documents || []).join('\n')} onChange={(event) => setDraft({ ...draft, required_documents: event.target.value.split('\n').map((document) => document.trim()).filter(Boolean) })} />
                <label htmlFor="draft-status">Application status</label>
                <select id="draft-status" style={fieldStyle} value={draft.status || 'saved'} onChange={(event) => setDraft({ ...draft, status: event.target.value })}>
                  {STATUS_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                </select>
                <label htmlFor="draft-notes">Personal notes</label>
                <textarea id="draft-notes" style={{ ...fieldStyle, resize: 'vertical' }} rows={3} placeholder="What do you need to prepare or remember?" value={draft.notes || ''} onChange={(event) => setDraft({ ...draft, notes: event.target.value })} />
                {extractError && <p role="alert" style={{ color: '#b83d2a' }}>{extractError}</p>}
                <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                  <button type="button" className="secondary-button" onClick={() => { if (editingOpportunityId !== null) { closeOpportunityForm() } else { setDraft(null); setExtractError('') } }} disabled={saving}>{editingOpportunityId !== null ? 'Cancel' : 'Back'}</button>
                  <button type="submit" className="primary-button" disabled={saving}>
                    {saving ? <LoaderCircle size={18} className="spin" /> : <Check size={18} />}
                    {saving ? 'Saving...' : editingOpportunityId !== null ? 'Save changes' : 'Save opportunity'}
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
              <button type="button" className="secondary-button" onClick={() => openEditModal(selectedOpportunity)}><Pencil size={16} /> Edit opportunity</button>
              {(selectedOpportunity.application_url || selectedOpportunity.source_url) && (
                <a className="primary-button" href={selectedOpportunity.application_url || selectedOpportunity.source_url} target="_blank" rel="noreferrer" style={{ textDecoration: 'none' }}>
                  Open opportunity <ExternalLink size={17} />
                </a>
              )}
            </div>
          </section>
        </div>
      )}
    </>
  )
}
