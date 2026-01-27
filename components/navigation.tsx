"use client"

import Link from "next/link"
import { Search, ShoppingCart, User, Moon, Sun, X, Package, Tag, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth/context"
import { useCartContext } from "@/lib/cart/context"
import { useCartDrawer } from "@/lib/cart/drawer-context"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { useSearch } from "@/lib/api/hooks"
import { useDebounce } from "@/hooks/use-debounce"
import { Skeleton } from "@/components/ui/skeleton"
import { AnimatePresence, motion } from "framer-motion"
import Image from "next/image"

export function Navigation() {
  const { user, logout, isAuthenticated } = useAuth()
  const { cart } = useCartContext()
  const { openDrawer } = useCartDrawer()
  const router = useRouter()
  const [isDark, setIsDark] = useState(false)
  const cartCount = cart?.items?.length || 0
  const [searchTerm, setSearchTerm] = useState("")
  const debouncedSearch = useDebounce(searchTerm, 400)
  const { data: searchResults, isValidating: isSearching } = useSearch(debouncedSearch)

  // Debug logging
  useEffect(() => {
    console.log("[Search Navigation] Term:", searchTerm, "Debounced:", debouncedSearch, "Results:", searchResults?.items?.length || 0, "IsSearching:", isSearching)
    console.log("[Search Navigation] Full Results:", searchResults)
    if (searchResults) {
      console.log("[Search Navigation] Items:", searchResults.items)
      console.log("[Search Navigation] Categories:", searchResults.categories)
      console.log("[Search Navigation] Brands:", searchResults.brands)
    }
  }, [searchTerm, debouncedSearch, searchResults, isSearching])

  const handleSearchSubmit = () => {
    if (searchTerm.trim().length >= 2) {
      router.push(`/products?search=${encodeURIComponent(searchTerm.trim())}`)
      setSearchTerm("")
    }
  }

  useEffect(() => {
    const isDarkMode = document.documentElement.classList.contains("dark")
    setIsDark(isDarkMode)
  }, [])

  const toggleTheme = () => {
    const newMode = !isDark
    setIsDark(newMode)
    document.documentElement.classList.toggle("dark", newMode)
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center gap-4 px-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 text-xl font-bold">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            P
          </div>
          <div className="flex flex-col leading-tight">
            <span className="text-sm font-bold">prosessed.ai</span>
            {isAuthenticated && user && (
              <span className="text-[10px] text-primary font-medium tracking-tight uppercase truncate max-w-[120px]">
                {user.companyName || user.companyUrl.replace(/https?:\/\//, "").split(".")[0]}
              </span>
            )}
          </div>
        </Link>

        {/* Search bar */}
        <div className="relative flex-1 max-w-2xl mx-auto group">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary" />
          <Input
            type="search"
            placeholder="Search for organic tomatoes, milk, eggs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                setSearchTerm("")
              } else if (e.key === "Enter" && searchTerm.trim().length >= 2) {
                handleSearchSubmit()
              }
            }}
            className="w-full pl-10 pr-24 bg-muted/50 focus:bg-background transition-all border-transparent focus:border-primary/50 h-10 rounded-xl"
          />
          {searchTerm && (
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
              <button
                onClick={() => setSearchTerm("")}
                className="h-7 w-7 rounded-full bg-muted hover:bg-muted-foreground/20 flex items-center justify-center transition-colors"
              >
                <X className="h-3.5 w-3.5 text-muted-foreground" />
              </button>
              {searchTerm.trim().length >= 2 && (
                <button
                  onClick={handleSearchSubmit}
                  className="h-7 w-7 rounded-full bg-primary hover:bg-primary/90 flex items-center justify-center transition-colors shadow-lg shadow-primary/20"
                >
                  <ArrowRight className="h-4 w-4 text-primary-foreground" />
                </button>
              )}
            </div>
          )}

          <AnimatePresence>
            {searchTerm.length >= 2 && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="absolute top-full left-0 right-0 mt-2 bg-background border-2 border-primary/20 rounded-2xl shadow-2xl shadow-primary/10 overflow-hidden z-[100]"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="max-h-[500px] overflow-y-auto">
                  {isSearching ? (
                    <div className="p-4 space-y-3">
                      {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="flex items-center gap-3">
                          <Skeleton className="h-14 w-14 rounded-xl shrink-0" />
                          <div className="space-y-2 flex-1">
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
                            <Link
                              key={item.item_code}
                              href={`/products/${item.item_code}`}
                              onClick={() => setSearchTerm("")}
                              className="flex items-center gap-3 p-3 hover:bg-primary/5 rounded-xl transition-all group border border-transparent hover:border-primary/20"
                            >
                              <div className="h-14 w-14 rounded-xl bg-muted/50 relative overflow-hidden shrink-0 border border-border/50">
                                <Image
                                  src={item.image || "/placeholder.svg"}
                                  alt={item.item_name || "Product"}
                                  fill
                                  className="object-contain p-2 group-hover:scale-110 transition-transform"
                                />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold group-hover:text-primary transition-colors line-clamp-1">
                                  {item.item_name}
                                </p>
                                <div className="flex items-center gap-2 mt-0.5">
                                  <p className="text-xs font-black text-primary">
                                    ${(item.price_list_rate || item.rate || 0).toFixed(2)}
                                  </p>
                                  {item.item_group && (
                                    <span className="text-[10px] text-muted-foreground px-1.5 py-0.5 bg-muted rounded">
                                      {item.item_group}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <Package className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0 opacity-0 group-hover:opacity-100" />
                            </Link>
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

        {/* Navigation links */}
        <nav className="hidden items-center gap-6 md:flex">
          <Link href="/" className="text-sm font-medium hover:text-primary transition-colors">
            Home
          </Link>
          <Link href="/products" className="text-sm font-medium hover:text-primary transition-colors">
            Products
          </Link>
          <Link href="/cart" className="text-sm font-medium hover:text-primary transition-colors">
            Cart
          </Link>
          <Link href="/orders" className="text-sm font-medium hover:text-primary transition-colors">
            My Orders
          </Link>
          <Link href="/quotes" className="text-sm font-medium hover:text-primary transition-colors">
            My Quotes
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
                    {user.fullName
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
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
                  <Link href="/account">My Account</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/orders">My Orders</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/quotes">My Quotes</Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout} className="text-destructive focus:text-destructive">
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
  )
}
