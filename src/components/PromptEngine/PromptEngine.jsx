import { useState } from 'react'
import './PromptEngine.css'
import { useApp } from '../../context/AppContext'

const STAGES = [
  { id: 'brief',    icon: '✎', label: 'Brief',    desc: 'Define your story' },
  { id: 'generate', icon: '✦', label: 'Generate', desc: 'AI creates clips' },
  { id: 'assemble', icon: '⊞', label: 'Assemble', desc: 'Edit & export' },
]

const TEMPLATES = [
  { id: 't1', name: 'Product Launch',  icon: '🚀', desc: 'Hero video for a product launch', fields: ['Product name','Key benefit','Target audience','Tone'] },
  { id: 't2', name: 'Data Story',      icon: '📊', desc: 'Turn data into motion graphics',   fields: ['Data source','Key metric','Time period','Chart style'] },
  { id: 't3', name: 'Brand Identity',  icon: '✦', desc: 'Cohesive brand reel',              fields: ['Brand name','Brand colors','Brand voice','Industry'] },
  { id: 't4', name: 'Social Reel',     icon: '📱', desc: 'Viral-ready short-form content',  fields: ['Hook','Platform','CTA','Vibe'] },
  { id: 't5', name: 'Event Highlights',icon: '🎬', desc: 'Event recap / highlight reel',    fields: ['Event name','Key moments','Music mood','Output length'] },
  { id: 't6', name: 'Tutorial',        icon: '🎓', desc: 'Step-by-step explainer video',    fields: ['Topic','Audience level','Key steps','Style'] },
]

const MOODS = ['Energetic','Calm','Dramatic','Playful','Authoritative','Mysterious','Inspiring']
const PACES = ['Rapid (< 2s)','Fast (2-3s)','Medium (3-5s)','Slow (5s+)']

const AI_SUGGESTIONS = [
  'Add a particle explosion at the brand reveal moment',
  'Use light leaks between scenes for cinematic feel',
  'Include a kinetic typography opener',
  'Cut on the beat — sync to 128 BPM',
  'Transition with a glitch effect for contrast',
]

