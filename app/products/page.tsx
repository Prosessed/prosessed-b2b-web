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
import { useAuth } from "@/lib/auth/context"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronLeft, ChevronRight, Filter, LayoutGrid, List, Loader2, X } from "lucide-react"

const getAllCategories = (tree: any[]): string[] => {
  const categories: string[] = []
  
  const traverse = (nodes: any[]) => {
    for (const node of nodes) {
      const hasChildren = node.children && node.children.length > 0

      // ✅ Only push leaf nodes
      if (!hasChildren && node.value && node.value !== "All Item Groups") {
        categories.push(node.value)
      }

      if (hasChildren) {
        traverse(node.children)
      }
    }
  }
  
  if (tree.length > 0 && tree[0].children) {
    traverse(tree[0].children)
  }
  
  return categories
}
// Helper to flatten all categories from tree
// const getAllCategories = (tree: any[]): string[] => {
//   const categories: string[] = []
  
//   const traverse = (nodes: any[]) => {
//     for (const node of nodes) {
//       if (node.value && node.value !== "All Item Groups") {
//         categories.push(node.value)
//       }
//       if (node.children && Array.isArray(node.children)) {
//         traverse(node.children)
//       }
//     }
//   }
  
//   if (tree.length > 0 && tree[0].children) {
//     traverse(tree[0].children)
//   }
  
//   return categories
// }

