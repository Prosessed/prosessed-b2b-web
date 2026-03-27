import type { AuthUser } from "./types"

const AUTH_STORAGE_KEY = "prosessed_auth"
const SESSION_STORAGE_KEY = "prosessed_session"

export const authStorage = {
  getUser(): AuthUser | null {
    if (typeof window === "undefined") return null
    const stored = localStorage.getItem(AUTH_STORAGE_KEY)
    return stored ? JSON.parse(stored) : null
  },

  setUser(user: AuthUser) {
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user))
  },

  removeUser() {
    localStorage.removeItem(AUTH_STORAGE_KEY)
    localStorage.removeItem(SESSION_STORAGE_KEY)
  },

  getSession(): { sid: string } | null {
    const stored = localStorage.getItem(SESSION_STORAGE_KEY)
    return stored ? JSON.parse(stored) : null
  },

  setSession(sid: string) {
    localStorage.setItem(
      SESSION_STORAGE_KEY,
      JSON.stringify({ sid })
    )
  },

  isSessionValid(currentSid: string): boolean {
    const session = this.getSession()
    return session ? session.sid === currentSid : false
  },
}
