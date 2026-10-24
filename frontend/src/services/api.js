
import {
  api,
  login as cookieLogin,
  logout as cookieLogout,
  restoreSession,
} from './session'

// ========================================
// SESSION RESTORATION
// ========================================

export { restoreSession }

// ========================================
// AUTHENTICATION
// ========================================

// Login using username/email and password.
// The session manager handles access tokens
// and HttpOnly refresh cookies.
export async function login(username, password) {
  return cookieLogin(username, password)
}

// Register a new account.
export async function register(username, email, password) {
  const response = await api.post('/auth/register/', {
    username,
    email,
    password,
  })

  return response.data
}

// Logout and revoke the refresh token.
export async function logout() {
  return cookieLogout()
}

// Verify account email using a six-digit code.
export async function verifyEmail(username, email, code) {
  const response = await api.post(
    '/auth/verify-email/',
    {
      username,
      email,
      code,
    }
  )

  return response.data
}

// Request another account verification code.
export async function resendVerificationCode(
  username,
  email
) {
  const response = await api.post(
    '/auth/resend-verification/',
    {
      username,
      email,
    }
  )

  return response.data
}

// ========================================
// PASSWORD RESET
// ========================================

// Request a password reset email.
export async function requestPasswordReset(email) {
  const response = await api.post(
    '/auth/password-reset/request/',
    { email }
  )

  return response.data
}

// Confirm password reset with new password.
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

// ========================================
// OPPORTUNITIES
// ========================================

// Get opportunities belonging to the user.
export async function getOpportunities() {
  const response = await api.get('/opportunities/')

  return response.data
}

// Extract opportunity details from URL or text.
export async function extractOpportunity({
  url,
  text,
} = {}) {
  const payload = url ? { url } : { text }

  const response = await api.post(
    '/opportunities/extract/',
    payload
  )

  return response.data
}

// Save a new opportunity.
export async function createOpportunity(opportunity) {
  const response = await api.post(
    '/opportunities/',
    opportunity
  )

  return response.data
}

// Update an existing opportunity.
export async function updateOpportunity(id, updates) {
  const response = await api.patch(
    `/opportunities/${id}/`,
    updates
  )

  return response.data
}

// Delete an opportunity.
export async function deleteOpportunity(id) {
  await api.delete(`/opportunities/${id}/`)
}

// ========================================
// EMAIL DEADLINE REMINDERS
// ========================================

// Get reminder preferences.
export async function getEmailReminderPreferences() {
  const response = await api.get(
    '/reminders/preferences/'
  )

  return response.data
}

// Request verification for the saved email.
export async function requestEmailVerification() {
  const response = await api.post(
    '/reminders/request-verification/'
  )

  return response.data
}

// Update reminder preferences.
export async function patchEmailReminderPreferences(
  payload
) {
  const response = await api.patch(
    '/reminders/preferences/',
    payload
  )

  return response.data
}

// Disconnect email reminders.
export async function disconnectEmailReminders() {
  const response = await api.post(
    '/reminders/disconnect/'
  )

  return response.data
}

// ========================================
// REMINDER SETTINGS
// ========================================

// Get all current reminder preferences.
export async function getReminderPreferences() {
  const response = await api.get(
    '/reminders/preferences/'
  )

  return response.data
}

// Update reminder preferences.
export async function updateReminderPreferences(data) {
  const response = await api.patch(
    '/reminders/preferences/',
    data
  )

  return response.data
}

// Request a verification code for a reminder email.
export async function requestReminderVerification(email) {
  const response = await api.post(
    '/reminders/request-verification/',
    { email }
  )

  return response.data
}

// Verify a reminder email with a six-digit code.
export async function verifyReminderEmail(email, code) {
  const response = await api.post(
    '/reminders/verify/',
    {
      email,
      code,
    }
  )

  return response.data
}

// Disconnect the reminder email.
export async function disconnectReminderEmail() {
  const response = await api.post(
    '/reminders/disconnect/'
  )

  return response.data
}

// ========================================
// DEFAULT EXPORT
// ========================================

// Reuse the cookie-aware Axios instance
// in any component that needs direct API calls.
export default api
