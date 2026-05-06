"use client"

import { useEffect, useState, type ReactNode } from "react"
import { Leaf } from "lucide-react"
import { createClient } from "@/utils/supabase/client"
import { NotificationBell } from "@/components/dashboard/notification-bell"
import { cn } from "@/lib/utils"

export function GlassTopBar({ end, className }: { end?: ReactNode; className?: string }) {
  const [email, setEmail] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    void createClient()
      .auth.getUser()
      .then(({ data }) => {
        if (!cancelled) setEmail(data.user?.email ?? null)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const initial = email?.trim()?.[0]?.toUpperCase() ?? "?"

  return (
    <header
      className={cn(
        "sticky top-0 z-50 border-b border-emerald-500/25 bg-background/70 backdrop-blur-xl supports-[backdrop-filter]:bg-background/55",
        className,
      )}
    >
      <div className="flex h-14 items-center justify-between gap-3 px-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-2">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500/20 to-teal-500/15 text-emerald-700 ring-1 ring-emerald-500/20">
            <Leaf className="size-4" aria-hidden />
          </span>
          <span className="truncate text-sm font-semibold tracking-tight text-emerald-900 sm:text-base">
            EcoLoop
          </span>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <NotificationBell tone="surface" />
          <div
            className="flex size-9 items-center justify-center rounded-full border border-emerald-200/80 bg-emerald-50 text-sm font-semibold text-emerald-800 shadow-sm"
            title={email ?? "Kullanıcı"}
            aria-hidden
          >
            {initial}
          </div>
          {end ? <div className="flex items-center border-l border-border/60 pl-2">{end}</div> : null}
        </div>
      </div>
    </header>
  )
}
