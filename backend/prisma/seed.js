// Seed: creates the initial demo project so the app has something to load on first run
require('dotenv').config()
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

const DEMO_TRACKS = [
  { id: 'v1', type: 'video', label: 'Video 1',    locked: false, muted: false, solo: false, color: '#2563EB' },
  { id: 'v2', type: 'video', label: 'Video 2',    locked: false, muted: false, solo: false, color: '#2563EB' },
  { id: 'a1', type: 'audio', label: 'Dialogue',   locked: false, muted: false, solo: false, color: '#059669' },
  { id: 'a2', type: 'audio', label: 'Music',      locked: false, muted: false, solo: false, color: '#059669' },
  { id: 'fx', type: 'fx',    label: 'Adj. Layer', locked: false, muted: false, solo: false, color: '#7C3AED' },
]

const DEMO_CLIPS = [
  { id: 'c1', track: 'v1', name: 'hero_shot_001.mp4',    start: 0,    dur: 5.5, color: '#2563EB', aiGenerated: false },
  { id: 'c2', track: 'v1', name: 'product_close_up.mp4', start: 5.5,  dur: 4,   color: '#2563EB', aiGenerated: false },
  { id: 'c3', track: 'v1', name: 'AI: Neon Title',       start: 9.5,  dur: 3.5, color: '#6D28D9', aiGenerated: true  },
  { id: 'c4', track: 'v1', name: 'brand_closeout.mp4',   start: 13,   dur: 5,   color: '#2563EB', aiGenerated: false },
  { id: 'c5', track: 'v2', name: 'bg_overlay.mov',       start: 2,    dur: 11,  color: '#1D4ED8', aiGenerated: false },
  { id: 'c6', track: 'a1', name: 'background_music.wav', start: 0,    dur: 18,  color: '#059669', aiGenerated: false },
  { id: 'c7', track: 'a2', name: 'voiceover_final.wav',  start: 1,    dur: 16.5,color: '#047857', aiGenerated: false },
  { id: 'c8', track: 'fx', name: 'Wanderlust - THE JOURNEY BEGINS', start: 0, dur: 7, color: '#D97706', aiGenerated: false },
  { id: 'c9', track: 'fx', name: 'Logo_Adventure.png',   start: 12,   dur: 6,   color: '#B45309', aiGenerated: false },
]

const DEMO_MARKERS = [
  { id: 'm1', time: 3.2,  label: 'CUT A',   color: '#F5A623' },
  { id: 'm2', time: 9.5,  label: 'SECTION', color: '#2DC770' },
  { id: 'm3', time: 13,   label: 'END',      color: '#E8433A' },
]

async function main() {
  // Only seed if no projects exist
  const count = await prisma.project.count()
  if (count > 0) {
    console.log(`⏭  Skipping seed — ${count} project(s) already exist`)
    return
  }

  const project = await prisma.project.create({
    data: {
      name: 'Q2 Product Launch',
      tracks:  DEMO_TRACKS,
      clips:   DEMO_CLIPS,
      markers: DEMO_MARKERS,
      zoom:    60,
      totalDur: 18,
    },
  })

  console.log(`✓ Seeded demo project: ${project.id} — "${project.name}"`)
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
