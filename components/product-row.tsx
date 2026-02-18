"use client"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ChevronRight } from "lucide-react"
import { useItems, useMostBoughtItems } from "@/lib/api/hooks"
import { SkeletonProductRow } from "./skeleton-card"
import { ProductCard } from "@/components/product-card"
import { motion } from "framer-motion"

interface ProductRowProps {
  title: string
  itemGroup: string
  categoryHref?: string
  pageSize?: number
}

export function ProductRow({ title, itemGroup, categoryHref = "/products", pageSize = 6 }: ProductRowProps) {
  const isPreviouslyBought = title === "Previously Bought Items" || categoryHref.includes("previously_bought")
  
  const { data: itemsData, isLoading: itemsLoading } = useItems({ 
    item_group: !isPreviouslyBought && itemGroup ? itemGroup : undefined, 
    page_size: !isPreviouslyBought ? pageSize : undefined
  })
  
  const { data: mostBoughtData, isLoading: mostBoughtLoading } = useMostBoughtItems(
    isPreviouslyBought ? {
      page_size: pageSize,
      time_frame: "6 months",
    } : undefined
  )

  const isLoading = isPreviouslyBought ? mostBoughtLoading : itemsLoading
  const products = isPreviouslyBought 
     ? (mostBoughtData?.message?.items || mostBoughtData?.message?.data || mostBoughtData?.items || []) 
    : (itemsData?.message?.items || itemsData?.message?.data || itemsData?.items || [])

  if (isPreviouslyBought && process.env.NODE_ENV === "development") {
    console.log(`[ProductRow] Previously Bought - Loading: ${mostBoughtLoading}, Items: ${products.length}`, {
      hasMessage: !!mostBoughtData?.message,
      messageItems: mostBoughtData?.message?.items?.length || 0,
      directItems: mostBoughtData?.items?.length || 0,
      data: mostBoughtData
    })
  }

  if (isLoading) return <SkeletonProductRow />
  
  if (isPreviouslyBought && products.length === 0 && !isLoading) return null

  return (
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
        className={pageSize >= 10 
          ? "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6"
          : "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6"
        }
      >
        {products.map((product: any) => {
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
  )
}
