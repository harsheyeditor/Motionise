import { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react'

const Ctx = createContext(null)

/* ── Demo project data ── */
// Track display names matching Nexora reference
const TRACKS = [
  { id: 'v1', type: 'video', label: 'Video 1',   locked: false, muted: false, solo: false, color: '#2563EB' },
  { id: 'v2', type: 'video', label: 'Video 2',   locked: false, muted: false, solo: false, color: '#2563EB' },
  { id: 'a1', type: 'audio', label: 'Dialogue',  locked: false, muted: false, solo: false, color: '#059669' },
  { id: 'a2', type: 'audio', label: 'Music',     locked: false, muted: false, solo: false, color: '#059669' },
  { id: 'fx', type: 'fx',    label: 'Adj. Layer', locked: false, muted: false, solo: false, color: '#7C3AED' },
]

const CLIPS = [
  { id: 'c1', track: 'v1', name: 'hero_shot_001.mp4',    start: 0,    dur: 5.5,  color: '#2563EB', aiGenerated: false },
  { id: 'c2', track: 'v1', name: 'product_close_up.mp4', start: 5.5,  dur: 4,    color: '#2563EB', aiGenerated: false },
  { id: 'c3', track: 'v1', name: 'AI: Neon Title',       start: 9.5,  dur: 3.5,  color: '#6D28D9', aiGenerated: true  },
  { id: 'c4', track: 'v1', name: 'brand_closeout.mp4',   start: 13,   dur: 5,    color: '#2563EB', aiGenerated: false },
  { id: 'c5', track: 'v2', name: 'bg_overlay.mov',       start: 2,    dur: 11,   color: '#1D4ED8', aiGenerated: false },
  { id: 'c6', track: 'a1', name: 'background_music.wav', start: 0,    dur: 18,   color: '#059669', aiGenerated: false },
  { id: 'c7', track: 'a2', name: 'voiceover_final.wav',  start: 1,    dur: 16.5, color: '#047857', aiGenerated: false },
  { id: 'c8', track: 'fx', name: 'Wanderlust — THE JOURNEY BEGINS', start: 0, dur: 7, color: '#D97706', aiGenerated: false },
  { id: 'c9', track: 'fx', name: 'Logo_Adventure.png',  start: 12,   dur: 6,    color: '#B45309', aiGenerated: false },
]

const ASSETS = [
  { id: 'a1', name: 'hero_shot_001.mp4',    type: 'video', dur: '0:05', size: '42 MB' },
  { id: 'a2', name: 'product_close_up.mp4', type: 'video', dur: '0:04', size: '31 MB' },
  { id: 'a3', name: 'brand_closeout.mp4',   type: 'video', dur: '0:05', size: '38 MB' },
  { id: 'a4', name: 'background_music.wav', type: 'audio', dur: '2:34', size: '18 MB' },
  { id: 'a5', name: 'voiceover_final.wav',  type: 'audio', dur: '0:16', size: '4 MB'  },
  { id: 'a6', name: 'logo_white.png',       type: 'image', dur: '—',    size: '0.2 MB'},
]

export function AppProvider({ children }) {
  const [workspace, setWorkspace]             = useState('editing')  // editing | motion | audio | ai
  const [activeTool, setActiveTool]           = useState('select')    // select | trim | blade
  const [tracks, setTracks]                   = useState(TRACKS)
  const [clips, setClips]                     = useState(CLIPS)
  const [selectedClipId, setSelectedClipId]   = useState('c1')
  const [playhead, setPlayhead]               = useState(0)
  const [isPlaying, setIsPlaying]             = useState(false)
  const [zoom, setZoom]                       = useState(60)  // px/sec
  const [assets]                              = useState(ASSETS)
  const [projectName, setProjectName]         = useState('Q2 Product Launch')
  const [saveStatus, setSaveStatus]           = useState('saved')  // saved | saving | unsaved
  const [generating, setGenerating]           = useState(false)
  const [genProgress, setGenProgress]         = useState(0)
  const [markers, setMarkers]                 = useState([
    { id: 'm1', time: 3.2,  label: 'CUT A', color: '#F5A623' },
    { id: 'm2', time: 9.5,  label: 'SECTION', color: '#2DC770' },
    { id: 'm3', time: 13,   label: 'END', color: '#E8433A' },
  ])

  const totalDuration = 18

  /* ── Playback loop — advances playhead at real-time speed ── */
  const prevTimeRef = useRef(null)
  useEffect(() => {
    if (!isPlaying) {
      prevTimeRef.current = null
      return
    }
    let raf
    const tick = (timestamp) => {
      if (prevTimeRef.current !== null) {
        const dt = (timestamp - prevTimeRef.current) / 1000  // seconds elapsed
        setPlayhead(prev => {
          const next = prev + dt
          if (next >= totalDuration) {
            setIsPlaying(false)
            return totalDuration
          }
          return next
        })
      }
      prevTimeRef.current = timestamp
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [isPlaying, totalDuration, setPlayhead, setIsPlaying])

  const selectedClip = clips.find(c => c.id === selectedClipId) || null
  const selectClip   = useCallback(id => setSelectedClipId(id), [])

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
          // Insert a new AI clip
          setClips(cs => [...cs, {
            id: `c_ai_${Date.now()}`,
            track: 'v1',
            name: `AI: ${prompt.slice(0, 28)}`,
            start: 18,
            dur: 4,
            color: '#2D1A6B',
            aiGenerated: true,
          }])
        }, 600)
      }
      setGenProgress(p)
    }, 250)
  }, [])

  return (
    <Ctx.Provider value={{
      workspace, setWorkspace,
      activeTool, setActiveTool,
      tracks, toggleTrackProp,
      clips, setClips,
      selectedClipId, selectClip, selectedClip,
      playhead, setPlayhead,
      isPlaying, setIsPlaying,
      zoom, setZoom,
      assets,
      projectName, setProjectName,
      saveStatus, setSaveStatus,
      generating, genProgress, simulateGenerate,
      totalDuration,
      markers, setMarkers,
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
