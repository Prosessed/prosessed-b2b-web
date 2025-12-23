import { ProductCard } from "@/components/product-card"
import { Badge } from "@/components/ui/badge"
import { ProductModel } from "@/lib/models/product"
import { Zap } from "lucide-react"

export default async function DealsPage() {
  const products = await ProductModel.getAll()

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <Zap className="h-10 w-10 text-primary" />
            <h1 className="text-4xl font-bold">Flash Deals & Specials</h1>
          </div>
          <p className="text-muted-foreground text-lg">Limited time offers on bulk orders - Save up to 40%</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {products.map((product) => (
            <div key={product.id} className="relative">
              <Badge className="absolute top-2 left-2 z-10 bg-destructive text-destructive-foreground">
                -{Math.floor(Math.random() * 30 + 10)}%
              </Badge>
              <ProductCard {...product} />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
