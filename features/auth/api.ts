// Auth Feature API
// All authentication-related API calls

import type { AuthCredentials, AuthResponse, Company, OTPResponse, OTPVerifyResponse } from './types'

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "https://internal.prosessed.com"

/**
 * Fetch all companies for a given email
 */
export async function getCompaniesByEmail(email: string): Promise<Company[]> {
  try {
    const params = new URLSearchParams({
      fields: '["*"]',
      filters: JSON.stringify([["email_id", "=", email]]),
    })

    const response = await fetch(`${BASE_URL}/api/resource/All User Master?${params}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch companies: ${response.statusText}`)
    }

    const result = await response.json()
    const data = result.data || []

    return data.map((item: any) => ({
      company_name: item.company_name || "",
      company_url: item.company_url || "",
    }))
  } catch (error) {
    console.error("[Auth API] getCompaniesByEmail error:", error)
    throw error
  }
}

/**
 * Login with email and password
 */
export async function login(credentials: AuthCredentials): Promise<AuthResponse> {
  try {
    const response = await fetch(`${BASE_URL}/api/method/prosessed_orderit.api.login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(credentials),
    })

    if (!response.ok) {
      throw new Error(`Authentication failed: ${response.statusText}`)
    }

    const data = await response.json()

    if (data.message?.success_key !== 1) {
      throw new Error(data.message?.message || "Authentication failed")
    }

    return data
  } catch (error) {
    console.error("[Auth API] login error:", error)
    throw error
  }
}

/**
 * Request OTP for password reset
 */
export async function requestOTP(email: string): Promise<OTPResponse> {
  try {
    const response = await fetch(`${BASE_URL}/api/method/prosessed_orderit.api.send_otp`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email }),
    })

    if (!response.ok) {
      throw new Error(`Failed to send OTP: ${response.statusText}`)
    }

    const data = await response.json()

    if (data.message?.success_key !== 1) {
      throw new Error(data.message?.message || "Failed to send OTP")
    }

    return { success: true, message: "OTP sent successfully" }
  } catch (error) {
    console.error("[Auth API] requestOTP error:", error)
    throw error
  }
}

/**
 * Verify OTP sent to user email
 */
export async function verifyOTP(email: string, otp: string): Promise<OTPVerifyResponse> {
  try {
    const response = await fetch(`${BASE_URL}/api/method/prosessed_orderit.api.verify_otp`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, otp }),
    })

    if (!response.ok) {
      throw new Error(`Failed to verify OTP: ${response.statusText}`)
    }

    const data = await response.json()

    if (data.message?.success_key !== 1) {
      throw new Error(data.message?.message || "Invalid OTP")
    }

    return {
      success: true,
      token: data.message?.token || "",
    }
  } catch (error) {
    console.error("[Auth API] verifyOTP error:", error)
    throw error
  }
}

/**
 * Reset password using token from OTP verification
 */
export async function resetPassword(
  email: string,
  token: string,
  newPassword: string
): Promise<OTPResponse> {
  try {
    const response = await fetch(`${BASE_URL}/api/method/prosessed_orderit.api.reset_password`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, token, new_password: newPassword }),
    })

    if (!response.ok) {
      throw new Error(`Failed to reset password: ${response.statusText}`)
    }

    const data = await response.json()

    if (data.message?.success_key !== 1) {
      throw new Error(data.message?.message || "Failed to reset password")
    }

    return { success: true, message: "Password reset successfully" }
  } catch (error) {
    console.error("[Auth API] resetPassword error:", error)
    throw error
  }
}
