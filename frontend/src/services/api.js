
import axios from 'axios'

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  'http://127.0.0.1:8000/api'

const ACCESS_KEY = 'opportune_access_token'
const REFRESH_KEY = 'opportune_refresh_token'

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Prevent multiple requests in the same browser tab
// from simultaneously rotating the same refresh token.
let refreshInFlight = null

function clearStoredSession() {
  localStorage.removeItem(ACCESS_KEY)
  localStorage.removeItem(REFRESH_KEY)
}

function notifySessionExpired() {
  window.dispatchEvent(
    new Event('opportune:session-expired')
  )
}

// Attach the current access token.
api.interceptors.request.use(
  (config) => {
    const accessToken = localStorage.getItem(ACCESS_KEY)

    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`
    }

    return config
  },
  (error) => Promise.reject(error)
)

// Refresh an expired access token.
// When rotation is enabled, save BOTH returned tokens.
async function renewAccessToken() {
  if (!refreshInFlight) {
    refreshInFlight = (async () => {
      const oldRefresh = localStorage.getItem(REFRESH_KEY)

      if (!oldRefresh) {
        throw new Error('No refresh token available')
      }

      // Use plain axios to avoid interceptor recursion.
      const response = await axios.post(
        `${API_BASE_URL}/auth/token/refresh/`,
        { refresh: oldRefresh },
        { timeout: 15000 }
      )

      const { access, refresh } = response.data

      if (!access) {
        throw new Error('Refresh response missing access token')
      }

      // Do not restore an old session after logout
      // or overwrite a different, newly signed-in session.
      if (localStorage.getItem(REFRESH_KEY) !== oldRefresh) {
        throw new Error('Session changed during refresh')
      }

      localStorage.setItem(ACCESS_KEY, access)

      // With rotation enabled, Django returns a new
      // refresh token. Save it immediately.
      if (refresh) {
        localStorage.setItem(REFRESH_KEY, refresh)
      }

      return access
    })().finally(() => {
      refreshInFlight = null
    })
  }

  return refreshInFlight
}

// Retry protected requests once after refreshing.
api.interceptors.response.use(
  (response) => response,

  async (error) => {
    const originalRequest = error.config

    if (!originalRequest) {
      return Promise.reject(error)
    }

    const isUnauthorized = error.response?.status === 401

    const isAuthEndpoint =
      originalRequest.url?.includes('/auth/') || false

    if (
      !isUnauthorized ||
      originalRequest._retry ||
      isAuthEndpoint
    ) {
      return Promise.reject(error)
    }

    originalRequest._retry = true

    const refreshBeforeRetry =
      localStorage.getItem(REFRESH_KEY)

    try {
      const currentAccess =
        localStorage.getItem(ACCESS_KEY)

      const requestAccess =
        originalRequest.headers?.Authorization

      // Another request might already have refreshed
      // our access token. Try that token first.
      if (
        currentAccess &&
        requestAccess &&
        requestAccess !== `Bearer ${currentAccess}`
      ) {
        originalRequest.headers.Authorization =
          `Bearer ${currentAccess}`

        return await api(originalRequest)
      }

      const newAccess = await renewAccessToken()

      originalRequest.headers.Authorization =
        `Bearer ${newAccess}`

      return await api(originalRequest)

    } catch (refreshError) {
      // Do not clear a different session that may have
      // replaced this one while refresh was running.
      if (
        localStorage.getItem(REFRESH_KEY) ===
        refreshBeforeRetry
      ) {
        clearStoredSession()
        notifySessionExpired()
      }

      return Promise.reject(refreshError)
    }
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


export async function logout() {
  const refreshToken =
    localStorage.getItem('opportune_refresh_token')

  // End the browser session immediately.
  localStorage.removeItem('opportune_access_token')
  localStorage.removeItem('opportune_refresh_token')

  if (!refreshToken) {
    return { revoked: false, reason: 'no_refresh_token' }
  }

  try {
    // Plain axios: no access token or refresh interceptor.
    await axios.post(
      `${API_BASE_URL}/auth/logout/`,
      { refresh: refreshToken },
      {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 15000,
      }
    )

    return { revoked: true }

  } catch (error) {
    // The local session is cleared, but remote revocation
    // may not have succeeded (e.g. network failure).
    console.warn(
      'Logout revocation could not be confirmed:',
      error.response?.status || error.message
    )

    return {
      revoked: false,
      reason: 'revocation_unconfirmed',
    }
  }
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


export async function getReminderPreferences() {
  const response = await api.get('/reminders/preferences/')
  return response.data
}

export async function updateReminderPreferences(data) {
  const response = await api.patch('/reminders/preferences/', data)
  return response.data
}

export async function requestReminderVerification(email) {
  const response = await api.post(
    '/reminders/request-verification/',
    { email }
  )
  return response.data
}

export async function verifyReminderEmail(email, code) {
  const response = await api.post('/reminders/verify/', {
    email,
    code,
  })
  return response.data
}

export async function disconnectReminderEmail() {
  const response = await api.post('/reminders/disconnect/')
  return response.data
}


export async function requestPasswordReset(email) {
  const response = await api.post(
    '/auth/password-reset/request/',
    { email }
  )

  return response.data
}

export async function confirmPasswordReset(
  uid,
  token,
  newPassword
) {
  const response = await api.post(
    '/auth/password-reset/confirm/',
    {
      uid,
      token,
      new_password: newPassword,
    }
  )

  return response.data
}

