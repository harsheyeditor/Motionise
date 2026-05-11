import { useState } from 'react'
import './ColorPanel.css'

/* Color wheel visual (CSS-only circular gradient) */
function ColorWheel({ label, tint = 'transparent' }) {
  const [x, setX] = useState(50)
  const [y, setY] = useState(50)
  const [val, setVal] = useState(0.0)

  const handleDrag = (e) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const cx = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100))
    const cy = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100))
    setX(cx)
    setY(cy)
  }

  return (
    <div className="cw-wrap">
      <div className="cw-wheel-wrap">
        <div
          className="cw-wheel"
          style={{ '--tint': tint }}
          onMouseMove={e => e.buttons === 1 && handleDrag(e)}
          onMouseDown={handleDrag}
        >
          <div className="cw-handle" style={{ left: `${x}%`, top: `${y}%` }} />
        </div>
        <input
          type="range" min={-1} max={1} step={0.001} value={val}
          className="cw-fader"
          onChange={e => setVal(+e.target.value)}
        />
      </div>
      <div className="cw-readouts">
        <span className="cw-label">{label}</span>
        <div className="cw-nums">
          {[0.00, 0.65, 0.00, 0.00].map((v, i) => (
            <div key={i} className="cw-num-cell">
              <span className="cw-ch">{['■','■','■','■'][i]}</span>
              <span className="cw-val">{v.toFixed(2)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

/* Waveform scope (CSS-rendered) */
function WaveformScope() {
  return (
    <div className="scope-wrap">
      <div className="scope-header">
        <span className="scope-title">Scopes</span>
        <div className="scope-btns">
          <button className="scope-btn active">Waveform</button>
          <button className="scope-btn">Vectorscope</button>
          <button className="scope-btn">Histogram</button>
          <button className="scope-btn">Parade</button>
        </div>
      </div>
      <div className="scope-canvas">
        <svg viewBox="0 0 400 160" className="scope-svg" preserveAspectRatio="none">
          {/* Grid lines */}
          {[0.25, 0.5, 0.75].map((v, i) => (
            <line key={i} x1="0" y1={v * 160} x2="400" y2={v * 160}
              stroke="rgba(255,255,255,0.06)" strokeWidth="1"/>
          ))}
          {/* Waveform traces */}
          <path
            d="M0,120 C20,80 40,40 60,60 C80,80 100,100 120,70 C140,40 160,30 180,50 C200,70 220,90 240,60 C260,30 280,20 300,40 C320,60 340,80 360,50 C380,30 390,20 400,30"
            fill="none" stroke="#22C55E" strokeWidth="1.5" opacity="0.8"
          />
          <path
            d="M0,130 C20,100 40,70 60,90 C80,110 100,120 120,100 C140,80 160,60 180,80 C200,100 220,110 240,90 C260,70 280,60 300,80 C320,100 340,110 360,80 C380,60 390,50 400,60"
            fill="none" stroke="#3B82F6" strokeWidth="1.5" opacity="0.8"
          />
          <path
            d="M0,140 C20,120 40,100 60,110 C80,120 100,130 120,115 C140,100 160,90 180,105 C200,120 220,125 240,110 C260,95 280,85 300,100 C320,115 340,120 360,105 C380,90 390,85 400,95"
            fill="none" stroke="#EF4444" strokeWidth="1.5" opacity="0.8"
          />
        </svg>
        <div className="scope-labels">
          {[1023, 768, 512, 256, 0].map(v => (
            <span key={v} className="scope-label">{v}</span>
          ))}
        </div>
      </div>
    </div>
  )
}

/* Curves editor */
function CurvesEditor() {
  return (
    <div className="curves-wrap">
      <div className="curves-header">
        <span className="scope-title">Curves — Custom</span>
        <div className="curves-channels">
          {['all','r','g','b'].map((c, i) => (
            <button key={c} className={`curve-ch curve-ch-${c}`} title={['All','Red','Green','Blue'][i]}>●</button>
          ))}
        </div>
        <button className="btn-ghost" style={{ fontSize: 10 }}>Reset</button>
      </div>
      <div className="curves-canvas">
        <svg viewBox="0 0 200 140" className="curves-svg" preserveAspectRatio="none">
          {/* Grid */}
          {[1,2,3].map(i => (
            <line key={`h${i}`} x1="0" y1={i * 35} x2="200" y2={i * 35}
              stroke="rgba(255,255,255,0.05)" strokeWidth="1"/>
          ))}
          {[1,2,3].map(i => (
            <line key={`v${i}`} x1={i * 50} y1="0" x2={i * 50} y2="140"
              stroke="rgba(255,255,255,0.05)" strokeWidth="1"/>
          ))}
          {/* Diagonal reference */}
          <line x1="0" y1="140" x2="200" y2="0" stroke="rgba(255,255,255,0.08)" strokeWidth="1" strokeDasharray="4,4"/>
          {/* Curve */}
          <path
            d="M0,140 C40,130 80,100 110,70 C140,40 160,20 200,0"
            fill="none" stroke="#E2E8F0" strokeWidth="2"
          />
          {/* Control points */}
          <circle cx="70" cy="100" r="4" fill="#3B82F6" stroke="#fff" strokeWidth="1.5"/>
          <circle cx="130" cy="45" r="4" fill="#3B82F6" stroke="#fff" strokeWidth="1.5"/>
        </svg>
      </div>
    </div>
  )
}

export default function ColorPanel() {
  const [tab, setTab] = useState('primaries')

  return (
    <div className="color-panel">
      {/* Header */}
      <div className="color-panel-header">
        <div className="color-panel-tabs">
          <button className={`color-tab ${tab === 'primaries' ? 'active' : ''}`} onClick={() => setTab('primaries')}>
            Color
          </button>
          <button className={`color-tab ${tab === 'scopes' ? 'active' : ''}`} onClick={() => setTab('scopes')}>
            Scopes
          </button>
        </div>
        <div style={{ flex: 1 }} />
        <span className="color-panel-meta">Temp 0.0 · Tint 0.0 · Contrast 1.000 · Pivot 0.435 · Mid/Detail 0.00</span>
      </div>

      <div className="color-panel-body">
        {tab === 'primaries' && (
          <>
            {/* Color wheels */}
            <div className="cw-row">
              <ColorWheel label="Lift" tint="rgba(20,20,30,0.6)" />
              <ColorWheel label="Gamma" tint="rgba(30,20,40,0.4)" />
              <ColorWheel label="Gain" tint="rgba(20,30,20,0.4)" />
              <ColorWheel label="Offset" tint="rgba(30,20,20,0.3)" />
            </div>
          </>
        )}

        {tab === 'scopes' && (
          <div className="scopes-layout">
            <WaveformScope />
          </div>
        )}

        {/* Curves — always visible */}
        <div className="curves-section">
          <CurvesEditor />
        </div>

        {/* Hue vs Sat */}
        <div className="hvs-section">
          <div className="scope-title" style={{ padding: '4px 8px' }}>Hue vs Sat</div>
          <div className="hvs-canvas">
            <svg viewBox="0 0 160 80" className="hvs-svg" preserveAspectRatio="none">
              <defs>
                <linearGradient id="hueGrad" x1="0" y1="0" x2="1" y2="0">
                  {[0,60,120,180,240,300,360].map((h, i) => (
                    <stop key={h} offset={`${i * 100/6}%`} stopColor={`hsl(${h},90%,55%)`}/>
                  ))}
                </linearGradient>
              </defs>
              <rect x="0" y="0" width="160" height="80" fill="rgba(0,0,0,0.5)"/>
              <rect x="0" y="70" width="160" height="6" fill="url(#hueGrad)" opacity="0.8"/>
              <path d="M0,60 C20,55 40,40 60,35 C80,30 100,35 120,45 C140,55 150,50 160,45"
                fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="2"/>
              <circle cx="80" cy="30" r="3" fill="#60A5FA" stroke="#fff" strokeWidth="1"/>
            </svg>
          </div>
        </div>
      </div>
    </div>
  )
}
