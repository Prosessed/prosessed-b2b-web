export interface Company {
  company_name: string
  company_url: string
}

export interface AuthUser {
  sid: string
  apiKey: string
  apiSecret: string
  username: string
  email: string
  customerId: string
  fullName: string
  defaultWarehouse?: string
  defaultPaymentTerm?: string
  defaultCurrency?: string
}

export interface LoginResponse {
  message: {
    success_key: number
    message: string
    sid: string
    api_key: string
    api_secret: string
    username: string
    email: string
    sales_person: string | null
    role_profile: string
    employee_id: string | null
    default_warehouse: string
    default_payment_term: string
    default_currency: string
    company_custom_disable_price_edit: number
    company_custom_disable_discount_apply: number
    is_customer: boolean
    customer_id: string
  }
  home_page: string
  full_name: string
}
