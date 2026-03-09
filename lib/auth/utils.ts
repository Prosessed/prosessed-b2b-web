import type { AuthUser, Company, LoginResponse } from "./types"

export function mapLoginResponseToAuthUser(
  response: LoginResponse,
  company: Company
): AuthUser {
  const m = response.message
  const fullName =
    response.full_name && response.full_name.trim().length > 0
      ? response.full_name
      : m.username || m.email
  return {
    email: m.email,
    fullName,
    username: m.username,
    companyName: m.company ?? company.company_name,
    salesPerson: m.sales_person ?? "",
    apiKey: m.api_key,
    apiSecret: m.api_secret,
    sid: m.sid,
    customerId: m.customer_id,
    isCustomer: m.is_customer,
    defaultWarehouse: m.default_warehouse,
    defaultPaymentTerm: m.default_payment_term,
    defaultCurrency: m.default_currency,
    companyUrl: company.company_url,
    disablePriceEdit: m.company_custom_disable_price_edit === 1,
    disableDiscountApply: m.company_custom_disable_discount_apply === 1,
  }
}
