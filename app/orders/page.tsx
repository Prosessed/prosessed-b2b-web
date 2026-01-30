import { redirect } from "next/navigation"

export default async function OrdersPage() {
  // This app uses Quotations (bulk orders) instead of traditional orders
  // Redirect users to the Quotes page
  redirect("/quotes")
}
