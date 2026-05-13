import { useState } from 'react'
import './AIStudio.css'
import { useApp } from '../../context/AppContext'

const TEMPLATES = [
  { id: 'product',  icon: '📦', label: 'Product Launch',  fields: ['Product name','Key benefit','Tone','Duration'] },
  { id: 'data',     icon: '📊', label: 'Data Story',      fields: ['Data source','Key metric','Chart style','Duration'] },
  { id: 'brand',    icon: '★',  label: 'Brand Reel',      fields: ['Brand name','Industry','Colors','Duration'] },
  { id: 'social',   icon: '📱', label: 'Social Reel',     fields: ['Hook','Platform','CTA','Duration'] },
  { id: 'event',    icon: '🎬', label: 'Event Highlight', fields: ['Event name','Key moments','Music mood','Duration'] },
  { id: 'tutorial', icon: '🎓', label: 'Tutorial',        fields: ['Topic','Skill level','Key steps','Duration'] },
]

const MODELS = [
  { id: 'runway', name: 'Runway Gen-3 Alpha', speed: 'Fast', quality: 5, best: true },
  { id: 'kling',  name: 'Kling 2.0',          speed: 'Med',  quality: 4, best: false },
  { id: 'pika',   name: 'Pika 2.0',           speed: 'Fast', quality: 4, best: false },
]

