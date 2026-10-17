import axios from 'axios'

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api'

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Attach the access token to authenticated requests.
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('opportune_access_token')

    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }

    console.log('[API request]', {
      method: config.method?.toUpperCase(),
      url: config.url,
      hasToken: Boolean(token),
    })

    return config
  },
  (error) => Promise.reject(error)
)

// Refresh expired access tokens when possible.
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      !originalRequest.url?.includes('/auth/token/') &&
      !originalRequest.url?.includes('/auth/register/')
    ) {
      const refreshToken = localStorage.getItem('opportune_refresh_token')

      if (refreshToken) {
        originalRequest._retry = true

        try {
          const response = await axios.post(
            `${API_BASE_URL}/auth/token/refresh/`,
            { refresh: refreshToken },
            {
              headers: {
                'Content-Type': 'application/json',
              },
            }
          )

          localStorage.setItem(
            'opportune_access_token',
            response.data.access
          )

          originalRequest.headers = originalRequest.headers || {}
          originalRequest.headers.Authorization =
            `Bearer ${response.data.access}`

          return api(originalRequest)
        } catch {
          logout()
        }
      }
    }

    return Promise.reject(error)
  }
)

// ========================================
// AUTHENTICATION
// ========================================

export const login = async (username, password) => {
  const response = await api.post('/auth/token/', {
    username,
    password,
  })

  localStorage.setItem(
    'opportune_access_token',
    response.data.access
  )

  if (response.data.refresh) {
    localStorage.setItem(
      'opportune_refresh_token',
      response.data.refresh
    )
  }

  return response.data
}

export const register = async (username, email, password) => {
  const response = await api.post('/auth/register/', {
    username,
    email,
    password,
  })

  return response.data
}

export const logout = () => {
  localStorage.removeItem('opportune_access_token')
  localStorage.removeItem('opportune_refresh_token')
}

// ========================================
// OPPORTUNITIES
// ========================================

export const getOpportunities = async () => {
  const response = await api.get('/opportunities/')
  return response.data
}

// Provide either a URL or pasted text.
export const extractOpportunity = async ({ url, text } = {}) => {
  const payload = url ? { url } : { text }

  const response = await api.post(
    '/opportunities/extract/',
    payload
  )

  return response.data
}

export const createOpportunity = async (opportunity) => {
  const response = await api.post(
    '/opportunities/',
    opportunity
  )

  return response.data
}

export const updateOpportunity = async (id, updates) => {
  const response = await api.patch(
    `/opportunities/${id}/`,
    updates
  )

  return response.data
}

export const deleteOpportunity = async (id) => {
  await api.delete(`/opportunities/${id}/`)
}

// ========================================
// EMAIL DEADLINE REMINDERS
// ========================================

// Get the current user's email reminder preferences.
export const getEmailReminderPreferences = async () => {
  const response = await api.get('/reminders/preferences/')
  return response.data
}

// Request a verification email for the registered account email.
export const requestEmailVerification = async () => {
  const response = await api.post(
    '/reminders/request-verification/'
  )

  return response.data
}

// Update reminder settings, such as enabled status and reminder days.
export const patchEmailReminderPreferences = async (payload) => {
  const response = await api.patch(
    '/reminders/preferences/',
    payload
  )

  return response.data
}

// Disconnect or disable email reminders for the current user.
export const disconnectEmailReminders = async () => {
  const response = await api.post('/reminders/disconnect/')
  return response.data
}

// Export the configured Axios instance for other API calls.
export default api


export async function verifyEmail(username, email, code) {
  const response = await api.post('/auth/verify-email/', {
    username,
    email,
    code,
  })

  return response.data
}

export async function resendVerificationCode(username, email) {
  const response = await api.post(
    '/auth/resend-verification/',
    {
      username,
      email,
    }
  )

  return response.data
}

