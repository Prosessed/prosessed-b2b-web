"use client"

import { useState, useMemo, useEffect, useRef, useCallback } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { ProductCard } from "@/components/product-card"
import { SkeletonCard } from "@/components/skeleton-card"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Card } from "@/components/ui/card"
import { useItems, useMostBoughtItems, useSearch } from "@/lib/api/hooks"
import { useItemGroupTree } from "@/hooks/useItemGroupTree"
import { motion, AnimatePresence } from "framer-motion"
import { Filter, X, Loader2 } from "lucide-react"

// Helper to flatten all categories from tree
const getAllCategories = (tree: any[]): string[] => {
  const categories: string[] = []
  
  const traverse = (nodes: any[]) => {
    for (const node of nodes) {
      if (node.value && node.value !== "All Item Groups") {
        categories.push(node.value)
      }
      if (node.children && Array.isArray(node.children)) {
        traverse(node.children)
      }
    }
  }
  
  if (tree.length > 0 && tree[0].children) {
    traverse(tree[0].children)
  }
  
  return categories
}

export default function ProductsPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const categoryFromUrl = searchParams.get("category") || undefined
  const searchQuery = searchParams.get("search") || undefined
  const previouslyBoughtParam = searchParams.get("previously_bought")
  const isPreviouslyBought = previouslyBoughtParam === "true"
  // Use most-bought API only when no filter is selected; any category/brand/search → use items vtwo API
  const effectivePreviouslyBought = isPreviouslyBought && !categoryFromUrl && !searchQuery
  
  // Read filter state from URL params
  const brandsFromUrl = searchParams.get("brands")
  const sortFromUrl = searchParams.get("sort")
  
  const observerTarget = useRef<HTMLDivElement>(null)

  // Initialize state from URL params
  type SortByType = "relevance" | "price-low" | "price-high" | "qty-desc"
  const [sortBy, setSortBy] = useState<SortByType>(() => {
    if (sortFromUrl && ["relevance", "price-low", "price-high", "qty-desc"].includes(sortFromUrl)) {
      return sortFromUrl as SortByType
    }
    return "relevance"
  })
  const [selectedBrands, setSelectedBrands] = useState<string[]>(() => {
    if (brandsFromUrl) {
      try {
        return brandsFromUrl.split(",").filter(Boolean)
      } catch {
        return []
      }
    }
    return []
  })
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false)
  const [allProducts, setAllProducts] = useState<any[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [isCategoryChanging, setIsCategoryChanging] = useState(false)
  const isResettingRef = useRef(false)
  const prevFiltersRef = useRef<string>("")

  const pageSize = 20

  // Get categories from API
  const { data: categoryTree } = useItemGroupTree(false)
  const allCategories = useMemo(() => getAllCategories(categoryTree || []), [categoryTree])

  // When opening Products from nav (no params), show most bought items so user can start from there
  useEffect(() => {
    if (categoryFromUrl || searchQuery || isPreviouslyBought) return
    router.replace("/products?previously_bought=true", { scroll: false })
  }, [categoryFromUrl, searchQuery, isPreviouslyBought, router])

  // Map sortBy to API sortByQty
  const sortByQty = useMemo(() => {
    if (sortBy === "qty-desc") return "desc"
    if (sortBy === "price-low" || sortBy === "price-high") return "asc"
    return "asc"
  }, [sortBy])

  // Search results
  const { data: searchData, isLoading: searchLoading, isValidating: searchValidating, error: searchError } = useSearch(
    searchQuery || "",
    currentPage,
    pageSize
  )

  // Fetch products: use items vtwo when any filter (category/brand) or search; use most-bought only when solely previously_bought
  const shouldFetchItems = !effectivePreviouslyBought && !searchQuery
  const { data: itemsData, isLoading: itemsLoading, isValidating: itemsValidating, error: itemsError } = useItems({
    item_group: shouldFetchItems ? categoryFromUrl : undefined,
    page: shouldFetchItems ? currentPage : undefined,
    page_size: shouldFetchItems ? pageSize : undefined,
    sortByQty: shouldFetchItems ? sortByQty : undefined,
    filterByBrand: shouldFetchItems && selectedBrands.length > 0 ? selectedBrands : undefined,
  })

  const { data: mostBoughtData, isLoading: mostBoughtLoading, isValidating: mostBoughtValidating, error: mostBoughtError } = useMostBoughtItems({
    page: effectivePreviouslyBought ? currentPage : undefined,
    page_size: effectivePreviouslyBought ? pageSize : undefined,
    sortByQty: effectivePreviouslyBought ? sortByQty : undefined,
    filterByBrand: effectivePreviouslyBought && selectedBrands.length > 0 ? selectedBrands : undefined,
    time_frame: effectivePreviouslyBought ? "6 months" : undefined,
  })

  const isLoading = searchQuery 
    ? searchLoading 
    : (effectivePreviouslyBought ? mostBoughtLoading : itemsLoading)
  const isValidating = searchQuery
    ? searchValidating
    : (effectivePreviouslyBought ? mostBoughtValidating : itemsValidating)
  const error = searchQuery
    ? searchError
    : (effectivePreviouslyBought ? mostBoughtError : itemsError)
  const products = searchQuery
    ? (searchData?.items || [])
    : (effectivePreviouslyBought 
      ? (mostBoughtData?.message?.items || mostBoughtData?.message?.data || mostBoughtData?.items || []) 
      : (itemsData?.message?.items || itemsData?.message?.data || itemsData?.message?.item_list || itemsData?.items || []))
  const pagination = searchQuery
    ? searchData?.pagination
    : (effectivePreviouslyBought 
      ? (mostBoughtData?.message?.pagination || mostBoughtData?.pagination) 
      : itemsData?.message?.pagination)
  const hasNextPage = pagination?.has_next_page || false
  
  // Debug: Log first product to check rate field
  if (products.length > 0 && process.env.NODE_ENV === "development") {
    console.log("[Products] Sample product:", { item_code: products[0].item_code, rate: products[0].rate, price_list_rate: products[0].price_list_rate })
  }
  
  const brandsData = effectivePreviouslyBought 
    ? (mostBoughtData?.message?.brands || mostBoughtData?.brands) 
    : itemsData?.message?.brands
  const brands: Array<{ name: string; count: number }> = useMemo(() => {
    if (!brandsData || brandsData.length === 0) return []
    return brandsData
      .map((b: any) => {
        const key = Object.keys(b)[0]
        return { name: key, count: b[key] }
      })
      .filter((b: { name: string; count: number }) => b.name && b.name !== "None")
      .sort((a: { name: string; count: number }, b: { name: string; count: number }) => a.name.localeCompare(b.name))
  }, [brandsData])

  // Create stable string for selectedBrands dependency (don't mutate original array)
  const selectedBrandsKey = useMemo(() => [...selectedBrands].sort().join(","), [selectedBrands])
  
  // Create filter key for comparison
  const currentFiltersKey = useMemo(() => {
    return `${categoryFromUrl || ""}|${selectedBrandsKey}|${sortBy}|${searchQuery || ""}`
  }, [categoryFromUrl, selectedBrandsKey, sortBy, searchQuery])

  // Sync state from URL params when they change (e.g., browser back/forward)
  useEffect(() => {
    const newBrands = brandsFromUrl ? brandsFromUrl.split(",").filter(Boolean) : []
    const newSort = (sortFromUrl as typeof sortBy) || "relevance"
    
    if (JSON.stringify(newBrands.sort()) !== JSON.stringify(selectedBrands.sort())) {
      setSelectedBrands(newBrands)
    }
    if (newSort !== sortBy) {
      setSortBy(newSort)
    }
  }, [brandsFromUrl, sortFromUrl])

  // Reset when category, search, or filters change
  useEffect(() => {
    // Skip if filters haven't actually changed (prevents reset on initial mount)
    if (prevFiltersRef.current === currentFiltersKey && prevFiltersRef.current !== "") {
      return
    }
    
    prevFiltersRef.current = currentFiltersKey
    isResettingRef.current = true
    setCurrentPage(1)
    // Only clear products if we're actually changing filters (not on initial mount with same filters)
    if (allProducts.length > 0) {
      setAllProducts([])
      setIsCategoryChanging(true)
    }
    // Reset the flag after a brief moment
    const timer = setTimeout(() => {
      isResettingRef.current = false
    }, 100)
    return () => clearTimeout(timer)
  }, [currentFiltersKey])

  // Update products list when data changes
  const prevProductsLengthRef = useRef(0)
  const prevPageRef = useRef(1)
  const prevFiltersKeyRef = useRef("")
  
  useEffect(() => {
    const productsChanged = products.length !== prevProductsLengthRef.current
    const pageChanged = currentPage !== prevPageRef.current
    const filtersChanged = prevFiltersKeyRef.current !== currentFiltersKey
    
    // If filters changed, reset tracking refs
    if (filtersChanged) {
      prevFiltersKeyRef.current = currentFiltersKey
      prevProductsLengthRef.current = 0
      prevPageRef.current = 1
    }
    
    // When we have new data for page 1, always apply it (even during reset window) so products show after category/nav click
    if (currentPage === 1 && products.length > 0) {
      setAllProducts(products)
      setIsCategoryChanging(false)
      prevProductsLengthRef.current = products.length
      prevPageRef.current = currentPage
      return
    }
    
    if (isResettingRef.current && currentPage === 1) {
      return
    }
    
    if (!productsChanged && !pageChanged && !filtersChanged) return
    
    prevProductsLengthRef.current = products.length
    prevPageRef.current = currentPage
    
    if (currentPage === 1) {
      setAllProducts(products)
      setIsCategoryChanging(false)
    } else if (products.length > 0) {
      // For subsequent pages, append new products
      setAllProducts((prev) => {
        const existingIds = new Set(prev.map((p: any) => p.item_code))
        const newProducts = products.filter((p: any) => !existingIds.has(p.item_code))
        if (newProducts.length === 0) return prev
        return [...prev, ...newProducts]
      })
      setIsLoadingMore(false)
    }
  }, [products, currentPage, currentFiltersKey])

  // Infinite scroll observer
  useEffect(() => {
    if (!hasNextPage || isLoading || isLoadingMore || isCategoryChanging) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setIsLoadingMore(true)
          setCurrentPage((prev) => prev + 1)
        }
      },
      { threshold: 0.1 }
    )

    const currentTarget = observerTarget.current
    if (currentTarget) {
      observer.observe(currentTarget)
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget)
      }
    }
  }, [hasNextPage, isLoading, isLoadingMore, isCategoryChanging])

  // Helper to update URL with current filter state; when any filter is set, drop previously_bought so we use items vtwo API
  const updateUrlParams = useCallback((updates: {
    category?: string | null
    brands?: string[]
    sort?: string
  }) => {
    const params = new URLSearchParams(searchParams.toString())
    
    if (updates.category !== undefined) {
      if (updates.category) {
        params.set("category", updates.category)
        params.delete("previously_bought")
      } else {
        params.delete("category")
      }
    }
    
    if (updates.brands !== undefined) {
      if (updates.brands.length > 0) {
        params.set("brands", updates.brands.join(","))
        params.delete("previously_bought")
      } else {
        params.delete("brands")
      }
    }
    
    if (updates.sort !== undefined) {
      if (updates.sort && updates.sort !== "relevance") {
        params.set("sort", updates.sort)
      } else {
        params.delete("sort")
      }
    }
    
    router.push(`/products?${params.toString()}`, { scroll: false })
  }, [searchParams, router])

  const handleCategoryChange = useCallback((category: string) => {
    updateUrlParams({ category: category || null })
  }, [updateUrlParams])

  const handleBrandToggle = useCallback((brand: string) => {
    setSelectedBrands((prev) => {
      const isSelected = prev.includes(brand)
      let newBrands: string[]
      if (isSelected) {
        newBrands = prev.filter((b) => b !== brand)
      } else {
        newBrands = [...prev, brand]
      }
      // Update URL immediately
      updateUrlParams({ brands: newBrands })
      return newBrands
    })
  }, [updateUrlParams])

  const handleClearFilters = useCallback(() => {
    updateUrlParams({
      category: null,
      brands: [],
      sort: "relevance"
    })
  }, [updateUrlParams])

  const hasActiveFilters = selectedBrands.length > 0 || categoryFromUrl

  // Client-side price sorting (since API doesn't support it directly)
  const sortedProducts = useMemo(() => {
    if (sortBy === "price-low") {
      return [...allProducts].sort((a: any, b: any) => {
        const priceA = a.price_list_rate ?? a.rate ?? 0
        const priceB = b.price_list_rate ?? b.rate ?? 0
        return priceA - priceB
      })
    }
    if (sortBy === "price-high") {
      return [...allProducts].sort((a: any, b: any) => {
        const priceA = a.price_list_rate ?? a.rate ?? 0
        const priceB = b.price_list_rate ?? b.rate ?? 0
        return priceB - priceA
      })
    }
    return allProducts
  }, [allProducts, sortBy])

  return (
    <div className="container mx-auto px-4 py-8 bg-background/50 min-h-screen relative">
      {/* Full Screen Loading Overlay for Category Changes */}
      <AnimatePresence>
        {isCategoryChanging && isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-background/80 backdrop-blur-sm flex items-center justify-center"
          >
            <div className="flex flex-col items-center gap-4">
              <div className="relative">
                <Loader2 className="h-12 w-12 text-primary animate-spin" />
                <div className="absolute inset-0 border-4 border-primary/20 rounded-full" />
              </div>
              <p className="text-lg font-semibold text-foreground">Loading products...</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Mobile Filter Toggle */}
        <div className="lg:hidden flex items-center justify-between mb-4">
          <Button
            variant="outline"
            onClick={() => setIsMobileFiltersOpen(true)}
            className="rounded-xl border-primary/20 text-primary font-bold"
          >
            <Filter className="h-4 w-4 mr-2" />
            Filters
            {hasActiveFilters && (
              <span className="ml-2 h-5 w-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center">
                {selectedBrands.length + (categoryFromUrl ? 1 : 0)}
              </span>
            )}
          </Button>
          <div className="text-sm font-medium text-muted-foreground">
            {pagination ? `${pagination.total_records || 0} items` : isLoading ? "Loading..." : "0 items"}
          </div>
        </div>

        {/* Filters Sidebar */}
        <aside
          className={`
          fixed inset-0 z-[100] lg:relative lg:inset-auto lg:block w-full lg:w-72 shrink-0
          bg-background lg:bg-transparent transition-transform duration-300
          ${isMobileFiltersOpen ? "translate-x-0" : "translate-x-full lg:translate-x-0"}
        `}
        >
          <Card className="h-full lg:h-auto p-6 lg:sticky lg:top-24 rounded-none lg:rounded-2xl border-0 lg:border shadow-none lg:shadow-xl shadow-primary/5 overflow-y-auto">
            <div className="flex items-center justify-between mb-6 lg:hidden">
              <h2 className="text-xl font-bold">Filters</h2>
              <Button variant="ghost" size="icon" onClick={() => setIsMobileFiltersOpen(false)}>
                <X className="h-6 w-6" />
              </Button>
            </div>

            <h2 className="hidden lg:block text-xl font-black mb-6 tracking-tight">Refine Results</h2>

            {/* Category Filter */}
            {allCategories.length > 0 && (
              <div className="mb-8">
                <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-4">Categories</h3>
                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-primary/10">
                  {allCategories.map((category) => (
                    <label key={category} className="flex items-center gap-3 group cursor-pointer">
                      <Checkbox
                        id={`category-${category}`}
                        checked={categoryFromUrl === category}
                        onCheckedChange={() => handleCategoryChange(category)}
                        className="h-5 w-5 rounded-md border-2 border-primary/20 data-[state=checked]:bg-primary data-[state=checked]:border-primary transition-all"
                      />
                      <span
                        className={`text-sm font-bold transition-colors ${
                          categoryFromUrl === category
                            ? "text-primary"
                            : "text-muted-foreground group-hover:text-foreground"
                        }`}
                      >
                        {category}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Brand Filter */}
            {brands.length > 0 && (
              <div className="mb-8">
                <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-4">Brands</h3>
                <div className="space-y-3 max-h-[200px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-primary/10">
                  {brands.map((brand) => (
                    <label key={brand.name} className="flex items-center justify-between group cursor-pointer">
                      <div className="flex items-center gap-3 flex-1">
                        <Checkbox
                          id={`brand-${brand.name}`}
                          checked={selectedBrands.includes(brand.name)}
                          onCheckedChange={() => handleBrandToggle(brand.name)}
                          className="h-5 w-5 rounded-md border-2 border-primary/20 data-[state=checked]:bg-primary data-[state=checked]:border-primary transition-all"
                        />
                        <span
                          className={`text-sm font-bold transition-colors ${
                            selectedBrands.includes(brand.name)
                              ? "text-primary"
                              : "text-muted-foreground group-hover:text-foreground"
                          }`}
                        >
                          {brand.name}
                        </span>
                      </div>
                      <span className="text-xs text-muted-foreground font-medium">{brand.count}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {hasActiveFilters && (
              <Button
                variant="outline"
                className="w-full rounded-xl border-primary/20 text-primary font-bold hover:bg-primary/5 h-11 transition-all bg-transparent"
                onClick={handleClearFilters}
              >
                Reset All Filters
              </Button>
            )}
          </Card>
        </aside>

        {/* Products Grid */}
        <div className="flex-1">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div className="space-y-1">
              <h1 className="text-3xl font-black tracking-tighter">
                {effectivePreviouslyBought ? "Previously Bought Items" : (categoryFromUrl || "All Products")}
              </h1>
              <p className="text-sm font-medium text-muted-foreground">
                {isLoading && currentPage === 1
                  ? "Fetching latest inventory..."
                  : pagination
                    ? `Showing ${sortedProducts.length} of ${pagination.total_records || 0} items`
                    : "Loading..."}
              </p>
            </div>

          </div>

          <AnimatePresence mode="popLayout">
            {error ? (
              <motion.div
                key="error-state"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center justify-center py-20 text-center"
              >
                <div className="h-24 w-24 bg-destructive/5 rounded-full flex items-center justify-center mb-6">
                  <X className="h-10 w-10 text-destructive/40" />
                </div>
                <h3 className="text-xl font-bold mb-2">Failed to load products</h3>
                <p className="text-muted-foreground max-w-xs mb-6">
                  {error instanceof Error ? error.message : "An error occurred while fetching products. Please try again."}
                </p>
                <Button 
                  onClick={() => window.location.reload()} 
                  className="bg-primary font-bold h-11 px-8 rounded-xl"
                >
                  Retry
                </Button>
              </motion.div>
            ) : isLoading && currentPage === 1 && sortedProducts.length === 0 ? (
              <motion.div
                key="loading-grid"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-6"
              >
                {Array.from({ length: 12 }).map((_, i) => (
                  <SkeletonCard key={i} />
                ))}
              </motion.div>
            ) : sortedProducts.length > 0 ? (
              <>
                <motion.div key="product-grid" layout className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-6">
                  {sortedProducts.map((product: any) => {
                    // Determine the display price and rate for cart
                    const displayPrice = product.price_list_rate ?? product.rate ?? 0
                    const cartRate = product.rate ?? product.price_list_rate ?? 0
                    
                    return (
                      <ProductCard
                        key={product.item_code}
                        id={product.item_code}
                        name={product.item_name}
                        price={displayPrice}
                        rate={cartRate}
                        image={product.image}
                        unit={product.stock_uom || product.uom}
                        stock={product.actual_qty}
                      />
                    )
                  })}
                </motion.div>

                {/* Infinite Scroll Trigger */}
                {hasNextPage && (
                  <div ref={observerTarget} className="h-20 flex items-center justify-center mt-8">
                    {isLoadingMore && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Loader2 className="h-5 w-5 animate-spin" />
                        <span className="text-sm font-medium">Loading more products...</span>
                      </div>
                    )}
                  </div>
                )}

                {/* End of Results */}
                {!hasNextPage && sortedProducts.length > 0 && (
                  <div className="text-center py-8 text-muted-foreground text-sm font-medium">
                    You've reached the end
                  </div>
                )}
              </>
            ) : !isLoading ? (
              <motion.div
                key="empty-state"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center justify-center py-20 text-center"
              >
                <div className="h-24 w-24 bg-primary/5 rounded-full flex items-center justify-center mb-6">
                  <X className="h-10 w-10 text-primary/40" />
                </div>
                <h3 className="text-xl font-bold mb-2">No products found</h3>
                <p className="text-muted-foreground max-w-xs">
                  Try adjusting your filters or search terms to find what you're looking for.
                </p>
                <Button onClick={handleClearFilters} className="mt-6 bg-primary font-bold h-11 px-8 rounded-xl">
                  Clear all filters
                </Button>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