export default function AIStudio() {
  const { simulateGenerate, generating, genProgress, setWorkspace } = useApp()
  const [stage, setStage]         = useState(0) // 0 = brief, 1 = review, 2 = done
  const [template, setTemplate]   = useState(null)
  const [fields, setFields]       = useState({})
  const [masterPrompt, setMasterPrompt] = useState('')
  const [model, setModel]         = useState('runway')
  const [mood, setMood]           = useState('Cinematic')
  const [styleNotes, setStyleNotes] = useState('')

  const selTmpl = TEMPLATES.find(t => t.id === template)

  const buildPrompt = () => {
    const parts = [
      selTmpl?.label,
      ...Object.entries(fields).map(([k,v]) => `${k}: ${v}`),
      `Mood: ${mood}`,
    ].filter(Boolean)
    setMasterPrompt(parts.join('. '))
    setStage(1)
  }

  const handleGenerate = () => {
    simulateGenerate(masterPrompt)
    setTimeout(() => setStage(2), 5000)
  }

  return (
    <div className="ai-studio">
      {/* Left col */}
      <div className="ais-left">
        {/* Step indicator */}
        <div className="ais-steps">
          {['Brief','Review & Generate','Timeline'].map((s, i) => (
            <div key={i} className={`ais-step ${stage === i ? 'active' : stage > i ? 'done' : ''}`} onClick={() => i <= stage && setStage(i)}>
              <div className="ais-step-num">{stage > i ? '✓' : i + 1}</div>
              <span>{s}</span>
            </div>
          ))}
        </div>

        {/* Brief */}
        {stage === 0 && (
          <div className="ais-panel anim-fade-in">
            <div className="ais-panel-title">Choose Template</div>
            <div className="template-grid">
              {TEMPLATES.map(t => (
                <button key={t.id} className={`tmpl-btn ${template === t.id ? 'selected' : ''}`} onClick={() => { setTemplate(t.id); setFields({}) }}>
                  <span className="tmpl-icon">{t.icon}</span>
                  <span className="tmpl-name">{t.label}</span>
                </button>
              ))}
            </div>

            {selTmpl && (
              <div className="ais-fields anim-fade-in">
                <div className="ais-panel-title" style={{ marginTop: 16 }}>Brief Details</div>
                {selTmpl.fields.map(f => (
                  <div key={f} className="ais-field-row">
                    <label className="ais-label">{f}</label>
                    <input
                      className="input"
                      style={{ height: 26, fontSize: 11 }}
                      placeholder={`Enter ${f.toLowerCase()}…`}
                      value={fields[f] || ''}
                      onChange={e => setFields(p => ({ ...p, [f]: e.target.value }))}
                    />
                  </div>
                ))}
                <div className="ais-field-row">
                  <label className="ais-label">Mood / Tone</label>
                  <div className="mood-chips">
                    {['Cinematic','Bold','Minimal','Dramatic','Upbeat'].map(m => (
                      <button key={m} className={`mood-chip ${mood === m ? 'active' : ''}`} onClick={() => setMood(m)}>{m}</button>
                    ))}
                  </div>
                </div>
                <div className="ais-field-row">
                  <label className="ais-label">Style Notes</label>
                  <textarea className="input" rows={2} style={{ fontSize: 11 }} placeholder="Reference URLs, brand guidelines, color codes…" value={styleNotes} onChange={e => setStyleNotes(e.target.value)} />
                </div>
                <button className="btn-ai" style={{ alignSelf: 'flex-end', marginTop: 8 }} onClick={buildPrompt}>
                  Build Prompt →
                </button>
              </div>
            )}
          </div>
        )}

        {/* Review */}
        {stage === 1 && (
          <div className="ais-panel anim-fade-in">
            <div className="ais-panel-title">Master Prompt</div>
            <textarea
              className="input"
              style={{ height: 100, fontSize: 12, lineHeight: 1.6 }}
              value={masterPrompt}
              onChange={e => setMasterPrompt(e.target.value)}
            />
            <div className="ais-panel-title" style={{ marginTop: 16 }}>Generation Model</div>
            <div className="model-list">
              {MODELS.map(m => (
                <div key={m.id} className={`model-row ${model === m.id ? 'selected' : ''}`} onClick={() => setModel(m.id)}>
                  <div className="model-radio">{model === m.id ? '●' : '○'}</div>
                  <div className="model-info">
                    <span className="model-name">{m.name}</span>
                    {m.best && <span className="badge badge-green">Recommended</span>}
                  </div>
                  <span className="model-speed badge badge-blue">{m.speed}</span>
                  <span className="model-stars">{'★'.repeat(m.quality)}{'☆'.repeat(5 - m.quality)}</span>
                </div>
              ))}
            </div>

            {generating ? (
              <div className="gen-status-box">
                <div className="gsb-row">
                  <span className="spin" style={{ fontSize: 14, color: 'var(--purple)' }}>⟳</span>
                  <span className="text-12 fw-500">Generating…</span>
                  <span className="mono text-purple" style={{ marginLeft: 'auto', color: 'var(--purple)' }}>
                    {Math.round(genProgress)}%
                  </span>
                </div>
                <div style={{ marginTop: 8, height: 4, borderRadius: 2, background: 'var(--bg-raised)', overflow: 'hidden' }}>
                  <div style={{ height: '100%', background: 'var(--purple)', width: `${genProgress}%`, transition: 'width 0.25s ease' }} />
                </div>
                <div className="text-10 text-muted" style={{ marginTop: 6 }}>
                  {genProgress < 30 ? 'Analyzing brief…' : genProgress < 65 ? 'Generating video clips…' : genProgress < 90 ? 'Assembling sequence…' : 'Finalizing…'}
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
                <button className="btn-secondary" onClick={() => setStage(0)} style={{ fontSize: 11 }}>← Back</button>
                <button className="btn-ai grow" style={{ fontSize: 13, height: 32 }} onClick={handleGenerate}>
                  ★ Generate Video
                </button>
              </div>
            )}
          </div>
        )}

        {/* Done */}
        {stage === 2 && (
          <div className="ais-panel anim-fade-in" style={{ alignItems: 'center', textAlign: 'center', paddingTop: 40 }}>
            <div className="done-checkmark">✓</div>
            <div className="fw-600 text-13" style={{ marginTop: 12 }}>Video Generated</div>
            <div className="text-11 text-muted" style={{ marginTop: 4 }}>Clips inserted into your timeline</div>
            <div style={{ display: 'flex', gap: 8, marginTop: 20 }}>
              <button className="btn-primary" onClick={() => setWorkspace('editing')}>Open in Studio →</button>
              <button className="btn-secondary" onClick={() => { setStage(0); setTemplate(null); }}>New Project</button>
            </div>
          </div>
        )}
      </div>

      {/* Right col — preview + history */}
      <div className="ais-right">
        <div className="ais-panel">
          <div className="ais-panel-title">Preview Output</div>
          <div className="ais-preview-box">
            {stage === 2 ? (
              <div className="ais-preview-done">
                <div style={{ fontSize: 32 }}>🎬</div>
                <div className="text-11 text-secondary" style={{ marginTop: 8 }}>Generated sequence ready</div>
              </div>
            ) : (
              <div className="ais-preview-placeholder">
                <div style={{ fontSize: 28, color: 'var(--text-muted)' }}>★</div>
                <div className="text-11 text-muted" style={{ marginTop: 6 }}>Preview will appear here</div>
              </div>
            )}
          </div>

          <div className="ais-panel-title" style={{ marginTop: 16 }}>Style Memory</div>
          <div className="style-memory-table">
            {[
              { key: 'Pacing', val: 'Fast cuts, <3s' },
              { key: 'Color',  val: 'Dark, muted tones' },
              { key: 'Type',   val: 'Inter Bold' },
              { key: 'Mood',   val: 'Premium / Confident' },
            ].map(r => (
              <div key={r.key} className="smt-row">
                <span className="smt-key">{r.key}</span>
                <span className="smt-val">{r.val}</span>
              </div>
            ))}
          </div>

          <div className="ais-panel-title" style={{ marginTop: 16 }}>History</div>
          {['Cinematic product reveal','Data viz: Q1 sales','Brand identity reel'].map((h, i) => (
            <div key={i} className="hist-row">
              <span className="hist-dot">↺</span>
              <span className="text-11 text-secondary truncate">{h}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
