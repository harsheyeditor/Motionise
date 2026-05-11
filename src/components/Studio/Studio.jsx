import { useState, useRef } from 'react'
import './Studio.css'
import { useApp } from '../../context/AppContext'

/* ── Transport icon helpers ── */
const Icon = ({ d, size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    {typeof d === 'string' ? <path d={d} /> : d}
  </svg>
)

export default function Studio() {
  const { isPlaying, setIsPlaying, playhead, setPlayhead, totalDuration, generating, genProgress, simulateGenerate } = useApp()
  const [zoomPct,    setZoomPct]    = useState(90)
  const [showSafe,   setShowSafe]   = useState(true)
  const [showGuides, setShowGuides] = useState(false)
  const [resolution, setResolution] = useState('1080p')
  const [fps,        setFps]        = useState('24')
  const [showSource, setShowSource] = useState(false)

  const progressPct = totalDuration > 0 ? (playhead / totalDuration) * 100 : 0

  return (
    <div className="studio">

      {/* ── Monitor row ── */}
      <div className="studio-monitors">

        {/* Source Monitor (collapsible) */}
        {showSource && (
          <div className="monitor source-monitor">
            <div className="monitor-topbar">
              <span className="monitor-label">Source</span>
              <span className="monitor-title truncate">hero_shot_001.mp4</span>
              <div style={{ flex: 1 }} />
              <button className="monitor-close-btn" onClick={() => setShowSource(false)}>✕</button>
            </div>
            <div className="monitor-canvas">
              <div className="monitor-canvas-inner">
                <div className="pf-bg src-bg" />
                <div className="monitor-tc mono">00:00:05:12</div>
              </div>
            </div>
            <div className="monitor-footer">
              <span className="monitor-meta mono">5:12 · 1920×1080 · 24fps</span>
              <div style={{ flex: 1 }} />
              <button className="btn-ghost" style={{ fontSize: 10, height: 20 }}>Insert</button>
              <button className="btn-ghost" style={{ fontSize: 10, height: 20 }}>Overwrite</button>
            </div>
          </div>
        )}

        {/* Program Monitor */}
        <div className="monitor program-monitor">
          <div className="monitor-topbar">
            <span className="monitor-label">Program</span>
            <span className="monitor-title truncate">Q2 Product Launch ▾</span>
            <div style={{ flex: 1 }} />
            <div className="monitor-meta-row">
              <select className="select" style={{ width: 52, fontSize: 10, height: 20, padding: '0 2px' }}
                value={`${zoomPct}%`}
                onChange={e => setZoomPct(parseInt(e.target.value))}>
                {[50, 75, 90, 100, 125, 150].map(v => (
                  <option key={v} value={`${v}%`}>{v}%</option>
                ))}
              </select>
              <span className="monitor-meta mono">{zoomPct}%</span>
            </div>
            <div className="monitor-meta-row mono" style={{ fontSize: 10, color: 'var(--text-muted)', gap: 4 }}>
              <span>50%</span>
              <span>·</span>
              <span className="monitor-tc-small">{formatTC(totalDuration)}</span>
            </div>
          </div>

          {/* Canvas */}
          <div className="monitor-canvas">
            <div className="monitor-canvas-inner" style={{ aspectRatio: '16/9' }}>
              {showSafe && <div className="safe-action" />}
              {showSafe && <div className="safe-title" />}
              {showGuides && <div className="guide-h" style={{ top: '50%' }} />}
              {showGuides && <div className="guide-v" style={{ left: '50%' }} />}

              {/* Demo preview content */}
              <div className="preview-frame">
                <div className="pf-bg" />
                <div className="pf-content">
                  <div className="pf-eyebrow">WANDERLUST</div>
                  <div className="pf-title">Q2 Product Launch</div>
                  <div className="pf-sub">AI MOTION DESIGN STUDIO</div>
                </div>
              </div>

              {/* Timecode overlay */}
              <div className="canvas-tc mono">{formatTC(playhead)}</div>

              {/* Generating overlay */}
              {generating && (
                <div className="canvas-gen-overlay">
                  <div className="canvas-gen-inner">
                    <span className="spin" style={{ fontSize: 18 }}>⟳</span>
                    <span style={{ fontSize: 13, fontWeight: 600 }}>Generating…</span>
                    <div className="canvas-gen-bar">
                      <div className="canvas-gen-fill" style={{ width: `${genProgress}%` }} />
                    </div>
                    <span className="mono" style={{ fontSize: 11, color: 'var(--purple-bright)' }}>
                      {Math.round(genProgress)}%
                    </span>
                  </div>
                </div>
              )}

              {/* Bottom-right info */}
              <div className="canvas-info-strip">
                <span>{resolution}</span>
                <span className="canvas-info-sep">|</span>
                <span>{fps} fps</span>
                <span className="canvas-info-sep">|</span>
                <span>{zoomPct}%</span>
              </div>
            </div>

            {/* Zoom / viewport controls (bottom-left) */}
            <div className="canvas-zoom-controls">
              <button
                className={`btn-icon ${showSafe ? 'active' : ''}`}
                title="Safe Zones" onClick={() => setShowSafe(s => !s)}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="18" height="18" rx="1"/>
                  <rect x="7" y="7" width="10" height="10" rx="1"/>
                </svg>
              </button>
              <button
                className={`btn-icon ${showGuides ? 'active' : ''}`}
                title="Guides" onClick={() => setShowGuides(s => !s)}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="12" y1="2" x2="12" y2="22"/><line x1="2" y1="12" x2="22" y2="12"/>
                </svg>
              </button>
              <div className="canvas-zoom-sep" />
              <button className="btn-icon" title="Fit" onClick={() => setZoomPct(90)}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/>
                </svg>
              </button>
              <button className="btn-icon" title="Zoom out" onClick={() => setZoomPct(z => Math.max(25, z - 25))}>−</button>
              <span className="canvas-zoom-val mono">{zoomPct}%</span>
              <button className="btn-icon" title="Zoom in" onClick={() => setZoomPct(z => Math.min(400, z + 25))}>+</button>
              <div className="canvas-zoom-sep" />
              <button className="btn-icon" title="Source Monitor" onClick={() => setShowSource(s => !s)}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8m-4-4v4"/>
                </svg>
              </button>
              <select className="select" style={{ width: 46, fontSize: 10, height: 20 }}
                value={resolution} onChange={e => setResolution(e.target.value)}>
                <option>720p</option><option>1080p</option><option>4K</option>
              </select>
              <select className="select" style={{ width: 40, fontSize: 10, height: 20 }}
                value={fps} onChange={e => setFps(e.target.value)}>
                <option>24</option><option>30</option><option>60</option>
              </select>
            </div>
          </div>

          {/* ── Transport Controls ── */}
          <div className="transport-bar">
            {/* Scrub timeline */}
            <div className="transport-scrub-wrap">
              <div
                className="transport-scrub"
                onClick={e => {
                  const rect = e.currentTarget.getBoundingClientRect()
                  const pct = (e.clientX - rect.left) / rect.width
                  setPlayhead(Math.max(0, Math.min(totalDuration, pct * totalDuration)))
                }}
              >
                <div className="transport-scrub-fill" style={{ width: `${progressPct}%` }} />
                <div className="transport-scrub-head" style={{ left: `${progressPct}%` }} />
              </div>
            </div>

            <div className="transport-controls">
              {/* Left: TC */}
              <div className="transport-tc mono">{formatTC(playhead)}</div>

              {/* Center: playback buttons */}
              <div className="transport-btns">
                <button className="transport-btn" title="Go to Start (Home)" onClick={() => setPlayhead(0)}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M6 6h2v12H6zm3.5 6 8.5 6V6z"/>
                  </svg>
                </button>
                <button className="transport-btn" title="Step Back">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                    <path d="m6 18 8.5-6L6 6v12zM16 6v12h2V6h-2z" transform="rotate(180 12 12)"/>
                  </svg>
                </button>
                <button className="transport-btn" title="Rewind">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M11 18V6l-8.5 6 8.5 6zm.5-6 8.5 6V6l-8.5 6z"/>
                  </svg>
                </button>
                <button
                  className={`transport-play-btn ${isPlaying ? 'playing' : ''}`}
                  onClick={() => setIsPlaying(p => !p)}
                  title="Play/Pause (Space)"
                >
                  {isPlaying
                    ? <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
                    : <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
                  }
                </button>
                <button className="transport-btn" title="Fast Forward">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M4 18l8.5-6L4 6v12zm9-12v12l8.5-6L13 6z"/>
                  </svg>
                </button>
                <button className="transport-btn" title="Step Forward">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                    <path d="m6 18 8.5-6L6 6v12zM16 6v12h2V6h-2z"/>
                  </svg>
                </button>
                <button className="transport-btn" title="Go to End" onClick={() => setPlayhead(totalDuration)}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                    <path d="m6 18 8.5-6L6 6v12zM16 6v12h2V6h-2z"/>
                  </svg>
                </button>
              </div>

              {/* Right: extras */}
              <div className="transport-extras">
                <button className="transport-btn" title="Loop">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/>
                    <polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/>
                  </svg>
                </button>
                <button className="transport-btn" title="Mark In">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="15 18 9 12 15 6"/>
                    <line x1="9" y1="18" x2="9" y2="6"/>
                  </svg>
                </button>
                <button className="transport-btn" title="Mark Out">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="9 18 15 12 9 6"/>
                    <line x1="15" y1="18" x2="15" y2="6"/>
                  </svg>
                </button>
                <div className="transport-sep" />
                <select className="select" style={{ width: 36, fontSize: 10, height: 22 }}>
                  <option>Nt</option><option>1x</option><option>2x</option>
                </select>
                <button className="transport-btn" title="Export Frame">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                    <polyline points="7 10 12 15 17 10"/>
                    <line x1="12" y1="15" x2="12" y2="3"/>
                  </svg>
                </button>
                <button className="transport-btn" title="Settings">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="3"/>
                    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── AI Command Bar ── */}
      <AICommandBar simulateGenerate={simulateGenerate} generating={generating} genProgress={genProgress} />
    </div>
  )
}

