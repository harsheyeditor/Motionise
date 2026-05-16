// In-process job workers — replaced fake workers with real FFmpeg processing for MVP.
const fs     = require('fs')
const path   = require('path')
const { prisma } = require('../db')
const ffmpeg = require('fluent-ffmpeg')
const ffmpegStatic = require('ffmpeg-static')

ffmpeg.setFfmpegPath(ffmpegStatic)

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// ── Export Project ─────────────────────────────────────────
// Extracts video clips from the project and concatenates them using FFmpeg
async function simulateExport(jobId, filename = 'export') {
  try {
    await prisma.job.update({ where: { id: jobId }, data: { status: 'running', progress: 0 } })

    const job = await prisma.job.findUnique({ where: { id: jobId } })
    if (!job || !job.projectId) throw new Error('Job or Project ID missing')

    const project = await prisma.project.findUnique({ where: { id: job.projectId } })
    if (!project) throw new Error('Project not found')

    let clips = project.clips || []
    if (typeof clips === 'string') {
      try { clips = JSON.parse(clips) } catch(e) {}
    }
    if (!Array.isArray(clips)) clips = []

    // Sort by start time
    clips.sort((a, b) => (a.start || 0) - (b.start || 0))

    // Find physical files for video clips
    const videoClips = clips.filter(c => c.track && c.track.startsWith('v'))
    const filesToMerge = []
    
    for (const clip of videoClips) {
      // Find asset by name
      const asset = await prisma.asset.findFirst({ where: { name: clip.name, type: 'video' } })
      if (asset) {
        const diskPath = path.resolve(__dirname, '../../uploads/assets', asset.filename)
        if (fs.existsSync(diskPath)) {
          filesToMerge.push(diskPath)
        }
      }
    }

    const outDir  = path.resolve(__dirname, '../../uploads/exports')
    fs.mkdirSync(outDir, { recursive: true })
    const outFile = `${filename.replace(/[^a-zA-Z0-9._-]/g, '_')}_${jobId}.mp4`
    const outPath = path.join(outDir, outFile)

    if (filesToMerge.length === 0) {
      // Fallback: create a 1s black video if timeline is empty or files missing
      await new Promise((resolve, reject) => {
        ffmpeg()
          .input('color=c=black:s=1280x720')
          .inputFormat('lavfi')
          .duration(1)
          .output(outPath)
          .on('end', resolve)
          .on('error', reject)
          .run()
      })
    } else {
      await new Promise((resolve, reject) => {
        const cmd = ffmpeg()
        filesToMerge.forEach(file => cmd.input(file))
        
        let lastUpdate = 0
        cmd.on('progress', async (progress) => {
          const now = Date.now()
          if (now - lastUpdate > 500) { // Throttle DB updates
            lastUpdate = now
            let p = progress.percent ? Math.floor(progress.percent) : 50
            if (p > 95) p = 95
            await prisma.job.update({ where: { id: jobId }, data: { progress: p } }).catch(() => {})
          }
        })
        .on('end', resolve)
        .on('error', reject)

        if (filesToMerge.length === 1) {
          cmd.output(outPath).run()
        } else {
          // Merge multiple files. Note: requires matching codecs/resolution.
          cmd.mergeToFile(outPath, path.resolve(__dirname, '../../uploads/exports'))
        }
      })
    }

    await prisma.job.update({
      where: { id: jobId },
      data: {
        status:   'done',
        progress: 100,
        result:   { url: `/uploads/exports/${outFile}`, filename: outFile },
      },
    })
  } catch (err) {
    console.error('Export error:', err)
    await prisma.job.update({
      where:  { id: jobId },
      data:   { status: 'failed', error: err.message },
    }).catch(() => {})
  }
}

// ── AI Generate simulation ─────────────────────────────────
// Ticks progress over ~6 seconds, then creates a stub Asset record and returns it.
async function simulateGenerate(jobId, prompt) {
  try {
    await prisma.job.update({ where: { id: jobId }, data: { status: 'running', progress: 0 } })

    const steps = [
      { progress: 15, delay: 600, msg: 'Analyzing brief…' },
      { progress: 40, delay: 800, msg: 'Generating video clips…' },
      { progress: 70, delay: 900, msg: 'Assembling sequence…' },
      { progress: 90, delay: 600, msg: 'Finalizing…' },
    ]

    for (const step of steps) {
      await sleep(step.delay)
      await prisma.job.update({ where: { id: jobId }, data: { progress: step.progress } })
    }

    // Create a stub Asset so the frontend can treat it as a real timeline item
    const asset = await prisma.asset.create({
      data: {
        name:     `AI: ${prompt.slice(0, 40)}`,
        type:     'video',
        filename: '',                   // no real file for now
        url:      '',
        sizeMb:   0,
        durSec:   4,
        mimeType: 'video/mp4',
      },
    })

    await prisma.job.update({
      where: { id: jobId },
      data: {
        status:   'done',
        progress: 100,
        result:   {
          assetId: asset.id,
          name:    asset.name,
          durSec:  asset.durSec,
        },
      },
    })
  } catch (err) {
    await prisma.job.update({
      where:  { id: jobId },
      data:   { status: 'failed', error: err.message },
    }).catch(() => {})
  }
}

module.exports = { simulateExport, simulateGenerate }
