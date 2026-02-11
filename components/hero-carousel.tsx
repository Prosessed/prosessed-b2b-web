"use client"
import { useEffect, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { getApiBaseUrl } from "@/lib/api/client"
import { getDisplayImageUrl } from "@/lib/utils/image-url"

interface HeroBanner {
  id?: string
  image?: string
  image_url?: string
  title?: string
  subtitle?: string
  ctaText?: string
  ctaLink?: string
  redirect_url?: string | null
}

interface HeroCarouselProps {
  banners: HeroBanner[]
}

export function HeroCarousel({ banners }: HeroCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % banners.length)
    }, 2000) // Change every 2 seconds

    return () => clearInterval(interval)
  }, [banners.length])

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + banners.length) % banners.length)
  }

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % banners.length)
  }

  return (
    <div className="relative w-full aspect-[21/9] md:aspect-[3/1] lg:aspect-[21/6] overflow-hidden rounded-lg">
      {/* Banners */}
      <div
        className="flex transition-transform duration-500 ease-out h-full"
        style={{ transform: `translateX(-${currentIndex * 100}%)` }}
      >
        {banners.map((banner, index) => {
          const imageSrc = getDisplayImageUrl(banner.image_url || banner.image, getApiBaseUrl()) || "/placeholder.svg"
          const linkHref = banner.redirect_url || banner.ctaLink || "/products"
          
          return (
            <div key={banner.id || index} className="min-w-full relative">
              <Image
                src={imageSrc || "/placeholder.svg"}
                alt={banner.title || "Banner"}
                fill
                className="object-cover"
                priority={currentIndex === 0}
              />
              {(banner.title || banner.subtitle) && (
                <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-transparent flex items-center">
                  <div className="container mx-auto px-4 md:px-8 lg:px-12">
                    <div className="max-w-xl">
                      {banner.title && (
                        <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-2">{banner.title}</h2>
                      )}
                      {banner.subtitle && (
                        <p className="text-lg md:text-xl text-white/90 mb-6">{banner.subtitle}</p>
                      )}
                      {banner.ctaText && (
                        <Link href={linkHref}>
                          <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground">
                            {banner.ctaText}
                          </Button>
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Navigation Arrows */}
      <Button
        variant="ghost"
        size="icon"
        onClick={goToPrevious}
        className="absolute left-4 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-white/90 hover:bg-white shadow-lg"
      >
        <ChevronLeft className="h-6 w-6 text-foreground" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        onClick={goToNext}
        className="absolute right-4 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-white/90 hover:bg-white shadow-lg"
      >
        <ChevronRight className="h-6 w-6 text-foreground" />
      </Button>

      {/* Dots Indicator */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
        {banners.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentIndex(index)}
            className={`h-2 rounded-full transition-all ${index === currentIndex ? "w-8 bg-white" : "w-2 bg-white/50"}`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  )
}
