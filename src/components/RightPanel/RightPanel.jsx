import { useState, useRef, useCallback } from 'react'
import './RightPanel.css'
import { useApp } from '../../context/AppContext'

export default function RightPanel() {
  const [tab, setTab] = useState('inspector')
  const { selectedClip } = useApp()

  const TABS = [
    { id: 'inspector',  label: 'Inspector' },
    { id: 'effects',    label: 'Effects'   },
    { id: 'graphics',   label: 'Essential Graphics' },
  ]

  return (
    <aside className="right-panel">
      <div className="rp-tabs">
        {TABS.map(t => (
          <button
            key={t.id}
            className={`rp-tab ${tab === t.id ? 'active' : ''}`}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
        <button className="rp-tab-menu" title="More">⋯</button>
      </div>

      <div className="rp-body">
        {tab === 'inspector' && <InspectorTab />}
        {tab === 'effects'   && <EffectsAppliedTab />}
        {tab === 'graphics'  && <EssentialGraphicsTab />}
      </div>
    </aside>
  )
}

/* ════════════════════════════════════════
   INSPECTOR TAB
════════════════════════════════════════ */
function InspectorTab() {
  const { selectedClip: clip, tracks } = useApp()
  const clipTrack = clip ? tracks.find(t => t.id === clip.track) : null
  const clipType  = clipTrack?.type ?? ''

  return (
    <div className="insp">
      {/* Clip header */}
      <div className="insp-clip-hdr">
        {clip ? (
          <>
            <div className="insp-clip-thumb shimmer-block" />
            <div className="insp-clip-info">
              <span className="insp-clip-name truncate">{clip.name}</span>
              <span className="insp-clip-meta mono">
                {clip.dur.toFixed(2)}s · {clipType}
                {clip.aiGenerated && <span className="badge badge-purple" style={{ marginLeft: 4 }}>AI</span>}
              </span>
            </div>
            <button className="btn-icon" title="Reset all" style={{ marginLeft: 'auto', flexShrink: 0 }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 2v6h6"/><path d="M3 13a9 9 0 1 0 3-7.7L3 8"/>
              </svg>
            </button>
          </>
        ) : (
          <div className="insp-no-sel">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ opacity: 0.3 }}>
              <rect x="3" y="3" width="18" height="18" rx="2"/><path d="m9 9 6 6m0-6-6 6"/>
            </svg>
            <span>No clip selected</span>
          </div>
        )}
      </div>

      {/* ── Transform ── */}
      <Section title="Transform" defaultOpen keyframeAll resetAll>
        <div className="insp-xy-row">
          <PropRow label="Position" val="960"  unit="px" min={-4000} max={4000} step={1} kf />
          <PropRow label=""         val="540"  unit="px" min={-4000} max={4000} step={1} kf />
        </div>
        <div className="insp-xy-row">
          <PropRow label="Scale"    val="100"  unit="%" min={0} max={400} step={0.1} kf hasSlider sliderMax={200} />
          <PropRow label=""         val="100"  unit="%" min={0} max={400} step={0.1} kf hasSlider sliderMax={200} />
        </div>
        <PropRow label="Rotation"   val="0"    unit="°"  min={-360} max={360} step={0.1} kf />
        <div className="insp-xy-row">
          <PropRow label="Anchor"   val="960"  unit="px" min={-4000} max={4000} step={1} kf />
          <PropRow label=""         val="540"  unit="px" min={-4000} max={4000} step={1} kf />
        </div>
        <PropRow label="Opacity"    val="100"  unit="%" min={0} max={100} step={1} kf hasSlider sliderMax={100} />
      </Section>

      {/* ── Cropping ── */}
      <Section title="Cropping">
        <div className="insp-4-grid">
          <PropRow label="Left"   val="0" unit="px" min={0} max={2000} step={1} />
          <PropRow label="Right"  val="0" unit="px" min={0} max={2000} step={1} />
          <PropRow label="Top"    val="0" unit="px" min={0} max={2000} step={1} />
          <PropRow label="Bottom" val="0" unit="px" min={0} max={2000} step={1} />
        </div>
      </Section>

      {/* ── Composite ── */}
      <Section title="Composite">
        <div className="prop-row">
          <span className="prop-lbl" style={{ cursor: 'default' }}>Blend Mode</span>
          <div style={{ flex: 1 }}>
            <select className="select" style={{ width: '100%', height: 20, fontSize: 11 }}>
              {['Normal','Multiply','Screen','Overlay','Darken','Lighten','Color Dodge','Color Burn','Hard Light','Soft Light'].map(m => (
                <option key={m}>{m}</option>
              ))}
            </select>
          </div>
          <div style={{ width: 44 }} />
        </div>
        <PropRow label="Opacity" val="100" unit="%" min={0} max={100} step={1} kf hasSlider sliderMax={100} />
      </Section>

      {/* ── Speed Change ── */}
      <Section title="Speed Change">
        <PropRow label="Speed"     val="100"  unit="%" min={-800} max={800} step={1} kf hasSlider sliderMax={200} />
        <div className="insp-toggle-row">
          <span className="insp-lbl">Reverse</span>
          <Toggle />
        </div>
        <div className="insp-toggle-row">
          <span className="insp-lbl">Ripple Edit</span>
          <Toggle />
        </div>
      </Section>

      {/* ── Stabilization ── */}
      <Section title="Stabilization">
        <div className="insp-toggle-row">
          <span className="insp-lbl">Enabled</span>
          <Toggle />
        </div>
        <PropRow label="Smoothness" val="50" unit="%" min={0} max={100} step={1} hasSlider sliderMax={100} />
        <div className="prop-row">
          <span className="prop-lbl" style={{ cursor: 'default' }}>Method</span>
          <div style={{ flex: 1 }}>
            <select className="select" style={{ width: '100%', height: 20, fontSize: 11 }}>
              <option>Subspace Warp</option>
              <option>Perspective</option>
              <option>Position Only</option>
            </select>
          </div>
          <div style={{ width: 44 }} />
        </div>
      </Section>

      {/* ── AI Controls ── */}
      <Section title="AI Controls" ai>
        <div className="insp-lbl" style={{ marginBottom: 4 }}>Generation Prompt</div>
        <textarea
          className="input"
          style={{ height: 54, fontSize: 11, lineHeight: 1.55 }}
          defaultValue={clip?.aiGenerated ? 'Neon title reveal with particle burst' : ''}
          placeholder="Describe changes to regenerate…"
        />
        <div className="insp-ai-actions">
          <button className="btn-ai" style={{ flex: 1, fontSize: 11, height: 26 }}>✦ Regenerate</button>
          <button className="btn-secondary" style={{ fontSize: 11, height: 26 }}>Variations</button>
        </div>
        <PropRow label="AI Strength" val="75" unit="%" hasSlider sliderMax={100} min={0} max={100} />
      </Section>
    </div>
  )
}

/* ════════════════════════════════════════
   EFFECTS APPLIED TAB
════════════════════════════════════════ */
function EffectsAppliedTab() {
  const { selectedClip: clip } = useApp()
  return (
    <div className="insp">
      <div className="effects-applied-hdr">
        <span className="panel-title">Applied to: {clip?.name ?? 'No selection'}</span>
        <button className="btn-ghost" style={{ fontSize: 10 }}>+ Add Effect</button>
      </div>
      <EffectRow name="Lumetri Color" expanded />
      {clip?.aiGenerated && <EffectRow name="✦ AI Style Transfer" ai />}
      <EffectRow name="Gaussian Blur" />

      <div className="effects-presets">
        <div className="effects-presets-title">Presets</div>
        {['Film Noir', 'Cinematic LUT', 'Warm Vintage', 'Teal & Orange'].map(p => (
          <div key={p} className="effects-preset-row">
            <span className="effects-preset-dot" />
            <span>{p}</span>
            <button className="btn-ghost" style={{ fontSize: 10, marginLeft: 'auto' }}>Apply</button>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ════════════════════════════════════════
   ESSENTIAL GRAPHICS TAB
════════════════════════════════════════ */
function EssentialGraphicsTab() {
  return (
    <div className="insp">
      <Section title="Text" defaultOpen>
        <div className="eg-text-preview">Aa</div>
        <div className="prop-row">
          <span className="prop-lbl" style={{ cursor: 'default' }}>Font</span>
          <select className="select" style={{ flex: 1, height: 20, fontSize: 11 }}>
            <option>Inter</option><option>Roboto</option><option>Helvetica</option><option>Futura</option>
          </select>
        </div>
        <PropRow label="Size"    val="72"  unit="px" min={4}   max={500} step={1} />
        <PropRow label="Tracking" val="0" unit=""    min={-200} max={800} step={1} />
        <PropRow label="Leading" val="100" unit="%"  min={50}   max={300} step={1} />
        <div className="eg-style-row">
          {['B','I','U','AA'].map(s => (
            <button key={s} className="eg-style-btn">{s}</button>
          ))}
          <div style={{ flex: 1 }} />
          {['align-left','align-center','align-right'].map((a, i) => (
            <button key={a} className="eg-style-btn">
              {i === 0 ? '≡' : i === 1 ? '≡' : '≡'}
            </button>
          ))}
        </div>
      </Section>

      <Section title="Appearance">
        <div className="eg-swatch-row">
          <span className="insp-lbl">Fill</span>
          <div className="eg-swatch" style={{ background: '#fff' }} />
          <PropRow label="" val="100" unit="%" hasSlider sliderMax={100} min={0} max={100} />
        </div>
        <div className="eg-swatch-row">
          <span className="insp-lbl">Stroke</span>
          <div className="eg-swatch" style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.3)' }} />
          <PropRow label="" val="0" unit="px" min={0} max={50} step={1} />
        </div>
        <div className="eg-swatch-row">
          <span className="insp-lbl">Shadow</span>
          <div className="eg-swatch" style={{ background: 'rgba(0,0,0,0.8)' }} />
          <PropRow label="" val="0" unit="%" hasSlider sliderMax={100} min={0} max={100} />
        </div>
      </Section>

      <Section title="Transform" defaultOpen>
        <PropRow label="Position X" val="0" unit="px" min={-2000} max={2000} step={1} />
        <PropRow label="Position Y" val="0" unit="px" min={-2000} max={2000} step={1} />
        <PropRow label="Scale"      val="100" unit="%" min={0} max={400} step={0.1} hasSlider sliderMax={200} />
        <PropRow label="Rotation"   val="0"   unit="°" min={-360} max={360} step={0.1} />
      </Section>
    </div>
  )
}

/* ── Reusable sub-components ── */

function Section({ title, children, defaultOpen = false, ai = false, keyframeAll = false, resetAll = false }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="insp-section">
      <div className="insp-section-hdr" onClick={() => setOpen(o => !o)}>
        <span className={`insp-chevron ${open ? 'open' : ''}`}>
          <svg width="7" height="7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
            <polyline points="9 18 15 12 9 6"/>
          </svg>
        </span>
        <span className={`insp-section-title ${ai ? 'ai' : ''}`}>{title}</span>
        {ai && <span className="badge badge-purple" style={{ marginLeft: 4, fontSize: 8 }}>AI</span>}
        <div style={{ flex: 1 }} />
        {open && keyframeAll && (
          <button className="btn-icon" style={{ width: 16, height: 16, fontSize: 9 }} title="Keyframe all" onClick={e => e.stopPropagation()}>◆</button>
        )}
        {open && resetAll && (
          <button className="btn-icon" style={{ width: 16, height: 16, fontSize: 9 }} title="Reset section" onClick={e => e.stopPropagation()}>↺</button>
        )}
      </div>
      {open && <div className="insp-section-body">{children}</div>}
    </div>
  )
}

function PropRow({ label, val: initVal, unit = '', min = 0, max = 100, step = 1, kf = false, hasSlider = false, sliderMax = 100 }) {
  const isNumeric = !isNaN(parseFloat(initVal))
  const [value, setValue]     = useState(isNumeric ? parseFloat(initVal) : initVal)
  const [kfActive, setKf]     = useState(false)
  const [dragging, setDragging] = useState(false)

  const onLabelDown = useCallback((e) => {
    if (!isNumeric) return
    e.preventDefault()
    const startX = e.clientX, startV = value
    setDragging(true)
    const onMove = (me) => {
      const dx   = (me.clientX - startX) * step * 0.5
      setValue(v => Math.max(min, Math.min(max, parseFloat((startV + dx).toFixed(3)))))
    }
    const onUp = () => {
      setDragging(false)
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }, [value, min, max, step, isNumeric])

  const pct = hasSlider && isNumeric ? ((value - min) / (sliderMax - min)) * 100 : 0

  return (
    <div className="prop-row">
      <span
        className={`prop-lbl ${dragging ? 'scrubbing' : ''}`}
        onMouseDown={onLabelDown}
        title={label ? `Drag to scrub ${label}` : undefined}
      >
        {label}
      </span>

      {hasSlider ? (
        <div className="prop-slider-cell">
          <div className="prop-slider-fill" style={{ width: `${Math.min(100, pct)}%` }} />
          <input
            type="range" min={min} max={sliderMax} step={step} value={value}
            className="prop-range-input"
            onChange={e => setValue(+e.target.value)}
          />
        </div>
      ) : (
        <div style={{ flex: 1 }} />
      )}

      <input
        className="prop-num"
        value={value}
        type="number"
        min={min} max={max} step={step}
        onChange={e => setValue(parseFloat(e.target.value) || 0)}
      />

      {unit && <span className="prop-unit">{unit}</span>}

      <button className="prop-reset" title="Reset" onClick={() => setValue(parseFloat(initVal))}>↺</button>

      {kf && (
        <button
          className={`prop-kf ${kfActive ? 'active' : ''}`}
          title={kfActive ? 'Remove Keyframe' : 'Add Keyframe'}
          onClick={() => setKf(k => !k)}
        />
      )}
    </div>
  )
}

function Toggle({ defaultChecked = false }) {
  const [on, setOn] = useState(defaultChecked)
  return (
    <label className="toggle" onClick={() => setOn(v => !v)}>
      <div className={`toggle-track ${on ? 'on' : ''}`}>
        <div className="toggle-thumb" />
      </div>
    </label>
  )
}

function EffectRow({ name, expanded = false, ai = false }) {
  const [open, setOpen] = useState(expanded)
  return (
    <div className={`fx-row ${ai ? 'fx-ai' : ''}`}>
      <div className="fx-row-hdr" onClick={() => setOpen(o => !o)}>
        <span className={`insp-chevron ${open ? 'open' : ''}`} style={{ fontSize: 7 }}>
          <svg width="7" height="7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
            <polyline points="9 18 15 12 9 6"/>
          </svg>
        </span>
        <div className={`fx-row-dot ${ai ? 'ai' : ''}`} />
        <span className="fx-row-name truncate">{name}</span>
        <div style={{ flex: 1 }} />
        <button className="btn-icon" style={{ width: 14, height: 14, fontSize: 9 }} onClick={e => e.stopPropagation()}>
          <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>
      {open && (
        <div className="fx-row-body">
          <PropRow label="Intensity" val="100" unit="%" hasSlider sliderMax={100} min={0} max={100} />
          <PropRow label="Blend"     val="Normal" unit="" />
        </div>
      )}
    </div>
  )
}
