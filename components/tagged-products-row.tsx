"use client"
import { ProductCard } from "@/components/product-card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useTaggedItems } from "@/lib/api/hooks"
import { parseTags } from "@/lib/utils/tags"
import { motion } from "framer-motion"
import { ChevronRight } from "lucide-react"
import Link from "next/link"
import { SkeletonProductRow } from "./skeleton-card"

interface TaggedProductsRowProps {
  title?: string
  warehouse?: string
  categoryHref?: string
  pageSize?: number
  showTagFilter?: boolean
}

export function TaggedProductsRow({
  title = "Tagged Products",
  warehouse,
  categoryHref = "/products",
  pageSize = 10,
  showTagFilter = false
}: TaggedProductsRowProps) {
  const { data: itemsData, isLoading } = useTaggedItems(warehouse)

  const products = Array.isArray(itemsData) ? itemsData : []

  // Group products by tags for display
  const tagGroups = new Map<string, typeof products>()

  products.forEach((product) => {
    const tags = parseTags(product.tags)
    tags.forEach((tag: string) => {
      if (!tagGroups.has(tag)) {
        tagGroups.set(tag, [])
      }
      tagGroups.get(tag)!.push(product)
    })
  })

  if (isLoading) return <SkeletonProductRow />

  if (products.length === 0) return null

  return (
    <>
      {/* Show all tagged products */}
      <section className="py-10">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-3xl font-black tracking-tight">{title}</h2>
          <Button variant="ghost" asChild className="text-primary hover:text-primary/90 font-bold text-sm">
            <Link href={categoryHref} className="flex items-center gap-1.5 hover:gap-2 transition-all">
              see all
              <ChevronRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6"
        >
          {products.slice(0, pageSize).map((product: any) => {
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
                unit={product.default_sales_uom || product.stock_uom || product.uom}
                stock={product.actual_qty}
                tags={product.tags}
              />
            )
          })}
        </motion.div>
      </section>

      {/* Show sections by tags if enabled */}
      {showTagFilter && tagGroups.size > 0 && (
        <>
          {Array.from(tagGroups.entries()).map(([tag, tagProducts]) => (
            <section key={tag} className="py-10">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <h3 className="text-2xl font-bold tracking-tight">{tag}</h3>
                  <Badge variant="secondary" className="text-lg px-3 py-1">
                    {tagProducts.length}
                  </Badge>
                </div>
                <Button variant="ghost" asChild className="text-primary hover:text-primary/90 font-bold text-sm">
                  <Link href={`${categoryHref}?tag=${encodeURIComponent(tag)}`} className="flex items-center gap-1.5 hover:gap-2 transition-all">
                    see all
                    <ChevronRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6"
              >
                {tagProducts.slice(0, 5).map((product: any) => {
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
                      unit={product.default_sales_uom || product.stock_uom || product.uom}
                      stock={product.actual_qty}
                      tags={product.tags}
                    />
                  )
                })}
              </motion.div>
            </section>
          ))}
        </>
      )}
    </>
  )
}
