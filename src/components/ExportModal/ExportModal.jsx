import { useState } from 'react'
import './ExportModal.css'
import { useApp } from '../../context/AppContext'
import { startExport, waitForJob } from '../../api/jobs'
import { createProject } from '../../api/projects'

export default function ExportModal() {
  const { setShowExportModal, projectId, loadProjectData, projectName } = useApp()
  const [format, setFormat] = useState('mp4')
  const [resolution, setResolution] = useState('1080p')
  const [fps, setFps] = useState('24')
  const [quality, setQuality] = useState(80)
  const [filename, setFilename] = useState('Motionise_Final_Render')
  const [exporting, setExporting] = useState(false)
  const [progress, setProgress] = useState(0)
  const [downloadUrl, setDownloadUrl] = useState(null)
  const [error, setError] = useState(null)

  const simulateHostedExport = async () => {
    for (let p = 0; p <= 100; p += 10) {
      setProgress(p)
      await new Promise(resolve => setTimeout(resolve, 250))
    }
    const blob = new Blob([
      `Motionise placeholder export\nFile: ${filename}.${format}\nResolution: ${resolution}\nFPS: ${fps}\nQuality: ${quality}\n`,
    ], { type: 'text/plain' })
    setDownloadUrl(URL.createObjectURL(blob))
  }
  
  const handleRender = async () => {
    setExporting(true)
    setError(null)
    setDownloadUrl(null)
    setProgress(0)
    try {
      // Auto-create a project if none exists so export never silently fails
      let activeProjectId = projectId
      if (!activeProjectId || activeProjectId === 'local-demo') {
        const created = await createProject(projectName || 'Untitled Project')
        activeProjectId = created.id
        await loadProjectData(activeProjectId)
      }
      const job = await startExport(activeProjectId, { format, resolution, fps, quality: Number(quality), filename })
      const res = await waitForJob(job.id, p => setProgress(p))
      setDownloadUrl(res.result.url)
    } catch (err) {
      await simulateHostedExport()
      setError('Backend is not deployed yet, so this render was simulated in the browser.')
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="modal-backdrop" onClick={() => setShowExportModal(false)}>
      <div className="export-modal" onClick={e => e.stopPropagation()}>
        
        <div className="export-modal-header">
          <div className="export-modal-title">Export Project</div>
          <button className="export-modal-close" onClick={() => setShowExportModal(false)}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <div className="export-modal-body">
          <div className="export-preview-col">
            <div className="export-preview-screen">
              <div className="export-preview-center">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.3">
                  <polygon points="5 3 19 12 5 21 5 3"/>
                </svg>
              </div>
            </div>
            <div className="export-preview-info">
              <div className="export-info-row">
                <span>Duration</span>
                <span className="mono">00:00:18:00</span>
              </div>
              <div className="export-info-row">
                <span>Est. File Size</span>
                <span className="mono">{(quality * 1.5).toFixed(1)} MB</span>
              </div>
            </div>
          </div>

          <div className="export-settings-col">
            
            <div className="export-field">
              <label>File Name</label>
              <input 
                type="text" 
                className="export-input" 
                value={filename} 
                onChange={e => setFilename(e.target.value)} 
              />
            </div>

            <div className="export-field">
              <label>Location</label>
              <div className="export-location-wrap">
                <input 
                  type="text" 
                  className="export-input" 
                  value="~/Documents/Motionise/Exports" 
                  readOnly 
                />
                <button className="export-btn-secondary">Browse…</button>
              </div>
            </div>

            <div className="export-section-title">Video Settings</div>
            
            <div className="export-field-row">
              <div className="export-field">
                <label>Format</label>
                <select className="export-select" value={format} onChange={e => setFormat(e.target.value)}>
                  <option value="mp4">H.264 (MP4)</option>
                  <option value="prores">Apple ProRes 422</option>
                  <option value="webm">WebM</option>
                  <option value="gif">Animated GIF</option>
                </select>
              </div>
              <div className="export-field">
                <label>Resolution</label>
                <select className="export-select" value={resolution} onChange={e => setResolution(e.target.value)}>
                  <option value="4k">3840 × 2160 (4K)</option>
                  <option value="1080p">1920 × 1080 (HD)</option>
                  <option value="720p">1280 × 720 (HD)</option>
                  <option value="1080x1920">1080 × 1920 (Vertical)</option>
                </select>
              </div>
            </div>

            <div className="export-field-row">
              <div className="export-field">
                <label>Frame Rate</label>
                <select className="export-select" value={fps} onChange={e => setFps(e.target.value)}>
                  <option value="23.976">23.976 fps</option>
                  <option value="24">24 fps</option>
                  <option value="25">25 fps</option>
                  <option value="29.97">29.97 fps</option>
                  <option value="30">30 fps</option>
                  <option value="60">60 fps</option>
                </select>
              </div>
              <div className="export-field">
                <label>Quality</label>
                <div className="export-slider-wrap">
                  <input 
                    type="range" 
                    min="10" max="100" 
                    value={quality} 
                    onChange={e => setQuality(e.target.value)} 
                    className="export-range"
                  />
                  <span className="export-quality-val">{quality}</span>
                </div>
              </div>
            </div>

            <div className="export-section-title" style={{ marginTop: 20 }}>Audio Settings</div>
            <div className="export-field">
              <label className="export-checkbox-label">
                <input type="checkbox" defaultChecked />
                Export Audio
              </label>
            </div>
            <div className="export-field-row" style={{ marginTop: 12 }}>
              <div className="export-field">
                <label>Audio Codec</label>
                <select className="export-select">
                  <option>AAC</option>
                  <option>WAV (Uncompressed)</option>
                </select>
              </div>
              <div className="export-field">
                <label>Sample Rate</label>
                <select className="export-select">
                  <option>48000 Hz</option>
                  <option>44100 Hz</option>
                </select>
              </div>
            </div>

          </div>
        </div>

        <div className="export-modal-footer">
          {error && <span style={{ color: 'var(--red)', marginRight: 'auto', fontSize: 12 }}>{error}</span>}
          {exporting && <span style={{ marginRight: 'auto', fontSize: 12, color: 'var(--text-muted)' }}>Rendering... {progress}%</span>}
          {downloadUrl && !exporting && (
            <a href={downloadUrl} download style={{ marginRight: 'auto', fontSize: 12, color: 'var(--blue)', textDecoration: 'none' }}>
              Download Result
            </a>
          )}
          <button className="export-btn-ghost" onClick={() => setShowExportModal(false)}>Close</button>
          <button className="export-btn-primary" onClick={handleRender} disabled={exporting}>
            {exporting ? 'Rendering…' : 'Render'}
          </button>
        </div>

      </div>
    </div>
  )
}
