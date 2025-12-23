import type { Product } from "@/lib/types"

export class ProductModel {
  static async getAll(): Promise<Product[]> {
    // TODO: Replace with actual API call
    // Example: const response = await fetch('/api/products')
    // return response.json()

    return mockProducts
  }

  static async getById(id: string): Promise<Product | null> {
    // TODO: Replace with actual API call
    // Example: const response = await fetch(`/api/products/${id}`)
    // return response.json()

    const products = await this.getAll()
    return products.find((p) => p.id === id) || null
  }

  static async getByCategory(category: string): Promise<Product[]> {
    // TODO: Replace with actual API call
    // Example: const response = await fetch(`/api/products?category=${category}`)
    // return response.json()

    const products = await this.getAll()
    return products.filter((p) => p.category === category)
  }

  static async search(query: string): Promise<Product[]> {
    // TODO: Replace with actual API call
    // Example: const response = await fetch(`/api/products/search?q=${query}`)
    // return response.json()

    const products = await this.getAll()
    return products.filter((p) => p.name.toLowerCase().includes(query.toLowerCase()))
  }
}

// Mock data - replace with actual API calls
const mockProducts: Product[] = [
  {
    id: "1",
    name: "Organic Tomatoes",
    price: 12.99,
    image: "/ripe-tomatoes.png",
    category: "fruits",
    brand: "Fresh Farms",
    unit: "kg",
    inStock: true,
  },
  {
    id: "2",
    name: "Fresh Avocados",
    price: 18.99,
    image: "/ripe-avocados.png",
    category: "fruits",
    brand: "Fresh Farms",
    unit: "kg",
    inStock: true,
  },
  {
    id: "3",
    name: "Premium Olive Oil",
    price: 24.99,
    image: "/olive-oil-bottle.png",
    category: "packaged",
    brand: "Mediterranean Gold",
    unit: "L",
    inStock: true,
  },
  {
    id: "4",
    name: "Artisan Bread",
    price: 8.99,
    image: "/rustic-bread-loaf.png",
    category: "bakery",
    brand: "Bakery Fresh",
    unit: "loaf",
    inStock: true,
  },
  {
    id: "5",
    name: "Greek Yogurt",
    price: 15.99,
    image: "/creamy-yogurt-bowl.png",
    category: "dairy",
    brand: "Dairy Best",
    unit: "kg",
    inStock: true,
  },
  {
    id: "6",
    name: "Bulk Rice 25kg",
    price: 45.99,
    image: "/rice-bag.png",
    category: "grains",
    brand: "Grain Master",
    unit: "kg",
    inStock: true,
  },
  {
    id: "7",
    name: "Fresh Salmon Fillet",
    price: 32.99,
    image: "/fresh-salmon-fillet.png",
    category: "seafood",
    brand: "Ocean Fresh",
    unit: "kg",
    inStock: true,
  },
  {
    id: "8",
    name: "Organic Honey 2L",
    price: 28.99,
    image: "/golden-honey-jar.png",
    category: "packaged",
    brand: "Pure Honey Co",
    unit: "L",
    inStock: true,
  },
  {
    id: "9",
    name: "Premium Coffee Beans",
    price: 34.99,
    image: "/pile-of-coffee-beans.png",
    category: "beverages",
    brand: "Coffee Masters",
    unit: "kg",
    inStock: true,
  },
  {
    id: "10",
    name: "Pasta Variety Pack",
    price: 22.99,
    image: "/colorful-pasta-arrangement.png",
    category: "packaged",
    brand: "Italian Foods",
    unit: "pack",
    inStock: true,
  },
  {
    id: "11",
    name: "Organic Spinach",
    price: 9.99,
    image: "/fresh-spinach.png",
    category: "fruits",
    brand: "Green Farms",
    unit: "kg",
    inStock: true,
  },
  {
    id: "12",
    name: "Aged Cheddar Cheese",
    price: 28.99,
    image: "/aged-cheddar-cheese.png",
    category: "dairy",
    brand: "Cheese Masters",
    unit: "kg",
    inStock: true,
  },
]
