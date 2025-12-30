import { Apple, Coffee, Milk, Wheat, Package, Fish } from "lucide-react"
import { AnimatedBanner } from "@/components/animated-banner"
import { StickyDealCards } from "@/components/sticky-deal-cards"
import { CategoryGrid } from "@/components/category-grid"
import { ProductRow } from "@/components/product-row"
import { Footer } from "@/components/footer"
import { HeroCarousel } from "@/components/hero-carousel"

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

const heroBanners = [
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
    ctaText: "View Deals",
    ctaLink: "/deals",
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
    ctaLink: "/deals",
  },
]

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background/50">
      <AnimatedBanner items={bannerItems} />

      <div className="container mx-auto px-4 py-6">
        <HeroCarousel banners={heroBanners} />
      </div>

      <div className="container mx-auto px-4 pb-12">
        <StickyDealCards />
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
