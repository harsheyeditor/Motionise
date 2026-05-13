import { api } from './client'

export const startExport   = (projectId, settings) =>
  api.post('/api/jobs/export',   { projectId, ...settings })

export const startGenerate = (projectId, prompt)   =>
  api.post('/api/jobs/generate', { projectId, prompt })

export const pollJob = (jobId) => api.get(`/api/jobs/${jobId}`)

// Polls a job until it reaches done/failed, calling onProgress on each tick.
export async function waitForJob(jobId, onProgress, intervalMs = 1000) {
  return new Promise((resolve, reject) => {
    const iv = setInterval(async () => {
      try {
        const job = await pollJob(jobId)
        if (onProgress) onProgress(job.progress)
        if (job.status === 'done')   { clearInterval(iv); resolve(job) }
        if (job.status === 'failed') { clearInterval(iv); reject(new Error(job.error || 'Job failed')) }
      } catch (err) { clearInterval(iv); reject(err) }
    }, intervalMs)
  })
}
