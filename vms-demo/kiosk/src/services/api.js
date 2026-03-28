import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api` : '/api'
})

export const sendOTP = (uid) => api.post('/aadhaar/send-otp', { uid })
export const verifyOTP = (uid, otp, referenceId) => api.post('/aadhaar/verify-otp', { uid, otp, referenceId })
export const registerVisit = (data) => api.post('/visitors/register', data)
export const getVisitStatus = (visitId) => api.get(`/visits/${visitId}/status`)

export default api
