"use client"

import { useState, useMemo, useEffect, useRef, useCallback } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { ProductCard } from "@/components/product-card"
import { SkeletonCard } from "@/components/skeleton-card"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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
  const observerTarget = useRef<HTMLDivElement>(null)

  const [sortBy, setSortBy] = useState<"relevance" | "price-low" | "price-high" | "qty-desc">("relevance")
  const [selectedBrands, setSelectedBrands] = useState<string[]>([])
  const [inStockOnly, setInStockOnly] = useState(false)
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false)
  const [allProducts, setAllProducts] = useState<any[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [isCategoryChanging, setIsCategoryChanging] = useState(false)
  const isResettingRef = useRef(false)

  const pageSize = 20

  // Get categories from API
  const { data: categoryTree } = useItemGroupTree(false)
  const allCategories = useMemo(() => getAllCategories(categoryTree || []), [categoryTree])

  // Map sortBy to API sortByQty
  const sortByQty = useMemo(() => {
    if (sortBy === "qty-desc") return "desc"
    if (sortBy === "price-low" || sortBy === "price-high") return "asc"
    return "asc"
  }, [sortBy])

  // Search results
  const { data: searchData, isLoading: searchLoading, isValidating: searchValidating } = useSearch(
    searchQuery || "",
    currentPage,
    pageSize
  )

  // Fetch products with all filters
  const { data: itemsData, isLoading: itemsLoading, isValidating: itemsValidating } = useItems({
    item_group: !isPreviouslyBought && !searchQuery ? categoryFromUrl : undefined,
    page: !isPreviouslyBought && !searchQuery ? currentPage : undefined,
    page_size: !isPreviouslyBought && !searchQuery ? pageSize : undefined,
    sortByQty: !isPreviouslyBought && !searchQuery ? sortByQty : undefined,
    filterByBrand: !isPreviouslyBought && !searchQuery && selectedBrands.length > 0 ? selectedBrands : undefined,
    inStockOnly: !isPreviouslyBought && !searchQuery ? inStockOnly : undefined,
  })

  const { data: mostBoughtData, isLoading: mostBoughtLoading, isValidating: mostBoughtValidating } = useMostBoughtItems({
    page: isPreviouslyBought ? currentPage : undefined,
    page_size: isPreviouslyBought ? pageSize : undefined,
    sortByQty: isPreviouslyBought ? sortByQty : undefined,
    filterByBrand: isPreviouslyBought && selectedBrands.length > 0 ? selectedBrands : undefined,
    inStockOnly: isPreviouslyBought ? inStockOnly : undefined,
    time_frame: isPreviouslyBought ? "6 months" : undefined,
  })

  const isLoading = searchQuery 
    ? searchLoading 
    : (isPreviouslyBought ? mostBoughtLoading : itemsLoading)
  const isValidating = searchQuery
    ? searchValidating
    : (isPreviouslyBought ? mostBoughtValidating : itemsValidating)
  const products = searchQuery
    ? (searchData?.items || [])
    : (isPreviouslyBought 
      ? (mostBoughtData?.message?.items || mostBoughtData?.items || []) 
      : (itemsData?.message?.items || []))
  const pagination = searchQuery
    ? searchData?.pagination
    : (isPreviouslyBought 
      ? (mostBoughtData?.message?.pagination || mostBoughtData?.pagination) 
      : itemsData?.message?.pagination)
  const hasNextPage = pagination?.has_next_page || false
  
  // Debug: Log first product to check rate field
  if (products.length > 0 && process.env.NODE_ENV === "development") {
    console.log("[Products] Sample product:", { item_code: products[0].item_code, rate: products[0].rate, price_list_rate: products[0].price_list_rate })
  }
  
  const brandsData = isPreviouslyBought 
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

  // Reset when category or filters change
  useEffect(() => {
    isResettingRef.current = true
    setCurrentPage(1)
    setAllProducts([])
    setIsCategoryChanging(true)
    // Reset the flag after a brief moment
    const timer = setTimeout(() => {
      isResettingRef.current = false
    }, 100)
    return () => clearTimeout(timer)
  }, [categoryFromUrl, selectedBrandsKey, inStockOnly, sortBy])

  // Reset products when filters/category change
  const prevProductsLengthRef = useRef(0)
  const prevPageRef = useRef(1)
  
  useEffect(() => {
    if (isResettingRef.current && currentPage === 1) {
      return
    }
    
    const productsChanged = products.length !== prevProductsLengthRef.current
    const pageChanged = currentPage !== prevPageRef.current
    
    if (!productsChanged && !pageChanged) return
    
    prevProductsLengthRef.current = products.length
    prevPageRef.current = currentPage
    
    if (currentPage === 1) {
      setAllProducts(products)
      setIsCategoryChanging(false)
    } else if (products.length > 0) {
      setAllProducts((prev) => {
        const existingIds = new Set(prev.map((p: any) => p.item_code))
        const newProducts = products.filter((p: any) => !existingIds.has(p.item_code))
        if (newProducts.length === 0) return prev
        return [...prev, ...newProducts]
      })
      setIsLoadingMore(false)
    }
  }, [products.length, currentPage])

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

  const handleCategoryChange = useCallback((category: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (category) {
      params.set("category", category)
    } else {
      params.delete("category")
    }
    router.push(`/products?${params.toString()}`)
  }, [searchParams, router])

  const handleBrandToggle = useCallback((brand: string) => {
    setSelectedBrands((prev) => {
      const isSelected = prev.includes(brand)
      if (isSelected) {
        const filtered = prev.filter((b) => b !== brand)
        // Only update if array actually changed
        if (filtered.length === prev.length) return prev
        return filtered
      } else {
        // Only update if brand not already in array
        if (prev.includes(brand)) return prev
        return [...prev, brand]
      }
    })
  }, [])

  const handleInStockToggle = useCallback((checked: boolean | "indeterminate") => {
    const newValue = checked === true
    setInStockOnly((prev) => {
      // Only update if value actually changed
      if (prev === newValue) return prev
      return newValue
    })
  }, [])

  const handleSortChange = useCallback((value: string) => {
    setSortBy(value as typeof sortBy)
  }, [])

  const handleClearFilters = () => {
    setSelectedBrands([])
    setInStockOnly(false)
    setSortBy("relevance")
    router.push("/products")
  }

  const hasActiveFilters = selectedBrands.length > 0 || inStockOnly || categoryFromUrl

  // Client-side price sorting (since API doesn't support it directly)
  const sortedProducts = useMemo(() => {
    if (sortBy === "price-low") {
      return [...allProducts].sort((a: any, b: any) => (a.rate || 0) - (b.rate || 0))
    }
    if (sortBy === "price-high") {
      return [...allProducts].sort((a: any, b: any) => (b.rate || 0) - (a.rate || 0))
    }
    return allProducts
  }, [allProducts, sortBy])

  // Handle direct navigation - show all products if no category
  const shouldShowProducts = !categoryFromUrl || sortedProducts.length > 0 || !isLoading

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
                {selectedBrands.length + (inStockOnly ? 1 : 0) + (categoryFromUrl ? 1 : 0)}
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
                  <label className="flex items-center gap-3 group cursor-pointer">
                    <Checkbox
                      id="category-all"
                      checked={!categoryFromUrl}
                      onCheckedChange={() => handleCategoryChange("")}
                      className="h-5 w-5 rounded-md border-2 border-primary/20 data-[state=checked]:bg-primary data-[state=checked]:border-primary transition-all"
                    />
                    <span
                      className={`text-sm font-bold transition-colors ${
                        !categoryFromUrl ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                      }`}
                    >
                      All Categories
                    </span>
                  </label>
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

            {/* In Stock Only Filter */}
            <div className="mb-8">
              <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-4">Availability</h3>
              <label className="flex items-center gap-3 group cursor-pointer">
                <Checkbox
                  id="in-stock-only"
                  checked={inStockOnly}
                  onCheckedChange={handleInStockToggle}
                  className="h-5 w-5 rounded-md border-2 border-primary/20 data-[state=checked]:bg-primary data-[state=checked]:border-primary transition-all"
                />
                <span
                  className={`text-sm font-bold transition-colors ${
                    inStockOnly ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                  }`}
                >
                  In Stock Only
                </span>
              </label>
            </div>

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
                {isPreviouslyBought ? "Previously Bought Items" : (categoryFromUrl || "All Products")}
              </h1>
              <p className="text-sm font-medium text-muted-foreground">
                {isLoading && currentPage === 1
                  ? "Fetching latest inventory..."
                  : pagination
                    ? `Showing ${sortedProducts.length} of ${pagination.total_records || 0} items`
                    : "Loading..."}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Select value={sortBy} onValueChange={handleSortChange}>
                <SelectTrigger className="w-48 h-11 rounded-xl border-primary/10 bg-background shadow-sm font-bold">
                  <SelectValue placeholder="Sort By" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-primary/10">
                  <SelectItem value="relevance">Recommended</SelectItem>
                  <SelectItem value="price-low">Price: Low to High</SelectItem>
                  <SelectItem value="price-high">Price: High to Low</SelectItem>
                  <SelectItem value="qty-desc">Stock: High to Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <AnimatePresence mode="popLayout">
            {isLoading && currentPage === 1 && sortedProducts.length === 0 ? (
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
                  {sortedProducts.map((product: any) => (
                    <ProductCard
                      key={`${product.item_code}-${currentPage}`}
                      id={product.item_code}
                      name={product.item_name}
                      price={product.price_list_rate ?? product.rate ?? 0}
                      rate={product.rate}
                      image={product.image}
                      unit={product.stock_uom || product.uom}
                      stock={product.actual_qty}
                    />
                  ))}
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
