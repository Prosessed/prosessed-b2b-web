"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Skeleton } from "@/components/ui/skeleton"
import { Textarea } from "@/components/ui/textarea"
import { getApiBaseUrl } from "@/lib/api/client"
import {
  createSalesOrderReturn,
  useAllInvoices,
  useItems,
  useReturnRequests,
  useSearch,
  type ReturnRequest,
} from "@/lib/api/hooks"
import { useAuth } from "@/lib/auth/context"
import { formatDate } from "@/lib/utils/currency"
import { getDisplayImageUrl, getFirstImageUrl } from "@/lib/utils/image-url"
import { getPriceDisplay } from "@/lib/utils/pricing"
import {
  AlertCircle,
  CheckCircle2,
  Check,
  FileImage,
  LayoutGrid,
  Package,
  Plus,
  RotateCcw,
  Search,
  Trash2,
  X,
} from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useEffect, useMemo, useState } from "react"

type ProductUomOption = {
  uom: string
  price_list_rate?: number
}

type SelectedProduct = {
  item_code: string
  item_name: string
  quantity: number
  uom: string
  availableUoms: ProductUomOption[]
}

function getTodayIsoDate() {
  return new Date().toISOString().slice(0, 10)
}

function getInvoiceNumber(invoice: any) {
  return String(invoice?.invoice_id ?? invoice?.name ?? invoice?.invoice ?? invoice?.docname ?? "").trim()
}

function getInvoiceLabel(invoice: any) {
  const invoiceNumber = getInvoiceNumber(invoice)
  const date = invoice?.posting_date ?? invoice?.transaction_date ?? invoice?.issue_date ?? invoice?.date
  return [invoiceNumber, date ? formatDate(date) : "", invoice?.customer_name ?? ""].filter(Boolean).join(" · ")
}

function getAvailableUoms(item: any): ProductUomOption[] {
  const rawUoms = Array.isArray(item?.uoms) ? item.uoms : []
  const mapped = rawUoms
    .map((entry: any) => ({
      uom: String(entry?.uom ?? "").trim(),
      price_list_rate: entry?.price_list_rate,
    }))
    .filter((entry: ProductUomOption) => entry.uom)

  const fallbacks = [item?.default_sales_uom, item?.stock_uom, item?.uom]
    .map((value) => String(value ?? "").trim())
    .filter(Boolean)
    .map((uom) => ({
      uom,
      price_list_rate: item?.price_list_rate ?? item?.rate,
    }))

  const deduped = [...mapped, ...fallbacks].filter(
    (entry, index, list) => list.findIndex((candidate) => candidate.uom === entry.uom) === index
  )

  return deduped.length > 0 ? deduped : [{ uom: "Nos", price_list_rate: item?.price_list_rate ?? item?.rate }]
}

function getProductTotalCount(request: ReturnRequest) {
  const items = Array.isArray(request.products)
    ? request.products
    : Array.isArray(request.items)
      ? request.items
      : []
  return items.reduce((sum, item) => sum + Number(item?.qty ?? item?.quantity ?? 0), 0)
}

function getRequestItems(request: ReturnRequest) {
  if (Array.isArray(request.products)) return request.products
  if (Array.isArray(request.items)) return request.items
  return []
}

