"use client"

import { useEffect, useMemo, useState } from "react"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import Image from "next/image"
import Link from "next/link"
import { X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { AnnouncementPopupConfig } from "@/lib/api/hooks"

type AnnouncementPopupProps = {
  announcement?: AnnouncementPopupConfig | null
  /**
   * If true, the popup will auto-open on mount when enabled + active.
   * Dismissals are persisted in localStorage.
   */
  autoOpen?: boolean
  /**
   * Optional: prevents showing the modal on certain routes (e.g. login pages).
   */
  disabled?: boolean
}

const getActiveNow = (announcement?: AnnouncementPopupConfig | null) => {
  if (!announcement?.enabled) return false
  if (!announcement.image_url) return false

  const start = announcement.start_date ? new Date(announcement.start_date) : null
  const end = announcement.end_date ? new Date(announcement.end_date) : null
  const now = new Date()

  const isAfterStart = start ? now >= start : true
  const isBeforeEnd = end ? now <= end : true

  return isAfterStart && isBeforeEnd
}

export function AnnouncementPopup({
  announcement,
  autoOpen = true,
  disabled = false,
}: AnnouncementPopupProps) {
  const [open, setOpen] = useState(false)

  const active = useMemo(() => getActiveNow(announcement), [announcement])

  useEffect(() => {
    if (!autoOpen) return
    if (disabled) return
    if (!active) return
    setOpen(true)
  }, [active, autoOpen, disabled])

  const handleOpenChange = (nextOpen: boolean) => setOpen(nextOpen)

  const redirectUrl = announcement?.redirect_url ?? null

  const redirectNode = redirectUrl
    ? redirectUrl.startsWith("/") ? (
        <Link href={redirectUrl} className="block">
          <span className="sr-only">Open announcement details</span>
        </Link>
      ) : (
        <a href={redirectUrl} target="_blank" rel="noopener noreferrer" className="block">
          <span className="sr-only">Open announcement details</span>
        </a>
      )
    : null

  if (!announcement) return null

  if (!active && !open) return null

  return (
    <DialogPrimitive.Root open={open} onOpenChange={handleOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay
          className={cn(
            "fixed inset-0 z-50 bg-black/70",
            "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0"
          )}
        />
        <DialogPrimitive.Content
          aria-label="Announcement popup"
          className={cn(
            "fixed left-1/2 top-1/2 z-50 w-[min(100vw-2rem,980px)] -translate-x-1/2 -translate-y-1/2",
            "rounded-2xl border border-border/60 bg-background shadow-2xl overflow-hidden",
            "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
            "data-[state=open]:slide-in-from-top-2 data-[state=closed]:slide-out-to-top-2",
            "focus:outline-none"
          )}
        >
          <div className="w-full">
            <DialogPrimitive.Title className="sr-only">Announcement</DialogPrimitive.Title>
            <div className="relative w-full bg-muted">
              <div className="relative w-full aspect-video sm:aspect-21/9 max-h-[70vh]">
                {announcement.image_url ? (
                  <Image
                    src={announcement.image_url}
                    alt="Announcement"
                    fill
                    priority
                    className="object-cover"
                  />
                ) : null}
              </div>
              {redirectNode ? (
                <div className="absolute inset-0">{redirectNode}</div>
              ) : null}
            </div>

            <div className="flex items-center justify-end gap-2 p-4 border-t border-border/60">
              <DialogPrimitive.Close asChild>
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-full"
                  aria-label="Close announcement"
                >
                  <X className="h-4 w-4 mr-2" />
                  Close
                </Button>
              </DialogPrimitive.Close>
            </div>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}

