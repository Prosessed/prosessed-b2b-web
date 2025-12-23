import Link from "next/link"
import Image from "next/image"

const categories = [
  { name: "Paan Corner", image: "/paan-betel-leaf.jpg", href: "/products?category=paan" },
  { name: "Dairy, Bread & Eggs", image: "/dairy-milk-bread.jpg", href: "/products?category=dairy" },
  { name: "Fruits & Vegetables", image: "/fresh-vegetables.png", href: "/products?category=fruits" },
  { name: "Cold Drinks & Juices", image: "/cold-drinks-bottles.jpg", href: "/products?category=beverages" },
  { name: "Snacks & Munchies", image: "/snacks-chips.jpg", href: "/products?category=snacks" },
  { name: "Breakfast & Instant Food", image: "/breakfast-cereal.jpg", href: "/products?category=breakfast" },
  { name: "Sweet Tooth", image: "/sweets-candy.jpg", href: "/products?category=sweets" },
  { name: "Bakery & Biscuits", image: "/bakery-biscuits.jpg", href: "/products?category=bakery" },
  { name: "Tea, Coffee & Health Drinks", image: "/tea-coffee.jpg", href: "/products?category=tea-coffee" },
  { name: "Atta, Rice & Dal", image: "/atta-rice-dal.jpg", href: "/products?category=staples" },
  { name: "Masala, Oil & More", image: "/masala-oil-spices.jpg", href: "/products?category=spices" },
  { name: "Sauces & Spreads", image: "/sauces-spreads.jpg", href: "/products?category=sauces" },
  { name: "Chicken, Meat & Fish", image: "/raw-chicken-pieces.png", href: "/products?category=meat" },
  { name: "Organic & Healthy Living", image: "/organic-food-display.png", href: "/products?category=organic" },
  { name: "Baby Care", image: "/baby-products-flatlay.png", href: "/products?category=baby-care" },
  { name: "Pharma & Wellness", image: "/medicine-pharmacy.png", href: "/products?category=pharma" },
  { name: "Cleaning Essentials", image: "/assorted-cleaning-products.png", href: "/products?category=cleaning" },
  { name: "Home & Office", image: "/cozy-home-office.png", href: "/products?category=home-office" },
  { name: "Personal Care", image: "/personal-care-products.png", href: "/products?category=personal-care" },
  { name: "Pet Care", image: "/pet-care.jpg", href: "/products?category=pet-care" },
]

export function CategoryGrid() {
  return (
    <section className="py-8">
      <div className="grid grid-cols-3 md:grid-cols-5 lg:grid-cols-10 gap-4">
        {categories.map((category) => (
          <Link
            key={category.name}
            href={category.href}
            className="flex flex-col items-center gap-2 p-3 rounded-lg hover:bg-muted/50 transition-colors group"
          >
            <div className="relative h-20 w-20 rounded-full overflow-hidden bg-muted">
              <Image
                src={category.image || "/placeholder.svg"}
                alt={category.name}
                fill
                className="object-cover group-hover:scale-110 transition-transform duration-200"
              />
            </div>
            <p className="text-xs text-center font-medium line-clamp-2 leading-tight">{category.name}</p>
          </Link>
        ))}
      </div>
    </section>
  )
}
