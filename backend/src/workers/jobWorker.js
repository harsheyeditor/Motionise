// In-process job workers — simulates progress without a real queue.
// Phase 4.5: replace bodies with real FFmpeg / AI provider calls.
const fs     = require('fs')
const path   = require('path')
const { prisma } = require('../db')

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// ── Export simulation ──────────────────────────────────────
// Ticks progress 0→100 over ~8 seconds, then writes a placeholder file.
async function simulateExport(jobId, filename = 'export') {
  try {
    await prisma.job.update({ where: { id: jobId }, data: { status: 'running', progress: 0 } })

    for (let p = 5; p <= 95; p += 5) {
      await sleep(400)
      await prisma.job.update({ where: { id: jobId }, data: { progress: p } })
    }

    // Write placeholder file
    const outDir  = path.resolve(__dirname, '../../uploads/exports')
    fs.mkdirSync(outDir, { recursive: true })
    const outFile = `${filename.replace(/[^a-zA-Z0-9._-]/g, '_')}_${jobId}.mp4`
    const outPath = path.join(outDir, outFile)
    // 4-byte MP4 placeholder so the browser can download something
    fs.writeFileSync(outPath, Buffer.from([0x00, 0x00, 0x00, 0x08, 0x66, 0x74, 0x79, 0x70]))

    await prisma.job.update({
      where: { id: jobId },
      data: {
        status:   'done',
        progress: 100,
        result:   { url: `/uploads/exports/${outFile}`, filename: outFile },
      },
    })
  } catch (err) {
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
