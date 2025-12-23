"use client"

import { useState } from "react"
import { ProductCard } from "@/components/product-card"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card } from "@/components/ui/card"

// Mock data
const products = [
  {
    id: "1",
    name: "Organic Tomatoes",
    price: 12.99,
    image: "/ripe-tomatoes.png",
    category: "fruits",
    brand: "FreshCo",
  },
  { id: "2", name: "Fresh Avocados", price: 18.99, image: "/ripe-avocados.png", category: "fruits", brand: "FreshCo" },
  {
    id: "3",
    name: "Premium Olive Oil",
    price: 24.99,
    image: "/olive-oil-bottle.png",
    category: "packaged",
    brand: "Gourmet",
  },
  { id: "4", name: "Artisan Bread", price: 8.99, image: "/rustic-bread-loaf.png", category: "grains", brand: "Bakery" },
  {
    id: "5",
    name: "Greek Yogurt",
    price: 15.99,
    image: "/creamy-yogurt-bowl.png",
    category: "dairy",
    brand: "DairyCo",
  },
  { id: "6", name: "Bulk Rice 25kg", price: 45.99, image: "/rice-bag.png", category: "grains", brand: "GrainHub" },
  {
    id: "7",
    name: "Fresh Salmon Fillet",
    price: 32.99,
    image: "/fresh-salmon-fillet.png",
    category: "seafood",
    brand: "OceanFresh",
  },
  {
    id: "8",
    name: "Organic Honey 2L",
    price: 28.99,
    image: "/golden-honey-jar.png",
    category: "packaged",
    brand: "HoneyBee",
  },
  {
    id: "9",
    name: "Premium Coffee Beans",
    price: 34.99,
    image: "/pile-of-coffee-beans.png",
    category: "beverages",
    brand: "CoffeeCraft",
  },
  {
    id: "10",
    name: "Pasta Variety Pack",
    price: 22.99,
    image: "/colorful-pasta-arrangement.png",
    category: "packaged",
    brand: "Italiano",
  },
  {
    id: "11",
    name: "Organic Spinach",
    price: 9.99,
    image: "/fresh-spinach.png",
    category: "fruits",
    brand: "GreenLeaf",
  },
  {
    id: "12",
    name: "Cheddar Cheese Block",
    price: 16.99,
    image: "/aged-cheddar-cheese.png",
    category: "dairy",
    brand: "DairyCo",
  },
]

const categories = ["fruits", "beverages", "dairy", "grains", "packaged", "seafood"]
const brands = [
  "FreshCo",
  "Gourmet",
  "Bakery",
  "DairyCo",
  "GrainHub",
  "OceanFresh",
  "HoneyBee",
  "CoffeeCraft",
  "Italiano",
  "GreenLeaf",
]

export default function ProductsPage() {
  const [sortBy, setSortBy] = useState("relevance")
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [selectedBrands, setSelectedBrands] = useState<string[]>([])
  const [showDealsOnly, setShowDealsOnly] = useState(false)

  const handleCategoryToggle = (category: string) => {
    setSelectedCategories((prev) =>
      prev.includes(category) ? prev.filter((c) => c !== category) : [...prev, category],
    )
  }

  const handleBrandToggle = (brand: string) => {
    setSelectedBrands((prev) => (prev.includes(brand) ? prev.filter((b) => b !== brand) : [...prev, brand]))
  }

  const filteredProducts = products.filter((product) => {
    if (selectedCategories.length > 0 && !selectedCategories.includes(product.category)) return false
    if (selectedBrands.length > 0 && !selectedBrands.includes(product.brand)) return false
    return true
  })

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex gap-8">
        {/* Filters Sidebar */}
        <aside className="hidden lg:block w-64 shrink-0">
          <Card className="p-6 sticky top-24">
            <h2 className="text-lg font-bold mb-4">Filters</h2>

            {/* Category Filter */}
            <div className="mb-6">
              <h3 className="font-medium mb-3">Category</h3>
              <div className="space-y-2">
                {categories.map((category) => (
                  <div key={category} className="flex items-center gap-2">
                    <Checkbox
                      id={`category-${category}`}
                      checked={selectedCategories.includes(category)}
                      onCheckedChange={() => handleCategoryToggle(category)}
                    />
                    <Label htmlFor={`category-${category}`} className="text-sm capitalize cursor-pointer">
                      {category}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            {/* Brand Filter */}
            <div className="mb-6">
              <h3 className="font-medium mb-3">Brand</h3>
              <div className="space-y-2">
                {brands.map((brand) => (
                  <div key={brand} className="flex items-center gap-2">
                    <Checkbox
                      id={`brand-${brand}`}
                      checked={selectedBrands.includes(brand)}
                      onCheckedChange={() => handleBrandToggle(brand)}
                    />
                    <Label htmlFor={`brand-${brand}`} className="text-sm cursor-pointer">
                      {brand}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            {/* Deals Filter */}
            <div className="mb-6">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="deals"
                  checked={showDealsOnly}
                  onCheckedChange={(checked) => setShowDealsOnly(!!checked)}
                />
                <Label htmlFor="deals" className="text-sm cursor-pointer">
                  Deals Only
                </Label>
              </div>
            </div>

            {(selectedCategories.length > 0 || selectedBrands.length > 0 || showDealsOnly) && (
              <Button
                variant="outline"
                className="w-full bg-transparent border-border text-foreground hover:bg-accent hover:text-foreground"
                onClick={() => {
                  setSelectedCategories([])
                  setSelectedBrands([])
                  setShowDealsOnly(false)
                }}
              >
                Clear All Filters
              </Button>
            )}
          </Card>
        </aside>

        {/* Products Grid */}
        <div className="flex-1">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold">All Products</h1>
            <div className="flex items-center gap-2">
              <Label htmlFor="sort" className="text-sm text-muted-foreground">
                Sort by:
              </Label>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger id="sort" className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="relevance">Relevance</SelectItem>
                  <SelectItem value="price-low">Price: Low to High</SelectItem>
                  <SelectItem value="price-high">Price: High to Low</SelectItem>
                  <SelectItem value="popularity">Popularity</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="mb-4 text-sm text-muted-foreground">
            Showing {filteredProducts.length} of {products.length} products
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredProducts.map((product) => (
              <ProductCard key={product.id} {...product} />
            ))}
          </div>

          {filteredProducts.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No products found matching your filters.</p>
              <Button
                variant="outline"
                className="mt-4 bg-transparent border-border text-foreground hover:bg-accent hover:text-foreground"
                onClick={() => {
                  setSelectedCategories([])
                  setSelectedBrands([])
                  setShowDealsOnly(false)
                }}
              >
                Clear Filters
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
