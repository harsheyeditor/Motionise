import { api } from './client'

export const listProjects  = ()           => api.get('/api/projects')
export const getProject    = (id)         => api.get(`/api/projects/${id}`)
export const createProject = (name)       => api.post('/api/projects', { name })
export const saveProject   = (id, state)  => api.put(`/api/projects/${id}`, state)
export const deleteProject = (id)         => api.del(`/api/projects/${id}`)
