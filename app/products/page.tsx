"use client"

import { useState, useMemo } from "react"
import { ProductCard } from "@/components/product-card"
import { SkeletonCard } from "@/components/skeleton-card"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card } from "@/components/ui/card"
import { useItems } from "@/lib/api/hooks"
import { motion, AnimatePresence } from "framer-motion"
import { Filter, X } from "lucide-react"

export default function ProductsPage() {
  const [sortBy, setSortBy] = useState("relevance")
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [selectedBrands, setSelectedBrands] = useState<string[]>([])
  const [showDealsOnly, setShowDealsOnly] = useState(false)
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false)

  // Fetching real data using our custom hook
  // We use the first selected category if any, otherwise broad search
  const { data, isLoading, isValidating } = useItems({
    item_group: selectedCategories.length > 0 ? selectedCategories[0] : undefined,
    page_size: 40,
  })

  const products = data?.message?.items || []
  const brands = data?.message?.brands?.map((b: any) => Object.keys(b)[0]).filter((b: string) => b !== "None") || []
  const categories = ["Dairy & Bakery", "Fruits & Vegetables", "Snacks & Munchies", "Beverages", "Grains", "Seafood"]

  const handleCategoryToggle = (category: string) => {
    setSelectedCategories((prev) => (prev.includes(category) ? prev.filter((c) => c !== category) : [category]))
  }

  const handleBrandToggle = (brand: string) => {
    setSelectedBrands((prev) => (prev.includes(brand) ? prev.filter((b) => b !== brand) : [...prev, brand]))
  }

  const filteredProducts = useMemo(() => {
    let result = [...products]
    if (selectedBrands.length > 0) {
      result = result.filter((p) => selectedBrands.includes(p.brand))
    }
    // Note: sorting usually happens server-side, but we implement client-side for immediate feedback
    if (sortBy === "price-low") result.sort((a, b) => a.rate - b.rate)
    if (sortBy === "price-high") result.sort((a, b) => b.rate - a.rate)
    return result
  }, [products, selectedBrands, sortBy])

  return (
    <div className="container mx-auto px-4 py-8 bg-background/50 min-h-screen">
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
          </Button>
          <div className="text-sm font-medium text-muted-foreground">{filteredProducts.length} items</div>
        </div>

        {/* Filters Sidebar */}
        <aside
          className={`
          fixed inset-0 z-[100] lg:relative lg:inset-auto lg:block w-full lg:w-72 shrink-0
          bg-background lg:bg-transparent transition-transform duration-300
          ${isMobileFiltersOpen ? "translate-x-0" : "translate-x-full lg:translate-x-0"}
        `}
        >
          <Card className="h-full lg:h-auto p-6 lg:sticky lg:top-24 rounded-none lg:rounded-2xl border-0 lg:border shadow-none lg:shadow-xl shadow-primary/5">
            <div className="flex items-center justify-between mb-6 lg:hidden">
              <h2 className="text-xl font-bold">Filters</h2>
              <Button variant="ghost" size="icon" onClick={() => setIsMobileFiltersOpen(false)}>
                <X className="h-6 w-6" />
              </Button>
            </div>

            <h2 className="hidden lg:block text-xl font-black mb-6 tracking-tight">Refine Results</h2>

            {/* Category Filter */}
            <div className="mb-8">
              <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-4">Categories</h3>
              <div className="space-y-3">
                {categories.map((category) => (
                  <label key={category} className="flex items-center gap-3 group cursor-pointer">
                    <div className="relative flex items-center justify-center">
                      <Checkbox
                        id={`category-${category}`}
                        checked={selectedCategories.includes(category)}
                        onCheckedChange={() => handleCategoryToggle(category)}
                        className="h-5 w-5 rounded-md border-2 border-primary/20 data-[state=checked]:bg-primary data-[state=checked]:border-primary transition-all"
                      />
                    </div>
                    <span
                      className={`text-sm font-bold transition-colors ${selectedCategories.includes(category) ? "text-primary" : "text-muted-foreground group-hover:text-foreground"}`}
                    >
                      {category}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Brand Filter */}
            {brands.length > 0 && (
              <div className="mb-8">
                <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-4">Brands</h3>
                <div className="space-y-3 max-h-[200px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-primary/10">
                  {brands.map((brand) => (
                    <label key={brand} className="flex items-center gap-3 group cursor-pointer">
                      <Checkbox
                        id={`brand-${brand}`}
                        checked={selectedBrands.includes(brand)}
                        onCheckedChange={() => handleBrandToggle(brand)}
                        className="h-5 w-5 rounded-md border-2 border-primary/20 data-[state=checked]:bg-primary data-[state=checked]:border-primary transition-all"
                      />
                      <span
                        className={`text-sm font-bold transition-colors ${selectedBrands.includes(brand) ? "text-primary" : "text-muted-foreground group-hover:text-foreground"}`}
                      >
                        {brand}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            <Button
              variant="outline"
              className="w-full rounded-xl border-primary/20 text-primary font-bold hover:bg-primary/5 h-11 transition-all bg-transparent"
              onClick={() => {
                setSelectedCategories([])
                setSelectedBrands([])
                setShowDealsOnly(false)
                setIsMobileFiltersOpen(false)
              }}
            >
              Reset All
            </Button>
          </Card>
        </aside>

        {/* Products Grid */}
        <div className="flex-1">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div className="space-y-1">
              <h1 className="text-3xl font-black tracking-tighter">
                {selectedCategories.length > 0 ? selectedCategories[0] : "All Products"}
              </h1>
              <p className="text-sm font-medium text-muted-foreground">
                {isLoading ? "Fetching latest inventory..." : `Found ${filteredProducts.length} premium quality items`}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-48 h-11 rounded-xl border-primary/10 bg-background shadow-sm font-bold">
                  <SelectValue placeholder="Sort By" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-primary/10">
                  <SelectItem value="relevance">Recommended</SelectItem>
                  <SelectItem value="price-low">Price: Low to High</SelectItem>
                  <SelectItem value="price-high">Price: High to Low</SelectItem>
                  <SelectItem value="popularity">Fastest Delivery</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <AnimatePresence mode="popLayout">
            {isLoading && !products.length ? (
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
            ) : filteredProducts.length > 0 ? (
              <motion.div key="product-grid" layout className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredProducts.map((product) => (
                  <ProductCard
                    key={product.item_code}
                    id={product.item_code}
                    name={product.item_name}
                    price={product.rate}
                    image={product.image}
                    unit={product.stock_uom}
                  />
                ))}
              </motion.div>
            ) : (
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
                <Button
                  onClick={() => setSelectedCategories([])}
                  className="mt-6 bg-primary font-bold h-11 px-8 rounded-xl"
                >
                  Clear all filters
                </Button>
              </motion.div>
            )}
          </AnimatePresence>

          {isValidating && products.length > 0 && (
            <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[100]">
              <div className="bg-primary text-primary-foreground px-4 py-2 rounded-full shadow-2xl flex items-center gap-2 text-sm font-bold animate-in fade-in slide-in-from-bottom-4">
                <div className="h-3 w-3 rounded-full bg-primary-foreground animate-ping" />
                Syncing latest prices...
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
