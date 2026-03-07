import axios from 'axios'

// Base URL can be overridden by environment-specific tooling (Vite, Expo, etc.)
const DEFAULT_BASE_URL =
  (typeof process !== 'undefined' && process.env.API_URL) ||
  'http://localhost:3001/api/v1'

export const api = axios.create({
  baseURL: DEFAULT_BASE_URL,
  withCredentials: false,
})

export function setAuthToken(token: string | null) {
  if (token) {
    api.defaults.headers.common.Authorization = `Bearer ${token}`
  } else {
    delete api.defaults.headers.common.Authorization
  }
}

