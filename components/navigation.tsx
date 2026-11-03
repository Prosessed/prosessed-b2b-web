
"use client"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { useDebounce } from "@/hooks/use-debounce"
import { getApiBaseUrl } from "@/lib/api/client"
import { useBannersAndDeals, useSearch } from "@/lib/api/hooks"
import { clearAuthCookie } from "@/lib/auth/actions"
import { useAuth } from "@/lib/auth/context"
import { useCartContext } from "@/lib/cart/context"
import { useCartDrawer } from "@/lib/cart/drawer-context"
import { cn } from "@/lib/utils"
import { getDisplayImageUrl, getFirstImageUrl } from "@/lib/utils/image-url"
import { getPriceDisplay } from "@/lib/utils/pricing"
import { AnimatePresence, motion } from "framer-motion"
import { ArrowRight, LayoutGrid, Moon, Package, Search, ShoppingCart, Sun, Tag, User, X } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { AnnouncementPopup } from "@/components/announcement-popup"
import {
  applyThemeToDocument,
  persistTheme,
  readStoredTheme,
  type ThemeMode,
} from "@/lib/theme/constants"

export function Navigation() {
  const { user, logout, isAuthenticated } = useAuth()
  const { cart } = useCartContext()
  const { openDrawer } = useCartDrawer()
  const router = useRouter()
  const pathname = usePathname()
  const [isDark, setIsDark] = useState(false)
  const cartCount = cart?.items?.length || 0
  const [searchTerm, setSearchTerm] = useState("")
  const debouncedSearch = useDebounce(searchTerm, 400)
  const { data: searchResults, isValidating: isSearching } = useSearch(debouncedSearch)
  const { data: bannersData, isLoading: bannersLoading } = useBannersAndDeals()

  const handleCategoriesNavClick = (e: React.MouseEvent) => {
    if (pathname !== "/") return
    e.preventDefault()
    const el = document.getElementById("categories")
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" })
    } else {
      router.push("/#categories")
    }
  }

  const handleSearchSubmit = () => {
    if (searchTerm.trim().length >= 2) {
      router.push(`/products?search=${encodeURIComponent(searchTerm.trim())}`)
      setSearchTerm("")
    }
  }

  useEffect(() => {
    const stored = readStoredTheme()
    if (stored) {
      applyThemeToDocument(stored)
      setIsDark(stored === "dark")
      return
    }
    setIsDark(document.documentElement.classList.contains("dark"))
  }, [])

  const toggleTheme = () => {
    const nextTheme: ThemeMode = isDark ? "light" : "dark"
    setIsDark(nextTheme === "dark")
    applyThemeToDocument(nextTheme)
    persistTheme(nextTheme)
  }

  // Get company logo from banners data or fallback to company name
  const companyLogo = bannersData?.company_logo
  const companyName = isAuthenticated && user
    ? (user.companyName || user.companyUrl.replace(/https?:\/\//, "").split(".")[0] || "B2B Portal")
    : "B2B Portal"
  const isLoginRoute = pathname.startsWith("/login")

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
        <div className="container mx-auto flex h-16 items-center gap-2 sm:gap-4 px-3 sm:px-4">
        {/* Company Logo — hide on mobile while typing so search can use the width */}
        <Link
          href="/"
          className={cn(
            "flex items-center min-w-0 shrink-0",
            searchTerm.length > 0 && "max-sm:hidden"
          )}
        >
          {bannersLoading ? (
            <Skeleton className="h-10 w-10 sm:h-14 sm:w-14 md:h-16 md:w-16 rounded-md" aria-hidden />
          ) : companyLogo ? (
            <div className="relative h-10 w-10 sm:h-14 sm:w-14 md:h-16 md:w-16">
              <Image
                src={companyLogo}
                alt={companyName}
                fill
                className="object-contain"
                priority
              />
            </div>
          ) : (
            <span className="text-lg font-bold truncate">
              {companyName}
            </span>
          )}
        </Link>

        {/* Search bar */}
        <div className="relative flex-1 min-w-0 max-w-2xl sm:mx-auto group">
          <Search className="pointer-events-none absolute left-2.5 sm:left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary z-10" />
          <Input
            type="text"
            inputMode="search"
            enterKeyHint="search"
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
            aria-label="Search products"
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                setSearchTerm("")
              } else if (e.key === "Enter" && searchTerm.trim().length >= 2) {
                handleSearchSubmit()
              }
            }}
            className={cn(
              "w-full min-w-0 pl-9 sm:pl-10 bg-muted/50 focus:bg-background transition-all border-transparent focus:border-primary/50 h-10 rounded-xl text-sm sm:text-base",
              searchTerm.trim().length >= 2
                ? "pr-[4.25rem] sm:pr-24"
                : searchTerm
                  ? "pr-9 sm:pr-12"
                  : "pr-3"
            )}
          />
          {searchTerm ? (
            <div className="absolute inset-y-0 right-1.5 sm:right-2 flex items-center gap-0.5 sm:gap-1">
              <button
                type="button"
                onClick={() => setSearchTerm("")}
                aria-label="Clear search"
                className="h-7 w-7 rounded-full bg-muted hover:bg-muted-foreground/20 flex items-center justify-center transition-colors shrink-0"
              >
                <X className="h-3.5 w-3.5 text-muted-foreground" />
              </button>
              {searchTerm.trim().length >= 2 ? (
                <button
                  type="button"
                  onClick={handleSearchSubmit}
                  aria-label="Submit search"
                  className="h-7 w-7 rounded-full bg-primary hover:bg-primary/90 flex items-center justify-center transition-colors shadow-lg shadow-primary/20 shrink-0"
                >
                  <ArrowRight className="h-4 w-4 text-primary-foreground" />
                </button>
              ) : null}
            </div>
          ) : null}

          <AnimatePresence>
            {searchTerm.length >= 2 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="fixed left-3 right-3 top-[4.25rem] z-[100] bg-background border-2 border-primary/20 rounded-2xl shadow-2xl shadow-primary/10 overflow-hidden sm:absolute sm:left-0 sm:right-0 sm:top-full sm:mt-2 sm:w-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="max-h-[min(500px,70vh)] overflow-y-auto overflow-x-hidden">
                  {isSearching ? (
                    <div className="p-3 sm:p-4 space-y-3">
                      {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="flex items-center gap-3 min-w-0">
                          <Skeleton className="h-12 w-12 sm:h-14 sm:w-14 rounded-xl shrink-0" />
                          <div className="space-y-2 flex-1 min-w-0">
                            <Skeleton className="h-4 w-3/4" />
                            <Skeleton className="h-3 w-1/3" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : searchResults?.items?.length > 0 ? (
                    <>
                      {/* Items */}
                      <div className="p-2">
                        <div className="px-2 py-1.5 text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">
                          Products ({searchResults.items.length})
                        </div>
                        <div className="space-y-1">
                          {searchResults.items.slice(0, 8).map((item: any) => (
                            (() => {
                              const priceDisplay = getPriceDisplay({
                                basePrice: Number(item.price_list_rate ?? item.rate ?? 0),
                                currency: user?.defaultCurrency,
                                // Temporarily disabled: Price on Request / custom margin from search API
                                // marginInfo: item.customer_price_margin,
                              })
                              const priceLabel =
                                // priceDisplay.kind === "hidden"
                                //   ? "Price on Request"
                                //   :
                                priceDisplay.kind === "range"
                                  ? `${priceDisplay.minLabel} - ${priceDisplay.maxLabel}`
                                  : priceDisplay.kind === "single"
                                    ? priceDisplay.label
                                    : ""

                              return (
                            <Link
                              key={item.item_code}
                              href={`/products/${item.item_code}`}
                              onClick={() => setSearchTerm("")}
                              className="flex items-start sm:items-center gap-3 p-2.5 sm:p-3 hover:bg-primary/5 rounded-xl transition-all group border border-transparent hover:border-primary/20 min-w-0 w-full"
                            >
                              <div className="h-12 w-12 sm:h-14 sm:w-14 rounded-xl bg-muted/50 relative overflow-hidden shrink-0 border border-border/50">
                                <Image
                                  src={getDisplayImageUrl(getFirstImageUrl(item.image), getApiBaseUrl()) || "/placeholder.svg"}
                                  alt={item.item_name || "Product"}
                                  fill
                                  className="object-contain p-1.5 sm:p-2 group-hover:scale-110 transition-transform"
                                />
                              </div>
                              <div className="flex-1 min-w-0 overflow-hidden">
                                <p className="text-sm font-bold group-hover:text-primary transition-colors line-clamp-2 break-words">
                                  {item.item_name}
                                </p>
                                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-0.5">
                                  <p className="text-xs font-black text-primary shrink-0">{priceLabel}</p>
                                  {item.item_group && (
                                    <span className="text-[10px] text-muted-foreground px-1.5 py-0.5 bg-muted rounded truncate max-w-full">
                                      {item.item_group}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <Package className="hidden sm:block h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0 opacity-0 group-hover:opacity-100" aria-hidden />
                            </Link>
                              )
                            })()
                          ))}
                        </div>
                      </div>

                      {/* Categories */}
                      {searchResults?.categories && searchResults.categories.length > 0 && (
                        <>
                          <div className="border-t border-border/50 mx-2" />
                          <div className="p-2">
                            <div className="px-2 py-1.5 text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">
                              Categories
                            </div>
                            <div className="space-y-1">
                              {searchResults.categories.slice(0, 3).map((cat: any, idx: number) => (
                                <Link
                                  key={idx}
                                  href={`/products?category=${encodeURIComponent(cat.label)}`}
                                  onClick={() => setSearchTerm("")}
                                  className="flex items-center gap-2 p-2.5 hover:bg-primary/5 rounded-lg transition-colors group"
                                >
                                  <Tag className="h-4 w-4 text-muted-foreground group-hover:text-primary" />
                                  <span className="text-sm font-medium group-hover:text-primary">
                                    {cat.label}
                                  </span>
                                </Link>
                              ))}
                            </div>
                          </div>
                        </>
                      )}

                      {/* Brands */}
                      {searchResults?.brands && searchResults.brands.length > 0 && (
                        <>
                          <div className="border-t border-border/50 mx-2" />
                          <div className="p-2">
                            <div className="px-2 py-1.5 text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">
                              Brands
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {searchResults.brands.slice(0, 5).map((brand: any, idx: number) => (
                                <Link
                                  key={idx}
                                  href={`/products?brand=${encodeURIComponent(brand.label)}`}
                                  onClick={() => setSearchTerm("")}
                                  className="px-3 py-1.5 text-xs font-semibold bg-muted hover:bg-primary hover:text-primary-foreground rounded-lg transition-colors"
                                >
                                  {brand.label}
                                </Link>
                              ))}
                            </div>
                          </div>
                        </>
                      )}

                      {/* View All Results */}
                      {searchResults?.pagination && searchResults.pagination.total_records > 8 && (
                        <>
                          <div className="border-t border-border/50 mx-2" />
                          <Link
                            href={`/products?search=${encodeURIComponent(searchTerm)}`}
                            onClick={() => setSearchTerm("")}
                            className="block p-3 text-center text-sm font-bold text-primary hover:bg-primary/5 transition-colors"
                          >
                            View all {searchResults.pagination.total_records} results →
                          </Link>
                        </>
                      )}
                    </>
                  ) : searchTerm.length >= 2 && !isSearching ? (
                    <div className="p-8 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <Search className="h-8 w-8 text-muted-foreground opacity-50" />
                        <p className="text-sm font-medium text-muted-foreground">
                          No results found for "{searchTerm}"
                        </p>
                        <p className="text-xs text-muted-foreground/70">Try different keywords</p>
                      </div>
                    </div>
                  ) : null}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <Button
          asChild
          size="sm"
          className={cn(
            "md:hidden shrink-0 rounded-full font-bold text-xs shadow-md shadow-primary/15 hover:shadow-lg hover:shadow-primary/20 transition-shadow",
            searchTerm.length > 0 && "hidden"
          )}
        >
          <Link href="/products" className="gap-1.5" aria-label="Shop Now">
            <LayoutGrid className="h-3.5 w-3.5 shrink-0" aria-hidden />
            Shop Now
          </Link>
        </Button>

        {/* Navigation links */}
        <nav className="hidden items-center gap-4 md:flex" aria-label="Main navigation">
          <Button
            asChild
            className="rounded-full font-bold shadow-md shadow-primary/15 hover:shadow-lg hover:shadow-primary/20 transition-shadow"
          >
            <Link href="/products" className="gap-2">
              <LayoutGrid className="h-4 w-4" aria-hidden />
              Shop Now
            </Link>
          </Button>
          <Link
            href="/#categories"
            onClick={handleCategoriesNavClick}
            className="text-sm font-medium hover:text-primary transition-colors"
          >
            Categories
          </Link>
          <Link href="/orders" className="text-sm font-medium hover:text-primary transition-colors">
            Orders
          </Link>
          <Link href="/return-requests" className="text-sm font-medium hover:text-primary transition-colors">
            Returns
          </Link>
          <Link href="/quotes" className="text-sm font-medium hover:text-primary transition-colors">
            Quotes
          </Link>
        </nav>

        <Button
          variant="ghost"
          size="icon"
          onClick={toggleTheme}
          className="hidden sm:inline-flex text-foreground hover:bg-accent hover:text-accent-foreground border border-border hover:border-primary/50"
        >
          {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </Button>

        <Button
          variant="ghost"
          size="icon"
          onClick={openDrawer}
          className="relative text-foreground hover:bg-accent hover:text-accent-foreground border border-border hover:border-primary/50"
        >
          <ShoppingCart className="h-5 w-5" />
          {cartCount > 0 && (
            <Badge
              variant="default"
              className="absolute -right-1 -top-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs bg-primary text-primary-foreground border-2 border-background"
            >
              {cartCount}
            </Badge>
          )}
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="text-foreground hover:bg-accent hover:text-accent-foreground border border-border hover:border-primary/50"
            >
              {isAuthenticated && user ? (
                <Avatar className="h-7 w-7">
                  <AvatarFallback className="bg-primary/10 text-primary text-[10px]">
                    {(user.fullName || user.email || "")
                      .split(" ")
                      .filter((part) => part.length > 0)
                      .map((part) => part[0]?.toUpperCase())
                      .join("") || "U"}
                  </AvatarFallback>
                </Avatar>
              ) : (
                <User className="h-5 w-5" />
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            {isAuthenticated && user ? (
              <>
                <div className="flex items-center justify-start gap-2 p-2">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user.fullName}</p>
                    <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                  </div>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/my-accounts">My Account</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/orders">My Orders</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/my-invoices">My Invoices</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/return-requests">Return Requests</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/quotes">My Quotes</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/statements">My Statements</Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={async () => {
                    await clearAuthCookie()
                    logout()
                  }}
                  className="text-destructive focus:text-destructive"
                >
                  Logout
                </DropdownMenuItem>
              </>
            ) : (
              <DropdownMenuItem asChild>
                <Link href="/login">Login</Link>
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
        </div>
      </header>
      <AnnouncementPopup
        announcement={bannersData?.announcement_popup ?? null}
        disabled={isLoginRoute}
      />
    </>
  )
}
