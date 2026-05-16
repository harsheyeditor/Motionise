import { useState, useCallback } from 'react'
import './App.css'
import Topbar     from './components/Topbar/Topbar'
import Toolbar    from './components/Toolbar/Toolbar'
import LeftPanel  from './components/LeftPanel/LeftPanel'
import Studio     from './components/Studio/Studio'
import RightPanel from './components/RightPanel/RightPanel'
import Timeline   from './components/Timeline/Timeline'
import ColorPanel from './components/ColorPanel/ColorPanel'
import AIStudio   from './components/AIStudio/AIStudio'
import ExportModal from './components/ExportModal/ExportModal'
import KeyboardShortcutsModal from './components/KeyboardShortcutsModal/KeyboardShortcutsModal'
import AuthModal from './components/AuthModal/AuthModal'
import { AppProvider, useApp } from './context/AppContext'

/* ── Drag-to-resize divider ── */
function ResizeDivider({ onMouseDown, axis = 'x' }) {
  return (
    <div
      className={`resize-divider resize-divider-${axis}`}
      onMouseDown={onMouseDown}
    />
  )
}

/* ── Bottom nav tab bar ── */
const BOTTOM_TABS = [
  { id: 'media',     label: 'MEDIA',     icon: '📂' },
  { id: 'edit',      label: 'EDIT',      icon: '✂️'  },
  { id: 'effects',   label: 'EFFECTS',   icon: '✨' },
  { id: 'color',     label: 'COLOR',     icon: '🎨' },
  { id: 'audio',     label: 'AUDIO',     icon: '🎵' },
  { id: 'fairlight', label: 'FAIRLIGHT', icon: '🎚' },
]

function BottomNav({ activeTab, onTabChange }) {
  return (
    <div className="bottom-nav">
      {BOTTOM_TABS.map(t => (
        <button
          key={t.id}
          className={`bottom-nav-btn ${activeTab === t.id ? 'active' : ''}`}
          onClick={() => onTabChange(t.id)}
        >
          <span className="bottom-nav-icon">{t.icon}</span>
          <span className="bottom-nav-label">{t.label}</span>
        </button>
      ))}
    </div>
  )
}

function Shell() {
  const { workspace, showExportModal, showShortcutsModal } = useApp()

  /* Panel widths & heights */
  const [leftW,  setLeftW]  = useState(240)
  const [rightW, setRightW] = useState(270)
  const [tlH,    setTlH]    = useState(240)
  const [colorH, setColorH] = useState(200)

  /* Bottom nav state — 'color' shows color panel */
  const [bottomTab, setBottomTab] = useState('edit')
  const showColorPanel = bottomTab === 'color'

  const startDrag = useCallback((which, e) => {
    e.preventDefault()
    const startX = e.clientX
    const startY = e.clientY
    const startVal = which === 'left' ? leftW
                   : which === 'right' ? rightW
                   : which === 'tl' ? tlH
                   : colorH

    const onMove = (me) => {
      if (which === 'left')  setLeftW(Math.max(180, Math.min(420, startVal + (me.clientX - startX))))
      if (which === 'right') setRightW(Math.max(200, Math.min(440, startVal - (me.clientX - startX))))
      if (which === 'tl')    setTlH(Math.max(140, Math.min(520, startVal - (me.clientY - startY))))
      if (which === 'color') setColorH(Math.max(140, Math.min(340, startVal - (me.clientY - startY))))
    }
    const onUp = () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }, [leftW, rightW, tlH, colorH])

  return (
    <div className="app-shell">
      <Topbar />

      <div className="app-body">
        {/* Vertical tool rail */}
        <Toolbar />

        {workspace === 'ai' ? (
          <AIStudio />
        ) : (
          <>
            {/* Left panel */}
            <div style={{ width: leftW, flexShrink: 0, display: 'flex', overflow: 'hidden' }}>
              <LeftPanel />
            </div>
            <ResizeDivider onMouseDown={e => startDrag('left', e)} />

            {/* Center column */}
            <div className="app-center">
              <Studio />
              <ResizeDivider axis="y" onMouseDown={e => startDrag('tl', e)} />
              <Timeline height={tlH} />
              {showColorPanel && (
                <>
                  <ResizeDivider axis="y" onMouseDown={e => startDrag('color', e)} />
                  <div style={{ height: colorH, flexShrink: 0, overflow: 'hidden' }}>
                    <ColorPanel />
                  </div>
                </>
              )}
              <BottomNav activeTab={bottomTab} onTabChange={setBottomTab} />
            </div>

            <ResizeDivider onMouseDown={e => startDrag('right', e)} />

            {/* Right panel */}
            <div style={{ width: rightW, flexShrink: 0, display: 'flex', overflow: 'hidden' }}>
              <RightPanel />
            </div>
          </>
        )}

        {/* Modals */}
        {showExportModal && <ExportModal />}
        {showShortcutsModal && <KeyboardShortcutsModal />}
      </div>
    </div>
  )
}

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('motionise_token'))

  useEffect(() => {
    const handleAuthChange = () => setIsAuthenticated(!!localStorage.getItem('motionise_token'))
    window.addEventListener('auth_changed', handleAuthChange)
    return () => window.removeEventListener('auth_changed', handleAuthChange)
  }, [])

  if (!isAuthenticated) {
    return <AuthModal onLogin={() => setIsAuthenticated(true)} />
  }

  return (
    <AppProvider>
      <Shell />
    </AppProvider>
  )
}
