import { useState, useRef } from 'react'
import './LeftPanel.css'
import { useApp } from '../../context/AppContext'
import { uploadAsset } from '../../api/assets'

/* ── Gradient thumbnails for demo asset previews ── */
const THUMB_GRADIENTS = [
  'linear-gradient(135deg,#1a3a6e 0%,#2563EB 40%,#1e40af 100%)',
  'linear-gradient(135deg,#1a4d3a 0%,#059669 50%,#064e3b 100%)',
  'linear-gradient(135deg,#3b1f6a 0%,#7C3AED 50%,#4c1d95 100%)',
  'linear-gradient(135deg,#6b2d07 0%,#D97706 50%,#92400e 100%)',
  'linear-gradient(135deg,#1e3a6e 0%,#1D4ED8 40%,#1e3a8a 100%)',
  'linear-gradient(135deg,#164e3a 0%,#047857 50%,#064e3b 100%)',
]

const ASSET_TYPE_ICON = {
  video: (
    <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
      <polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/>
    </svg>
  ),
  audio: (
    <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
      <path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>
    </svg>
  ),
  image: (
    <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
      <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/>
      <polyline points="21 15 16 10 5 21"/>
    </svg>
  ),
}

/* ── Effects with visual preview styles ── */
const EFFECT_CARDS = [
  { name: 'Gaussian Blur',    style: { filter: 'blur(3px)', background: 'linear-gradient(135deg,#3b82f6,#1d4ed8)' }},
  { name: 'Directional Blur', style: { filter: 'blur(4px) skewX(-15deg)', background: 'linear-gradient(90deg,#2563eb,#60a5fa)' }},
  { name: 'Color Balance',    style: { background: 'linear-gradient(135deg,#ef4444 0%,#22c55e 50%,#3b82f6 100%)' }},
  { name: 'Lumetri Color',    style: { background: 'linear-gradient(135deg,#f97316,#eab308,#22c55e)' }},
  { name: 'Camera Shake',     style: { background: '#1e293b', transform: 'skew(-3deg,-2deg)' }},
  { name: 'Glow',             style: { background: '#0c0c1c', boxShadow: 'inset 0 0 20px 8px rgba(167,139,250,0.8)' }},
  { name: 'Warp Stabilizer',  style: { background: 'linear-gradient(135deg,#0ea5e9,#2563eb)' }},
  { name: 'Sharpen',          style: { background: 'linear-gradient(135deg,#64748b,#94a3b8)' }},
  { name: 'Tint',             style: { background: 'linear-gradient(135deg,#d97706 0%,#fbbf24 100%)' }},
  { name: 'Vignette',         style: { background: 'radial-gradient(ellipse at center, #334155 30%, #000 100%)' }},
  { name: '★ AI Restyle',     style: { background: 'linear-gradient(135deg,#6d28d9,#a78bfa,#4c1d95)', border: '1px solid rgba(167,139,250,0.5)' }, ai: true },
  { name: '★ AI Remove BG',   style: { background: 'linear-gradient(135deg,#7c3aed,#c4b5fd)' }, ai: true },
]

