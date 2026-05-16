import { api } from './client'

export const listAssets  = ()    => api.get('/api/assets')
export const deleteAsset = (id)  => api.del(`/api/assets/${id}`)

// Multipart upload — can't use the json client for this
export async function uploadAsset(file, onProgress) {
  const form = new FormData()
  form.append('file', file)

  return new Promise((resolve, reject) => {
    const fallback = () => {
      if (onProgress) onProgress(100)
      const type = file.type.startsWith('video/')
        ? 'video'
        : file.type.startsWith('audio/')
          ? 'audio'
          : 'image'
      resolve({
        id: `local_${Date.now()}`,
        name: file.name,
        type,
        filename: file.name,
        url: URL.createObjectURL(file),
        sizeMb: +(file.size / (1024 * 1024)).toFixed(2),
        durSec: type === 'image' ? 5 : 0,
        mimeType: file.type || 'application/octet-stream',
        dur: type === 'image' ? '0:05' : '0:00',
        size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
        localOnly: true,
      })
    }

    const xhr = new XMLHttpRequest()
    xhr.open('POST', '/api/assets')

    if (onProgress) {
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100))
      }
    }

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try { resolve(JSON.parse(xhr.responseText)) }
        catch { resolve({}) }
      } else {
        let msg = `Upload failed (${xhr.status})`
        try { msg = JSON.parse(xhr.responseText).error || msg } catch (_) {}
        if (xhr.status === 404 || xhr.status === 405) fallback()
        else reject(new Error(msg))
      }
    }

    xhr.onerror = fallback
    xhr.send(form)
  })
}
