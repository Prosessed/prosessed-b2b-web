import Link from "next/link"
import { Instagram, Linkedin, Youtube } from "lucide-react"
import { Button } from "@/components/ui/button"

export function Footer() {
  return (
    <footer className="bg-muted/30 border-t mt-16">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          {/* Useful Links */}
          <div>
            <h3 className="font-bold mb-4">Useful Links</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/about" className="text-muted-foreground hover:text-foreground transition-colors">
                  About
                </Link>
              </li>
              <li>
                <Link href="/careers" className="text-muted-foreground hover:text-foreground transition-colors">
                  Careers
                </Link>
              </li>
              <li>
                <Link href="/blog" className="text-muted-foreground hover:text-foreground transition-colors">
                  Blog
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="text-muted-foreground hover:text-foreground transition-colors">
                  Privacy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-muted-foreground hover:text-foreground transition-colors">
                  Terms
                </Link>
              </li>
              <li>
                <Link href="/faq" className="text-muted-foreground hover:text-foreground transition-colors">
                  FAQs
                </Link>
              </li>
              <li>
                <Link href="/security" className="text-muted-foreground hover:text-foreground transition-colors">
                  Security
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-muted-foreground hover:text-foreground transition-colors">
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          {/* Categories (First Column) */}
          <div>
            <h3 className="font-bold mb-4">Categories</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  href="/products?category=fruits"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  Vegetables & Fruits
                </Link>
              </li>
              <li>
                <Link
                  href="/products?category=beverages"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  Cold Drinks & Juices
                </Link>
              </li>
              <li>
                <Link
                  href="/products?category=bakery"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  Bakery & Biscuits
                </Link>
              </li>
              <li>
                <Link
                  href="/products?category=spices"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  Dry Fruits, Masala & Oil
                </Link>
              </li>
              <li>
                <Link
                  href="/products?category=paan"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  Paan Corner
                </Link>
              </li>
              <li>
                <Link
                  href="/products?category=pharma"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  Pharma & Wellness
                </Link>
              </li>
              <li>
                <Link
                  href="/products?category=personal-care"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  Personal Care
                </Link>
              </li>
            </ul>
          </div>

          {/* Categories (Second Column) */}
          <div>
            <h3 className="font-bold mb-4 text-transparent">Categories</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  href="/products?category=dairy"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  Dairy & Breakfast
                </Link>
              </li>
              <li>
                <Link
                  href="/products?category=frozen"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  Instant & Frozen Food
                </Link>
              </li>
              <li>
                <Link
                  href="/products?category=sweets"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  Sweet Tooth
                </Link>
              </li>
              <li>
                <Link
                  href="/products?category=sauces"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  Sauces & Spreads
                </Link>
              </li>
              <li>
                <Link
                  href="/products?category=meat"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  Chicken, Meat & Fish
                </Link>
              </li>
              <li>
                <Link
                  href="/products?category=organic"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  Organic & Premium
                </Link>
              </li>
              <li>
                <Link
                  href="/products?category=baby-care"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  Baby Care
                </Link>
              </li>
            </ul>
          </div>

          {/* Categories (Third Column) */}
          <div>
            <h3 className="font-bold mb-4 text-transparent">Categories</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  href="/products?category=kitchen"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  Kitchen & Dining
                </Link>
              </li>
              <li>
                <Link
                  href="/products?category=stationary"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  Stationary Needs
                </Link>
              </li>
              <li>
                <Link
                  href="/products?category=print-store"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  Print Store
                </Link>
              </li>
              <li>
                <Link
                  href="/products?category=egift"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  E-Gift Cards
                </Link>
              </li>
              <li>
                <Link
                  href="/products?category=pet-care"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  Pet Care
                </Link>
              </li>
              <li>
                <Link
                  href="/products?category=fashion"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  Fashion & Accessories
                </Link>
              </li>
              <li>
                <Link
                  href="/products?category=books"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  Books
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom section */}
        <div className="mt-12 pt-8 border-t flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">© prosessed.ai Commerce Private Limited, 2025</p>
          <div className="flex items-center gap-4">
            <p className="text-sm font-medium">Download App</p>
            <div className="flex gap-2">
              <Link
                href="https://apps.apple.com/in/app/orderit-wholesale-order-app/id6736897489"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button
                  variant="outline"
                  size="sm"
                  className="h-10 bg-transparent border-border hover:bg-accent hover:text-accent-foreground transition-colors"
                >
                  <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
                  </svg>
                  App Store
                </Button>
              </Link>
              <Link
                href="https://play.google.com/store/apps/details?id=com.expofoods.orderit"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button
                  variant="outline"
                  size="sm"
                  className="h-10 bg-transparent border-border hover:bg-accent hover:text-accent-foreground transition-colors"
                >
                  <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M3,20.5V3.5C3,2.91 3.34,2.39 3.84,2.15L13.69,12L3.84,21.85C3.34,21.6 3,21.09 3,20.5M16.81,15.12L6.05,21.34L14.54,12.85L16.81,15.12M20.16,10.81C20.5,11.08 20.75,11.5 20.75,12C20.75,12.5 20.5,12.92 20.16,13.19L17.89,14.5L15.39,12L17.89,9.5L20.16,10.81M6.05,2.66L16.81,8.88L14.54,11.15L6.05,2.66Z" />
                  </svg>
                  Play Store
                </Button>
              </Link>
            </div>
            <div className="flex gap-3 ml-4">
              <Link
                href="https://www.linkedin.com/company/prosessed/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <Linkedin className="h-5 w-5" />
              </Link>
              <Link
                href="https://www.youtube.com/@Prosessed-orderit"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <Youtube className="h-5 w-5" />
              </Link>
              <Link
                href="https://www.instagram.com/prosessed/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <Instagram className="h-5 w-5" />
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-6 pt-6 border-t">
          <p className="text-xs text-muted-foreground text-center leading-relaxed">
            "prosessed.ai" is owned & managed by "prosessed.ai Commerce Private Limited" and is not related, linked or
            interconnected in whatsoever manner or nature, to any other business entity.
          </p>
        </div>
      </div>
    </footer>
  )
}