function AICommandBar({ simulateGenerate, generating, genProgress }) {
  const [prompt, setPrompt]     = useState('')
  const [expanded, setExpanded] = useState(false)

  const handleGenerate = () => {
    if (!prompt.trim()) return
    simulateGenerate(prompt)
    setPrompt('')
    setExpanded(false)
  }

  const SUGGESTIONS = [
    'Cinematic title reveal with particle burst',
    'Animated data visualization: bar chart',
    'Lower third for speaker name',
    'Smooth logo transition with motion blur',
    'Neon glow text animation',
    'Kinetic typography intro',
  ]

  return (
    <div className={`ai-cmd-bar ${expanded ? 'expanded' : ''}`}>
      <div className="ai-cmd-main">
        <div className="ai-cmd-sparkle">✦</div>
        <input
          className="ai-cmd-input"
          placeholder='Describe a motion, effect, or scene… e.g. "cinematic intro with particle burst and title"'
          value={prompt}
          onChange={e => setPrompt(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleGenerate()}
          onFocus={() => setExpanded(true)}
          onBlur={() => !prompt && setTimeout(() => setExpanded(false), 150)}
        />
        {generating ? (
          <div className="ai-cmd-progress">
            <div className="ai-cmd-bar-fill" style={{ width: `${genProgress}%` }} />
            <span className="mono" style={{ position: 'relative', fontSize: 10, color: 'var(--purple-bright)' }}>
              {Math.round(genProgress)}%
            </span>
          </div>
        ) : (
          <button
            className="btn-ai"
            style={{ height: 26, fontSize: 11, padding: '0 12px', flexShrink: 0 }}
            onClick={handleGenerate}
            disabled={!prompt.trim()}
          >
            Generate
          </button>
        )}
      </div>

      {expanded && (
        <div className="ai-cmd-suggestions anim-fade-in">
          {SUGGESTIONS.map(s => (
            <button
              key={s}
              className="ai-sugg-chip"
              onMouseDown={() => { setPrompt(s); setExpanded(false) }}
            >
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function formatTC(sec) {
  const h = Math.floor(sec / 3600)
  const m = Math.floor((sec % 3600) / 60)
  const s = Math.floor(sec % 60)
  const f = Math.floor((sec % 1) * 24)
  return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}:${String(f).padStart(2,'0')}`
}
