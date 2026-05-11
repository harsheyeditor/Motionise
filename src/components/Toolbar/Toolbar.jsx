import './Toolbar.css'
import { useApp } from '../../context/AppContext'

const TOOL_GROUPS = [
  [
    { id: 'select', label: 'Select', key: 'V', icon: (
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M4 4l7 18 3-7 7-3z"/><line x1="13" y1="13" x2="20" y2="20"/>
      </svg>
    )},
    { id: 'trim', label: 'Trim', key: 'T', icon: (
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="8" width="18" height="8" rx="1"/><line x1="3" y1="12" x2="21" y2="12"/>
      </svg>
    )},
    { id: 'blade', label: 'Blade', key: 'B', icon: (
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><line x1="20" y1="4" x2="8.12" y2="15.88"/>
        <line x1="14.47" y1="14.48" x2="20" y2="20"/><line x1="8.12" y1="8.12" x2="12" y2="12"/>
      </svg>
    )},
  ],
  [
    { id: 'text', label: 'Text', key: 'X', icon: (
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <polyline points="4 7 4 4 20 4 20 7"/><line x1="9" y1="20" x2="15" y2="20"/>
        <line x1="12" y1="4" x2="12" y2="20"/>
      </svg>
    )},
    { id: 'shape', label: 'Shape', key: 'U', icon: (
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
      </svg>
    )},
    { id: 'pen', label: 'Pen', key: 'P', icon: (
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
      </svg>
    )},
  ],
  [
    { id: 'hand', label: 'Hand', key: 'H', icon: (
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M18 11V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v0"/>
        <path d="M14 10V4a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v2"/>
        <path d="M10 10.5V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v8"/>
        <path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15"/>
      </svg>
    )},
    { id: 'zoom', label: 'Zoom', key: 'Z', icon: (
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
        <line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/>
      </svg>
    )},
  ],
]

const BOTTOM_TOOLS = [
  { id: 'snap', label: 'Snap (S)', key: 'S', icon: (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 22V2"/><path d="M7 7H2"/><path d="M7 17H2"/><path d="M22 7h-5"/><path d="M22 17h-5"/>
    </svg>
  )},
  { id: 'marker', label: 'Marker (M)', key: 'M', icon: (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
    </svg>
  )},
]

export default function Toolbar() {
  const { activeTool, setActiveTool } = useApp()

  return (
    <div className="toolbar">
      <div className="toolbar-tools">
        {TOOL_GROUPS.map((group, gi) => (
          <div key={gi} className="toolbar-group">
            {gi > 0 && <div className="toolbar-sep" />}
            {group.map(t => (
              <button
                key={t.id}
                className={`toolbar-btn ${activeTool === t.id ? 'active' : ''}`}
                onClick={() => setActiveTool(t.id)}
                data-tip={`${t.label} (${t.key})`}
              >
                <span className="toolbar-icon">{t.icon}</span>
                <span className="toolbar-key">{t.key}</span>
              </button>
            ))}
          </div>
        ))}
      </div>

      <div className="toolbar-bottom">
        <div className="toolbar-sep" />
        {BOTTOM_TOOLS.map(t => (
          <button
            key={t.id}
            className="toolbar-btn"
            data-tip={t.label}
          >
            <span className="toolbar-icon">{t.icon}</span>
            <span className="toolbar-key">{t.key}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