export default function ProductsPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { user } = useAuth()
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
  const observerTarget = useRef<HTMLDivElement>(null)

  // Initialize state from URL params (legacy: featured/price-low/price-high still accepted)
  type SortByType = "recommended" | "name-asc" | "name-desc"
  const normalizeSortFromUrl = (url: string | null): SortByType => {
    if (!url) return "recommended"
    if (url === "featured" || url === "relevance" || url === "qty-desc") return "recommended"
    if (url === "price-low" || url === "price-high") return "recommended"
    if (["recommended", "name-asc", "name-desc"].includes(url)) {
      return url as SortByType
    }
    return "recommended"
  }
  const [sortBy, setSortBy] = useState<SortByType>(() => normalizeSortFromUrl(sortFromUrl))
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
  const [isDesktopFiltersCollapsed, setIsDesktopFiltersCollapsed] = useState(true)
  const [isDesktopViewport, setIsDesktopViewport] = useState(false)
  const [allProducts, setAllProducts] = useState<any[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  /** How many tagged/filtered items we want loaded (fills 20/50/100 per “page”). */
  const [loadTargetCount, setLoadTargetCount] = useState(pageSize)
  const loadMoreStartedAtRef = useRef<number | null>(null)
  const pendingLoadMoreRef = useRef(false)
  const [canLoadMoreFallback, setCanLoadMoreFallback] = useState(true)
  const [isCategoryChanging, setIsCategoryChanging] = useState(false)
  const isResettingRef = useRef(false)
  const prevFiltersRef = useRef<string>("")

  // Get categories from API
  const { data: categoryTree } = useItemGroupTree(false)
  const allCategories = useMemo(() => getAllCategories(categoryTree || []), [categoryTree])

  const slugifyCategory = useCallback((value: string) => {
    return value
      .toLowerCase()
      .trim()
      .replace(/&/g, "and")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
  }, [])

  const resolvedCategoryFromUrl = useMemo(() => {
    if (!categoryFromUrl) return undefined
    if (allCategories.includes(categoryFromUrl)) return categoryFromUrl
    const normalized = slugifyCategory(categoryFromUrl)
    if (!normalized) return categoryFromUrl
    const match = allCategories.find((c) => slugifyCategory(c) === normalized)
    return match || categoryFromUrl
  }, [allCategories, categoryFromUrl, slugifyCategory])

  const selectedCategory = resolvedCategoryFromUrl

  /**
   * Stock sort only: sortByQty=asc (low→high), sortByQty=desc (high→low).
   * Recommended omits sortByQty so sortByRecommended applies via settings merge.
   */
  const sortByQtyForApi: "asc" | "desc" | undefined = undefined

  const useTaggedView = !!(tagFromUrl || taggedFromUrl)

  // Search results
  const { data: searchData, isLoading: searchLoading, isValidating: searchValidating, error: searchError } = useSearch(
    searchQuery || "",
    currentPage,
    pageSize,
    { sortByQty: sortByQtyForApi }
  )

  // Fetch products: use items vtwo when any filter (category/brand) or search; use most-bought only when solely previously_bought
  const shouldFetchItems = !effectivePreviouslyBought && !searchQuery && !useTaggedView
  const { data: itemsData, isLoading: itemsLoading, isValidating: itemsValidating, error: itemsError } = useItems({
    item_group: shouldFetchItems ? selectedCategory : undefined,
    page: shouldFetchItems ? currentPage : undefined,
    page_size: shouldFetchItems ? pageSize : undefined,
    sortByQty: shouldFetchItems ? sortByQtyForApi : undefined,
    filterByBrand: shouldFetchItems && selectedBrands.length > 0 ? selectedBrands : undefined,
  })

  const { data: mostBoughtData, isLoading: mostBoughtLoading, isValidating: mostBoughtValidating, error: mostBoughtError } = useMostBoughtItems({
    page: effectivePreviouslyBought ? currentPage : undefined,
    page_size: effectivePreviouslyBought ? pageSize : undefined,
    sortByQty: effectivePreviouslyBought ? sortByQtyForApi : undefined,
    filterByBrand: effectivePreviouslyBought && selectedBrands.length > 0 ? selectedBrands : undefined,
    time_frame: effectivePreviouslyBought ? "6 months" : undefined,
  })

  const {
    data: taggedItemsData,
    isLoading: taggedLoading,
    isValidating: taggedValidating,
    error: taggedError,
  } = useTaggedItems(undefined, {
    enabled: useTaggedView,
    page: useTaggedView ? currentPage : undefined,
    page_size: useTaggedView ? pageSize : undefined,
    tag: tagFromUrl,
    sortByQty: useTaggedView ? sortByQtyForApi : undefined,
  })
  const productsWhenTag = useMemo(() => {
    if (!useTaggedView || !taggedItemsData?.items || !Array.isArray(taggedItemsData.items)) return []
    // Keep client-side filter as a safety net when API returns mixed tags
    if (tagFromUrl) return taggedItemsData.items.filter((p: any) => parseTags(p.tags).includes(tagFromUrl))
    return taggedItemsData.items
  }, [useTaggedView, tagFromUrl, taggedItemsData])

  const isLoading = useTaggedView
    ? taggedLoading
    : searchQuery
    ? searchLoading
    : (effectivePreviouslyBought ? mostBoughtLoading : itemsLoading)
  const isValidating = useTaggedView
    ? taggedValidating
    : (searchQuery ? searchValidating : (effectivePreviouslyBought ? mostBoughtValidating : itemsValidating))
  const error = useTaggedView ? taggedError : (searchQuery ? searchError : (effectivePreviouslyBought ? mostBoughtError : itemsError))
  const products = useTaggedView
    ? productsWhenTag
    : searchQuery
    ? (searchData?.items || [])
    : (effectivePreviouslyBought
      ? (mostBoughtData?.message?.items || mostBoughtData?.message?.data || mostBoughtData?.items || [])
      : (itemsData?.message?.items || itemsData?.message?.data || itemsData?.message?.item_list || itemsData?.items || []))
  const pagination = useTaggedView
    ? taggedItemsData?.pagination
    : searchQuery
    ? searchData?.pagination
    : (effectivePreviouslyBought
      ? (mostBoughtData?.message?.pagination || mostBoughtData?.pagination)
      : itemsData?.message?.pagination)
  const hasNextPage = useMemo(() => {
    if (typeof pagination?.has_next_page === "boolean") return pagination.has_next_page
    return canLoadMoreFallback
  }, [canLoadMoreFallback, pagination?.has_next_page])
  
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
    return `${selectedCategory || ""}|${selectedBrandsKey}|${searchQuery || ""}|${tagFromUrl || ""}|${taggedFromUrl}|${pageSize}|${sortBy}`
  }, [selectedCategory, selectedBrandsKey, searchQuery, tagFromUrl, taggedFromUrl, pageSize, sortBy])

  // Sync state from URL params when they change (e.g., browser back/forward)
  useEffect(() => {
    const newBrands = brandsFromUrl ? brandsFromUrl.split(",").filter(Boolean) : []
    const newSort = normalizeSortFromUrl(sortFromUrl)
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

  useEffect(() => {
    if (typeof window === "undefined") return
    const media = window.matchMedia("(min-width: 1024px)")
    const handleChange = () => setIsDesktopViewport(media.matches)
    handleChange()
    media.addEventListener("change", handleChange)
    return () => media.removeEventListener("change", handleChange)
  }, [])

  // Reset when category, search, or filters change
  useEffect(() => {
    // Skip if filters haven't actually changed (prevents reset on initial mount)
    if (prevFiltersRef.current === currentFiltersKey && prevFiltersRef.current !== "") {
      return
    }
    
    prevFiltersRef.current = currentFiltersKey
    isResettingRef.current = true
    setCurrentPage(1)
    setLoadTargetCount(pageSize)
    setCanLoadMoreFallback(true)
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
  }, [currentFiltersKey, pageSize])

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
      // If backend doesn't send pagination, infer "may have more" from first page size.
      if (typeof pagination?.has_next_page !== "boolean") {
        setCanLoadMoreFallback(products.length >= pageSize)
      }
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
      if (typeof pagination?.has_next_page !== "boolean") {
        setCanLoadMoreFallback(products.length >= pageSize)
      }
    } else if (products.length > 0) {
      // For subsequent pages, append new products
      let appendedCount = 0
      setAllProducts((prev) => {
        const existingIds = new Set(prev.map((p: any) => p.item_code))
        const newProducts = products.filter((p: any) => !existingIds.has(p.item_code))
        appendedCount = newProducts.length
        if (newProducts.length === 0) return prev
        return [...prev, ...newProducts]
      })
      // If backend doesn't send pagination, stop when we get a short page or no new unique items.
      if (typeof pagination?.has_next_page !== "boolean") {
        if (products.length < pageSize || appendedCount === 0) {
          setCanLoadMoreFallback(false)
        }
      }
    }
  }, [products, currentPage, currentFiltersKey, pageSize, pagination?.has_next_page])

  // Always stop the "load more" spinner when the request finishes (even if API returns 0 items or errors)
  useEffect(() => {
    if (!isLoadingMore) return
    if (!loadMoreStartedAtRef.current) loadMoreStartedAtRef.current = Date.now()
    if (isValidating) return

    const minVisibleMs = 550
    const elapsed = Date.now() - (loadMoreStartedAtRef.current ?? Date.now())
    const remaining = Math.max(0, minVisibleMs - elapsed)

    const t = window.setTimeout(() => {
      setIsLoadingMore(false)
      loadMoreStartedAtRef.current = null
    }, remaining)

    return () => window.clearTimeout(t)
  }, [isLoadingMore, isValidating])

  // If the sentinel intersected during validation, run it once validation completes.
  useEffect(() => {
    if (!pendingLoadMoreRef.current) return
    if (!hasNextPage) return
    if (isLoadingMore) return
    if (isValidating) return
    if (isCategoryChanging) return
    pendingLoadMoreRef.current = false
    if (useTaggedView) {
      setLoadTargetCount((prev) => Math.max(prev, allProducts.length) + pageSize)
      return
    }
    setIsLoadingMore(true)
    setCurrentPage((prev) => prev + 1)
  }, [
    hasNextPage,
    isLoadingMore,
    isValidating,
    isCategoryChanging,
    useTaggedView,
    allProducts.length,
    pageSize,
  ])

  // Tagged view: API pages can mix tags; keep fetching until we hit selected page size (20/50/100)
  useEffect(() => {
    if (!useTaggedView) return
    if (!hasNextPage) return
    if (isLoading || isValidating || isLoadingMore || isCategoryChanging) return
    if (allProducts.length >= loadTargetCount) return
    setIsLoadingMore(true)
    setCurrentPage((prev) => prev + 1)
  }, [
    useTaggedView,
    hasNextPage,
    isLoading,
    isValidating,
    isLoadingMore,
    isCategoryChanging,
    allProducts.length,
    loadTargetCount,
  ])

  // Infinite scroll observer
  useEffect(() => {
    if (!hasNextPage) return
    if (isLoadingMore) return
    if (isCategoryChanging) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          if (!hasNextPage) return
          if (isLoadingMore) return
          if (isValidating) {
            pendingLoadMoreRef.current = true
            return
          }
          if (isCategoryChanging) return
          if (useTaggedView) {
            setLoadTargetCount((prev) => Math.max(prev, allProducts.length) + pageSize)
            return
          }
          setIsLoadingMore(true)
          setCurrentPage((prev) => prev + 1)
        }
      },
      { threshold: 0, rootMargin: "240px 0px" }
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
  }, [
    hasNextPage,
    isLoadingMore,
    isValidating,
    isCategoryChanging,
    useTaggedView,
    allProducts.length,
    pageSize,
  ])

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
      if (updates.sort && updates.sort !== "recommended") {
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
      sort: "recommended",
      tag: null,
      tagged: null,
    })
  }, [updateUrlParams])

  const handleCloseMobileFilters = useCallback(() => {
    setIsMobileFiltersOpen(false)
  }, [])

  useEffect(() => {
    if (!isMobileFiltersOpen || isDesktopViewport) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [isMobileFiltersOpen, isDesktopViewport])

  const handleSortByChange = useCallback((value: string) => {
    if (!["recommended", "name-asc", "name-desc"].includes(value)) return
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

  const hasActiveFilters = selectedBrands.length > 0 || !!selectedCategory || !!tagFromUrl || taggedFromUrl
  const showExpandedFilterContent = !isDesktopViewport || !isDesktopFiltersCollapsed

  // Filter by tag (client-side); name sort client-side
  const sortedProducts = useMemo(() => {
    let list = allProducts
    if (tagFromUrl) {
      list = list.filter((p: any) => {
        const tags = parseTags(p.tags)
        return tags.includes(tagFromUrl)
      })
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

  const mobileFilterResultsCount = pagination?.total_records ?? sortedProducts.length

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
        {!effectivePreviouslyBought && !useTaggedView && (
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
        )}

        {/* Filters Sidebar */}
        {!effectivePreviouslyBought && !useTaggedView && (
        <>
          <AnimatePresence>
            {isMobileFiltersOpen && !isDesktopViewport && (
              <motion.button
                type="button"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="fixed inset-0 z-40 bg-black/45 backdrop-blur-[1px] lg:hidden"
                onClick={handleCloseMobileFilters}
                aria-label="Close filters"
              />
            )}
          </AnimatePresence>

        <motion.aside
          layout
          initial={false}
          animate={
            isDesktopViewport
              ? { width: isDesktopFiltersCollapsed ? 84 : 288 }
              : { width: "100%" }
          }
          transition={{ type: "spring", stiffness: 260, damping: 28 }}
          className={`
          fixed inset-x-0 bottom-0 z-50 lg:relative lg:inset-auto lg:block w-full shrink-0
          max-h-[88vh] rounded-t-2xl border-t border-border/60 shadow-2xl lg:max-h-none lg:rounded-none lg:border-0 lg:shadow-none
          bg-background lg:bg-transparent transition-transform duration-300 ease-out
          ${isMobileFiltersOpen ? "translate-y-0" : "translate-y-full lg:translate-y-0"}
          ${isDesktopFiltersCollapsed ? "lg:w-[84px]" : "lg:w-72"}
        `}
        >
          <Card
            className={`flex h-full max-h-[88vh] flex-col lg:h-[calc(100vh-6rem)] lg:max-h-none lg:sticky lg:top-24 rounded-t-2xl lg:rounded-2xl border-0 shadow-none overflow-hidden ${
              isDesktopFiltersCollapsed && isDesktopViewport ? "p-3" : "lg:p-5 xl:p-6"
            }`}
          >
            <div className="lg:hidden shrink-0 border-b border-border/60 bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/80">
              <div className="flex justify-center pt-2">
                <span className="h-1 w-10 rounded-full bg-muted-foreground/25" aria-hidden />
              </div>
              <div className="flex items-center justify-between gap-3 px-4 pb-3 pt-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-bold tracking-tight">Filters</h2>
                    {hasActiveFilters && (
                      <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary/10 px-1.5 text-[10px] font-bold text-primary tabular-nums">
                        {selectedBrands.length + (selectedCategory ? 1 : 0)}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {isLoading ? "Loading..." : `${mobileFilterResultsCount} items`}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleCloseMobileFilters}
                  className="h-8 shrink-0 rounded-lg border-border/60 px-2.5 text-xs font-semibold"
                  aria-label="Close filters"
                >
                  <X className="h-3.5 w-3.5 mr-1" />
                  Close
                </Button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto overscroll-contain scroll-smooth px-4 py-3 lg:px-0 lg:py-0">
            <div className="hidden lg:flex items-center justify-end gap-3 mb-5">
              <span className="sr-only">Filters</span>
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="rounded-xl border-border/60 bg-background/60 hover:bg-muted/40"
                onClick={() => setIsDesktopFiltersCollapsed((v) => !v)}
                aria-label={isDesktopFiltersCollapsed ? "Expand filters sidebar" : "Collapse filters sidebar"}
              >
                {isDesktopFiltersCollapsed ? (
                  <ChevronRight className="h-4 w-4" />
                ) : (
                  <ChevronLeft className="h-4 w-4" />
                )}
              </Button>
            </div>

            {/* Category Filter */}
            <AnimatePresence initial={false}>
              {showExpandedFilterContent && allCategories.length > 0 ? (
                <motion.section
                  key="categories-expanded"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="mb-4 lg:mb-6 overflow-hidden"
                >
                  <div className="flex items-center justify-between gap-3 mb-2 lg:mb-3">
                    <h3 className="text-[10px] lg:text-[11px] font-black uppercase tracking-widest text-muted-foreground">
                      Categories
                    </h3>
                    {selectedCategory && (
                      <button
                        type="button"
                        onClick={() => updateUrlParams({ category: null })}
                        className="text-[10px] lg:text-[11px] font-bold text-primary hover:underline underline-offset-4"
                        aria-label="Clear category filter"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                  <div className="rounded-xl lg:rounded-2xl border border-border/60 bg-muted/20 lg:bg-background/60 p-1.5 lg:p-2.5 max-h-[180px] lg:max-h-[320px] overflow-y-auto pr-1 lg:pr-2 scrollbar-thin scrollbar-thumb-primary/10">
                    {allCategories.map((category) => (
                      <label
                        key={category}
                        className="flex items-center gap-2.5 rounded-lg lg:rounded-xl px-2 py-1.5 lg:px-2.5 lg:py-2 hover:bg-muted/40 transition-colors cursor-pointer"
                      >
                        <Checkbox
                          id={`category-${category}`}
                          checked={selectedCategory === category}
                          onCheckedChange={() => handleCategoryChange(category)}
                          className="h-4 w-4 lg:h-5 lg:w-5 rounded-md border-2 border-primary/20 data-[state=checked]:bg-primary data-[state=checked]:border-primary transition-all"
                        />
                        <span
                          className={`text-xs lg:text-sm font-semibold lg:font-bold transition-colors line-clamp-2 ${
                            selectedCategory === category
                              ? "text-primary"
                              : "text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          {category}
                        </span>
                      </label>
                    ))}
                  </div>
                </motion.section>
              ) : null}
            </AnimatePresence>

            {/* Brand Filter */}
            <AnimatePresence initial={false}>
              {showExpandedFilterContent && brands.length > 0 ? (
                <motion.section
                  key="brands-expanded"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="mb-4 lg:mb-6 overflow-hidden"
                >
                  <div className="flex items-center justify-between gap-3 mb-2 lg:mb-3">
                    <h3 className="text-[10px] lg:text-[11px] font-black uppercase tracking-widest text-muted-foreground">
                      Brands
                    </h3>
                    {selectedBrands.length > 0 && (
                      <button
                        type="button"
                        onClick={() => updateUrlParams({ brands: [] })}
                        className="text-[10px] lg:text-[11px] font-bold text-primary hover:underline underline-offset-4"
                        aria-label="Clear brand filters"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                  <div className="rounded-xl lg:rounded-2xl border border-border/60 bg-muted/20 lg:bg-background/60 p-1.5 lg:p-2.5 max-h-[160px] lg:max-h-[240px] overflow-y-auto pr-1 lg:pr-2 scrollbar-thin scrollbar-thumb-primary/10">
                    {brands.map((brand) => (
                      <label
                        key={brand.name}
                        className="flex items-center justify-between gap-2 rounded-lg lg:rounded-xl px-2 py-1.5 lg:px-2.5 lg:py-2 hover:bg-muted/40 transition-colors cursor-pointer"
                      >
                        <div className="flex items-center gap-2.5 flex-1 min-w-0">
                          <Checkbox
                            id={`brand-${brand.name}`}
                            checked={selectedBrands.includes(brand.name)}
                            onCheckedChange={() => handleBrandToggle(brand.name)}
                            className="h-4 w-4 lg:h-5 lg:w-5 rounded-md border-2 border-primary/20 data-[state=checked]:bg-primary data-[state=checked]:border-primary transition-all"
                          />
                          <span
                            className={`text-xs lg:text-sm font-semibold lg:font-bold transition-colors truncate ${
                              selectedBrands.includes(brand.name)
                                ? "text-primary"
                                : "text-muted-foreground hover:text-foreground"
                            }`}
                          >
                            {brand.name}
                          </span>
                        </div>
                        <span className="text-[10px] lg:text-xs text-muted-foreground font-semibold tabular-nums shrink-0">
                          {brand.count}
                        </span>
                      </label>
                    ))}
                  </div>
                </motion.section>
              ) : null}
            </AnimatePresence>

            {hasActiveFilters ? (
              isDesktopFiltersCollapsed && isDesktopViewport ? (
                <div className="hidden lg:flex flex-col gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="rounded-xl border-primary/20 text-primary hover:bg-primary/5 h-11 w-full"
                    onClick={handleClearFilters}
                    aria-label="Reset all filters"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                  <div className="flex items-center justify-center">
                    <span
                      className="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-primary/10 px-2 text-xs font-bold text-primary tabular-nums"
                      aria-label="Active filters count"
                    >
                      {selectedBrands.length + (selectedCategory ? 1 : 0)}
                    </span>
                  </div>
                </div>
              ) : (
                <Button
                  variant="outline"
                  className="hidden lg:flex w-full rounded-xl border-primary/20 text-primary font-bold hover:bg-primary/5 h-11 transition-all bg-transparent"
                  onClick={handleClearFilters}
                >
                  Reset All Filters
                </Button>
              )
            ) : null}
            </div>

            <div className="lg:hidden shrink-0 border-t border-border/60 bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/80 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
              <div className="flex items-center gap-2">
                {hasActiveFilters && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleClearFilters}
                    className="h-10 shrink-0 rounded-xl border-primary/20 px-4 text-xs font-bold text-primary"
                  >
                    Clear all
                  </Button>
                )}
                <Button
                  type="button"
                  onClick={handleCloseMobileFilters}
                  className="h-10 flex-1 rounded-xl font-bold text-sm shadow-md shadow-primary/15"
                >
                  Show {mobileFilterResultsCount} results
                </Button>
              </div>
            </div>
          </Card>
        </motion.aside>
        </>
        )}

        {/* Products Grid */}
        <div className="flex-1">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 mb-8">
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-3xl font-black tracking-tighter">
                  {tagFromUrl
                    ? `Tag: ${tagFromUrl}`
                    : taggedFromUrl
                    ? "Hot Deals & Trending Products"
                    : effectivePreviouslyBought
                    ? "Previously Bought Items"
                    : (selectedCategory || "All Products")}
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
            <div className="rounded-2xl border border-border/60 bg-muted/20 p-4 sm:p-5 overflow-visible space-y-5">
              {/* Row 1: Items, Sort */}
              <div className="flex flex-wrap items-center gap-4 sm:gap-6">
                <div className="flex items-center gap-4 min-w-0">
                  <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground shrink-0">
                    Items
                  </span>
                  <Select value={String(pageSize)} onValueChange={handlePageSizeChange}>
                    <SelectTrigger size="sm" className="w-[104px] rounded-lg shrink-0">
                      <SelectValue placeholder="20" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="20">20</SelectItem>
                      <SelectItem value="50">50</SelectItem>
                      <SelectItem value="100">100</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-4 min-w-0">
                  <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground shrink-0">
                    Sort
                  </span>
                  <Select value={sortBy} onValueChange={handleSortByChange}>
                    <SelectTrigger size="sm" className="w-[170px] rounded-lg shrink-0">
                      <SelectValue placeholder="Recommended" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="recommended">Recommended</SelectItem>
                      <SelectItem value="name-asc">A → Z</SelectItem>
                      <SelectItem value="name-desc">Z → A</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Row 2: View (Grid/List), Column selector */}
              <div className="flex flex-wrap items-center gap-6 sm:gap-8 pt-4 border-t border-border/40">
                {/* View mode */}
                <div className="flex items-center gap-4 min-w-0">
                  <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground shrink-0">
                    View
                  </span>
                  <div className="flex items-center gap-1 rounded-xl border border-border/60 bg-background/60 p-1 shrink-0">
                    <Button
                      type="button"
                      variant={viewMode === "grid" ? "secondary" : "ghost"}
                      size="sm"
                      onClick={() => handleViewModeChange("grid")}
                      className="h-8 rounded-lg px-3 font-bold cursor-pointer"
                      aria-label="Grid view"
                    >
                      <LayoutGrid className="h-4 w-4" />
                      <span className="hidden sm:inline">Grid</span>
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
                      <span className="hidden sm:inline">List</span>
                    </Button>
                  </div>
                </div>

                {/* Grid columns */}
                {viewMode === "grid" && (
                  <div className="flex items-center gap-1 rounded-xl border border-border/60 bg-background/60 p-1 shrink-0">
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
                )}
              </div>
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
                        customerPriceMargin={product.customer_price_margin}
                      />
                    )
                  })}
                </motion.div>

                {/* Infinite Scroll Trigger */}
                {hasNextPage && (
                  <div ref={observerTarget} className="mt-8">
                    {isLoadingMore ? (
                      <div className="space-y-4">
                        <div className="fixed bottom-5 left-1/2 z-50 -translate-x-1/2 px-4">
                          <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/95 px-4 py-2 text-muted-foreground shadow-xl shadow-primary/10 backdrop-blur">
                            <Loader2 className="h-5 w-5 animate-spin text-primary" />
                            <span className="text-sm font-semibold">Loading more products…</span>
                          </div>
                        </div>
                        {sortedProducts.length >= pageSize && (
                          <div
                            className={viewMode === "grid"
                              ? gridClassName
                              : "space-y-3"
                            }
                            aria-label="Loading more products"
                          >
                            {Array.from({
                              length:
                                viewMode === "grid"
                                  ? Math.min(12, Math.max(8, Math.floor(pageSize / 5)))
                                  : Math.min(8, Math.max(4, Math.floor(pageSize / 10))),
                            }).map((_, i) => (
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
