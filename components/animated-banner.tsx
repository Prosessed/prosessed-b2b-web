"use client"
import { useEffect, useRef } from "react"

interface AnimatedBannerProps {
  items: { text: string; bgColor: string; textColor: string }[]
}

export function AnimatedBanner({ items }: AnimatedBannerProps) {
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const scrollContainer = scrollRef.current
    if (!scrollContainer) return

    let animationFrameId: number
    let scrollPosition = 0
    const scrollSpeed = 0.5 // Adjust speed here

    const animate = () => {
      scrollPosition += scrollSpeed
      if (scrollPosition >= scrollContainer.scrollWidth / 2) {
        scrollPosition = 0
      }
      scrollContainer.scrollLeft = scrollPosition
      animationFrameId = requestAnimationFrame(animate)
    }

    animationFrameId = requestAnimationFrame(animate)

    return () => cancelAnimationFrame(animationFrameId)
  }, [])

  return (
    <div ref={scrollRef} className="overflow-hidden whitespace-nowrap scrollbar-hide">
      <div className="inline-flex">
        {/* Duplicate items for seamless loop */}
        {[...items, ...items].map((item, index) => (
          <div
            key={index}
            className="inline-block px-8 py-3 text-sm font-medium"
            style={{ backgroundColor: item.bgColor, color: item.textColor }}
          >
            {item.text}
          </div>
        ))}
      </div>
    </div>
  )
}
