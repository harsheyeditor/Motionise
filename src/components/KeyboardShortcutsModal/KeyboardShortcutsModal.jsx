import './KeyboardShortcutsModal.css'
import { useApp } from '../../context/AppContext'

const SHORTCUTS = [
  { category: 'Playback', items: [
    { key: 'Space', desc: 'Play / Pause' },
    { key: 'L', desc: 'Shuttle Forward (press again to speed up)' },
    { key: 'K', desc: 'Shuttle Stop' },
    { key: 'J', desc: 'Shuttle Reverse (press again to speed up)' },
  ]},
  { category: 'Tools', items: [
    { key: 'V', desc: 'Selection Tool' },
    { key: 'B', desc: 'Blade Tool (press again to split selected clip)' },
    { key: 'T', desc: 'Trim Tool' },
    { key: 'S', desc: 'Toggle Snapping' },
    { key: 'M', desc: 'Add Marker at Playhead' },
  ]},
  { category: 'Edit', items: [
    { key: 'Ctrl + Z', desc: 'Undo' },
    { key: 'Ctrl + Y / Shift+Z', desc: 'Redo' },
    { key: 'Del / Backspace', desc: 'Delete Selected Clip' },
  ]},
  { category: 'View', items: [
    { key: '?', desc: 'Toggle Keyboard Shortcuts' },
  ]},
]

export default function KeyboardShortcutsModal() {
  const { setShowShortcutsModal } = useApp()

  return (
    <div className="modal-backdrop" onClick={() => setShowShortcutsModal(false)}>
      <div className="shortcuts-modal" onClick={e => e.stopPropagation()}>
        
        <div className="shortcuts-modal-header">
          <div className="shortcuts-modal-title">Keyboard Shortcuts</div>
          <button className="shortcuts-modal-close" onClick={() => setShowShortcutsModal(false)}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <div className="shortcuts-modal-body">
          {SHORTCUTS.map(group => (
            <div key={group.category} className="shortcuts-group">
              <div className="shortcuts-category">{group.category}</div>
              <div className="shortcuts-list">
                {group.items.map(item => (
                  <div key={item.key} className="shortcut-row">
                    <span className="shortcut-desc">{item.desc}</span>
                    <span className="shortcut-key">{item.key}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  )
}
