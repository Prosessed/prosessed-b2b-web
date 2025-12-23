import Link from "next/link"
import Image from "next/image"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

const dealCards = [
  {
    title: "Pharmacy at your doorstep!",
    subtitle: "Cough syrups, pain relief sprays & more",
    image: "/pharmacy-medicine.jpg",
    bgColor: "from-teal-400 to-teal-500",
    href: "/products?category=pharma",
  },
  {
    title: "Pet Care supplies in minutes",
    subtitle: "Food, treats, toys & more",
    image: "/pet-care-dog-cat.jpg",
    bgColor: "from-amber-400 to-amber-500",
    href: "/products?category=pet-care",
  },
  {
    title: "No time for a diaper run?",
    subtitle: "Get baby care essentials in minutes",
    image: "/placeholder.svg?height=200&width=300",
    bgColor: "from-blue-300 to-blue-400",
    href: "/products?category=baby-care",
  },
]

export function StickyDealCards() {
  return (
    <section className="py-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {dealCards.map((deal, index) => (
          <Link key={index} href={deal.href} className="group">
            <Card
              className={`overflow-hidden hover:shadow-xl transition-all duration-300 group-hover:scale-[1.02] border-0 bg-gradient-to-br ${deal.bgColor}`}
            >
              <div className="relative h-48 flex items-end p-6">
                <div className="absolute inset-0">
                  <Image
                    src={deal.image || "/placeholder.svg"}
                    alt={deal.title}
                    fill
                    className="object-cover opacity-20 group-hover:opacity-30 transition-opacity"
                  />
                </div>
                <div className="relative z-10 text-white">
                  <h3 className="text-xl font-bold mb-1">{deal.title}</h3>
                  <p className="text-sm mb-3 text-white/90">{deal.subtitle}</p>
                  <Button size="sm" variant="secondary" className="h-8 text-xs font-semibold">
                    Order Now
                  </Button>
                </div>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </section>
  )
}
