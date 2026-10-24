
import axios from 'axios'

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  'http://localhost:8000/api'

// Protected API requests.
export const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Separate client for cookie-authentication endpoints.
// This avoids accidentally refreshing a request
// that is already trying to refresh authentication.
const authClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Memory only: none of these values is persisted.
let accessToken = null
let csrfToken = null
let csrfPromise = null
let refreshPromise = null
let sessionVersion = 0

function removeLegacyTokens() {
  localStorage.removeItem('opportune_access_token')
  localStorage.removeItem('opportune_refresh_token')
}

function notifySessionExpired() {
  window.dispatchEvent(
    new Event('opportune:session-expired')
  )
}

function isAuthUrl(url = '') {
  return /(^|\/)auth\//.test(url)
}

// -----------------------------------------
// CSRF bootstrap
// -----------------------------------------

async function getCsrfToken(force = false) {
  if (force) {
    csrfToken = null
  }

  if (csrfToken) {
    return csrfToken
  }

  if (!csrfPromise) {
    csrfPromise = authClient
      .get('/auth/cookie/csrf/')
      .then(({ data }) => {
        if (!data.csrfToken) {
          throw new Error('CSRF token was not returned')
        }

        csrfToken = data.csrfToken
        return csrfToken
      })
      .finally(() => {
        csrfPromise = null
      })
  }

  return csrfPromise
}

async function postWithCsrf(
  url,
  body = {},
  retryOnCsrfFailure = true
) {
  const token = await getCsrfToken()

  try {
    return await authClient.post(url, body, {
      headers: {
        'X-CSRFToken': token,
      },
    })
  } catch (error) {
    // A different browser tab might have rotated
    // the CSRF token. Fetch a new one and retry once.
    if (
      retryOnCsrfFailure &&
      error.response?.status === 403
    ) {
      const freshToken = await getCsrfToken(true)

      return authClient.post(url, body, {
        headers: {
          'X-CSRFToken': freshToken,
        },
      })
    }

    throw error
  }
}

// -----------------------------------------
// Restore / refresh the logged-in session
// -----------------------------------------

async function refreshAccessToken() {
  // Only one refresh operation per browser tab.
  if (!refreshPromise) {
    const version = sessionVersion

    refreshPromise = (async () => {
      const { data } = await postWithCsrf(
        '/auth/cookie/refresh/'
      )

      if (!data.access) {
        throw new Error(
          'Refresh endpoint returned no access token'
        )
      }

      // Do not restore a session that has changed
      // while this request was running.
      if (version !== sessionVersion) {
        throw new Error(
          'Session changed during token refresh'
        )
      }

      accessToken = data.access
      return accessToken
    })().finally(() => {
      refreshPromise = null
    })
  }

  return refreshPromise
}

export async function restoreSession() {
  // Remove the old browser-stored JWTs.
  removeLegacyTokens()

  try {
    await refreshAccessToken()
    return true
  } catch (error) {
    accessToken = null

    if (error.response?.status === 401) {
      return false
    }

    // Network errors should be distinguishable
    // from an expired or missing session.
    throw error
  }
}

// -----------------------------------------
// Login
// -----------------------------------------

export async function login(username, password) {
  // Avoid changing sessions while a refresh is active.
  if (refreshPromise) {
    await refreshPromise.catch(() => {})
  }

  const { data } = await postWithCsrf(
    '/auth/cookie/login/',
    {
      username,
      password,
    }
  )

  if (!data.access) {
    throw new Error('Login returned no access token')
  }

  sessionVersion += 1
  accessToken = data.access

  // Django rotates CSRF on successful login.
  csrfToken = data.csrfToken || null

  removeLegacyTokens()

  return data
}

// -----------------------------------------
// Logout
// -----------------------------------------

export async function logout() {
  // Let an in-progress refresh settle before revoking
  // the browser's latest refresh cookie.
  if (refreshPromise) {
    await refreshPromise.catch(() => {})
  }

  let revoked = false

  try {
    await postWithCsrf('/auth/cookie/logout/')
    revoked = true
  } catch (error) {
    console.warn(
      'Server-side logout could not be confirmed:',
      error.response?.status || error.message
    )
  } finally {
    sessionVersion += 1
    accessToken = null
    csrfToken = null
    removeLegacyTokens()
    notifySessionExpired()
  }

  return { revoked }
}

// -----------------------------------------
// Attach the in-memory access token
// -----------------------------------------

api.interceptors.request.use(
  (config) => {
    if (accessToken && !isAuthUrl(config.url)) {
      config.headers.Authorization =
        `Bearer ${accessToken}`
    }

    return config
  },
  (error) => Promise.reject(error)
)

// -----------------------------------------
// Automatically renew expired access tokens
// -----------------------------------------

api.interceptors.response.use(
  (response) => response,

  async (error) => {
    const originalRequest = error.config

    if (
      !originalRequest ||
      error.response?.status !== 401 ||
      originalRequest._retry ||
      isAuthUrl(originalRequest.url)
    ) {
      return Promise.reject(error)
    }

    originalRequest._retry = true

    try {
      // Another request may have already refreshed
      // the access token. Use it if it changed.
      const requestAuth =
        originalRequest.headers?.Authorization

      if (
        accessToken &&
        requestAuth &&
        requestAuth !== `Bearer ${accessToken}`
      ) {
        originalRequest.headers.Authorization =
          `Bearer ${accessToken}`

        return api(originalRequest)
      }

      const newAccess = await refreshAccessToken()

      originalRequest.headers.Authorization =
        `Bearer ${newAccess}`

      return api(originalRequest)

    } catch (refreshError) {
      // Only a confirmed rejected cookie session
      // should trigger automatic sign-out.
      if (refreshError.response?.status === 401) {
        sessionVersion += 1
        accessToken = null
        removeLegacyTokens()
        notifySessionExpired()
      }

      return Promise.reject(refreshError)
    }
  }
)
