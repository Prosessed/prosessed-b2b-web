// Auth Feature Hooks
// React hooks for authentication functionality

"use client"

import { useAuth } from "@/lib/auth/context"
import { useCallback, useState } from "react"
import * as authApi from "./api"

/**
 * Hook to manage login flow
 */
export function useLogin() {
  const { login } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loginUser = useCallback(
    async (email: string, password: string, companyUrl: string) => {
      setIsLoading(true)
      setError(null)

      try {
        const response = await authApi.login({
          email,
          password,
          company_url: companyUrl,
        })

        return response
      } catch (err: any) {
        const errorMsg = err.message || "Login failed"
        setError(errorMsg)
        throw err
      } finally {
        setIsLoading(false)
      }
    },
    []
  )

  return { loginUser, isLoading, error }
}

/**
 * Hook to manage forgot password flow
 */
export function useForgotPassword() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const requestOtp = useCallback(async (email: string) => {
    setIsLoading(true)
    setError(null)

    try {
      const result = await authApi.requestOTP(email)
      return result
    } catch (err: any) {
      const errorMsg = err.message || "Failed to send OTP"
      setError(errorMsg)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [])

  const verifyOtp = useCallback(async (email: string, otp: string) => {
    setIsLoading(true)
    setError(null)

    try {
      const result = await authApi.verifyOTP(email, otp)
      return result
    } catch (err: any) {
      const errorMsg = err.message || "Invalid OTP"
      setError(errorMsg)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [])

  const resetPassword = useCallback(async (email: string, token: string, newPassword: string) => {
    setIsLoading(true)
    setError(null)

    try {
      const result = await authApi.resetPassword(email, token, newPassword)
      return result
    } catch (err: any) {
      const errorMsg = err.message || "Failed to reset password"
      setError(errorMsg)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [])

  return { requestOtp, verifyOtp, resetPassword, isLoading, error }
}

/**
 * Hook to fetch companies by email
 */
export function useCompaniesByEmail(email: string) {
  const [companies, setCompanies] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchCompanies = useCallback(async () => {
    if (!email) return

    setIsLoading(true)
    setError(null)

    try {
      const result = await authApi.getCompaniesByEmail(email)
      setCompanies(result)
      return result
    } catch (err: any) {
      const errorMsg = err.message || "Failed to fetch companies"
      setError(errorMsg)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [email])

  return { companies, isLoading, error, fetchCompanies }
}
