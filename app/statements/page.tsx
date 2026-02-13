"use client"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { useCustomerName, useCustomerStatement } from "@/lib/api/hooks"
import { useAuth } from "@/lib/auth/context"
import { AlertCircle, Download, ExternalLink, FileText, Loader, ZoomIn, ZoomOut } from "lucide-react"
import Link from "next/link"
import { useEffect, useRef, useState } from "react"

export default function StatementsPage() {
  const { user, isAuthenticated } = useAuth()
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [submitted, setSubmitted] = useState(false)

  // Fetch customer name (API: get_customer_name) and statement URL when dates are submitted
  const { data: customerName, isLoading: isNameLoading } = useCustomerName(user?.customerId ?? null)

  const { data: statementUrl, isLoading, error } = useCustomerStatement(
    submitted && customerName ? customerName : null,
    submitted ? startDate : null,
    submitted ? endDate : null
  )

  // Manage object URL lifecycle
  const lastObjectUrl = useRef<string | null>(null)
  useEffect(() => {
    const url = statementUrl?.url
    if (!url) return
    // Revoke previous if different
    if (lastObjectUrl.current && lastObjectUrl.current !== url) {
      try {
        URL.revokeObjectURL(lastObjectUrl.current)
      } catch {}
    }
    lastObjectUrl.current = url

    return () => {
      // When unmounting, revoke
      try {
        if (lastObjectUrl.current) {
          URL.revokeObjectURL(lastObjectUrl.current)
          lastObjectUrl.current = null
        }
      } catch {}
    }
  }, [statementUrl])

  // Zoom state for PDF preview
  const [zoom, setZoom] = useState(1)
  const zoomIn = () => setZoom((z) => Math.min(2, +(z + 0.1).toFixed(2)))
  const zoomOut = () => setZoom((z) => Math.max(0.4, +(z - 0.1).toFixed(2)))
  const resetZoom = () => setZoom(1)

  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="p-8 text-center">
          <p className="text-muted-foreground mb-4">
            Please sign in to view your statements
          </p>
          <Button asChild>
            <Link href="/login">Sign In</Link>
          </Button>
        </Card>
      </div>
    )
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!startDate || !endDate) {
      alert("Please select both start and end dates")
      return
    }

    if (new Date(startDate) > new Date(endDate)) {
      alert("Start date must be before end date")
      return
    }

    setSubmitted(true)
  }

  const handleReset = () => {
    setStartDate("")
    setEndDate("")
    setSubmitted(false)
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">My Statements</h1>
          <p className="text-muted-foreground">
            Download and view your customer account statements
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Form Section */}
          <div className="lg:col-span-1">
            <Card className="p-6 sticky top-20">
              <h2 className="text-xl font-semibold mb-6">Request Statement</h2>

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Customer Name Display */}
                <div>
                  <Label htmlFor="customer" className="text-sm font-medium">
                    Customer
                  </Label>
                  <div className="mt-2 p-3 bg-muted rounded-lg">
                    <p className="text-sm font-medium">{customerName ?? user.customerId}</p>
                    <p className="text-xs text-muted-foreground mt-1">{user.companyName}</p>
                    {isNameLoading && (
                      <p className="text-xs text-muted-foreground mt-2">Loading customer name…</p>
                    )}
                  </div>
                </div>

                {/* Start Date */}
                <div>
                  <Label htmlFor="startDate" className="text-sm font-medium">
                    Start Date <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="mt-2"
                    disabled={isLoading}
                  />
                </div>

                {/* End Date */}
                <div>
                  <Label htmlFor="endDate" className="text-sm font-medium">
                    End Date <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="mt-2"
                    disabled={isLoading}
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 pt-4">
                  <Button
                    type="submit"
                    className="flex-1"
                    disabled={isLoading}
                  >
                    {isLoading && (
                      <Loader className="h-4 w-4 mr-2 animate-spin" />
                    )}
                    {isLoading ? "Loading..." : "Generate"}
                  </Button>
                  {submitted && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleReset}
                      disabled={isLoading}
                    >
                      Reset
                    </Button>
                  )}
                </div>
              </form>

              {/* Helper Text */}
              <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <p className="text-xs text-blue-900 dark:text-blue-200">
                  <span className="font-semibold">Tip:</span> Select a date range to
                  generate your account statement for that period.
                </p>
              </div>
            </Card>
          </div>

          {/* Results Section */}
          <div className="lg:col-span-2">
            {!submitted ? (
              <Card className="p-12 text-center">
                <FileText className="h-16 w-16 mx-auto text-muted-foreground mb-4 opacity-50" />
                <h3 className="text-lg font-semibold mb-2">
                  No statements generated
                </h3>
                <p className="text-muted-foreground">
                  Select a date range and click "Generate" to retrieve your statement.
                </p>
              </Card>
            ) : isLoading ? (
              <div className="space-y-4">
                <Card className="p-6">
                  <Skeleton className="h-8 w-32 mb-4" />
                  <Skeleton className="h-64 w-full" />
                </Card>
              </div>
            ) : error ? (
              <Card className="p-6 bg-destructive/10 border-destructive/20">
                <div className="flex gap-3">
                  <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-destructive mb-1">
                      Unable to Load Statement
                    </h3>
                    <p className="text-sm text-destructive/90">
                      {error?.message ||
                        "An error occurred while fetching your statement. Please try again."}
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleReset}
                      className="mt-3"
                    >
                      Try Again
                    </Button>
                  </div>
                </div>
              </Card>
            ) : statementUrl ? (
              <div className="space-y-4">
                {/* Statement Preview */}
                <Card className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-lg font-semibold">
                        Statement Generated
                      </h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        {startDate} to {endDate}
                      </p>
                    </div>
                    <Badge className="bg-green-500/10 text-green-700 dark:text-green-400">
                      Ready
                    </Badge>
                  </div>

                  {/* PDF Preview or Details */}
                  <div className="bg-muted rounded-lg p-4 min-h-96 flex items-center justify-center">
                    {statementUrl?.url ? (
                      <div className="w-full">
                        <div className="flex items-center justify-end gap-2 mb-3">
                          <div className="flex items-center gap-2">
                            <Button variant="outline" size="sm" onClick={zoomOut}>
                              <ZoomOut className="h-4 w-4" />
                            </Button>
                            <Button variant="outline" size="sm" onClick={resetZoom}>
                              {Math.round(zoom * 100)}%
                            </Button>
                            <Button variant="outline" size="sm" onClick={zoomIn}>
                              <ZoomIn className="h-4 w-4" />
                            </Button>
                          </div>
                          <div className="flex items-center gap-2">
                            <a href={statementUrl.url} target="_blank" rel="noopener noreferrer" className="inline-flex">
                              <Button variant="outline" size="sm">
                                <ExternalLink className="h-4 w-4 mr-2" />
                                Open
                              </Button>
                            </a>
                            <a href={statementUrl.url} download target="_blank" rel="noopener noreferrer" className="inline-flex">
                              <Button size="sm">
                                <Download className="h-4 w-4 mr-2" />
                                Download
                              </Button>
                            </a>
                          </div>
                        </div>

                        <div className="rounded border border-border overflow-hidden">
                          <iframe
                            src={statementUrl.url}
                            className="w-full h-96"
                            title="Customer Statement"
                            style={{ transform: `scale(${zoom})`, transformOrigin: "top center" }}
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="text-center">
                        <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-2 opacity-50" />
                        <p className="text-muted-foreground text-sm">
                          Statement ready for download
                        </p>
                      </div>
                    )}
                  </div>
                </Card>

                {/* Download Button */}
                {statementUrl?.url && (
                  <Card className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-semibold">Download Statement</h4>
                        <p className="text-sm text-muted-foreground mt-1">
                          Get your statement as a PDF file
                        </p>
                      </div>
                      <Button
                        asChild
                        size="lg"
                        className="gap-2"
                      >
                        <a
                          href={statementUrl.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          download
                        >
                          <Download className="h-4 w-4" />
                          Download PDF
                        </a>
                      </Button>
                    </div>
                  </Card>
                )}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  )
}

// Badge component helper
function Badge({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <span
      className={`px-3 py-1 rounded-full text-xs font-medium ${className}`}
    >
      {children}
    </span>
  )
}