export default function LeftPanel() {
  const { assets, setAssets } = useApp()
  const [tab, setTab]           = useState('project')
  const [search, setSearch]     = useState('')
  const [viewMode, setViewMode] = useState('list')
  const [openFolders, setOpenFolders] = useState({ seq: true, footage: true, audio: true, graphics: true, ai: true })
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)

  const filtered = assets.filter(a => a.name.toLowerCase().includes(search.toLowerCase()))
  const toggle   = (k) => setOpenFolders(f => ({ ...f, [k]: !f[k] }))

  async function handleUpload(e) {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = '' // reset for next upload

    setUploading(true)
    try {
      const asset = await uploadAsset(file, p => setUploadProgress(p))
      setAssets(prev => [asset, ...prev])
    } catch (err) {
      alert(err.message)
    } finally {
      setUploading(false)
      setUploadProgress(0)
    }
  }

  return (
    <aside className="left-panel">

      {/* ── Tabs ── */}
      <div className="lp-tabs">
        {['Media','Effects','Transitions','Titles','Libraries'].map(t => (
          <button
            key={t}
            className={`lp-tab ${tab === t.toLowerCase() || (tab === 'project' && t === 'Media') ? 'active' : ''}`}
            onClick={() => setTab(t === 'Media' ? 'project' : t.toLowerCase())}
          >
            {t}
          </button>
        ))}
      </div>

      {/* ── Search + view controls ── */}
      <div className="lp-search-row">
        <div className="lp-search-wrap">
          <svg className="lp-search-icon" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            className="lp-search"
            placeholder="Search media…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="lp-view-btns">
          <button className={`lp-view-btn ${viewMode === 'grid' ? 'active' : ''}`} onClick={() => setViewMode('grid')} title="Grid">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
              <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
            </svg>
          </button>
          <button className={`lp-view-btn ${viewMode === 'list' ? 'active' : ''}`} onClick={() => setViewMode('list')} title="List">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/>
              <line x1="8" y1="18" x2="21" y2="18"/>
              <line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/>
              <line x1="3" y1="18" x2="3.01" y2="18"/>
            </svg>
          </button>
        </div>
        <label className="lp-import-btn" title="Import" style={{ cursor: uploading ? 'wait' : 'pointer' }}>
          <input type="file" style={{ display: 'none' }} onChange={handleUpload} disabled={uploading} />
          {uploading ? (
            <span style={{ fontSize: 9 }}>{uploadProgress}%</span>
          ) : (
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
            </svg>
          )}
        </label>
      </div>

      {/* ── Content ── */}
      <div className="lp-content overflow-auto grow">

        {/* ══ MEDIA TAB ══ */}
        {tab === 'project' && (
          <div className="lp-tree">

            {/* Sequences */}
            <FolderRow label="01_SEQUENCES" icon="📋" open={openFolders.seq} onToggle={() => toggle('seq')} count={1} />
            {openFolders.seq && (
              <div className="lp-asset lp-indent lp-seq">
                <span className="asset-icon">▶</span>
                <span className="asset-name truncate">Wanderlust_Trailer</span>
                <span className="asset-meta">0:18</span>
              </div>
            )}

            {/* 02_MEDIA > Video */}
            <FolderRow label="02_MEDIA" icon="📁" open={openFolders.footage} onToggle={() => toggle('footage')} count={filtered.length} />
            {openFolders.footage && (
              <>
                <div className="lp-subfolder">
                  <span className="lp-subfolder-name">▸ Video</span>
                </div>
                {viewMode === 'list'
                  ? filtered.filter(a => a.type === 'video').map((a, i) => (
                    <AssetRow key={a.id} asset={a} icon={ASSET_TYPE_ICON.video} grad={THUMB_GRADIENTS[i % THUMB_GRADIENTS.length]} />
                  ))
                  : (
                    <div className="lp-grid-4">
                      {filtered.filter(a => a.type === 'video').map((a, i) => (
                        <AssetCard key={a.id} asset={a} grad={THUMB_GRADIENTS[i % THUMB_GRADIENTS.length]} />
                      ))}
                    </div>
                  )
                }
                <div className="lp-subfolder"><span className="lp-subfolder-name">▸ Audio</span></div>
                {filtered.filter(a => a.type === 'audio').map((a, i) => (
                  <AssetRow key={a.id} asset={a} icon={ASSET_TYPE_ICON.audio} grad={THUMB_GRADIENTS[(i + 3) % THUMB_GRADIENTS.length]} color="#10B981" />
                ))}
                <div className="lp-subfolder"><span className="lp-subfolder-name">▸ Images</span></div>
                {filtered.filter(a => a.type === 'image').map((a, i) => (
                  <AssetRow key={a.id} asset={a} icon={ASSET_TYPE_ICON.image} grad={THUMB_GRADIENTS[(i + 2) % THUMB_GRADIENTS.length]} color="#F59E0B" />
                ))}
              </>
            )}

            {/* 04_COMPS */}
            <FolderRow label="04_COMPS" icon="📁" open={false} onToggle={() => {}} count={4} />

            {/* 05_SFX */}
            <FolderRow label="05_SFX" icon="📁" open={false} onToggle={() => {}} count={3} />

            {/* AI Generated */}
            <FolderRow label="AI Generated" icon="★" open={openFolders.ai} onToggle={() => toggle('ai')} count={2} ai />
            {openFolders.ai && (
              <>
                <AssetRow asset={{ id: 'ai1', name: 'AI: Neon Title',     dur: '0:03', size: 'AI', type: 'video' }} icon="★" color="#A78BFA" grad="linear-gradient(135deg,#4c1d95,#7c3aed)" />
                <AssetRow asset={{ id: 'ai2', name: 'AI: Particle Burst', dur: '0:02', size: 'AI', type: 'video' }} icon="★" color="#A78BFA" grad="linear-gradient(135deg,#6d28d9,#a78bfa)" />
              </>
            )}
          </div>
        )}

        {/* ══ EFFECTS TAB ══ */}
        {(tab === 'effects' || tab === 'transitions') && (
          <EffectsTab mode={tab} />
        )}

        {/* ══ TITLES TAB ══ */}
        {tab === 'titles' && (
          <div className="lp-titles-grid">
            {[
              { name: 'Basic Title',  color: '#fff', bg: '#111' },
              { name: 'Lower Third',  color: '#60a5fa', bg: '#0f172a' },
              { name: 'End Card',     color: '#f0f0f0', bg: '#0a0a0a' },
              { name: 'Credit Roll',  color: '#e2e8f0', bg: '#020617' },
              { name: '★ AI Title',   color: '#a78bfa', bg: 'linear-gradient(135deg,#1e1b4b,#2e1065)', ai: true },
              { name: '★ Kinetic',    color: '#c4b5fd', bg: 'linear-gradient(135deg,#1e1b4b,#4c1d95)', ai: true },
            ].map(t => (
              <div key={t.name} className={`lp-title-card ${t.ai ? 'ai' : ''}`} draggable>
                <div className="lp-title-preview" style={{ background: t.bg }}>
                  <span style={{ color: t.color, fontStyle: 'italic', fontWeight: 700, fontSize: 18 }}>Aa</span>
                </div>
                <span className="lp-title-name">{t.name}</span>
              </div>
            ))}
          </div>
        )}

        {tab === 'libraries' && (
          <div className="lp-empty">
            <div className="lp-empty-icon">📚</div>
            <div className="lp-empty-title">No Libraries</div>
            <div className="lp-empty-sub">Connect Creative Cloud to access shared assets</div>
            <button className="btn-secondary" style={{ marginTop: 12, fontSize: 11 }}>Connect Library</button>
          </div>
        )}
      </div>
    </aside>
  )
}

