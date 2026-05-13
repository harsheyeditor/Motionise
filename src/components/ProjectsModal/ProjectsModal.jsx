import { useState, useEffect } from 'react'
import './ProjectsModal.css'
import { listProjects, createProject, deleteProject } from '../../api/projects'

export default function ProjectsModal({ currentProjectId, onLoad, onClose }) {
  const [projects, setProjects]   = useState([])
  const [loading, setLoading]     = useState(true)
  const [creating, setCreating]   = useState(false)
  const [newName, setNewName]     = useState('')
  const [error, setError]         = useState(null)

  useEffect(() => {
    listProjects()
      .then(setProjects)
      .catch(() => setError('Could not load projects'))
      .finally(() => setLoading(false))
  }, [])

  async function handleCreate(e) {
    e.preventDefault()
    if (!newName.trim()) return
    setCreating(true)
    try {
      const p = await createProject(newName.trim())
      onLoad(p)          // switch to the new project immediately
    } catch {
      setError('Failed to create project')
    } finally { setCreating(false) }
  }

  async function handleDelete(e, id) {
    e.stopPropagation()
    if (!confirm('Delete this project? This cannot be undone.')) return
    try {
      await deleteProject(id)
      setProjects(ps => ps.filter(p => p.id !== id))
      if (id === currentProjectId) onClose()   // close if current project deleted
    } catch { setError('Failed to delete project') }
  }

  function fmtDate(iso) {
    return new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="pm-modal" onClick={e => e.stopPropagation()}>

        <div className="pm-header">
          <span className="pm-title">Projects</span>
          <button className="pm-close" onClick={onClose}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {error && <div className="pm-error">{error}</div>}

        {/* New project form */}
        <form className="pm-new-form" onSubmit={handleCreate}>
          <input
            className="pm-name-input"
            placeholder="New project name…"
            value={newName}
            onChange={e => setNewName(e.target.value)}
            autoFocus
          />
          <button className="btn-ai pm-new-btn" type="submit" disabled={creating || !newName.trim()}>
            {creating ? '…' : '+ New'}
          </button>
        </form>

        <div className="pm-list">
          {loading && <div className="pm-empty">Loading…</div>}
          {!loading && projects.length === 0 && (
            <div className="pm-empty">No projects yet — create one above</div>
          )}
          {projects.map(p => (
            <div
              key={p.id}
              className={`pm-row ${p.id === currentProjectId ? 'current' : ''}`}
              onClick={() => onLoad(p)}
            >
              <div className="pm-row-info">
                <span className="pm-row-name">{p.name}</span>
                <span className="pm-row-meta">Updated {fmtDate(p.updatedAt)}</span>
              </div>
              {p.id === currentProjectId && <span className="pm-row-badge">open</span>}
              <button
                className="pm-row-del"
                title="Delete project"
                onClick={e => handleDelete(e, p.id)}
              >
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="3 6 5 6 21 6"/>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                </svg>
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
