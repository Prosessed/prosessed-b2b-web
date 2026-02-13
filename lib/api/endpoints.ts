export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "https://internal.prosessed.com"

export const endpoints = {
  // Products
  products: {
    list: `${API_BASE_URL}/products`,
    detail: (id: string) => `${API_BASE_URL}/products/${id}`,
    search: `${API_BASE_URL}/products/search`,
    byCategory: (category: string) => `${API_BASE_URL}/products?category=${category}`,
  },

  // Orders
  orders: {
    list: `${API_BASE_URL}/orders`,
    detail: (id: string) => `${API_BASE_URL}/orders/${id}`,
    create: `${API_BASE_URL}/orders`,
  },

  // Quotes
  quotes: {
    list: `${API_BASE_URL}/quotes`,
    detail: (id: string) => `${API_BASE_URL}/quotes/${id}`,
    create: `${API_BASE_URL}/quotes`,
  },

  // Cart
  cart: {
    get: `${API_BASE_URL}/cart`,
    add: `${API_BASE_URL}/cart/add`,
    update: `${API_BASE_URL}/cart/update`,
    remove: `${API_BASE_URL}/cart/remove`,
  },

  // Auth
  auth: {
    login: `${API_BASE_URL}/auth/login`,
    logout: `${API_BASE_URL}/auth/logout`,
    register: `${API_BASE_URL}/auth/register`,
    profile: `${API_BASE_URL}/auth/profile`,
  },

  // Statements
  statements: {
    getUrl: `${API_BASE_URL}/api/method/prosessed_orderit.orderit.get_customer_statement_url`,
  },
}
