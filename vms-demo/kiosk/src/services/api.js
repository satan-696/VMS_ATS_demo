import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api` : '/api'
})

// Aadhaar Flow (Legacy OTP)
export const sendOTP = (uid) => api.post('/aadhaar/send-otp', { uid })
export const verifyOTP = (uid, otp, referenceId) => api.post('/aadhaar/verify-otp', { uid, otp, referenceId })

// Aadhaar Flow (New OVSE v4)
export const initializeOVSE = (data) => api.post('/aadhaar/ovse/initialize', data)
export const getOVSEStatus = (clientId) => api.get(`/aadhaar/ovse/status/${clientId}`)
export const getOVSEResult = (clientId) => api.get(`/aadhaar/ovse/result/${clientId}`)

// Aadhaar Flow (DigiLocker)
export const initializeDigiLocker = (data) => api.post('/aadhaar/digilocker/initialize', data)
export const getDigiLockerStatus = (clientId) => api.get(`/aadhaar/digilocker/status/${clientId}`)
export const getDigiLockerResult = (clientId) => api.get(`/aadhaar/digilocker/result/${clientId}`)

// Aadhaar Flow (Manual OTP Relay)
export const initiateManualOTP = (data) => api.post('/aadhaar/manual-otp/initiate', data)
export const submitManualOTP = (visitId, otp) => api.post('/aadhaar/manual-otp/submit', { visit_id: visitId, otp })
export const getManualOTPStatus = (visitId) => api.get(`/aadhaar/manual-otp/status/${visitId}`)

// Registration
export const registerVisit = (data) => api.post('/visitors/register', data)
export const registerManualDocument = (formData) => {
  // formData is a FormData object containing document images and live_photo_base64
  return api.post('/visitors/manual-document', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
}

// Status & Stats
export const getVisitStatus = (visitId) => api.get(`/visits/${visitId}/status`)
export const getStats = () => api.get('/stats')

export default api
