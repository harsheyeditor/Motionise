// Thin fetch wrapper — all API calls go through here.
// In dev, Vite proxies /api → localhost:3001, so no CORS headers needed.

async function request(method, path, body) {
  const token = localStorage.getItem('motionise_token')
  const opts = { 
    method, 
    headers: {
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    } 
  }

  if (body !== undefined) {
    opts.headers['Content-Type'] = 'application/json'
    opts.body = JSON.stringify(body)
  }

  const res = await fetch(path, opts)

  if (!res.ok) {
    if (res.status === 401) {
      // Clear token and force re-login if unauthorized
      localStorage.removeItem('motionise_token')
      localStorage.removeItem('motionise_user')
      window.dispatchEvent(new Event('auth_changed'))
    }
    let msg = `HTTP ${res.status}`
    try { const j = await res.json(); msg = j.error || j.message || msg } catch (_) {}
    const err = new Error(msg)
    err.status = res.status
    throw err
  }

  return res.json()
}

export const api = {
  get:  (path)        => request('GET',    path),
  post: (path, body)  => request('POST',   path, body),
  put:  (path, body)  => request('PUT',    path, body),
  del:  (path)        => request('DELETE', path),
}
