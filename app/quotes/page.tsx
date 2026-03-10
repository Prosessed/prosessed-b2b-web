"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { useQuotations } from "@/lib/api/hooks"
import { useAuth } from "@/lib/auth/context"
import { formatPrice, formatDate } from "@/lib/utils/currency"
import { motion } from "framer-motion"
import { Calendar, CheckCircle, Clock, FileText, XCircle } from "lucide-react"
import Link from "next/link"
import { useCallback, useMemo, useState } from "react"

const PRESETS = [
  { label: "Last 7 days", days: 7 },
  { label: "Last 30 days", days: 30 },
  {
    label: "This month",
    getRange: () => {
      const now = new Date()
      const start = new Date(now.getFullYear(), now.getMonth(), 1)
      return { start, end: now }
    },
  },
  { label: "Last 3 months", days: 90 },
] as const

function getTodayISO(): string {
  return new Date().toISOString().slice(0, 10)
}

function getDaysAgoISO(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() - days)
  return d.toISOString().slice(0, 10)
}

const defaultEnd = getTodayISO()
const defaultStart = getDaysAgoISO(30)

export default function QuotesPage() {
  const { user, isAuthenticated } = useAuth()
  const [startDate, setStartDate] = useState(defaultStart)
  const [endDate, setEndDate] = useState(defaultEnd)
  const [activePresetIndex, setActivePresetIndex] = useState<number>(1) // default: Last 30 days

  const { data: quotations = [], isLoading, error } = useQuotations({
    startDate,
    endDate,
  })
  const currency = user?.defaultCurrency ?? "AUD"

  const applyPreset = useCallback((presetIndex: number, preset: (typeof PRESETS)[number]) => {
    if ("days" in preset && preset.days) {
      const nextEnd = getTodayISO()
      const nextStart = getDaysAgoISO(preset.days)
      setEndDate(nextEnd)
      setStartDate(nextStart)
    } else if ("getRange" in preset && preset.getRange) {
      const { start, end } = preset.getRange()
      setStartDate(start.toISOString().slice(0, 10))
      setEndDate(end.toISOString().slice(0, 10))
    }
    setActivePresetIndex(presetIndex)
  }, [])

  const getStatusIcon = (status: string) => {
    if (/approved|ordered|open/i.test(status)) return <CheckCircle className="h-4 w-4" />
    if (/reject|cancel/i.test(status)) return <XCircle className="h-4 w-4" />
    if (/expired/i.test(status)) return <Clock className="h-4 w-4" />
    return <FileText className="h-4 w-4" />
  }

  const getStatusColor = (status: string) => {
    if (/approved|ordered|open/i.test(status)) return "bg-green-500/10 text-green-700 dark:text-green-400"
    if (/reject|cancel/i.test(status)) return "bg-red-500/10 text-red-700 dark:text-red-400"
    if (/expired/i.test(status)) return "bg-gray-500/10 text-gray-700 dark:text-gray-400"
    return "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400"
  }

  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="p-8 text-center">
          <p className="text-muted-foreground mb-4">Please sign in to view quotes</p>
          <Button asChild>
            <Link href="/login">Sign In</Link>
          </Button>
        </Card>
      </div>
    )
  }

  const list = Array.isArray(quotations) ? quotations : []

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold mb-2">My Quotes</h1>
            <p className="text-muted-foreground">Manage your quotations</p>
          </div>
          <Button asChild size="lg" className="shrink-0 w-full sm:w-auto">
            <Link href="/cart">Request New Quote</Link>
          </Button>
        </div>

        {/* Date range filter */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Card className="p-4 sm:p-6 border-2 border-primary/10 bg-linear-to-br from-background to-muted/20">
            <div className="flex flex-col gap-4">
              <div className="flex flex-wrap items-center gap-2">
                <Calendar className="h-5 w-5 text-primary shrink-0" aria-hidden />
                <span className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
                  Date range
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
                <div className="space-y-2">
                  <label htmlFor="quotes-start" className="text-xs font-semibold text-muted-foreground block">
                    From
                  </label>
                  <Input
                    id="quotes-start"
                    type="date"
                    value={startDate}
                    onChange={(e) => {
                      setStartDate(e.target.value)
                      setActivePresetIndex(-1)
                    }}
                    className="w-full rounded-xl border-2 border-border/60 bg-background focus:border-primary transition-colors cursor-pointer"
                    aria-label="Start date"
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="quotes-end" className="text-xs font-semibold text-muted-foreground block">
                    To
                  </label>
                  <Input
                    id="quotes-end"
                    type="date"
                    value={endDate}
                    onChange={(e) => {
                      setEndDate(e.target.value)
                      setActivePresetIndex(-1)
                    }}
                    className="w-full rounded-xl border-2 border-border/60 bg-background focus:border-primary transition-colors cursor-pointer"
                    aria-label="End date"
                  />
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {PRESETS.map((preset, i) => (
                  <Button
                    key={preset.label}
                    type="button"
                    variant={activePresetIndex === i ? "default" : "outline"}
                    size="sm"
                    onClick={() => applyPreset(i, preset)}
                    className="rounded-full font-semibold cursor-pointer transition-all"
                    aria-label={`Filter by ${preset.label}`}
                  >
                    {preset.label}
                  </Button>
                ))}
              </div>
            </div>
          </Card>
        </motion.div>

        {error && (
          <Card className="mb-6 p-6 bg-destructive/10 border-destructive/20">
            <p className="text-destructive">Failed to load quotes. Please try again.</p>
          </Card>
        )}

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="p-6 animate-pulse">
                <div className="h-6 w-48 bg-muted rounded mb-4" />
                <div className="h-4 w-full bg-muted rounded" />
              </Card>
            ))}
          </div>
        ) : list.length === 0 ? (
          <Card className="p-12 text-center">
            <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No quotes in this range</h3>
            <p className="text-muted-foreground mb-6">Try a different date range or request a new quote</p>
            <Button variant="outline" onClick={() => { setStartDate(defaultStart); setEndDate(defaultEnd) }} className="cursor-pointer">
              Reset to last 30 days
            </Button>
          </Card>
        ) : (
          <div className="space-y-4">
            {list.map((q: any) => (
              <Card key={q.name} className="p-6 hover:shadow-lg transition-shadow">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-4 mb-2">
                      <h3 className="font-bold text-lg">Quote #{q.name}</h3>
                      <Badge className={getStatusColor(q.workflow_state ?? q.status ?? "")}>
                        {getStatusIcon(q.workflow_state ?? q.status ?? "")}
                        <span className="ml-1 capitalize">{q.workflow_state ?? q.status ?? "—"}</span>
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-1">
                      Created {formatDate(q.creation)}
                    </p>
                    {q.customer_name && (
                      <p className="text-sm text-muted-foreground">Customer: {q.customer_name}</p>
                    )}
                  </div>
                  <div className="flex flex-col items-start lg:items-end gap-2">
                    <p className="text-2xl font-bold text-primary">
                      {formatPrice(q.grand_total ?? 0, currency)}
                    </p>
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/quotes/${q.name}`}>View Details</Link>
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
