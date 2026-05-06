"use client"

import { useCallback, useEffect, useState } from "react"
import { Bell } from "lucide-react"
import { createClient } from "@/utils/supabase/client"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"

export type NotificationRow = {
  id: string
  user_id: string
  title: string | null
  body: string | null
  is_read: boolean | null
  created_at: string | null
}

type NotificationBellProps = {
  /** surface: açık üst çubuk; sidebar: koyu yan menü */
  tone?: "surface" | "sidebar"
}

export function NotificationBell({ tone = "sidebar" }: NotificationBellProps) {
  const [open, setOpen] = useState(false)
  const [items, setItems] = useState<NotificationRow[]>([])
  const [unread, setUnread] = useState(0)
  const [loading, setLoading] = useState(false)

  const load = useCallback(async () => {
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      setItems([])
      setUnread(0)
      return
    }

    const { count } = await supabase
      .from("notifications")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("is_read", false)

    setUnread(count ?? 0)

    if (!open) return

    setLoading(true)
    try {
      const { data, error } = await supabase
        .from("notifications")
        .select("id,user_id,title,body,is_read,created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(40)

      if (error) {
        console.error(error)
        return
      }
      setItems((data as NotificationRow[]) ?? [])
    } finally {
      setLoading(false)
    }
  }, [open])

  useEffect(() => {
    load()
  }, [load])

  const markRead = async (row: NotificationRow) => {
    if (row.is_read) return
    const supabase = createClient()
    const { error } = await supabase.from("notifications").update({ is_read: true }).eq("id", row.id)
    if (error) {
      console.error(error)
      return
    }
    setItems((prev) => prev.map((n) => (n.id === row.id ? { ...n, is_read: true } : n)))
    setUnread((u) => Math.max(0, u - 1))
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={cn(
            "relative shrink-0",
            tone === "sidebar"
              ? "text-sidebar-foreground hover:bg-sidebar-accent/50"
              : "text-emerald-900 hover:bg-emerald-500/10",
          )}
          aria-label="Bildirimler"
        >
          <Bell className="size-5" />
          {unread > 0 ? (
            <span className="absolute -right-0.5 -top-0.5 flex size-4 items-center justify-center rounded-full bg-[#f9735c] text-[10px] font-bold text-white shadow-sm ring-2 ring-background">
              {unread > 9 ? "9+" : unread}
            </span>
          ) : null}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-0" align="end" side="right" sideOffset={8}>
        <div className="border-b px-3 py-2">
          <p className="text-sm font-semibold">Bildirimler</p>
          <p className="text-xs text-muted-foreground">Tıklayınca okundu işaretlenir</p>
        </div>
        <ScrollArea className="h-[min(70vh,360px)]">
          {loading ? (
            <p className="p-4 text-sm text-muted-foreground">Yükleniyor...</p>
          ) : items.length === 0 ? (
            <p className="p-4 text-sm text-muted-foreground">Bildirim yok.</p>
          ) : (
            <ul className="divide-y">
              {items.map((n) => (
                <li key={n.id}>
                  <button
                    type="button"
                    className={cn(
                      "w-full px-3 py-2.5 text-left text-sm transition-colors hover:bg-muted/80",
                      !n.is_read && "bg-primary/5",
                    )}
                    onClick={() => markRead(n)}
                  >
                    <span className="font-medium">{n.title ?? "Bildirim"}</span>
                    {n.body ? <p className="mt-0.5 text-xs text-muted-foreground line-clamp-3">{n.body}</p> : null}
                    {n.created_at ? (
                      <p className="mt-1 text-[10px] text-muted-foreground">
                        {new Date(n.created_at).toLocaleString("tr-TR")}
                      </p>
                    ) : null}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  )
}