export default function PromptEngine() {
  const { simulateGenerate, generating, generationProgress, activeStyle, styleMemory, brandVoice, setBrandVoice } = useApp()
  const [stage, setStage]       = useState('brief')
  const [template, setTemplate] = useState(null)
  const [fields, setFields]     = useState({})
  const [mood, setMood]         = useState('Energetic')
  const [pace, setPace]         = useState('Fast (2-3s)')
  const [masterPrompt, setMasterPrompt] = useState('')
  const [suggestions, setSuggestions]   = useState(AI_SUGGESTIONS)
  const [dataInput, setDataInput]       = useState('')

  const selectedTemplate = TEMPLATES.find(t => t.id === template)

  const buildPrompt = () => {
    if (!selectedTemplate) return
    const fieldStr = Object.entries(fields).map(([k,v]) => `${k}: ${v}`).join(', ')
    const built = `${selectedTemplate.name} video. ${selectedTemplate.desc}. ${fieldStr}. Mood: ${mood}. Pacing: ${pace}. Style: ${activeStyle}. Brand voice: ${brandVoice}.`
    setMasterPrompt(built)
    setStage('generate')
  }

  const handleGenerate = () => {
    simulateGenerate(masterPrompt)
    setTimeout(() => setStage('assemble'), 4000)
  }

  return (
    <div className="prompt-engine">
      {/* Stage progress */}
      <div className="pe-stages">
        {STAGES.map((s, i) => {
          const idx = STAGES.findIndex(x => x.id === stage)
          const done = i < idx
          const active = s.id === stage
          return (
            <div key={s.id} className="pe-stage-wrap">
              <button
                className={`pe-stage ${active ? 'active' : ''} ${done ? 'done' : ''}`}
                onClick={() => setStage(s.id)}
              >
                <div className="pe-stage-icon">{done ? '✓' : s.icon}</div>
                <div>
                  <div className="pe-stage-label">{s.label}</div>
                  <div className="pe-stage-desc">{s.desc}</div>
                </div>
              </button>
              {i < STAGES.length - 1 && <div className={`pe-stage-connector ${done ? 'done' : ''}`} />}
            </div>
          )
        })}
      </div>

      <div className="pe-body">
        {/* ── STAGE 1: BRIEF ── */}
        {stage === 'brief' && (
          <div className="pe-brief animate-fade-in">
            <div className="pe-col-main">
              <div className="pe-section-title">Choose a Template</div>
              <div className="template-grid">
                {TEMPLATES.map(t => (
                  <button
                    key={t.id}
                    className={`template-card ${template === t.id ? 'selected' : ''}`}
                    onClick={() => { setTemplate(t.id); setFields({}) }}
                  >
                    <span className="tmpl-icon">{t.icon}</span>
                    <span className="tmpl-name">{t.name}</span>
                    <span className="tmpl-desc">{t.desc}</span>
                  </button>
                ))}
              </div>

              {selectedTemplate && (
                <div className="brief-fields animate-fade-in">
                  <div className="pe-section-title" style={{ marginTop: 0 }}>Fill in the Brief</div>
                  <div className="fields-grid">
                    {selectedTemplate.fields.map(f => (
                      <div key={f} className="field-group">
                        <div className="label">{f}</div>
                        <input
                          className="input"
                          placeholder={`Enter ${f.toLowerCase()}…`}
                          value={fields[f] || ''}
                          onChange={e => setFields(prev => ({ ...prev, [f]: e.target.value }))}
                        />
                      </div>
                    ))}
                  </div>

                  <div className="brief-meta">
                    <div>
                      <div className="label">Mood</div>
                      <div className="chip-row">
                        {MOODS.map(m => (
                          <button key={m} className={`chip ${mood === m ? 'active' : ''}`} onClick={() => setMood(m)}>{m}</button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <div className="label">Pacing</div>
                      <div className="chip-row">
                        {PACES.map(p => (
                          <button key={p} className={`chip ${pace === p ? 'active' : ''}`} onClick={() => setPace(p)}>{p}</button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Data input */}
                  <div>
                    <div className="label">Data / Reference (optional)</div>
                    <textarea
                      className="input"
                      rows={3}
                      placeholder="Paste CSV data, statistics, URLs, or describe reference footage…"
                      value={dataInput}
                      onChange={e => setDataInput(e.target.value)}
                    />
                  </div>

                  <button className="btn btn-primary" style={{ alignSelf: 'flex-end', padding: '10px 24px' }} onClick={buildPrompt}>
                    Build Prompt →
                  </button>
                </div>
              )}
            </div>

            {/* Sidebar — style memory */}
            <div className="pe-col-side">
              <StyleMemorySidebar styleMemory={[]} brandVoice={brandVoice} setBrandVoice={setBrandVoice} activeStyle={activeStyle} />
            </div>
          </div>
        )}

        {/* ── STAGE 2: GENERATE ── */}
        {stage === 'generate' && (
          <div className="pe-generate animate-fade-in">
            <div className="pe-col-main">
              <div className="pe-section-title">Master Prompt</div>
              <div className="master-prompt-box">
                <textarea
                  className="input master-prompt-input"
                  rows={6}
                  value={masterPrompt}
                  onChange={e => setMasterPrompt(e.target.value)}
                  placeholder="Your AI-built prompt will appear here…"
                />
                <div className="mp-actions">
                  <button className="btn btn-ghost" style={{ fontSize: 11 }}>✎ Refine</button>
                  <button className="btn btn-ghost" style={{ fontSize: 11 }}>⧉ Copy</button>
                </div>
              </div>

              {/* AI suggestions */}
              <div>
                <div className="pe-section-title">✦ AI Suggestions</div>
                <div className="suggestions-list">
                  {suggestions.map((s, i) => (
                    <div key={i} className="suggestion-item" onClick={() => setMasterPrompt(p => p + '. ' + s)}>
                      <span className="sug-dot">◈</span>
                      <span>{s}</span>
                      <span className="sug-add">+ Add</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Generation models */}
              <div>
                <div className="pe-section-title">Generation Model</div>
                <div className="model-cards">
                  {[
                    { name: 'Runway Gen-3', speed: 'Fast', quality: '★★★★★', tag: 'Recommended' },
                    { name: 'Kling 2.0',    speed: 'Med',  quality: '★★★★☆', tag: 'Creative' },
                    { name: 'Pika 2.0',     speed: 'Fast', quality: '★★★★☆', tag: 'Social' },
                  ].map((m, i) => (
                    <div key={i} className={`model-card ${i === 0 ? 'selected' : ''}`}>
                      <div className="mc-name">{m.name}</div>
                      <div className="mc-meta">
                        <span className="tag tag-cyan" style={{ fontSize: 9 }}>{m.speed}</span>
                        <span style={{ fontSize: 10, color: 'var(--accent-amber)' }}>{m.quality}</span>
                      </div>
                      {i === 0 && <div className="tag tag-green mc-tag">{m.tag}</div>}
                    </div>
                  ))}
                </div>
              </div>

              {generating ? (
                <div className="gen-status-box">
                  <div className="gsb-spinner" />
                  <div className="gsb-info">
                    <div style={{ fontSize: 13, fontWeight: 600 }}>Generating your video…</div>
                    <div className="progress-bar" style={{ width: '100%', margin: '8px 0' }}>
                      <div className="progress-bar-fill" style={{ width: `${generationProgress}%` }} />
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                      {generationProgress < 30 ? 'Analyzing brief…' :
                       generationProgress < 60 ? 'Generating clips…' :
                       generationProgress < 90 ? 'Assembling timeline…' : 'Finalizing…'}
                    </div>
                  </div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 20, color: 'var(--accent-cyan)', fontWeight: 700 }}>
                    {Math.round(generationProgress)}%
                  </div>
                </div>
              ) : (
                <button className="btn btn-primary generate-big-btn" onClick={handleGenerate}>
                  ✦ Generate Video
                </button>
              )}
            </div>

            <div className="pe-col-side">
              <StyleMemorySidebar styleMemory={[]} brandVoice={brandVoice} setBrandVoice={() => {}} activeStyle={activeStyle} />
            </div>
          </div>
        )}

        {/* ── STAGE 3: ASSEMBLE ── */}
        {stage === 'assemble' && (
          <div className="pe-assemble animate-fade-in">
            <div className="assemble-success">
              <div className="as-icon">✓</div>
              <div className="as-title">Video Generated!</div>
              <div className="as-sub">Your clips are ready in the timeline. Switch to Studio to edit.</div>
              <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
                <button className="btn btn-primary" style={{ padding: '10px 28px' }}>Open in Studio →</button>
                <button className="btn btn-ghost">Generate Another</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function StyleMemorySidebar({ activeStyle, brandVoice, setBrandVoice }) {
  const { styleMemory } = useApp()
  return (
    <div className="style-sidebar flex-col gap-3">
      <div className="pe-section-title" style={{ marginTop: 0 }}>Style Memory</div>
      <div className="glow-card flex-col gap-2">
        {styleMemory.map(s => (
          <div key={s.key} className="sm-row">
            <span className="sm-key">{s.key}</span>
            <span className="sm-val">{s.value}</span>
          </div>
        ))}
        <div className="sep sep-h" />
        <div>
          <div className="label">Brand Voice</div>
          <input
            className="input"
            value={brandVoice}
            onChange={e => setBrandVoice(e.target.value)}
          />
        </div>
        <div>
          <div className="label">Active Style</div>
          <div className="tag tag-violet" style={{ textTransform: 'capitalize' }}>{activeStyle}</div>
        </div>
        <button className="btn btn-ghost w-full" style={{ fontSize: 11, marginTop: 4 }}>✎ Edit Style Memory</button>
      </div>

      <div className="pe-section-title">Prompt History</div>
      {['Cinematic product reveal','Neon data visualization','Corporate brand story'].map((h, i) => (
        <div key={i} className="hist-item">
          <span className="hist-icon">↺</span>
          <span className="hist-text truncate">{h}</span>
        </div>
      ))}
    </div>
  )
}
