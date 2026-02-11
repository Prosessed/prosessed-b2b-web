"use client"

import Link from "next/link"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowRight, Sparkles, Tag, Zap } from "lucide-react"
import { motion } from "framer-motion"
import Image from "next/image"
import { useBannersAndDeals } from "@/lib/api/hooks"
import { Skeleton } from "@/components/ui/skeleton"
import { getApiBaseUrl } from "@/lib/api/client"
import { getDisplayImageUrl } from "@/lib/utils/image-url"

const defaultDeals = [
  {
    id: "1",
    title: "Flash Sale",
    subtitle: "Up to 50% OFF",
    description: "Limited time offer on selected items",
    image: "https://images.unsplash.com/photo-1607082349566-187342175e2f?w=800&h=400&fit=crop",
    ctaText: "Shop Now",
    ctaLink: "/products?deal=flash-sale",
    badge: "Hot Deal",
    icon: Zap,
    gradient: "from-orange-500 to-red-500",
  },
]

export function StickyDealCards() {
  const { data, isLoading } = useBannersAndDeals()
  
  const deals = (data?.deals || []).map((deal, index) => ({
    id: String(index),
    title: deal.title,
    subtitle: "",
    description: deal.tag || "Special Deal",
    image: deal.image_url || "/placeholder.svg",
    ctaText: "View Deal",
    ctaLink: deal.redirect_url || "/products",
    badge: deal.tag || "Hot Deal",
    icon: index % 3 === 0 ? Zap : index % 3 === 1 ? Sparkles : Tag,
    gradient: index % 3 === 0 ? "from-orange-500 to-red-500" : index % 3 === 1 ? "from-blue-500 to-purple-500" : "from-green-500 to-emerald-500",
  }))

  const displayDeals = deals.length > 0 ? deals : defaultDeals
  
  if (isLoading) {
    return (
      <section className="py-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-3xl font-black tracking-tight">Special Deals</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="aspect-video rounded-lg" />
          ))}
        </div>
      </section>
    )
  }
  return (
    <section className="py-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-3xl font-black tracking-tight">Special Deals</h2>
        <Link
          href="/products"
          className="text-sm font-bold text-primary hover:text-primary/90 flex items-center gap-1.5 transition-colors"
        >
          View all
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {displayDeals.map((deal, index) => (
          <motion.div
            key={deal.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
            whileHover={{ y: -4 }}
          >
            <Link href={deal.ctaLink}>
              <Card className="overflow-hidden hover:shadow-2xl transition-all duration-300 border-2 border-border/30 hover:border-primary/30 group h-full relative">
                {/* Background Image */}
                <div className="absolute inset-0">
                  <Image
                    src={getDisplayImageUrl(deal.image, getApiBaseUrl()) || "/placeholder.svg"}
                    alt={deal.title}
                    fill
                    className="object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className={`absolute inset-0 bg-gradient-to-br ${deal.gradient} opacity-60 group-hover:opacity-70 transition-opacity`} />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
                </div>
                
                {/* Content */}
                <div className="relative p-6 flex flex-col h-full min-h-[200px]">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <Badge className="mb-2 bg-white/20 backdrop-blur-sm text-white border-white/30 font-bold">
                        {deal.badge}
                      </Badge>
                      <h3 className="text-2xl font-black mb-1 text-white">{deal.title}</h3>
                      <p className="text-lg font-bold text-white mb-2">{deal.subtitle}</p>
                      <p className="text-sm text-white/90">{deal.description}</p>
                    </div>
                    <div className={`p-3 rounded-xl bg-white/20 backdrop-blur-sm text-white shadow-lg border border-white/30`}>
                      <deal.icon className="h-6 w-6" />
                    </div>
                  </div>
                  <div className="mt-auto">
                    <div className="flex items-center gap-2 text-white font-bold group-hover:gap-3 transition-all bg-white/20 backdrop-blur-sm px-4 py-2 rounded-lg w-fit border border-white/30">
                      <span>{deal.ctaText}</span>
                      <ArrowRight className="h-4 w-4" />
                    </div>
                  </div>
                </div>
              </Card>
            </Link>
          </motion.div>
        ))}
      </div>
    </section>
  )
}
