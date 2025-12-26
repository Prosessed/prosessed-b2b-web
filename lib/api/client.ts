import type { Company, LoginResponse } from "../auth/types" // Assuming these types are declared in a separate file

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || ""

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message)
    this.name = "ApiError"
  }
}

export const apiClient = {
  async getCompaniesByEmail(email: string): Promise<Company[]> {
    const params = new URLSearchParams({
      fields: '["*"]',
      filters: `[["email_id", "=", "${email}"]]`,
    })

    const response = await fetch(`${BASE_URL}/api/resource/All User Master?${params}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      throw new ApiError(response.status, `Failed to fetch companies: ${response.statusText}`)
    }

    const result = await response.json()
    const data = result.data || []

    return data.map((item: any) => ({
      company_name: item.company_name || "",
      company_url: item.company_url || "",
    }))
  },

  async login(email: string, password: string, companyUrl: string): Promise<LoginResponse> {
    const response = await fetch(`${companyUrl}/api/method/prosessed_orderit.api.login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        usr: email,
        pwd: password,
      }),
    })

    if (!response.ok) {
      throw new ApiError(response.status, "Invalid credentials")
    }

    const data: LoginResponse = await response.json()

    if (data.message.success_key !== 1) {
      throw new ApiError(401, data.message.message || "Authentication failed")
    }

    return data
  },
}
