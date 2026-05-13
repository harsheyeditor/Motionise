import { useRef, useState, useCallback, useEffect } from 'react'
import './Timeline.css'
import { useApp } from '../../context/AppContext'

const TRACK_TYPE_LABEL = { video: 'V', audio: 'A', fx: 'FX' }
const TRACK_TYPE_COLOR = {
  video: '#1D4E8C',
  audio: '#155C3A',
  fx:    '#4A1E7A',
}

/* Demo keyframes per clip */
const DEMO_KFS = {
  c1: [1.2, 2.8, 4.0],
  c2: [0.5, 2.0, 3.5],
  c3: [0.8, 2.2],
  c4: [1.5, 3.8],
}

/* Mixer channels */
const MIXER_CHANNELS = [
  { id: 'A1', label: 'A1', level: 72, color: '#10B981' },
  { id: 'A2', label: 'A2', level: 58, color: '#10B981' },
  { id: 'A3', label: 'A3', level: 45, color: '#3B82F6' },
  { id: 'A4', label: 'A4', level: 20, color: '#3B82F6' },
  { id: 'M1', label: 'M1', level: 80, color: '#F59E0B' },
]

export default function Timeline({ height = 224 }) {
  const {
    tracks, toggleTrackProp,
    clips, setClips,
    selectedClipId, selectClip,
    playhead, setPlayhead,
    zoom, setZoom,
    markers,
    totalDuration,
    activeTool,
    pushHistory, splitClipAtPlayhead, dropAssetToTrack, setClipColor,
    deleteClip, addMarker,
  } = useApp()

  const rulerRef = useRef(null)
  const scrollRef = useRef(null)
  const [collapsed, setCollapsed] = useState(false)
  const [snapEnabled, setSnapEnabled] = useState(true)
  const [snapLine, setSnapLine] = useState(null)   // x px for snap indicator
  const [ctxTrack, setCtxTrack] = useState(null)   // { trackId, x, y }
  const [playheadDrag, setPlayheadDrag] = useState(false)

  const pxPerSec = zoom
  const trackH = 52
  const labelW = 120
  const rulerH = 26
  const markerH = 16

  // Number of ruler ticks
  const tickSec = pxPerSec >= 60 ? 1 : pxPerSec >= 30 ? 2 : 5
  const totalW = Math.max((totalDuration + 8) * pxPerSec, 800)
  const numTicks = Math.ceil(totalW / pxPerSec / tickSec) + 1

  const trackOrder = ['v1', 'v2', 'a1', 'a2', 'fx']

  /* ── Ruler → set playhead ── */
  const onRulerDown = useCallback((e) => {
    const rect = rulerRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left + (scrollRef.current?.scrollLeft || 0)
    setPlayhead(Math.max(0, x / pxPerSec))
    setPlayheadDrag(true)

    const onMove = (me) => {
      const mx = me.clientX - rect.left + (scrollRef.current?.scrollLeft || 0)
      setPlayhead(Math.max(0, mx / pxPerSec))
    }
    const onUp = () => {
      setPlayheadDrag(false)
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }, [pxPerSec, setPlayhead])

  /* ── Trim handles ── */
  const onTrimStart = useCallback((e, clipId, edge) => {
    e.stopPropagation()
    const clip = clips.find(c => c.id === clipId)
    if (!clip) return

    const onMove = (me) => {
      const dx = (me.clientX - e.clientX) / pxPerSec
      setClips(cs => cs.map(c => {
        if (c.id !== clipId) return c
        if (edge === 'left') {
          const ns = Math.max(0, clip.start + dx)
          const nd = Math.max(0.25, clip.dur - dx)
          return { ...c, start: ns, dur: nd }
        }
        return { ...c, dur: Math.max(0.25, clip.dur + dx) }
      }))
    }
    const onUp = () => {
      setClips(cs => { pushHistory(cs); return cs })
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }, [clips, pxPerSec, setClips, pushHistory])

  /* ── Clip drag ── */
  const onClipDrag = useCallback((e, clipId) => {
    if (activeTool !== 'select') return
    e.stopPropagation()
    const clip = clips.find(c => c.id === clipId)
    if (!clip) return
    const startX = e.clientX
    const origStart = clip.start

    const onMove = (me) => {
      const dx = (me.clientX - startX) / pxPerSec
      let newStart = Math.max(0, origStart + dx)

      // Snap to other clips, playhead, and markers
      if (snapEnabled) {
        const snapTargets = clips
          .filter(c => c.id !== clipId)
          .flatMap(c => [c.start, c.start + c.dur])
          .concat([playhead, ...markers.map(m => m.time)])
        for (const t of snapTargets) {
          if (Math.abs(newStart - t) < 0.15) {
            newStart = t
            setSnapLine(t * pxPerSec)
            break
          } else {
            setSnapLine(null)
          }
        }
      }
      setClips(cs => cs.map(c => c.id === clipId ? { ...c, start: newStart } : c))
    }
    const onUp = () => {
      setSnapLine(null)
      setClips(cs => { pushHistory(cs); return cs })
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }, [clips, pxPerSec, snapEnabled, activeTool, setClips, playhead, markers, pushHistory])

  /* ── Track context menu ── */
  const onTrackCtx = (e, trackId) => {
    e.preventDefault()
    setCtxTrack({ trackId, x: e.clientX, y: e.clientY })
  }

  const totalTrackH = trackOrder.length * (trackH + 1)

  return (
    <div
      className={`timeline ${collapsed ? 'tl-collapsed' : ''}`}
      style={{ height: collapsed ? 28 : height }}
      onClick={() => setCtxTrack(null)}
    >
      {/* ── Toolbar ── */}
      <div className="tl-toolbar">
        <button
          className="btn-icon"
          style={{ fontSize: 10 }}
          title={collapsed ? 'Expand Timeline' : 'Collapse Timeline'}
          onClick={() => setCollapsed(c => !c)}
        >
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            {collapsed
              ? <polyline points="18 15 12 9 6 15" />
              : <polyline points="6 9 12 15 18 9" />}
          </svg>
        </button>
        <span className="panel-title" style={{ padding: '0 5px' }}>TIMELINE</span>
        <div className="tl-tb-div" />

        <span className="tl-toolbar-tc">{fmtFullTC(playhead)}</span>
        <div className="tl-tb-div" />

        {/* Edit tools row */}
        <button className="btn-ghost" style={{ fontSize: 10, gap: 3 }}>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 6h18M3 12h18M3 18h18"/>
          </svg>
          Insert
        </button>
        <button className="btn-ghost" style={{ fontSize: 10 }}>Overwrite</button>
        <div className="tl-tb-div" />

        {/* Zoom */}
        <div className="tl-zoom-ctrl">
          <button className="btn-icon" onClick={() => setZoom(z => Math.max(15, z - 15))}>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="5" y1="12" x2="19" y2="12"/></svg>
          </button>
          <input type="range" min="15" max="150" value={zoom}
            className="range" style={{ width: 64 }}
            onChange={e => setZoom(+e.target.value)} />
          <button className="btn-icon" onClick={() => setZoom(z => Math.min(150, z + 15))}>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          </button>
          <span className="mono" style={{ fontSize: 9, color: 'var(--text-muted)', minWidth: 38 }}>
            {zoom}px/s
          </span>
        </div>

        <div style={{ flex: 1 }} />

        <button
          className={`btn-icon ${snapEnabled ? 'active' : ''}`}
          title="Toggle Snap (S)"
          onClick={() => setSnapEnabled(s => !s)}
        >
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 22V2M7 7H2M7 17H2M22 7h-5M22 17h-5"/>
          </svg>
        </button>
        <button className="btn-icon" title="Add Marker" onClick={() => addMarker()}>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
          </svg>
        </button>
        <div className="tl-tb-div" />
        <button className="btn-ghost" style={{ fontSize: 10 }}>Lift</button>
        <button className="btn-ghost" style={{ fontSize: 10 }}>Ripple</button>
        <button
          className="btn-ghost"
          style={{ fontSize: 10, color: 'var(--red)' }}
          title="Delete selected clip (Del)"
          onClick={() => selectedClipId && deleteClip(selectedClipId)}
        >
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
          </svg>
        </button>
      </div>

      {/* ── Body ── */}
      {!collapsed && (
        <div className="tl-body">

          {/* Fixed label column */}
          <div className="tl-labels" style={{ width: labelW }}>
            {/* Ruler spacer */}
            <div className="tl-label-ruler-gap" style={{ height: rulerH + markerH }} />

            {/* Per-track labels */}
            {trackOrder.map((tid, i) => {
              const t = tracks.find(tr => tr.id === tid)
              if (!t) return null
              const isAudio = t.type === 'audio'

              return (
                <div
                  key={tid}
                  className={`tl-track-hdr tl-hdr-${t.type}`}
                  style={{ height: trackH }}
                  onContextMenu={e => onTrackCtx(e, tid)}
                >
                  {/* Color strip */}
                  <div className="tl-hdr-strip" style={{ background: TRACK_TYPE_COLOR[t.type] }} />

                  {/* Name + index */}
                  <div className="tl-hdr-identity">
                    <span className="tl-hdr-type">{TRACK_TYPE_LABEL[t.type]}{i + 1 > 2 ? i - 1 : i + 1}</span>
                    <span className="tl-hdr-name truncate">{t.label}</span>
                  </div>

                  {/* Controls */}
                  <div className="tl-hdr-controls">
                    {/* Eye / visibility */}
                    <button
                      className={`tl-hdr-btn ${t.muted ? '' : 'on'}`}
                      title={t.muted ? 'Show' : 'Hide'}
                      onClick={() => toggleTrackProp(tid, 'muted')}
                    >
                      {t.muted ? '👁‍🗨' : '👁'}
                    </button>
                    {/* Mute (audio only) */}
                    {isAudio && (
                      <button
                        className={`tl-hdr-btn ${t.muted ? 'warn' : 'on'}`}
                        title="Mute"
                        onClick={() => toggleTrackProp(tid, 'muted')}
                      >M</button>
                    )}
                    {/* Solo (audio only) */}
                    {isAudio && (
                      <button
                        className={`tl-hdr-btn ${t.solo ? 'active' : ''}`}
                        title="Solo"
                        onClick={() => toggleTrackProp(tid, 'solo')}
                      >S</button>
                    )}
                    {/* Lock */}
                    <button
                      className={`tl-hdr-btn ${t.locked ? 'warn' : ''}`}
                      title={t.locked ? 'Unlock' : 'Lock'}
                      onClick={() => toggleTrackProp(tid, 'locked')}
                    >{t.locked ? '🔒' : '🔓'}</button>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Scrollable track area */}
          <div className="tl-scroll" ref={scrollRef}>
            <div style={{ width: totalW, position: 'relative', minWidth: '100%' }}>

              {/* ── Ruler ── */}
              <div
                className="tl-ruler"
                style={{ height: rulerH }}
                ref={rulerRef}
                onMouseDown={onRulerDown}
              >
                {Array.from({ length: numTicks }).map((_, i) => {
                  const sec = i * tickSec
                  const x = sec * pxPerSec
                  const major = sec % (tickSec * 5) === 0
                  return (
                    <div key={i} className={`tl-tick ${major ? 'major' : ''}`} style={{ left: x }}>
                      {major && <span className="tl-tick-label">{fmtTC(sec)}</span>}
                    </div>
                  )
                })}

                {/* Markers on ruler */}
                {markers.map(m => (
                  <div key={m.id} className="tl-ruler-marker" style={{ left: m.time * pxPerSec }}>
                    <div className="tl-marker-flag" style={{ background: m.color }}>
                      {m.label}
                    </div>
                  </div>
                ))}

                {/* Playhead triangle on ruler */}
                <div
                  className="tl-ph-handle"
                  style={{ left: playhead * pxPerSec }}
                />
              </div>

              {/* ── Marker strip ── */}
              <div className="tl-marker-strip" style={{ height: markerH }}>
                {markers.map(m => (
                  <div
                    key={m.id}
                    className="tl-marker-diamond"
                    style={{ left: m.time * pxPerSec, background: m.color }}
                    title={m.label}
                  />
                ))}
              </div>

              {/* ── Track rows ── */}
              {trackOrder.map(tid => {
                const t = tracks.find(tr => tr.id === tid)
                if (!t) return null
                const tClips = clips.filter(c => c.track === tid)

                return (
                  <div
                    key={tid}
                    className={`tl-track tl-track-${t.type} ${t.muted ? 'muted' : ''} ${t.locked ? 'locked' : ''}`}
                    style={{ height: trackH }}
                    onContextMenu={e => onTrackCtx(e, tid)}
                    onDragOver={e => e.preventDefault()}
                    onDrop={e => {
                      e.preventDefault()
                      if (t.locked) return
                      const data = e.dataTransfer.getData('application/motionise-asset')
                      if (!data) return
                      try {
                        const asset = JSON.parse(data)
                        const rect = e.currentTarget.getBoundingClientRect()
                        const x = e.clientX - rect.left + (scrollRef.current?.scrollLeft || 0)
                        const dropStart = Math.max(0, x / pxPerSec)
                        dropAssetToTrack(asset.assetId, tid, dropStart)
                      } catch (err) { console.error('Drop error', err) }
                    }}
                  >
                    {/* Alternating row tint */}
                    <div className="tl-track-bg" />

                    {tClips.map(clip => (
                      <TLClip
                        key={clip.id}
                        clip={clip}
                        track={t}
                        pxPerSec={pxPerSec}
                        trackH={trackH}
                        selected={selectedClipId === clip.id}
                        onSelect={() => {
                          if (t.locked) return
                          if (activeTool === 'blade') {
                            splitClipAtPlayhead(clip.id)
                          } else {
                            selectClip(clip.id)
                          }
                        }}
                        onTrimStart={onTrimStart}
                        onDrag={onClipDrag}
                        locked={t.locked}
                        tool={activeTool}
                        keyframes={DEMO_KFS[clip.id] || []}
                        splitClipAtPlayhead={splitClipAtPlayhead}
                        setClipColor={setClipColor}
                        deleteClip={deleteClip}
                      />
                    ))}

                    {/* Playhead line per track */}
                    <div className="tl-ph-track-line" style={{ left: playhead * pxPerSec }} />
                  </div>
                )
              })}

              {/* ── Full-height playhead line ── */}
              <div
                className="tl-playhead"
                style={{
                  left: playhead * pxPerSec,
                  height: totalTrackH + rulerH + markerH,
                }}
              />

              {/* ── Snap indicator ── */}
              {snapLine !== null && (
                <div
                  className="tl-snap-line"
                  style={{ left: snapLine, height: totalTrackH + rulerH + markerH }}
                />
              )}
            </div>
          </div>

          <div className="tl-mixer-panel">
            <div className="tl-mixer-hdr">
              <span className="panel-title">MIXER</span>
            </div>
            <div className="tl-mixer-channels">
              {MIXER_CHANNELS.map(ch => (
                <MixerChannel key={ch.id} {...ch} />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Track context menu */}
      {ctxTrack && (
        <div className="ctx-menu" style={{ left: ctxTrack.x, top: ctxTrack.y }}>
          <div className="ctx-item">Add Track Above</div>
          <div className="ctx-item">Add Track Below</div>
          <div className="ctx-sep" />
          <div className="ctx-item">Rename Track</div>
          <div className="ctx-item">Track Properties…</div>
          <div className="ctx-sep" />
          <div className="ctx-item danger">Delete Track</div>
        </div>
      )}
    </div>
  )
}

/* ════ Clip Block ════ */
function TLClip({ clip, track, pxPerSec, trackH, selected, onSelect, onTrimStart, onDrag, locked, tool, keyframes, splitClipAtPlayhead, setClipColor, deleteClip }) {
  const [ctxMenu, setCtxMenu] = useState(null)
  const w = Math.max(clip.dur * pxPerSec - 2, 6)

  const onCtx = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setCtxMenu({ x: e.clientX, y: e.clientY })
  }

  const getCursor = () => {
    if (locked) return 'not-allowed'
    if (tool === 'blade') return 'crosshair'
    if (tool === 'trim') return 'col-resize'
    return 'pointer'
  }

  const isAudio = track.type === 'audio'
  const trackColor = clip.color || TRACK_TYPE_COLOR[track.type]

  return (
    <>
      <div
        className={`tl-clip ${selected ? 'tl-clip-selected' : ''} ${clip.aiGenerated ? 'tl-clip-ai' : ''}`}
        style={{
          left: clip.start * pxPerSec,
          width: w,
          cursor: getCursor(),
          '--tc': trackColor,
        }}
        onMouseDown={e => !locked && tool === 'select' && onDrag(e, clip.id)}
        onClick={onSelect}
        onContextMenu={onCtx}
      >
        {/* Left color strip */}
        <div className="tl-clip-strip" style={{ background: trackColor }} />

        {/* Top label bar */}
        <div className="tl-clip-label-bar">
          {clip.aiGenerated && <span className="tl-ai-badge">★</span>}
          <span className="tl-clip-name truncate">{clip.name}</span>
          {w > 100 && <span className="tl-clip-dur mono">{clip.dur.toFixed(1)}s</span>}
        </div>

        {/* Body — waveform (audio) or film strip (video) */}
        <div className="tl-clip-body">
          {isAudio ? (
            <AudioWave width={w} />
          ) : (
            <VideoStrip width={w} ai={clip.aiGenerated} />
          )}
        </div>

        {/* Keyframe diamonds */}
        {keyframes.map((t, i) => (
          <div
            key={i}
            className="tl-kf-diamond"
            style={{ left: t * pxPerSec }}
            title={`Keyframe @ ${t.toFixed(2)}s`}
          />
        ))}

        {/* Trim handles */}
        {!locked && (
          <>
            <div
              className="tl-trim-handle tl-trim-left"
              onMouseDown={e => onTrimStart(e, clip.id, 'left')}
            />
            <div
              className="tl-trim-handle tl-trim-right"
              onMouseDown={e => onTrimStart(e, clip.id, 'right')}
            />
          </>
        )}
      </div>

      {ctxMenu && (
        <div
          className="ctx-menu"
          style={{ left: ctxMenu.x, top: ctxMenu.y }}
          onClick={() => setCtxMenu(null)}
          onMouseLeave={() => setCtxMenu(null)}
        >
          <div className="ctx-item" onClick={(e) => { e.stopPropagation(); splitClipAtPlayhead(clip.id); setCtxMenu(null); }}>Split at Playhead <span className="ctx-shortcut">B</span></div>
          <div className="ctx-item">Duplicate</div>
          <div className="ctx-item">Copy <span className="ctx-shortcut">Ctrl+C</span></div>
          <div className="ctx-sep" />
          <div className="ctx-item-submenu" style={{ padding: '4px 12px' }}>
            <div style={{ fontSize: 11, marginBottom: 6, color: 'var(--text-muted)' }}>Label Color</div>
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', width: 120 }}>
              {['#EF4444', '#F97316', '#EAB308', '#22C55E', '#3B82F6', '#8B5CF6', '#EC4899', '#94A3B8'].map(c => (
                <div key={c} onClick={(e) => { e.stopPropagation(); setClipColor(clip.id, c); setCtxMenu(null); }} style={{ width: 16, height: 16, borderRadius: '50%', background: c, cursor: 'pointer', border: clip.color === c ? '2px solid white' : 'none' }} />
              ))}
            </div>
          </div>
          <div className="ctx-sep" />
          <div className="ctx-item">Speed / Duration…</div>
          <div className="ctx-item">Add Hold Frame</div>
          <div className="ctx-item">Enable</div>
          {clip.aiGenerated && (
            <>
              <div className="ctx-sep" />
              <div className="ctx-item" style={{ color: 'var(--purple)' }}>★ Regenerate Clip</div>
              <div className="ctx-item" style={{ color: 'var(--purple)' }}>★ Edit AI Prompt</div>
            </>
          )}
          <div className="ctx-sep" />
          <div className="ctx-item danger" onClick={(e) => { e.stopPropagation(); deleteClip(clip.id); setCtxMenu(null); }}>Delete <span className="ctx-shortcut">Del</span></div>
        </div>
      )}
    </>
  )
}

/* ── Audio waveform bars ── */
function AudioWave({ width }) {
  const count = Math.max(4, Math.floor(width / 4))
  return (
    <div className="wave-wrap">
      {Array.from({ length: count }).map((_, i) => {
        const h = 20 + Math.abs(Math.sin(i * 0.8 + 1) * 55 + Math.cos(i * 0.4) * 20)
        return <div key={i} className="wave-bar" style={{ height: `${h}%` }} />
      })}
    </div>
  )
}

/* ── Video film strip indicator ── */
function VideoStrip({ width, ai }) {
  const count = Math.max(1, Math.floor(width / 32))
  return (
    <div className="film-strip">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className={`film-frame ${ai ? 'film-ai' : ''}`} />
      ))}
    </div>
  )
}

function fmtTC(sec) {
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

function fmtFullTC(sec) {
  const h = Math.floor(sec / 3600)
  const m = Math.floor((sec % 3600) / 60)
  const s = Math.floor(sec % 60)
  const f = Math.floor((sec % 1) * 24)
  return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}:${String(f).padStart(2,'0')}`
}

/* Audio mixer channel */
function MixerChannel({ label, level, color }) {
  const [vol, setVol] = useState(level)
  const db = ((vol / 100) * 12 - 12).toFixed(1)
  const meterH = `${vol}%`
  const meterColor = vol > 85 ? '#EF4444' : vol > 70 ? '#F59E0B' : color

  return (
    <div className="tl-mixer-channel">
      <span className="tl-mixer-ch-label">{label}</span>
      <div className="tl-mixer-fader-wrap">
        <div className="tl-mixer-meter">
          <div
            className="tl-mixer-meter-fill"
            style={{ height: meterH, background: meterColor }}
          />
        </div>
      </div>
      <span className="tl-mixer-val">{db}</span>
    </div>
  )
}