/* ── Folder row ── */
function FolderRow({ label, icon, open, onToggle, count, ai = false }) {
  return (
    <div className={`lp-folder ${ai ? 'ai' : ''}`} onClick={onToggle}>
      <span className={`lp-folder-chevron ${open ? 'open' : ''}`}>
        <svg width="7" height="7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="9 18 15 12 9 6"/></svg>
      </span>
      <span className="lp-folder-icon">{icon}</span>
      <span className="lp-folder-name">{label}</span>
      <span className="lp-folder-count">{count}</span>
    </div>
  )
}

/* ── Asset list row with gradient thumb ── */
function AssetRow({ asset, icon, color, grad }) {
  const onDragStart = (e) => {
    e.dataTransfer.effectAllowed = 'copy'
    e.dataTransfer.setData('application/motionise-asset', JSON.stringify({
      assetId: asset.id,
      name: asset.name,
      type: asset.type,
      durSec: asset.durSec ?? 5,
    }))
  }
  return (
    <div className="lp-asset lp-indent" draggable onDragStart={onDragStart}>
      <div className="asset-thumb" style={{ background: grad }} />
      <span className="asset-icon" style={color ? { color } : {}}>{icon}</span>
      <span className="asset-name truncate">{asset.name}</span>
      <span className="asset-meta">{asset.dur}</span>
      <span className="asset-size">{asset.size}</span>
    </div>
  )
}

