// Auth Feature Types

export interface AuthUser {
  email: string
  fullName: string
  username: string
  companyName: string
  apiKey: string
  apiSecret: string
  sid: string
  customerId: string
  isCustomer: boolean
  defaultWarehouse: string
  defaultPaymentTerm: string
  defaultCurrency: string
  companyUrl: string
  disablePriceEdit: boolean
  disableDiscountApply: boolean
}

export interface AuthCredentials {
  email: string
  password: string
  company_url: string
}

export interface AuthResponse {
  message: {
    success_key: number
    email: string
    username: string
    api_key: string
    api_secret: string
    sid: string
    customer_id: string
    is_customer: boolean
    default_warehouse: string
    default_payment_term: string
    default_currency: string
    company_custom_disable_price_edit: number
    company_custom_disable_discount_apply: number
  }
  full_name: string
}

export interface Company {
  company_name: string
  company_url: string
}

export interface OTPResponse {
  success: boolean
  message: string
}

export interface OTPVerifyResponse {
  success: boolean
  token: string
}
