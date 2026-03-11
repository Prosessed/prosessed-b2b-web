"use client"

import { useState, useMemo, useEffect, useRef, useCallback } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { ProductCard } from "@/components/product-card"
import { SkeletonCard } from "@/components/skeleton-card"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Card } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { parseTags } from "@/lib/utils/tags"
import { useItems, useMostBoughtItems, useSearch, useTaggedItems } from "@/lib/api/hooks"
import { getFirstImageUrl } from "@/lib/utils/image-url"
import { useItemGroupTree } from "@/hooks/useItemGroupTree"
import { motion, AnimatePresence } from "framer-motion"
import { Filter, LayoutGrid, List, Loader2, Package, X } from "lucide-react"

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
  const tagFromUrl = searchParams.get("tag") || undefined
  const taggedFromUrl = searchParams.get("tagged") === "true"
  const previouslyBoughtParam = searchParams.get("previously_bought")
  const isPreviouslyBought = previouslyBoughtParam === "true"
  // Use most-bought API only when no filter is selected; any category/brand/search/tag/tagged → use other APIs
  const effectivePreviouslyBought = isPreviouslyBought && !categoryFromUrl && !searchQuery && !tagFromUrl && !taggedFromUrl

  // Read filter state from URL params
  const brandsFromUrl = searchParams.get("brands")
  const sortFromUrl = searchParams.get("sort")
  const pageSizeFromUrl = searchParams.get("page_size")
  const viewFromUrl = searchParams.get("view")
  const gridColsFromUrl = searchParams.get("cols")
  const inStockOnlyParam = searchParams.get("in_stock_only")
  /** null = follow OrderIT settings only; true/false = force API filter */
  const inStockOnlyFilter: boolean | null =
    inStockOnlyParam === "true" ? true : inStockOnlyParam === "false" ? false : null

  const observerTarget = useRef<HTMLDivElement>(null)

  // Initialize state from URL params
  type SortByType = "featured" | "price-low" | "price-high" | "name-asc" | "name-desc"
  const [sortBy, setSortBy] = useState<SortByType>(() => {
    if (!sortFromUrl) return "featured"
    if (sortFromUrl === "relevance" || sortFromUrl === "qty-desc") return "featured"
    if (["featured", "price-low", "price-high", "name-asc", "name-desc"].includes(sortFromUrl)) {
      return sortFromUrl as SortByType
    }
    return "featured"
  })
  const [pageSize, setPageSize] = useState<number>(() => {
    const n = Number(pageSizeFromUrl)
    if (!Number.isFinite(n)) return 20
    if (n === 20 || n === 50 || n === 100) return n
    return 20
  })
  const [viewMode, setViewMode] = useState<"grid" | "list">(() => {
    if (viewFromUrl === "list") return "list"
    return "grid"
  })
  const [gridCols, setGridCols] = useState<2 | 3 | 4>(() => {
    const n = Number(gridColsFromUrl)
    if (n === 2 || n === 3 || n === 4) return n
    return 4
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

  // Get categories from API
  const { data: categoryTree } = useItemGroupTree(false)
  const allCategories = useMemo(() => getAllCategories(categoryTree || []), [categoryTree])

  /** API sortByQty: asc = low→high, desc = high→low — used when sorting by price */
  const sortByQtyForApi: "asc" | "desc" | undefined =
    sortBy === "price-low" ? "asc" : sortBy === "price-high" ? "desc" : undefined
  const sortByQtyForHooks: "asc" | "desc" = sortByQtyForApi ?? "asc"

  // Search results
  const { data: searchData, isLoading: searchLoading, isValidating: searchValidating, error: searchError } = useSearch(
    searchQuery || "",
    currentPage,
    pageSize,
    { sortByQty: sortByQtyForApi, inStockOnly: inStockOnlyFilter }
  )

  // Fetch products: use items vtwo when any filter (category/brand) or search; use most-bought only when solely previously_bought
  const shouldFetchItems = !effectivePreviouslyBought && !searchQuery
  const { data: itemsData, isLoading: itemsLoading, isValidating: itemsValidating, error: itemsError } = useItems({
    item_group: shouldFetchItems ? categoryFromUrl : undefined,
    page: shouldFetchItems ? currentPage : undefined,
    page_size: shouldFetchItems ? pageSize : undefined,
    sortByQty: shouldFetchItems ? sortByQtyForHooks : undefined,
    filterByBrand: shouldFetchItems && selectedBrands.length > 0 ? selectedBrands : undefined,
    inStockOnly: shouldFetchItems ? inStockOnlyFilter : undefined,
  })

  const { data: mostBoughtData, isLoading: mostBoughtLoading, isValidating: mostBoughtValidating, error: mostBoughtError } = useMostBoughtItems({
    page: effectivePreviouslyBought ? currentPage : undefined,
    page_size: effectivePreviouslyBought ? pageSize : undefined,
    sortByQty: effectivePreviouslyBought ? sortByQtyForHooks : undefined,
    filterByBrand: effectivePreviouslyBought && selectedBrands.length > 0 ? selectedBrands : undefined,
    time_frame: effectivePreviouslyBought ? "6 months" : undefined,
    inStockOnly: effectivePreviouslyBought ? inStockOnlyFilter : undefined,
  })

  const useTaggedView = tagFromUrl || taggedFromUrl
  const { data: taggedItemsData, isLoading: taggedLoading, error: taggedError } = useTaggedItems(undefined, {
    sortByQty: useTaggedView ? sortByQtyForHooks : undefined,
    inStockOnly: useTaggedView ? inStockOnlyFilter : undefined,
  })
  const productsWhenTag = useMemo(() => {
    if (!useTaggedView || !taggedItemsData || !Array.isArray(taggedItemsData)) return []
    if (tagFromUrl) return taggedItemsData.filter((p: any) => parseTags(p.tags).includes(tagFromUrl))
    return taggedItemsData
  }, [useTaggedView, tagFromUrl, taggedItemsData])

  const isLoading = useTaggedView
    ? taggedLoading
    : searchQuery
    ? searchLoading
    : (effectivePreviouslyBought ? mostBoughtLoading : itemsLoading)
  const isValidating = useTaggedView ? false : (searchQuery ? searchValidating : (effectivePreviouslyBought ? mostBoughtValidating : itemsValidating))
  const error = useTaggedView ? taggedError : (searchQuery ? searchError : (effectivePreviouslyBought ? mostBoughtError : itemsError))
  const products = useTaggedView
    ? productsWhenTag
    : searchQuery
    ? (searchData?.items || [])
    : (effectivePreviouslyBought
      ? (mostBoughtData?.message?.items || mostBoughtData?.message?.data || mostBoughtData?.items || [])
      : (itemsData?.message?.items || itemsData?.message?.data || itemsData?.message?.item_list || itemsData?.items || []))
  const pagination = useTaggedView
    ? { total_records: productsWhenTag.length, has_next_page: false }
    : searchQuery
    ? searchData?.pagination
    : (effectivePreviouslyBought
      ? (mostBoughtData?.message?.pagination || mostBoughtData?.pagination)
      : itemsData?.message?.pagination)
  const hasNextPage = useTaggedView ? false : (pagination?.has_next_page || false)
  
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
    return `${categoryFromUrl || ""}|${selectedBrandsKey}|${searchQuery || ""}|${tagFromUrl || ""}|${taggedFromUrl}|${pageSize}|${inStockOnlyParam || ""}|${sortBy}`
  }, [categoryFromUrl, selectedBrandsKey, searchQuery, tagFromUrl, taggedFromUrl, pageSize, inStockOnlyParam, sortBy])

  // Sync state from URL params when they change (e.g., browser back/forward)
  useEffect(() => {
    const newBrands = brandsFromUrl ? brandsFromUrl.split(",").filter(Boolean) : []
    const newSort: SortByType = (() => {
      if (!sortFromUrl) return "featured"
      if (sortFromUrl === "relevance" || sortFromUrl === "qty-desc") return "featured"
      if (["featured", "price-low", "price-high", "name-asc", "name-desc"].includes(sortFromUrl)) {
        return sortFromUrl as SortByType
      }
      return "featured"
    })()
    const newPageSize = (() => {
      const n = Number(pageSizeFromUrl)
      if (!Number.isFinite(n)) return 20
      if (n === 20 || n === 50 || n === 100) return n
      return 20
    })()
    const newViewMode = viewFromUrl === "list" ? "list" : "grid"
    const newGridCols = (() => {
      const n = Number(gridColsFromUrl)
      if (n === 2 || n === 3 || n === 4) return n
      return 4
    })()
    
    if (JSON.stringify([...newBrands].sort()) !== JSON.stringify([...selectedBrands].sort())) {
      setSelectedBrands(newBrands)
    }
    if (newSort !== sortBy) {
      setSortBy(newSort)
    }
    if (newPageSize !== pageSize) {
      setPageSize(newPageSize)
    }
    if (newViewMode !== viewMode) {
      setViewMode(newViewMode)
    }
    if (newGridCols !== gridCols) {
      setGridCols(newGridCols)
    }
  }, [brandsFromUrl, sortFromUrl, pageSizeFromUrl, viewFromUrl, gridColsFromUrl])

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
    sort?: SortByType
    pageSize?: number
    view?: "grid" | "list"
    cols?: 2 | 3 | 4
    tag?: string | null
    tagged?: string | null
    /** true = in stock only, false = include all, null = remove param (follow settings) */
    inStockOnly?: boolean | null
  }) => {
    const params = new URLSearchParams(searchParams.toString())

    if (updates.category !== undefined) {
      if (updates.category) {
        params.set("category", updates.category)
        params.delete("previously_bought")
        params.delete("tagged")
        params.delete("tag")
      } else {
        params.delete("category")
      }
    }

    if (updates.brands !== undefined) {
      if (updates.brands.length > 0) {
        params.set("brands", updates.brands.join(","))
        params.delete("previously_bought")
        params.delete("tagged")
        params.delete("tag")
      } else {
        params.delete("brands")
      }
    }

    if (updates.sort !== undefined) {
      if (updates.sort && updates.sort !== "featured") {
        params.set("sort", updates.sort)
      } else {
        params.delete("sort")
      }
    }

    if (updates.pageSize !== undefined) {
      if (updates.pageSize && updates.pageSize !== 20) {
        params.set("page_size", String(updates.pageSize))
      } else {
        params.delete("page_size")
      }
    }

    if (updates.view !== undefined) {
      if (updates.view === "list") {
        params.set("view", "list")
      } else {
        params.delete("view")
      }
    }

    if (updates.cols !== undefined) {
      if (updates.cols && updates.cols !== 4) {
        params.set("cols", String(updates.cols))
      } else {
        params.delete("cols")
      }
    }

    if (updates.tag !== undefined) {
      if (updates.tag) {
        params.set("tag", updates.tag)
        params.delete("previously_bought")
      } else {
        params.delete("tag")
      }
    }

    if (updates.tagged !== undefined) {
      if (updates.tagged) {
        params.set("tagged", "true")
        params.delete("previously_bought")
      } else {
        params.delete("tagged")
      }
    }

    if (updates.inStockOnly !== undefined) {
      if (updates.inStockOnly === true) {
        params.set("in_stock_only", "true")
      } else if (updates.inStockOnly === false) {
        params.set("in_stock_only", "false")
      } else {
        params.delete("in_stock_only")
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
      sort: "featured",
      tag: null,
      tagged: null,
      inStockOnly: null,
    })
  }, [updateUrlParams])

  const handleInStockToggle = useCallback(() => {
    if (inStockOnlyFilter === true) {
      updateUrlParams({ inStockOnly: false })
    } else if (inStockOnlyFilter === false) {
      updateUrlParams({ inStockOnly: null })
    } else {
      updateUrlParams({ inStockOnly: true })
    }
  }, [inStockOnlyFilter, updateUrlParams])

  const handleSortByChange = useCallback((value: string) => {
    if (!["featured", "price-low", "price-high", "name-asc", "name-desc"].includes(value)) return
    const next = value as SortByType
    setSortBy(next)
    updateUrlParams({ sort: next })
  }, [updateUrlParams])

  const handlePageSizeChange = useCallback((value: string) => {
    const next = Number(value)
    if (!(next === 20 || next === 50 || next === 100)) return
    setPageSize(next)
    updateUrlParams({ pageSize: next })
  }, [updateUrlParams])

  const handleViewModeChange = useCallback((next: "grid" | "list") => {
    setViewMode(next)
    updateUrlParams({ view: next })
  }, [updateUrlParams])

  const handleGridColsChange = useCallback((next: 2 | 3 | 4) => {
    setGridCols(next)
    updateUrlParams({ cols: next })
  }, [updateUrlParams])

  const hasActiveFilters = selectedBrands.length > 0 || categoryFromUrl || !!tagFromUrl || taggedFromUrl


  // Filter by tag (client-side); name sort client-side; price sort via API (sortByQty) — no local price reorder
  const sortedProducts = useMemo(() => {
    let list = allProducts
    if (tagFromUrl) {
      list = list.filter((p: any) => {
        const tags = parseTags(p.tags)
        return tags.includes(tagFromUrl)
      })
    }
    if (sortBy === "price-low" || sortBy === "price-high") {
      return list
    }
    if (sortBy === "name-asc") {
      return [...list].sort((a: any, b: any) => {
        const nameA = (a.item_name ?? a.name ?? "").toString()
        const nameB = (b.item_name ?? b.name ?? "").toString()
        return nameA.localeCompare(nameB, undefined, { sensitivity: "base" })
      })
    }
    if (sortBy === "name-desc") {
      return [...list].sort((a: any, b: any) => {
        const nameA = (a.item_name ?? a.name ?? "").toString()
        const nameB = (b.item_name ?? b.name ?? "").toString()
        return nameB.localeCompare(nameA, undefined, { sensitivity: "base" })
      })
    }
    return list
  }, [allProducts, sortBy, tagFromUrl])

  const gridClassName = useMemo(() => {
    if (viewMode !== "grid") return ""
    if (gridCols === 2) return "grid grid-cols-2 gap-6"
    if (gridCols === 3) return "grid grid-cols-2 md:grid-cols-3 gap-6"
    return "grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6"
  }, [gridCols, viewMode])

  return (
    <div className="container mx-auto px-4 py-8 bg-background/50 min-h-screen relative">
      {/* Full Screen Loading Overlay for Category Changes */}
      <AnimatePresence>
        {isCategoryChanging && isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-200 bg-background/80 backdrop-blur-sm flex items-center justify-center"
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
          fixed inset-0 z-100 lg:relative lg:inset-auto lg:block w-full lg:w-72 shrink-0
          bg-background lg:bg-transparent transition-transform duration-300
          ${isMobileFiltersOpen ? "translate-x-0" : "translate-x-full lg:translate-x-0"}
        `}
        >
          <Card className="h-full lg:h-[calc(100vh-6rem)] p-6 lg:sticky lg:top-24 rounded-none lg:rounded-2xl border-0 lg:border shadow-none lg:shadow-xl shadow-primary/5 overflow-y-auto overscroll-contain scroll-smooth">
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
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-3xl font-black tracking-tighter">
                  {tagFromUrl
                    ? `Tag: ${tagFromUrl}`
                    : taggedFromUrl
                    ? "Hot Deals & Trending Products"
                    : effectivePreviouslyBought
                    ? "Previously Bought Items"
                    : (categoryFromUrl || "All Products")}
                </h1>
                {tagFromUrl && (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-sm font-semibold text-primary">
                    Tag: {tagFromUrl}
                    <button
                      type="button"
                      onClick={() => updateUrlParams({ tag: null })}
                      className="rounded-full p-0.5 hover:bg-primary/20 focus-visible:outline focus-visible:ring-2 focus-visible:ring-primary"
                      aria-label={`Clear tag filter ${tagFromUrl}`}
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </span>
                )}
              </div>
              <p className="text-sm font-medium text-muted-foreground">
                {isLoading && currentPage === 1
                  ? "Fetching latest inventory..."
                  : pagination
                    ? `Showing ${sortedProducts.length} of ${pagination.total_records || 0} items`
                    : "Loading..."}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">
                  Items per page
                </span>
                <Select value={String(pageSize)} onValueChange={handlePageSizeChange}>
                  <SelectTrigger size="sm" className="w-[88px] rounded-lg">
                    <SelectValue placeholder="20" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="20">20</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* In stock only — cycles default → on → off; drives API inStockOnly */}
              <div className="flex items-center gap-2 rounded-xl border border-primary/20 bg-primary/5 px-3 py-1.5">
                <Package
                  className={`h-4 w-4 shrink-0 ${inStockOnlyFilter === true ? "text-primary" : "text-muted-foreground"}`}
                  aria-hidden
                />
                <span className="text-[11px] font-black uppercase tracking-widest text-muted-foreground whitespace-nowrap">
                  In stock
                </span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={inStockOnlyFilter === true}
                  aria-label="Toggle in-stock only filter"
                  onClick={handleInStockToggle}
                  className={`
                    relative h-7 w-12 shrink-0 rounded-full transition-colors duration-200
                    focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2
                    ${inStockOnlyFilter === true ? "bg-primary" : inStockOnlyFilter === false ? "bg-muted-foreground/40" : "bg-muted"}
                  `}
                >
                  <span
                    className={`
                      absolute top-0.5 left-0.5 h-6 w-6 rounded-full bg-background shadow-md transition-transform duration-200
                      ${inStockOnlyFilter === true ? "translate-x-5" : "translate-x-0"}
                    `}
                  />
                </button>
                <span className="text-[10px] font-bold text-muted-foreground hidden sm:inline max-w-18 truncate">
                  {inStockOnlyFilter === true ? "Only" : inStockOnlyFilter === false ? "All" : "Auto"}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">
                  Sort by
                </span>
                <Select value={sortBy} onValueChange={handleSortByChange}>
                  <SelectTrigger size="sm" className="w-[170px] rounded-lg">
                    <SelectValue placeholder="Featured" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="featured">Featured</SelectItem>
                    <SelectItem value="price-low">Price: Low → High</SelectItem>
                    <SelectItem value="price-high">Price: High → Low</SelectItem>
                    <SelectItem value="name-asc">A → Z</SelectItem>
                    <SelectItem value="name-desc">Z → A</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-1 rounded-xl border border-border/60 bg-muted/20 p-1">
                <Button
                  type="button"
                  variant={viewMode === "grid" ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => handleViewModeChange("grid")}
                  className="h-8 rounded-lg px-3 font-bold cursor-pointer"
                  aria-label="Grid view"
                >
                  <LayoutGrid className="h-4 w-4" />
                  Grid
                </Button>
                <Button
                  type="button"
                  variant={viewMode === "list" ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => handleViewModeChange("list")}
                  className="h-8 rounded-lg px-3 font-bold cursor-pointer"
                  aria-label="List view"
                >
                  <List className="h-4 w-4" />
                  List
                </Button>
              </div>

              {viewMode === "grid" && (
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">
                    View as
                  </span>
                  <div className="flex items-center gap-1 rounded-xl border border-border/60 bg-muted/20 p-1">
                    <Button
                      type="button"
                      variant={gridCols === 2 ? "secondary" : "ghost"}
                      size="sm"
                      onClick={() => handleGridColsChange(2)}
                      className="h-8 rounded-lg px-3 font-black cursor-pointer"
                      aria-label="2 columns"
                    >
                      2
                    </Button>
                    <Button
                      type="button"
                      variant={gridCols === 3 ? "secondary" : "ghost"}
                      size="sm"
                      onClick={() => handleGridColsChange(3)}
                      className="h-8 rounded-lg px-3 font-black cursor-pointer"
                      aria-label="3 columns"
                    >
                      3
                    </Button>
                    <Button
                      type="button"
                      variant={gridCols === 4 ? "secondary" : "ghost"}
                      size="sm"
                      onClick={() => handleGridColsChange(4)}
                      className="h-8 rounded-lg px-3 font-black cursor-pointer"
                      aria-label="4 columns"
                    >
                      4
                    </Button>
                  </div>
                </div>
              )}
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
                className={viewMode === "grid"
                  ? gridClassName
                  : "space-y-3"
                }
              >
                {Array.from({ length: viewMode === "grid" ? 12 : 8 }).map((_, i) => (
                  viewMode === "grid" ? (
                    <SkeletonCard key={i} />
                  ) : (
                    <div
                      key={i}
                      className="h-[124px] rounded-2xl border border-border/60 bg-linear-to-r from-muted/40 via-muted/20 to-muted/40 animate-pulse"
                    />
                  )
                ))}
              </motion.div>
            ) : sortedProducts.length > 0 ? (
              <>
                <motion.div
                  key="product-grid"
                  layout
                  className={viewMode === "grid"
                    ? gridClassName
                    : "flex flex-col gap-3"
                  }
                >
                  {sortedProducts.map((product: any) => {
                    // Determine the display price and rate for cart
                    const displayPrice = product.price_list_rate ?? product.rate ?? product.price ?? 0
                    const cartRate = product.rate ?? product.price_list_rate ?? product.price ?? 0
                    const unit = product.default_sales_uom || product.stock_uom || product.uom || product.uoms?.[0]?.uom
                    
                    return (
                      <ProductCard
                        key={product.item_code}
                        view={viewMode}
                        id={product.item_code}
                        name={product.item_name ?? product.name ?? ""}
                        price={displayPrice}
                        rate={cartRate}
                        image={getFirstImageUrl(product.image) ?? ""}
                        unit={unit}
                        stock={product.actual_qty ?? product.uoms?.[0]?.reserved ?? product.reserved ?? 0}
                        tags={product.tags}
                      />
                    )
                  })}
                </motion.div>

                {/* Infinite Scroll Trigger */}
                {hasNextPage && (
                  <div ref={observerTarget} className="mt-8">
                    {isLoadingMore ? (
                      <div className="space-y-4">
                        <div className="flex items-center justify-center gap-2 text-muted-foreground">
                          <Loader2 className="h-5 w-5 animate-spin" />
                          <span className="text-sm font-semibold">Loading more products…</span>
                        </div>
                        {sortedProducts.length >= 20 && (
                          <div
                            className={viewMode === "grid"
                              ? gridClassName
                              : "space-y-3"
                            }
                            aria-label="Loading more products"
                          >
                            {Array.from({ length: viewMode === "grid" ? 8 : 4 }).map((_, i) => (
                              viewMode === "grid" ? (
                                <SkeletonCard key={i} />
                              ) : (
                                <div
                                  key={i}
                                  className="h-[124px] rounded-2xl border border-border/60 bg-linear-to-r from-primary/10 via-muted/20 to-primary/10 animate-pulse"
                                />
                              )
                            ))}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="h-10" />
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
