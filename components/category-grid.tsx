"use client"

import Link from "next/link"
import Image from "next/image"
import { CategoryGridSkeleton } from "./category-grid-skeleton"
import { useItemGroupTree, type ItemGroupNode } from "@/hooks/useItemGroupTree"

// Helper function to recursively flatten all children
const flattenChildren = (node: ItemGroupNode): ItemGroupNode[] => {
  const result: ItemGroupNode[] = []
  
  if (node.children && Array.isArray(node.children)) {
    for (const child of node.children) {
      // Add the child itself
      result.push(child)
      // Recursively add all nested children
      result.push(...flattenChildren(child))
    }
  }
  
  return result
}

interface CategoryWithSubcategories {
  parent: ItemGroupNode
  subcategories: ItemGroupNode[]
}

export function CategoryGrid() {
  const { data, isLoading } = useItemGroupTree(false)

  if (isLoading) return <CategoryGridSkeleton />

  if (!data || !Array.isArray(data)) return null

  // Extract parent categories (top-level children of "All Item Groups")
  let parentCategories: ItemGroupNode[] = []
  
  if (data.length > 0) {
    const rootItem = data[0]
    if (rootItem?.children && Array.isArray(rootItem.children) && rootItem.children.length > 0) {
      parentCategories = rootItem.children
    } else {
      parentCategories = data.filter((item) => item.value !== "All Item Groups")
    }
  }

  // Separate categories with children vs individual (no children or empty)
  const categoriesWithSubcategories: CategoryWithSubcategories[] = []
  const individualCategories: ItemGroupNode[] = []

  parentCategories.forEach((parent) => {
    const subcategories = flattenChildren(parent)
    const hasChildren = parent.children && Array.isArray(parent.children) && parent.children.length > 0
    
    if (hasChildren && subcategories.length > 0) {
      categoriesWithSubcategories.push({ parent, subcategories })
    } else {
      individualCategories.push(parent)
    }
  })

  // Sort categories with subcategories
  categoriesWithSubcategories.sort((a, b) => {
    const rankA = a.parent.custom_priority_rank ? Number(a.parent.custom_priority_rank) : 999
    const rankB = b.parent.custom_priority_rank ? Number(b.parent.custom_priority_rank) : 999
    return rankA - rankB
  })

  // Sort individual categories
  individualCategories.sort((a, b) => {
    const rankA = a.custom_priority_rank ? Number(a.custom_priority_rank) : 999
    const rankB = b.custom_priority_rank ? Number(b.custom_priority_rank) : 999
    return rankA - rankB
  })

  return (
    <section className="py-8 space-y-8">
      {categoriesWithSubcategories.map(({ parent, subcategories }) => (
        <div key={parent.value} className="space-y-4">
          <div className="flex-1 h-px bg-border" />
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-bold text-foreground">{parent.label || parent.title || parent.value}</h3>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-4">
            {subcategories
              .sort((a, b) => {
                const rankA = a.custom_priority_rank ? Number(a.custom_priority_rank) : 999
                const rankB = b.custom_priority_rank ? Number(b.custom_priority_rank) : 999
                return rankA - rankB
              })
              .map((subcategory) => (
                <Link
                  key={subcategory.value}
                  href={`/products?category=${encodeURIComponent(subcategory.value)}`}
                  className="flex flex-col items-center gap-2 p-3 rounded-lg hover:bg-muted/50 transition-colors group"
                >
                  <div className="relative h-20 w-20 rounded-full overflow-hidden bg-muted">
                    <Image
                      src={subcategory.image || "/placeholder.svg"}
                      alt={subcategory.label || subcategory.title || subcategory.value}
                      fill
                      className="object-cover group-hover:scale-110 transition-transform duration-200"
                    />
                  </div>
                  <p className="text-xs text-center font-medium line-clamp-2 leading-tight">
                    {subcategory.label || subcategory.title || subcategory.value}
                  </p>
                </Link>
              ))}
          </div>
        </div>
      ))}
      
      {individualCategories.length > 0 && (
        <div className="space-y-4">
          <div className="flex-1 h-px bg-border" />
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-bold text-foreground">Individual</h3>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-4">
            {individualCategories.map((category) => (
              <Link
                key={category.value}
                href={`/products?category=${encodeURIComponent(category.value)}`}
                className="flex flex-col items-center gap-2 p-3 rounded-lg hover:bg-muted/50 transition-colors group"
              >
                <div className="relative h-20 w-20 rounded-full overflow-hidden bg-muted">
                  <Image
                    src={category.image || "/placeholder.svg"}
                    alt={category.label || category.title || category.value}
                    fill
                    className="object-cover group-hover:scale-110 transition-transform duration-200"
                  />
                </div>
                <p className="text-xs text-center font-medium line-clamp-2 leading-tight">
                  {category.label || category.title || category.value}
                </p>
              </Link>
            ))}
          </div>
        </div>
      )}
    </section>
  )
}
