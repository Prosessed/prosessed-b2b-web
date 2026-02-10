// Products Feature Types

export interface Product {
  item_code: string
  item_name: string
  rate: number
  price_list_rate?: number
  image?: string
  item_group?: string
  uom?: string
  stock?: number
  brand?: string
}

export interface ProductTag {
  type: 'hot-deal' | 'best-seller' | 'new' | 'limited'
  discount?: number
}

export interface ProductFilters {
  item_group?: string
  page?: number
  page_size?: number
  search_term?: string
  is_search?: boolean
  sortByQty?: 'asc' | 'desc'
  filterByBrand?: string | string[]
  inStockOnly?: boolean
  qty?: number
}

export interface SearchResult {
  items: Product[]
  categories?: Array<{ label: string }>
  brands?: Array<{ label: string }>
  pagination?: {
    total_records: number
    current_page: number
    page_size: number
  }
}
