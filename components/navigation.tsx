"use client"

import Link from "next/link"
import { Search, ShoppingCart, User, Moon, Sun } from "lucide-react"
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
import { useAuth } from "@/lib/auth/context"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { useSearch } from "@/lib/api/hooks"
import { useDebounce } from "@/hooks/use-debounce"
import { Skeleton } from "@/components/ui/skeleton"
import { AnimatePresence, motion } from "framer-motion"
import Image from "next/image"

export function Navigation() {
  const { user, logout, isAuthenticated } = useAuth()
  const [isDark, setIsDark] = useState(false)
  const [cartCount, setCartCount] = useState(3)
  const [searchTerm, setSearchTerm] = useState("")
  const debouncedSearch = useDebounce(searchTerm, 400)
  const { data: searchResults, isValidating: isSearching } = useSearch(debouncedSearch)

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
            className="w-full pl-10 pr-4 bg-muted/50 focus:bg-background transition-all border-transparent focus:border-primary/50 h-10 rounded-xl"
          />

          <AnimatePresence>
            {searchTerm.length >= 2 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="absolute top-full left-0 right-0 mt-2 bg-background border rounded-xl shadow-2xl overflow-hidden z-[100]"
              >
                <div className="p-4 max-h-[400px] overflow-y-auto">
                  {isSearching ? (
                    <div className="space-y-4">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="flex items-center gap-3">
                          <Skeleton className="h-12 w-12 rounded-lg" />
                          <div className="space-y-2 flex-1">
                            <Skeleton className="h-4 w-1/2" />
                            <Skeleton className="h-3 w-1/4" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : searchResults?.items?.length > 0 ? (
                    <div className="space-y-1">
                      {searchResults.items.map((item: any) => (
                        <Link
                          key={item.item_code}
                          href={`/products/${item.item_code}`}
                          onClick={() => setSearchTerm("")}
                          className="flex items-center gap-3 p-2 hover:bg-muted rounded-lg transition-colors group"
                        >
                          <div className="h-12 w-12 rounded-lg bg-muted relative overflow-hidden">
                            <Image src={item.image || "/placeholder.svg"} alt="" fill className="object-contain p-1" />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium group-hover:text-primary transition-colors">
                              {item.item_name}
                            </p>
                            <p className="text-xs text-muted-foreground">${item.rate?.toFixed(2)}</p>
                          </div>
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <div className="py-8 text-center">
                      <p className="text-sm text-muted-foreground">No results found for "{searchTerm}"</p>
                    </div>
                  )}
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
          <Link href="/deals" className="text-sm font-medium hover:text-primary transition-colors">
            Deals
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
          className="relative text-foreground hover:bg-accent hover:text-accent-foreground border border-border hover:border-primary/50"
          asChild
        >
          <Link href="/cart">
            <ShoppingCart className="h-5 w-5" />
            {cartCount > 0 && (
              <Badge
                variant="default"
                className="absolute -right-1 -top-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs bg-primary text-primary-foreground border-2 border-background"
              >
                {cartCount}
              </Badge>
            )}
          </Link>
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
