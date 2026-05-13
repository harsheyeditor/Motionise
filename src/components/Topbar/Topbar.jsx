import { useState, useEffect } from 'react'
import './Topbar.css'
import { useApp } from '../../context/AppContext'
import ProjectsModal from '../ProjectsModal/ProjectsModal'

const WORKSPACES = [
  { id: 'editing',    label: 'EDIT'      },
  { id: 'effects',    label: 'EFFECTS'   },
  { id: 'color',      label: 'COLOR'     },
  { id: 'audio',      label: 'AUDIO'     },
  { id: 'fairlight',  label: 'FAIRLIGHT' },
  { id: 'deliver',    label: 'DELIVER'   },
  { id: 'ai',         label: 'AI STUDIO', ai: true },
]

export default function Topbar() {
  const {
    workspace, setWorkspace,
    activeTool, setActiveTool,
    projectName, setProjectName,
    saveStatus, setSaveStatus,
    isPlaying, setIsPlaying,
    playhead, setPlayhead,
    generating, genProgress,
    simulateGenerate,
    totalDuration,
    undo, redo, shuttleJ, shuttleK, shuttleL,
    splitClipAtPlayhead, selectedClipId,
    setShowExportModal, setShowShortcutsModal,
    addMarker, deleteClip,
    projectId, loadProjectData
  } = useApp()

  const [editingName, setEditingName] = useState(false)
  const [showProjects, setShowProjects] = useState(false)

  useEffect(() => {
    const onKey = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return
      
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0
      const isCmd = isMac ? e.metaKey : e.ctrlKey

      if (isCmd && e.key === 'z' && !e.shiftKey) { e.preventDefault(); undo(); return }
      if (isCmd && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) { e.preventDefault(); redo(); return }

      if (e.key === ' ')   { e.preventDefault(); setIsPlaying(p => !p) }
      if (e.key === 'v' || e.key === 'V') setActiveTool('select')
      if (e.key === 't' || e.key === 'T') setActiveTool('trim')
      
      if (e.key === 'b' || e.key === 'B') {
        if (activeTool === 'blade' && selectedClipId) splitClipAtPlayhead(selectedClipId)
        setActiveTool('blade')
      }

      if (e.key === 'j' || e.key === 'J') { e.preventDefault(); shuttleJ() }
      if (e.key === 'k' || e.key === 'K') { e.preventDefault(); shuttleK() }
      if (e.key === 'l' || e.key === 'L') { e.preventDefault(); shuttleL() }

      if (e.key === 'm' || e.key === 'M') { e.preventDefault(); addMarker() }
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedClipId) { e.preventDefault(); deleteClip(selectedClipId) }
      
      if (e.key === '?') { e.preventDefault(); setShowShortcutsModal(s => !s) }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [setActiveTool, setIsPlaying, undo, redo, shuttleJ, shuttleK, shuttleL, splitClipAtPlayhead, selectedClipId, activeTool, setShowShortcutsModal, addMarker, deleteClip])

  return (
    <>
      <header className="topbar">

        {/* ── Left: Brand + Project Name ── */}
        <div className="tb-left">
          <div className="tb-brand">
            <div className="tb-logo-mark">M</div>
            <span className="tb-brand-name">MOTIONISE</span>
          </div>
          <div className="tb-vdiv" />
          <button className="btn-ghost" style={{ marginRight: 8 }} onClick={() => setShowProjects(true)}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
              <polyline points="9 22 9 12 15 12 15 22"></polyline>
            </svg>
          </button>
          <div className="tb-project-wrap">
            {editingName ? (
              <input
                className="tb-name-input"
                value={projectName}
                autoFocus
                onChange={e => { setProjectName(e.target.value); }}
                onBlur={() => { setEditingName(false); }}
                onKeyDown={e => e.key === 'Enter' && setEditingName(false)}
              />
            ) : (
              <span className="tb-name" onClick={() => setEditingName(true)}>{projectName}</span>
            )}
            <span className={`tb-save-status tb-save-${saveStatus}`}>
              {saveStatus === 'saved' ? 'Saved' : saveStatus === 'saving' ? 'Saving...' : 'Unsaved'}
            </span>
          </div>
        </div>

      {/* ── Center: Workspace Tabs ── */}
      <div className="tb-center">
        <nav className="tb-workspaces">
          {WORKSPACES.map(w => (
            <button
              key={w.id}
              className={`tb-ws-tab ${workspace === w.id ? 'active' : ''} ${w.ai ? 'ai-tab' : ''}`}
              onClick={() => setWorkspace(w.id)}
            >
              {w.ai && <span className="tb-ai-pip" />}
              {w.label}
            </button>
          ))}
        </nav>
      </div>

      {/* ── Right: Actions ── */}
      <div className="tb-right">
        {/* Timecode display */}
        <div className="tb-tc-block">
          <span className="tb-tc-label">TC</span>
          <span className="tb-tc-val mono">{formatTC(playhead)}</span>
        </div>

        <div className="tb-vdiv" />

        {/* Icons row */}
        <div className="tb-action-row">
          <button className="tb-icon-btn" data-tip="Settings">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
            </svg>
          </button>
          <button className="tb-icon-btn" data-tip="Cloud Sync">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/>
              <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/>
            </svg>
          </button>
          <button className="tb-icon-btn" data-tip="Collaboration">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
          </button>
        </div>

        <div className="tb-vdiv" />

        {/* Generation progress */}
        {generating && (
          <div className="tb-gen-pill">
            <span className="spin" style={{ fontSize: 10 }}>⟳</span>
            <div className="tb-gen-track">
              <div className="tb-gen-fill" style={{ width: `${genProgress}%` }} />
            </div>
            <span className="mono" style={{ fontSize: 10, color: 'var(--purple-bright)', minWidth: 28 }}>
              {Math.round(genProgress)}%
            </span>
          </div>
        )}

        <button className="tb-quick-export-btn" onClick={() => setShowExportModal(true)}>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
          Quick Export
        </button>

        <button className="tb-export-btn" onClick={() => setShowExportModal(true)}>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
            <polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/>
            <polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/>
          </svg>
          Export
        </button>

        {/* Avatar */}
        <div className="tb-avatar" data-tip="Account">
          <span>U</span>
        </div>
      </div>
    </header>
      {showProjects && (
        <ProjectsModal
          currentProjectId={projectId}
          onLoad={(p) => {
            loadProjectData(p.id)
            setShowProjects(false)
          }}
          onClose={() => setShowProjects(false)}
        />
      )}
    </>
  )
}

function formatTC(sec) {
  const h = Math.floor(sec / 3600)
  const m = Math.floor((sec % 3600) / 60)
  const s = Math.floor(sec % 60)
  const f = Math.floor((sec % 1) * 24)
  return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}:${String(f).padStart(2,'0')}`
}
