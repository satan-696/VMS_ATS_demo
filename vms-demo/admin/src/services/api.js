import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api` : '/api'
})

export const getPendingApprovals = () => api.get('/approvals/pending')
export const approveVisit = (visitId) => api.post(`/approvals/${visitId}/approve`)
export const rejectVisit = (visitId) => api.post(`/approvals/${visitId}/reject`)
export const resetDemo = () => api.post('/demo/reset')
export const getStats = () => api.get('/stats')
export const getVisitLog = () => api.get('/visits')

export default api