/* ── 4-col grid asset card ── */
function AssetCard({ asset, grad }) {
  const onDragStart = (e) => {
    e.dataTransfer.effectAllowed = 'copy'
    e.dataTransfer.setData('application/motionise-asset', JSON.stringify({
      assetId: asset.id,
      name: asset.name,
      type: asset.type,
      durSec: asset.durSec ?? 5,
    }))
  }
  return (
    <div className="lp-card4" draggable onDragStart={onDragStart}>
      <div className="lp-card4-thumb" style={{ background: grad }}>
        <div className="lp-card4-type">
          <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/>
          </svg>
        </div>
        <span className="lp-card4-dur">{asset.dur}</span>
      </div>
      <span className="lp-card4-name truncate">{asset.name}</span>
    </div>
  )
}

/* ── Effects browser ── */
function EffectsTab({ mode }) {
  const [search, setSearch] = useState('')
  const cards = EFFECT_CARDS.filter(e => e.name.toLowerCase().includes(search.toLowerCase()))

  const FX_CATS = mode === 'transitions'
    ? ['Video Transitions', 'Audio Transitions']
    : ['Presets', 'Lumetri Presets', 'Audio Effects', 'Audio Transitions', 'Video Effects', 'Video Transitions']

  const [openCat, setOpenCat] = useState('Video Effects')

  return (
    <div className="fx-panel">
      <div className="fx-search-row">
        <div className="lp-search-wrap" style={{ flex: 1 }}>
          <svg className="lp-search-icon" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input className="lp-search" placeholder="Search effects…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        {/* Acc / Clear */}
        <button className="lp-view-btn" title="Accelerated effects only">A</button>
      </div>

      {search ? (
        /* Search results — card grid */
        <div className="fx-card-grid">
          {cards.map(e => (
            <FxCard key={e.name} effect={e} />
          ))}
        </div>
      ) : (
        /* Categorized list */
        <div className="fx-tree">
          {FX_CATS.map(cat => (
            <div key={cat}>
              <div className="fx-cat-hdr" onClick={() => setOpenCat(o => o === cat ? null : cat)}>
                <span className={`lp-folder-chevron ${openCat === cat ? 'open' : ''}`}>
                  <svg width="7" height="7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="9 18 15 12 9 6"/></svg>
                </span>
                <span className="fx-cat-dot" style={{ background: cat.includes('AI') ? '#8B5CF6' : cat.includes('Audio') ? '#10B981' : cat.includes('Video') ? '#3B82F6' : '#F59E0B' }} />
                <span className="fx-cat-name">{cat}</span>
              </div>
              {openCat === cat && (
                <div className="fx-card-grid">
                  {(cat === 'Video Effects' ? EFFECT_CARDS.filter(e => !e.ai) : EFFECT_CARDS.slice(0, 4)).map(e => (
                    <FxCard key={e.name} effect={e} />
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function FxCard({ effect }) {
  return (
    <div className={`fx-card ${effect.ai ? 'fx-card-ai' : ''}`} draggable title={`Drag to apply ${effect.name}`}>
      <div className="fx-card-thumb" style={effect.style} />
      <span className="fx-card-name truncate">{effect.name}</span>
    </div>
  )
}
