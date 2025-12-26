export interface Company {
  company_name: string
  company_url: string
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
  usr: string
  pwd: string
}

export type AuthResponse = LoginResponse
