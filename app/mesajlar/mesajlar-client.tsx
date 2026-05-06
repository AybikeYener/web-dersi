"use client"

import { useMemo, useState } from "react"
import { toast } from "sonner"
import { Send } from "lucide-react"
import { createClient } from "@/utils/supabase/client"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"

export type MessageRow = {
  id: string
  sender_id: string
  receiver_id: string
  content: string | null
  created_at: string | null
}

export type PartnerProfile = {
  id: string
  full_name: string | null
  email: string | null
}

export function MesajlarClient({
  currentUserId,
  initialMessages,
  partnerProfiles,
}: {
  currentUserId: string
  initialMessages: MessageRow[]
  partnerProfiles: PartnerProfile[]
}) {
  const [messages, setMessages] = useState(initialMessages)
  const [selectedPartnerId, setSelectedPartnerId] = useState<string | null>(() => {
    const partners = buildPartners(initialMessages, currentUserId)
    return partners[0] ?? null
  })
  const [draft, setDraft] = useState("")
  const [sending, setSending] = useState(false)

  const profileById = useMemo(
    () => new Map(partnerProfiles.map((p) => [p.id, p] as const)),
    [partnerProfiles],
  )

  const partners = useMemo(() => buildPartners(messages, currentUserId), [messages, currentUserId])

  const sortedPartners = useMemo(() => {
    const lastAt = new Map<string, number>()
    for (const m of messages) {
      const other = m.sender_id === currentUserId ? m.receiver_id : m.sender_id
      const t = m.created_at ? new Date(m.created_at).getTime() : 0
      lastAt.set(other, Math.max(lastAt.get(other) ?? 0, t))
    }
    return [...partners].sort((a, b) => (lastAt.get(b) ?? 0) - (lastAt.get(a) ?? 0))
  }, [messages, partners, currentUserId])

  const thread = useMemo(() => {
    if (!selectedPartnerId) return []
    return messages
      .filter(
        (m) =>
          (m.sender_id === currentUserId && m.receiver_id === selectedPartnerId) ||
          (m.receiver_id === currentUserId && m.sender_id === selectedPartnerId),
      )
      .sort((a, b) => {
        const ta = a.created_at ? new Date(a.created_at).getTime() : 0
        const tb = b.created_at ? new Date(b.created_at).getTime() : 0
        return ta - tb
      })
  }, [messages, selectedPartnerId, currentUserId])

  const send = async () => {
    if (!selectedPartnerId) {
      toast.error("Önce bir konuşma seçin.")
      return
    }
    if (!draft.trim()) {
      toast.error("Mesaj yazın.")
      return
    }
    setSending(true)
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from("messages")
        .insert({
          sender_id: currentUserId,
          receiver_id: selectedPartnerId,
          content: draft.trim(),
        })
        .select("id,sender_id,receiver_id,content,created_at")
        .single()

      if (error) {
        toast.error(`Gönderilemedi: ${error.message}`)
        return
      }
      if (data) setMessages((m) => [...m, data as MessageRow])
      setDraft("")
      toast.success("Mesaj gönderildi.")
    } finally {
      setSending(false)
    }
  }

  const labelFor = (userId: string) => {
    const p = profileById.get(userId)
    return p?.full_name?.trim() || p?.email || userId.slice(0, 8)
  }

  return (
    <div className="grid h-[calc(100vh-8rem)] gap-4 md:grid-cols-[280px_1fr]">
      <Card className="flex min-h-0 flex-col overflow-hidden">
        <div className="border-b px-3 py-2 text-sm font-semibold">Konuşmalar</div>
        <ScrollArea className="flex-1">
          {sortedPartners.length === 0 ? (
            <p className="p-3 text-sm text-muted-foreground">Henüz mesaj yok.</p>
          ) : (
            <ul>
              {sortedPartners.map((pid) => (
                <li key={pid}>
                  <button
                    type="button"
                    className={cn(
                      "w-full px-3 py-2.5 text-left text-sm transition-colors hover:bg-muted/80",
                      selectedPartnerId === pid && "bg-sidebar-accent/40 font-medium",
                    )}
                    onClick={() => setSelectedPartnerId(pid)}
                  >
                    {labelFor(pid)}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </ScrollArea>
      </Card>

      <Card className="flex min-h-0 flex-col overflow-hidden">
        <div className="border-b px-4 py-3">
          <p className="text-sm font-semibold">
            {selectedPartnerId ? labelFor(selectedPartnerId) : "Sohbet"}
          </p>
          <p className="text-xs text-muted-foreground">Gelen ve giden mesajlar</p>
        </div>
        <ScrollArea className="min-h-0 flex-1 p-4">
          {!selectedPartnerId ? (
            <p className="text-sm text-muted-foreground">Soldan bir kişi seçin.</p>
          ) : thread.length === 0 ? (
            <p className="text-sm text-muted-foreground">Bu kişiyle henüz mesaj yok. Aşağıdan yazın.</p>
          ) : (
            <div className="space-y-3">
              {thread.map((m) => {
                const mine = m.sender_id === currentUserId
                return (
                  <div key={m.id} className={cn("flex", mine ? "justify-end" : "justify-start")}>
                    <div
                      className={cn(
                        "max-w-[85%] rounded-2xl px-3 py-2 text-sm shadow-sm",
                        mine ? "bg-primary text-primary-foreground" : "bg-muted",
                      )}
                    >
                      <p className="whitespace-pre-wrap">{m.content}</p>
                      {m.created_at ? (
                        <p
                          className={cn(
                            "mt-1 text-[10px] opacity-80",
                            mine ? "text-primary-foreground/80" : "text-muted-foreground",
                          )}
                        >
                          {new Date(m.created_at).toLocaleString("tr-TR")}
                        </p>
                      ) : null}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </ScrollArea>
        <div className="flex gap-2 border-t p-3">
          <Input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Mesajınız..."
            disabled={!selectedPartnerId || sending}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault()
                void send()
              }
            }}
          />
          <Button type="button" onClick={() => void send()} disabled={!selectedPartnerId || sending}>
            <Send className="size-4" />
          </Button>
        </div>
      </Card>
    </div>
  )
}

function buildPartners(msgs: MessageRow[], me: string): string[] {
  const s = new Set<string>()
  for (const m of msgs) {
    if (m.sender_id === me) s.add(m.receiver_id)
    else if (m.receiver_id === me) s.add(m.sender_id)
  }
  return [...s]
}