export default function ReturnRequestsPage() {
  const { user, isAuthenticated } = useAuth()
  const [page, setPage] = useState(1)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [activeRequestKey, setActiveRequestKey] = useState<string | null>(null)
  const [invoiceQuery, setInvoiceQuery] = useState("")
  const [invoiceDropdownOpen, setInvoiceDropdownOpen] = useState(false)
  const [selectedInvoiceNo, setSelectedInvoiceNo] = useState("")
  const [reasonForReturn, setReasonForReturn] = useState("")
  const [dateOfRequest, setDateOfRequest] = useState(getTodayIsoDate())
  const [itemSearchTerm, setItemSearchTerm] = useState("")
  const [selectedProducts, setSelectedProducts] = useState<SelectedProduct[]>([])
  /** Allows empty field while editing quantity (controlled number + min 1 blocked backspace). */
  const [quantityDraftByCode, setQuantityDraftByCode] = useState<Record<string, string>>({})
  const [photos, setPhotos] = useState<File[]>([])
  const [photoPreviewUrls, setPhotoPreviewUrls] = useState<string[]>([])
  const [submitError, setSubmitError] = useState("")
  const [submitSuccess, setSubmitSuccess] = useState<{
    message: string
    returnRequestName?: string
    attachments?: string[]
  } | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const { data, isLoading, error, mutate } = useReturnRequests({
    customerId: user?.customerId ?? null,
    page,
    pageSize: 10,
  })

  const { data: invoicesData } = useAllInvoices({
    page: 1,
    pageSize: 20,
    customerId: user?.customerId ?? null,
  })

  const { data: defaultItemsData, isLoading: isLoadingDefaultItems } = useItems({
    page: 1,
    page_size: 12,
  })
  const { data: searchData, isLoading: isSearchingItems } = useSearch(itemSearchTerm, 1, 12)

  const returnRequests = data?.return_requests ?? []
  const pagination = data?.pagination
  const hasPreviousPage = page > 1 && (pagination?.has_previous_page ?? page > 1)
  const hasNextPage = pagination?.has_next_page ?? false
  const currency = user?.defaultCurrency ?? "INR"

  const invoices = useMemo(() => {
    const list = Array.isArray(invoicesData?.invoices) ? invoicesData.invoices : []
    const query = invoiceQuery.trim().toLowerCase()
    if (!query) return list
    return list.filter((invoice: any) => getInvoiceLabel(invoice).toLowerCase().includes(query))
  }, [invoiceQuery, invoicesData?.invoices])

  const selectedInvoice = useMemo(
    () => (Array.isArray(invoicesData?.invoices) ? invoicesData.invoices.find((invoice: any) => getInvoiceNumber(invoice) === selectedInvoiceNo) : null),
    [invoicesData?.invoices, selectedInvoiceNo]
  )

  const itemResults = useMemo(() => {
    if (itemSearchTerm.trim().length >= 2) {
      return Array.isArray(searchData?.items) ? searchData.items : []
    }
    const items = defaultItemsData?.message?.items ?? defaultItemsData?.items ?? []
    return Array.isArray(items) ? items : []
  }, [defaultItemsData, itemSearchTerm, searchData])

  const activeRequest = useMemo(() => {
    return returnRequests.find((request: ReturnRequest) => {
      const requestKey = request.return_request_id ?? request.name ?? `${request.customer_id}-${request.date_of_request}`
      return requestKey === activeRequestKey
    }) ?? null
  }, [activeRequestKey, returnRequests])

  const customerIdForCreate = String(user?.customerId ?? "").trim()

  useEffect(() => {
    const urls = photos.map((photo) => URL.createObjectURL(photo))
    setPhotoPreviewUrls(urls)
    return () => {
      urls.forEach((url) => URL.revokeObjectURL(url))
    }
  }, [photos])

  const addProduct = (item: any) => {
    const itemCode = String(item?.item_code ?? "").trim()
    if (!itemCode) return

    const availableUoms = getAvailableUoms(item)
    const defaultUom = availableUoms[0]?.uom ?? "Nos"

    setSelectedProducts((current) => {
      const existing = current.find((product) => product.item_code === itemCode)
      if (existing) {
        return current.map((product) =>
          product.item_code === itemCode ? { ...product, quantity: product.quantity + 1 } : product
        )
      }

      return [
        ...current,
        {
          item_code: itemCode,
          item_name: item?.item_name ?? itemCode,
          quantity: 1,
          uom: defaultUom,
          availableUoms,
        },
      ]
    })
  }

  const updateProduct = (itemCode: string, next: Partial<SelectedProduct>) => {
    setSelectedProducts((current) =>
      current.map((product) => (product.item_code === itemCode ? { ...product, ...next } : product))
    )
  }

  const removeProduct = (itemCode: string) => {
    setSelectedProducts((current) => current.filter((product) => product.item_code !== itemCode))
    setQuantityDraftByCode((prev) => {
      const { [itemCode]: _, ...rest } = prev
      return rest
    })
  }

  const handleQuantityChange = (itemCode: string, raw: string) => {
    if (raw !== "" && !/^\d*$/.test(raw)) return
    setQuantityDraftByCode((prev) => ({ ...prev, [itemCode]: raw }))
    if (raw !== "") {
      const n = parseInt(raw, 10)
      if (!Number.isNaN(n) && n >= 1) {
        updateProduct(itemCode, { quantity: n })
      }
    }
  }

  const handleQuantityBlur = (itemCode: string, raw: string) => {
    setSelectedProducts((current) =>
      current.map((product) => {
        if (product.item_code !== itemCode) return product
        const fallback = product.quantity
        let nextQty = fallback
        if (raw !== "") {
          const n = parseInt(raw, 10)
          nextQty = Math.max(1, Number.isNaN(n) ? fallback : n)
        } else {
          nextQty = Math.max(1, fallback)
        }
        return { ...product, quantity: nextQty }
      })
    )
    setQuantityDraftByCode((prev) => {
      const { [itemCode]: _, ...rest } = prev
      return rest
    })
  }

  const resolveProductQuantity = (product: SelectedProduct) => {
    const draft = quantityDraftByCode[product.item_code]
    if (draft === undefined || draft === "") return Math.max(1, product.quantity)
    const n = parseInt(draft, 10)
    return Math.max(1, Number.isNaN(n) ? product.quantity : n)
  }

  const removePhoto = (indexToRemove: number) => {
    setPhotos((current) => current.filter((_, index) => index !== indexToRemove))
  }

  const resetForm = () => {
    setInvoiceQuery("")
    setSelectedInvoiceNo("")
    setReasonForReturn("")
    setDateOfRequest(getTodayIsoDate())
    setItemSearchTerm("")
    setSelectedProducts([])
    setQuantityDraftByCode({})
    setPhotos([])
    setSubmitError("")
  }

  const handleCreateOpenChange = (nextOpen: boolean) => {
    setIsCreateOpen(nextOpen)
    setInvoiceDropdownOpen(false)
    if (nextOpen) {
      setSubmitError("")
      setSubmitSuccess(null)
    }
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSubmitError("")
    setSubmitSuccess(null)

    if (!user?.customerId) {
      setSubmitError("Customer account is missing. Please sign in again.")
      return
    }
    if (!customerIdForCreate) {
      setSubmitError("Customer ID is missing. Please sign in again.")
      return
    }
    if (!reasonForReturn.trim()) {
      setSubmitError("Reason for return is required.")
      return
    }
    if (selectedProducts.length === 0) {
      setSubmitError("Please add products from the product browser.")
      return
    }

    setIsSubmitting(true)
    try {
      const response = await createSalesOrderReturn(
        {
          // Backend validates this against Customer.name (e.g. "CUS-02195")
          customerName: customerIdForCreate,
          returnForInvoiceNo: selectedInvoiceNo.trim() || undefined,
          reasonForReturn: reasonForReturn.trim(),
          dateOfRequest,
          products: selectedProducts.map((product) => ({
            item_code: product.item_code,
            item_name: product.item_name,
            quantity: resolveProductQuantity(product),
            uom: product.uom,
          })),
          photos,
        },
        { apiKey: user.apiKey, apiSecret: user.apiSecret, sid: user.sid }
      )

      setSubmitSuccess({
        message: response?.message ?? "Return request created successfully.",
        returnRequestName: response?.return_request_name,
        attachments: response?.attachments,
      })
      resetForm()
      setPage(1)
      await mutate()
      setIsCreateOpen(false)
    } catch (err: any) {
      setSubmitError(err?.message || "Failed to create return request. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="p-8 text-center">
          <p className="text-muted-foreground mb-4">Please sign in to view return requests</p>
          <Button asChild>
            <Link href="/login">Sign In</Link>
          </Button>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto max-w-7xl px-4 py-8 space-y-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-2">Return Requests</h1>
            <p className="text-muted-foreground">Track submitted returns and open the product browser to create a new request.</p>
          </div>
          <Button size="lg" className="rounded-xl" onClick={() => handleCreateOpenChange(true)}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Create Return Request
          </Button>
        </div>

        {submitSuccess && (
          <Card className="border-green-500/20 bg-green-500/10">
            <CardContent className="pt-6 text-sm text-green-700 dark:text-green-400">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 mt-0.5 shrink-0" />
                <div>
                  <p className="font-medium">{submitSuccess.message}</p>
                  {submitSuccess.returnRequestName && <p className="mt-1">Reference: {submitSuccess.returnRequestName}</p>}
                  {submitSuccess.attachments && submitSuccess.attachments.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {submitSuccess.attachments.map((url) => (
                        <a key={url} href={url} target="_blank" rel="noreferrer" className="block underline">
                          View attachment
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {error && (
          <Card className="p-4 bg-destructive/10 border-destructive/20">
            <div className="flex items-start gap-3 text-destructive">
              <AlertCircle className="h-5 w-5 mt-0.5 shrink-0" />
              <p>Failed to load return requests. Please try again.</p>
            </div>
          </Card>
        )}

        {isLoading ? (
          <div className="grid gap-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="p-6">
                <div className="space-y-4">
                  <Skeleton className="h-6 w-48" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-16 w-full" />
                </div>
              </Card>
            ))}
          </div>
        ) : returnRequests.length === 0 ? (
          <Card className="p-12 text-center">
            <RotateCcw className="h-16 w-16 mx-auto text-muted-foreground mb-4 opacity-50" />
            <h2 className="text-xl font-semibold mb-2">No return requests found</h2>
            <p className="text-muted-foreground mb-6">Open the create window to start your first return request.</p>
            <Button onClick={() => handleCreateOpenChange(true)}>Create Return Request</Button>
          </Card>
        ) : (
          <div className="grid gap-4">
            {returnRequests.map((request: ReturnRequest) => {
              const requestKey = request.return_request_id ?? request.name ?? `${request.customer_id}-${request.date_of_request}`
              const totalItemsCount = getProductTotalCount(request)
              const requestItems = getRequestItems(request)
              const cardCustomerName = request.customer_name || request.customer_id || "Customer"

              return (
                <Card key={requestKey} className="border-border/60 shadow-sm">
                  <CardContent className="flex flex-col gap-4 pt-6 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-lg font-semibold">{cardCustomerName}</p>
                      <p className="text-sm text-muted-foreground">
                        Requested date: {formatDate(request.date_of_request)}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className="w-fit">
                        {requestItems.length} line item{requestItems.length === 1 ? "" : "s"} · {totalItemsCount} qty
                      </Badge>
                      <Button type="button" variant="outline" onClick={() => setActiveRequestKey(requestKey)}>
                        View Details
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}

        {!isLoading && returnRequests.length > 0 && (
          <div className="flex items-center justify-between gap-4">
            <Button variant="outline" onClick={() => setPage((current) => Math.max(1, current - 1))} disabled={!hasPreviousPage}>
              Previous
            </Button>
            <div className="text-sm text-muted-foreground">
              Page {pagination?.current_page ?? page}
              {pagination?.total_pages ? ` of ${pagination.total_pages}` : ""}
              {pagination?.total_records ? ` · ${pagination.total_records} total` : ""}
            </div>
            <Button
              variant="outline"
              onClick={() => {
                if (!hasNextPage) return
                setPage((current) => current + 1)
              }}
              disabled={!hasNextPage}
            >
              Next
            </Button>
          </div>
        )}
      </div>

      <Sheet open={isCreateOpen} onOpenChange={handleCreateOpenChange}>
        <SheetContent side="right" className="w-full p-0 sm:max-w-none sm:w-[98vw]">
          <div className="flex h-full min-h-0 flex-col">
            <SheetHeader className="border-b px-6 py-5 pr-14 text-left">
              <SheetTitle className="text-2xl">Create Return Request</SheetTitle>

            </SheetHeader>

            <div className="grid min-h-0 flex-1 lg:grid-cols-[1.55fr_0.95fr]">
              <div className="flex min-h-0 flex-col border-b lg:border-b-0 lg:border-r">
                <div className="border-b bg-muted/20 px-6 py-4">
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">

                    <Badge variant="secondary" className="w-fit">
                      <LayoutGrid className="h-3.5 w-3.5 mr-1" />
                      {selectedProducts.length} selected
                    </Badge>
                  </div>

                  <div className="relative mt-4">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      value={itemSearchTerm}
                      onChange={(event) => setItemSearchTerm(event.target.value)}
                      placeholder="Search products by name or category"
                      className="h-11 rounded-xl bg-background pl-9 pr-10"
                    />
                    {itemSearchTerm && (
                      <button
                        type="button"
                        onClick={() => setItemSearchTerm("")}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        aria-label="Clear search"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="min-h-0 flex-1 overflow-y-auto px-6 py-6">
                  {(isSearchingItems || isLoadingDefaultItems) && itemResults.length === 0 ? (
                    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                      {[1, 2, 3, 4, 5, 6].map((i) => (
                        <Card key={i} className="overflow-hidden py-0">
                          <Skeleton className="h-40 w-full rounded-none" />
                          <CardContent className="space-y-3 pt-4">
                            <Skeleton className="h-5 w-3/4" />
                            <Skeleton className="h-4 w-1/2" />
                            <Skeleton className="h-10 w-full" />
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : itemResults.length === 0 ? (
                    <Card className="p-12 text-center">
                      <Package className="h-14 w-14 mx-auto text-muted-foreground opacity-40 mb-4" />
                      <h3 className="text-lg font-semibold">No matching products</h3>
                      <p className="text-sm text-muted-foreground mt-2">Try another keyword. Search starts after 2 characters.</p>
                    </Card>
                  ) : (
                    <div className="grid gap-4 pb-10 sm:grid-cols-2 xl:grid-cols-3">
                      {itemResults.map((item: any) => {
                        const imageUrl = getDisplayImageUrl(getFirstImageUrl(item.image), getApiBaseUrl()) || "/placeholder.svg"
                        const isSelected = selectedProducts.some((product) => product.item_code === item.item_code)
                        const display = getPriceDisplay({
                          basePrice: Number(item.price_list_rate ?? item.rate ?? 0),
                          currency,
                          marginInfo: item.customer_price_margin,
                        })
                        const priceLabel =
                          display.kind === "hidden"
                            ? "Price on Request"
                            : display.kind === "range"
                              ? `${display.minLabel} - ${display.maxLabel}`
                              : display.label

                        return (
                          <Card
                            key={item.item_code}
                            className={[
                              "overflow-hidden py-0 gap-0 border-border/60",
                              "transition-all hover:shadow-md hover:border-primary/30",
                              isSelected ? "ring-1 ring-primary/20" : "",
                            ].join(" ")}
                          >
                            <div className="relative aspect-square bg-gradient-to-br from-muted/30 to-muted/10">
                              <Image
                                src={imageUrl}
                                alt={item.item_name || item.item_code || "Product"}
                                fill
                                className="object-contain p-6"
                                sizes="(max-width: 1280px) 50vw, 25vw"
                              />
                              {isSelected && (
                                <div className="absolute left-3 top-3 rounded-full bg-primary px-2.5 py-1 text-xs font-semibold text-primary-foreground flex items-center gap-1">
                                  <Check className="h-3.5 w-3.5" />
                                  Added
                                </div>
                              )}
                            </div>
                            <CardContent className="px-5 pt-5 pb-5">
                              <div className="min-h-12">
                                <p className="font-semibold leading-snug line-clamp-2">{item.item_name || item.item_code}</p>
                                <p className="text-xs text-muted-foreground mt-1">
                                  {item.item_code || "—"}
                                  {item.item_group ? ` · ${item.item_group}` : ""}
                                </p>
                              </div>
                              <div className="mt-4 flex items-end justify-between gap-4">
                                <div className="min-w-0">
                                  <p className="text-base font-black text-primary tabular-nums leading-none">
                                    {priceLabel}
                                  </p>
                                  <p className="mt-2 text-[11px] text-muted-foreground line-clamp-1">
                                    UOM: {getAvailableUoms(item).map((entry) => entry.uom).join(", ")}
                                  </p>
                                </div>
                                <Button
                                  type="button"
                                  size="sm"
                                  variant={isSelected ? "secondary" : "default"}
                                  onClick={() => addProduct(item)}
                                  disabled={isSelected}
                                  className={[
                                    "rounded-full font-semibold shrink-0",
                                    "min-w-24 justify-center",
                                  ].join(" ")}
                                >
                                  {isSelected ? (
                                    <>
                                      <Check className="h-4 w-4 mr-1" />
                                      Added
                                    </>
                                  ) : (
                                    <>
                                      <Plus className="h-4 w-4 mr-1" />
                                      Add
                                    </>
                                  )}
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        )
                      })}
                    </div>
                  )}
                </div>
              </div>

              <div className="min-h-0 overflow-y-auto bg-background px-6 py-6">
                <form className="space-y-6 pb-8" onSubmit={handleSubmit}>
                  <div className="space-y-3">
                    <div>
                      <p className="font-semibold">Invoice (optional)</p>
                      <p className="text-xs text-muted-foreground mt-1">Type an invoice number or pick from your invoices.</p>
                    </div>
                    <div className="relative space-y-2">
                      <div className="flex gap-2">
                        <Input
                          id="return-invoice-no"
                          value={selectedInvoiceNo}
                          onChange={(event) => setSelectedInvoiceNo(event.target.value)}
                          placeholder="Invoice number"
                          className="h-10 flex-1"
                          aria-label="Invoice number"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          className="shrink-0"
                          onClick={() => setInvoiceDropdownOpen((open) => !open)}
                          aria-expanded={invoiceDropdownOpen}
                          aria-controls="invoice-browse-list"
                        >
                          Browse
                        </Button>
                      </div>
                      {invoiceDropdownOpen && (
                        <div
                          id="invoice-browse-list"
                          className="absolute z-50 mt-1 w-full rounded-xl border bg-popover p-2 shadow-lg"
                        >
                          <div className="relative mb-2">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                              value={invoiceQuery}
                              onChange={(event) => setInvoiceQuery(event.target.value)}
                              placeholder="Search invoices"
                              className="pl-9"
                              autoFocus
                            />
                          </div>
                          <div className="max-h-72 overflow-y-auto">
                            {invoices.length === 0 ? (
                              <div className="px-3 py-2 text-sm text-muted-foreground">No invoices found</div>
                            ) : (
                              invoices.map((invoice: any) => {
                                const invoiceNo = getInvoiceNumber(invoice)
                                return (
                                  <button
                                    key={invoiceNo}
                                    type="button"
                                    onClick={() => {
                                      setSelectedInvoiceNo(invoiceNo)
                                      setInvoiceDropdownOpen(false)
                                    }}
                                    className="flex w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-muted"
                                  >
                                    {getInvoiceLabel(invoice)}
                                  </button>
                                )
                              })
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                    {selectedInvoice && selectedInvoiceNo.trim() === getInvoiceNumber(selectedInvoice) && (
                      <div className="rounded-xl border border-border/60 bg-muted/20 p-3 text-sm text-muted-foreground">
                        Matched invoice: <span className="font-medium text-foreground">{getInvoiceLabel(selectedInvoice)}</span>
                      </div>
                    )}
                  </div>

                  <div className="rounded-2xl">

                    <div className="mt-4 space-y-3">
                      {
                        selectedProducts.map((product) => (
                          <div key={product.item_code} className="rounded-xl border border-border/60 bg-background p-3">
                            <div className="flex items-start justify-between gap-3 mb-3">
                              <div className="min-w-0">
                                <p className="font-medium">{product.item_name}</p>
                                <p className="text-sm text-muted-foreground">{product.item_code}</p>
                              </div>
                              <Button type="button" variant="ghost" size="icon" onClick={() => removeProduct(product.item_code)}>
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                            <div className="grid gap-3 sm:grid-cols-2">
                              <div className="space-y-2">
                                <label className="text-sm font-medium" htmlFor={`qty-${product.item_code}`}>
                                  Quantity
                                </label>
                                <Input
                                  id={`qty-${product.item_code}`}
                                  type="text"
                                  inputMode="numeric"
                                  autoComplete="off"
                                  aria-label={`Quantity for ${product.item_name || product.item_code}`}
                                  value={
                                    quantityDraftByCode[product.item_code] !== undefined
                                      ? quantityDraftByCode[product.item_code]
                                      : String(product.quantity)
                                  }
                                  onChange={(event) => handleQuantityChange(product.item_code, event.target.value)}
                                  onBlur={(event) => handleQuantityBlur(product.item_code, event.target.value)}
                                />
                              </div>
                              <div className="space-y-2">
                                <label className="text-sm font-medium">UOM</label>
                                <Select
                                  value={product.uom}
                                  onValueChange={(value) => updateProduct(product.item_code, { uom: value })}
                                >
                                  <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Select UOM" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {product.availableUoms.map((uomOption) => (
                                      <SelectItem key={`${product.item_code}-${uomOption.uom}`} value={uomOption.uom}>
                                        {uomOption.uom}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                          </div>
                        ))
                      }
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="return-date" className="text-sm font-medium">
                      Date of Request
                    </label>
                    <Input
                      id="return-date"
                      type="date"
                      value={dateOfRequest}
                      onChange={(event) => setDateOfRequest(event.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="return-reason" className="text-sm font-medium">
                      Reason for Return
                    </label>
                    <Textarea
                      id="return-reason"
                      value={reasonForReturn}
                      onChange={(event) => setReasonForReturn(event.target.value)}
                      placeholder="Describe the issue with these products"
                      rows={4}
                    />
                  </div>

                  <div className="space-y-3">
                    <label htmlFor="return-photos" className="text-sm font-medium flex items-center gap-2">
                      <FileImage className="h-4 w-4" />
                      Photos
                    </label>
                    <Input
                      id="return-photos"
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={(event) => setPhotos((current) => [...current, ...Array.from(event.target.files ?? [])])}
                    />
                    {photoPreviewUrls.length > 0 && (
                      <div className="grid grid-cols-3 gap-3">
                        {photoPreviewUrls.map((url, index) => (
                          <div key={url} className="relative overflow-hidden rounded-xl border border-border/60 bg-muted/20">
                            <div className="relative aspect-square">
                              <Image src={url} alt={`Return upload ${index + 1}`} fill className="object-cover" sizes="160px" />
                            </div>
                            <button
                              type="button"
                              onClick={() => removePhoto(index)}
                              className="absolute right-2 top-2 rounded-full bg-black/70 p-1 text-white"
                              aria-label={`Remove photo ${index + 1}`}
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {submitError && (
                    <div className="rounded-xl border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">
                      {submitError}
                    </div>
                  )}

                  <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                    <Button type="button" variant="outline" onClick={resetForm} disabled={isSubmitting}>
                      Reset
                    </Button>
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting ? "Submitting..." : "Submit Return Request"}
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      <Sheet open={Boolean(activeRequest)} onOpenChange={(open) => !open && setActiveRequestKey(null)}>
        <SheetContent side="right" className="w-full px-0 sm:max-w-xl">
          {activeRequest && (
            <div className="flex h-full min-h-0 flex-col">
              <div className="flex-1 overflow-y-auto px-6 py-8">
                <div className="space-y-6">
                  <div className="rounded-2xl border border-border/60 bg-muted/20 p-5">
                    <h2 className="text-2xl font-semibold">{activeRequest.customer_name || activeRequest.customer_id || "Customer"}</h2>
                    <p className="text-sm text-muted-foreground mt-1">
                      Requested date: {formatDate(activeRequest.date_of_request)}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Invoice: {activeRequest.return_for_invoice_no || "—"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Reason: {activeRequest.reason_for_return || "—"}
                    </p>
                  </div>

                  <div className="space-y-3 rounded-2xl border border-border/60 bg-background p-5">
                    <p className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Items</p>
                    {getRequestItems(activeRequest).length > 0 ? (
                      getRequestItems(activeRequest).map((item, index) => (
                        <div key={`${item.item_code ?? item.item_name ?? "item"}-${index}`} className="rounded-xl border border-border/60 p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="font-medium">{item.item_name || item.item_code || "Item"}</p>
                              <p className="text-sm text-muted-foreground">
                                {item.item_code || "—"}
                                {item.item_group ? ` · ${item.item_group}` : ""}
                              </p>
                            </div>
                            <Badge variant="secondary">
                              {item.qty ?? item.quantity ?? 0} {item.uom || ""}
                            </Badge>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground">No items returned from API.</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}
