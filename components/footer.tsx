import Link from "next/link"

export function Footer() {
  return (
    <footer className="bg-muted/30 border-t mt-16">
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col items-center justify-center gap-2 text-center">
          <p className="text-sm text-muted-foreground">
            Place Order · Get Quote · Ledger · Payment
          </p>
          <p className="text-xs text-muted-foreground">
            This portal is powered by{" "}
            <Link
              href="https://prosessed.ai"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              prosessed.ai
            </Link>
          </p>
        </div>
      </div>
    </footer>
  )
}
