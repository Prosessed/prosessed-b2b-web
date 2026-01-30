"use server"

import type { AuthUser } from "./types"
import { clearAuthSession, setAuthSession } from "./storage"

/**
 * Set auth session cookie from client after login.
 * Keeps server-rendered pages (e.g. /quotes) in sync with client auth.
 */
export async function setAuthCookie(user: AuthUser): Promise<void> {
  await setAuthSession(user)
}

/**
 * Clear auth session cookie on logout.
 */
export async function clearAuthCookie(): Promise<void> {
  await clearAuthSession()
}
