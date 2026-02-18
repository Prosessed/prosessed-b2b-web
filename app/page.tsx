"use client"

import { AnimatedBanner } from "@/components/animated-banner"
import { CategoryGrid } from "@/components/category-grid"
import { Footer } from "@/components/footer"
import { HeroCarousel } from "@/components/hero-carousel"
import { ProductRow } from "@/components/product-row"
import { StickyDealCards } from "@/components/sticky-deal-cards"
import { TaggedProductsRow } from "@/components/tagged-products-row"
import { Skeleton } from "@/components/ui/skeleton"
import { useBannersAndDeals } from "@/lib/api/hooks"
import { Apple, Coffee, Fish, Milk, Package, Wheat } from "lucide-react"

const categories = [
  { name: "Fruits & Vegetables", icon: Apple, href: "/products?category=fruits" },
  { name: "Beverages", icon: Coffee, href: "/products?category=beverages" },
  { name: "Dairy & Eggs", icon: Milk, href: "/products?category=dairy" },
  { name: "Grains & Cereals", icon: Wheat, href: "/products?category=grains" },
  { name: "Packaged Foods", icon: Package, href: "/products?category=packaged" },
  { name: "Fresh Seafood", icon: Fish, href: "/products?category=seafood" },
]

const bannerItems = [
  { text: "🎉 Welcome Offer: Get 40% OFF on your first order!", bgColor: "oklch(0.52 0.18 145)", textColor: "white" },
  { text: "⚡ Free Delivery on orders above $100", bgColor: "oklch(0.58 0.2 145)", textColor: "white" },
  { text: "🚀 10-minute delivery for urgent orders", bgColor: "oklch(0.52 0.18 145)", textColor: "white" },
  { text: "💳 Easy payment options available", bgColor: "oklch(0.58 0.2 145)", textColor: "white" },
]

const defaultHeroBanners = [
  {
    id: "1",
    image: "/hero-banner-1.jpg",
    title: "Fresh Produce Delivered Fast",
    subtitle: "Get your favorite groceries in 10 minutes",
    ctaText: "Shop Now",
    ctaLink: "/products?category=fruits",
  },
  {
    id: "2",
    image: "/hero-banner-2.jpg",
    title: "Bulk Orders Made Easy",
    subtitle: "Special prices for businesses & restaurants",
    ctaText: "View Products",
    ctaLink: "/products",
  },
  {
    id: "3",
    image: "/hero-banner-3.jpg",
    title: "Premium Quality Assured",
    subtitle: "Sourced directly from trusted suppliers",
    ctaText: "Explore Categories",
    ctaLink: "/products",
  },
  {
    id: "4",
    image: "/hero-banner-4.jpg",
    title: "Save Big on Daily Essentials",
    subtitle: "Up to 40% off on selected items",
    ctaText: "View Offers",
    ctaLink: "/products",
  },
]

export default function HomePage() {
  const { data, isLoading } = useBannersAndDeals()

  const heroBanners = (data?.banners || []).map((banner, index) => ({
    id: String(index),
    image_url: banner.image_url,
    image: banner.image_url,
    title: banner.title,
    subtitle: banner.subtitle,
    redirect_url: banner.redirect_url,
  }))

  const displayBanners = heroBanners.length > 0 ? heroBanners : defaultHeroBanners

  return (
    <div className="min-h-screen bg-background/50">
      <AnimatedBanner items={bannerItems} />

      <div className="container mx-auto px-4 py-6">
        {isLoading ? (
          <Skeleton className="aspect-video rounded-lg" />
        ) : (
          <HeroCarousel banners={displayBanners} />
        )}
      </div>

      <div className="container mx-auto px-4 pb-12">
        <StickyDealCards />
        <ProductRow
          title="Previously Bought Items"
          itemGroup=""
          categoryHref="/products?previously_bought=true"
          pageSize={10}
        />
        <TaggedProductsRow
          title="Hot Deals & Trending Products"
          categoryHref="/products?tagged=true"
          pageSize={10}
          showTagFilter={false}
        />
        <CategoryGrid />

        {/* <ProductRow title="Dairy, Bread & Eggs" itemGroup="Dairy & Bakery" categoryHref="/products?category=dairy" />

        <ProductRow title="Snacks & Munchies" itemGroup="Snacks & Munchies" categoryHref="/products?category=snacks" />

        <ProductRow
          title="Fresh Fruits & Vegetables"
          itemGroup="Fruits & Vegetables"
          categoryHref="/products?category=fruits"
        /> */}
      </div>

      <Footer />
    </div>
  )
}
