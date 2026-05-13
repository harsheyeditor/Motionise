// Thin fetch wrapper — all API calls go through here.
// In dev, Vite proxies /api → localhost:3001, so no CORS headers needed.

async function request(method, path, body) {
  const opts = { method, headers: {} }

  if (body !== undefined) {
    opts.headers['Content-Type'] = 'application/json'
    opts.body = JSON.stringify(body)
  }

  const res = await fetch(path, opts)

  if (!res.ok) {
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
