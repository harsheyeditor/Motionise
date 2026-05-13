import { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react'
import { listProjects, getProject, saveProject } from '../api/projects'
import { listAssets } from '../api/assets'

const Ctx = createContext(null)

/* ── Demo project data ── */
const TRACKS = [
  { id: 'v1', type: 'video', label: 'Video 1',   locked: false, muted: false, solo: false, color: '#2563EB' },
  { id: 'v2', type: 'video', label: 'Video 2',   locked: false, muted: false, solo: false, color: '#2563EB' },
  { id: 'a1', type: 'audio', label: 'Dialogue',  locked: false, muted: false, solo: false, color: '#059669' },
  { id: 'a2', type: 'audio', label: 'Music',     locked: false, muted: false, solo: false, color: '#059669' },
  { id: 'fx', type: 'fx',    label: 'Adj. Layer', locked: false, muted: false, solo: false, color: '#7C3AED' },
]

const CLIPS_INITIAL = [
  { id: 'c1', track: 'v1', name: 'hero_shot_001.mp4',    start: 0,    dur: 5.5,  color: '#2563EB', aiGenerated: false },
  { id: 'c2', track: 'v1', name: 'product_close_up.mp4', start: 5.5,  dur: 4,    color: '#2563EB', aiGenerated: false },
  { id: 'c3', track: 'v1', name: 'AI: Neon Title',       start: 9.5,  dur: 3.5,  color: '#6D28D9', aiGenerated: true  },
  { id: 'c4', track: 'v1', name: 'brand_closeout.mp4',   start: 13,   dur: 5,    color: '#2563EB', aiGenerated: false },
  { id: 'c5', track: 'v2', name: 'bg_overlay.mov',       start: 2,    dur: 11,   color: '#1D4ED8', aiGenerated: false },
  { id: 'c6', track: 'a1', name: 'background_music.wav', start: 0,    dur: 18,   color: '#059669', aiGenerated: false },
  { id: 'c7', track: 'a2', name: 'voiceover_final.wav',  start: 1,    dur: 16.5, color: '#047857', aiGenerated: false },
  { id: 'c8', track: 'fx', name: 'Wanderlust - THE JOURNEY BEGINS', start: 0, dur: 7, color: '#D97706', aiGenerated: false },
  { id: 'c9', track: 'fx', name: 'Logo_Adventure.png',  start: 12,   dur: 6,    color: '#B45309', aiGenerated: false },
]

const ASSETS = [
  { id: 'a1', name: 'hero_shot_001.mp4',    type: 'video', dur: '0:05', size: '42 MB', durSec: 5.5 },
  { id: 'a2', name: 'product_close_up.mp4', type: 'video', dur: '0:04', size: '31 MB', durSec: 4   },
  { id: 'a3', name: 'brand_closeout.mp4',   type: 'video', dur: '0:05', size: '38 MB', durSec: 5   },
  { id: 'a4', name: 'background_music.wav', type: 'audio', dur: '2:34', size: '18 MB', durSec: 154 },
  { id: 'a5', name: 'voiceover_final.wav',  type: 'audio', dur: '0:16', size: '4 MB',  durSec: 16  },
  { id: 'a6', name: 'logo_white.png',       type: 'image', dur: '—',    size: '0.2 MB',durSec: 5   },
]

/* Clip colour label palette */
export const LABEL_COLORS = [
  '#EF4444', '#F97316', '#EAB308', '#22C55E',
  '#3B82F6', '#8B5CF6', '#EC4899', '#94A3B8',
]

/* JKL shuttle speed table: index → multiplier */
const SHUTTLE_SPEEDS = [8, 4, 2, 1, 0, -1, -2, -4, -8]
// index 4 = stopped (0), 3 = 1×, 5 = -1×, etc.
const SHUTTLE_NEUTRAL = 4

export function AppProvider({ children }) {
  const [projectId, setProjectId]           = useState(null)
  const [workspace, setWorkspace]           = useState('editing')
  const [activeTool, setActiveTool]         = useState('select')
  const [tracks, setTracks]                 = useState(TRACKS)
  const [clips, setClips]                   = useState(CLIPS_INITIAL)
  const [selectedClipId, setSelectedClipId] = useState(null)
  const [playhead, setPlayhead]             = useState(0)
  const [zoom, setZoom]                     = useState(60)
  const [assets, setAssets]                 = useState(ASSETS)
  const [projectName, setProjectName]       = useState('Q2 Product Launch')
  const [saveStatus, setSaveStatus]         = useState('saved')
  const [generating, setGenerating]         = useState(false)
  const [genProgress, setGenProgress]       = useState(0)
  const [markers, setMarkers]               = useState(DEMO_MARKERS)
  const [showExportModal, setShowExportModal]               = useState(false)
  const [showShortcutsModal, setShowShortcutsModal]         = useState(false)

  /* JKL shuttle index (4 = neutral/stopped) */
  const [shuttleIdx, setShuttleIdx] = useState(SHUTTLE_NEUTRAL)

  const [totalDuration, setTotalDuration] = useState(18)

  /* ── Undo / Redo — 20-step ring buffer on clips ── */
  const historyRef = useRef([CLIPS_INITIAL])
  const historyIdx = useRef(0)

  const pushHistory = useCallback((currentClips) => {
    // Truncate any redo future
    historyRef.current = historyRef.current.slice(0, historyIdx.current + 1)
    historyRef.current.push(currentClips)
    if (historyRef.current.length > 20) historyRef.current.shift()
    historyIdx.current = historyRef.current.length - 1
  }, [])

  const undo = useCallback(() => {
    if (historyIdx.current > 0) {
      historyIdx.current--
      setClips(historyRef.current[historyIdx.current])
    }
  }, [])

  const redo = useCallback(() => {
    if (historyIdx.current < historyRef.current.length - 1) {
      historyIdx.current++
      setClips(historyRef.current[historyIdx.current])
    }
  }, [])

  /* ── Backend Loading & Auto-save ── */
  const loadProjectData = useCallback(async (id) => {
    try {
      const p = await getProject(id)
      setProjectId(p.id)
      setProjectName(p.name)
      setTracks(p.tracks || [])
      setClips(p.clips || [])
      setMarkers(p.markers || [])
      setZoom(p.zoom || 60)
      setTotalDuration(p.totalDur || 18)
      
      // Reset history
      historyRef.current = [p.clips || []]
      historyIdx.current = 0
      setSelectedClipId(null)
    } catch (err) {
      console.error('Failed to load project:', err)
    }
  }, [])

  // Initial load
  useEffect(() => {
    // Load assets
    listAssets().then(setAssets).catch(console.error)
    
    // Load first project
    listProjects().then(ps => {
      if (ps.length > 0) loadProjectData(ps[0].id)
    }).catch(console.error)
  }, [loadProjectData])

  // Auto-save
  const isInitialMount = useRef(true)
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false
      return
    }
    if (!projectId) return

    setSaveStatus('saving')
    const timer = setTimeout(() => {
      saveProject(projectId, {
        name: projectName,
        tracks, clips, markers, zoom, totalDur: totalDuration
      })
      .then(() => setSaveStatus('saved'))
      .catch(() => setSaveStatus('unsaved'))
    }, 1500)

    return () => clearTimeout(timer)
  }, [projectId, projectName, tracks, clips, markers, zoom, totalDuration])

  /* ── Playback loop — JKL-aware ── */
  const prevTimeRef = useRef(null)
  useEffect(() => {
    const speed = SHUTTLE_SPEEDS[shuttleIdx]
    const moving = speed !== 0

    if (!moving) {
      prevTimeRef.current = null
      return
    }

    let raf
    const tick = (timestamp) => {
      if (prevTimeRef.current !== null) {
        const dt = (timestamp - prevTimeRef.current) / 1000
        setPlayhead(prev => {
          const next = prev + dt * speed
          if (next >= totalDuration) { setShuttleIdx(SHUTTLE_NEUTRAL); return totalDuration }
          if (next <= 0)             { setShuttleIdx(SHUTTLE_NEUTRAL); return 0 }
          return next
        })
      }
      prevTimeRef.current = timestamp
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [shuttleIdx, totalDuration])

  /* Legacy isPlaying compat shim */
  const isPlayingActual = SHUTTLE_SPEEDS[shuttleIdx] > 0
  const setIsPlaying = useCallback((val) => {
    const on = typeof val === 'function' ? val(isPlayingActual) : val
    setShuttleIdx(on ? 3 : SHUTTLE_NEUTRAL) // 3 = 1× forward
  }, [isPlayingActual])

  /* JKL handlers */
  const shuttleL = useCallback(() =>
    setShuttleIdx(i => Math.min(i + 1, SHUTTLE_SPEEDS.length - 1)), [])
  const shuttleK = useCallback(() =>
    setShuttleIdx(SHUTTLE_NEUTRAL), [])
  const shuttleJ = useCallback(() =>
    setShuttleIdx(i => Math.max(i - 1, 0)), [])

  /* ── Split clip at playhead ── */
  const splitClipAtPlayhead = useCallback((clipId) => {
    setClips(current => {
      const clip = current.find(c => c.id === clipId)
      if (!clip) return current
      const ph = playhead
      if (ph <= clip.start + 0.05 || ph >= clip.start + clip.dur - 0.05) return current
      const leftDur  = ph - clip.start
      const rightClip = {
        ...clip,
        id: `${clip.id}_r${Date.now()}`,
        start: ph,
        dur: clip.dur - leftDur,
      }
      const next = current.map(c => c.id === clipId ? { ...c, dur: leftDur } : c).concat(rightClip)
      pushHistory(next)
      return next
    })
  }, [playhead, pushHistory])

  /* ── Drop asset onto track ── */
  const dropAssetToTrack = useCallback((assetId, trackId, startSec) => {
    const asset = ASSETS.find(a => a.id === assetId)
    if (!asset) return
    const newClip = {
      id: `drop_${assetId}_${Date.now()}`,
      track: trackId,
      name: asset.name,
      start: Math.max(0, startSec),
      dur: asset.durSec,
      color: trackId.startsWith('a') ? '#059669'
           : trackId === 'fx' ? '#D97706'
           : '#2563EB',
      aiGenerated: false,
    }
    setClips(current => {
      const next = [...current, newClip]
      pushHistory(next)
      return next
    })
  }, [pushHistory])

  /* ── Clip colour label ── */
  const setClipColor = useCallback((clipId, color) => {
    setClips(current => {
      const next = current.map(c => c.id === clipId ? { ...c, color } : c)
      pushHistory(next)
      return next
    })
  }, [pushHistory])

  /* ── Delete clip ── */
  const deleteClip = useCallback((clipId) => {
    setClips(current => {
      const next = current.filter(c => c.id !== clipId)
      pushHistory(next)
      return next
    })
    setSelectedClipId(id => id === clipId ? null : id)
  }, [pushHistory])

  /* ── Add marker at playhead ── */
  const addMarker = useCallback((label = '') => {
    setMarkers(ms => [
      ...ms,
      { id: `m_${Date.now()}`, time: playhead, label: label || `M${ms.length + 1}`, color: '#F5A623' },
    ])
    setSaveStatus('unsaved')
    setTimeout(() => setSaveStatus('saved'), 1500)
  }, [playhead])

  const selectedClip  = clips.find(c => c.id === selectedClipId) || null
  const selectClip    = useCallback(id => setSelectedClipId(id), [])

  const toggleTrackProp = useCallback((trackId, prop) => {
    setTracks(ts => ts.map(t => t.id === trackId ? { ...t, [prop]: !t[prop] } : t))
  }, [])

  const simulateGenerate = useCallback((prompt) => {
    setGenerating(true)
    setGenProgress(0)
    let p = 0
    const iv = setInterval(() => {
      p += Math.random() * 8 + 4
      if (p >= 100) {
        p = 100
        clearInterval(iv)
        setTimeout(() => {
          setGenerating(false)
          setGenProgress(0)
          setClips(cs => {
            const next = [...cs, {
              id: `c_ai_${Date.now()}`,
              track: 'v1',
              name: `AI: ${prompt.slice(0, 28)}`,
              start: 18,
              dur: 4,
              color: '#2D1A6B',
              aiGenerated: true,
            }]
            pushHistory(next)
            return next
          })
        }, 600)
      }
      setGenProgress(p)
    }, 250)
  }, [pushHistory])

  return (
    <Ctx.Provider value={{
      projectId, loadProjectData,
      workspace, setWorkspace,
      activeTool, setActiveTool,
      tracks, toggleTrackProp,
      clips, setClips,
      selectedClipId, selectClip, selectedClip,
      playhead, setPlayhead,
      isPlaying: isPlayingActual, setIsPlaying,
      shuttleIdx, shuttleJ, shuttleK, shuttleL,
      zoom, setZoom,
      assets, setAssets,
      projectName, setProjectName,
      saveStatus, setSaveStatus,
      generating, genProgress, simulateGenerate,
      totalDuration, setTotalDuration,
      markers, setMarkers,
      showExportModal, setShowExportModal,
      showShortcutsModal, setShowShortcutsModal,
      undo, redo,
      pushHistory,
      splitClipAtPlayhead,
      dropAssetToTrack,
      setClipColor,
      deleteClip,
      addMarker,
    }}>
      {children}
    </Ctx.Provider>
  )
}

export const useApp = () => {
  const c = useContext(Ctx)
  if (!c) throw new Error('useApp outside AppProvider')
  return c
}
