"use client"

import Link from "next/link"
import { useState } from "react"
import { toast } from "sonner"
import { AlertTriangle, Leaf, Mail, MapPin, MessageSquare, Phone, Store } from "lucide-react"
import { createClient } from "@/utils/supabase/client"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { MaterialGrid } from "@/components/dashboard/material-grid"
import { normalizeAiProjects } from "@/lib/material-ai"

export type PublicProfile = {
  id: string
  full_name: string | null
  phone: string | null
  address: string | null
  email: string | null
}

type MatRow = {
  id: string
  title: string | null
  price: number | null
  status: string | null
  image_url: string | null
  created_at: string | null
  ai_suggestions: { material_type: string | null; projects?: unknown; difficulty?: string | null }[] | null
}

export function ProfilePublicView({
  profileUserId,
  profile,
  profileLoadError,
  materials,
  viewerUserId,
}: {
  profileUserId: string
  profile: PublicProfile | null
  profileLoadError: string | null
  materials: MatRow[]
  viewerUserId: string | null
}) {
  const [msgOpen, setMsgOpen] = useState(false)
  const [msgBody, setMsgBody] = useState("")
  const [sending, setSending] = useState(false)

  const isOwn = viewerUserId === profileUserId
  const shortId =
    profileUserId.length > 12 ? `${profileUserId.slice(0, 8)}…` : profileUserId
  const displayName =
    profile?.full_name?.trim() || profile?.email?.trim() || `Kullanıcı (${shortId})`

  const gridMaterials = materials.map((m) => {
    const suggestion = Array.isArray(m.ai_suggestions) ? m.ai_suggestions[0] : null
    const aiProjects = normalizeAiProjects(suggestion?.projects)
    return {
      id: m.id,
      title: m.title || "İsimsiz Malzeme",
      category: suggestion?.material_type || "Genel",
      price: m.price ?? 0,
      status: m.status ?? "Satışta",
      image: m.image_url,
      aiProjects,
      aiDifficulty: suggestion?.difficulty ?? null,
      createdAt: m.created_at,
    }
  })

  const sendMessage = async () => {
    if (!viewerUserId) {
      toast.error("Mesaj göndermek için giriş yapın.")
      return
    }
    if (!msgBody.trim()) {
      toast.error("Mesajınızı yazın.")
      return
    }
    setSending(true)
    try {
      const supabase = createClient()
      const { error } = await supabase.from("messages").insert({
        sender_id: viewerUserId,
        receiver_id: profileUserId,
        content: msgBody.trim(),
      })
      if (error) {
        toast.error(`Gönderilemedi: ${error.message}`)
        return
      }
      toast.success("Mesajınız gönderildi.")
      setMsgOpen(false)
      setMsgBody("")
    } finally {
      setSending(false)
    }
  }

  const profileMissing = !profileLoadError && !profile

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b bg-background/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <Link
            href={viewerUserId ? "/malzemeler" : "/login"}
            className="flex items-center gap-2 font-semibold text-foreground"
          >
            <Store className="size-5" />
            EcoLoop Pazaryeri
          </Link>
          {!viewerUserId ? (
            <Button asChild variant="outline" size="sm">
              <Link href="/login">Giriş yap</Link>
            </Button>
          ) : (
            <Button asChild variant="outline" size="sm">
              <Link href="/">Panele dön</Link>
            </Button>
          )}
        </div>
      </header>

      <div className="mx-auto max-w-6xl space-y-8 px-4 py-8">
        {profileLoadError ? (
          <Alert variant="destructive">
            <AlertTriangle />
            <AlertTitle>Profil bilgisi alınamadı</AlertTitle>
            <AlertDescription>
              Veritabanı veya erişim kuralı nedeniyle profil yüklenemedi. Sayfa kapanmadı; aşağıda bu
              kullanıcıya ait ilanlar varsa gösterilir. Teknik ayrıntı: {profileLoadError}
            </AlertDescription>
          </Alert>
        ) : null}

        {profileMissing ? (
          <Alert className="border-amber-500/40 bg-amber-500/10 text-foreground">
            <AlertTriangle className="text-amber-600" />
            <AlertTitle>Profil kaydı bulunamadı</AlertTitle>
            <AlertDescription>
              Bu kullanıcı kimliği için <code className="rounded bg-muted px-1 py-0.5 text-xs">{profileUserId}</code>{" "}
              tabloda satır yok. Kullanıcı henüz ayarlardan profilini kaydetmemiş olabilir. İlanlar yine de
              aşağıda listelenebilir.
            </AlertDescription>
          </Alert>
        ) : null}

        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="flex flex-wrap items-center gap-2 text-3xl font-bold tracking-tight text-emerald-950">
              <Leaf className="size-8 shrink-0 text-emerald-600" aria-hidden />
              {displayName}
            </h1>
            <p className="mt-1 text-muted-foreground">Satıcı profili</p>
            {profile ? (
              <div className="mt-4 flex flex-col gap-2 text-sm">
                {profile.email ? (
                  <p className="flex items-center gap-2 text-muted-foreground">
                    <Mail className="size-4 shrink-0" />
                    <span>{profile.email}</span>
                  </p>
                ) : null}
                {profile.phone ? (
                  <p className="flex items-center gap-2 text-muted-foreground">
                    <Phone className="size-4 shrink-0" />
                    <span>{profile.phone}</span>
                  </p>
                ) : null}
                {profile.address ? (
                  <p className="flex items-start gap-2 text-muted-foreground">
                    <MapPin className="mt-0.5 size-4 shrink-0" />
                    <span>{profile.address}</span>
                  </p>
                ) : null}
              </div>
            ) : (
              <p className="mt-4 text-sm text-muted-foreground">
                İletişim bilgileri, profil oluşturulduğunda burada görünür.
              </p>
            )}
          </div>
          {!isOwn && viewerUserId ? (
            <Button size="lg" className="w-full sm:w-auto" onClick={() => setMsgOpen(true)}>
              <MessageSquare className="mr-2 size-5" />
              Mesaj Gönder
            </Button>
          ) : null}
          {!viewerUserId ? (
            <Button size="lg" variant="secondary" asChild className="w-full sm:w-auto">
              <Link href="/login">Mesaj için giriş yap</Link>
            </Button>
          ) : null}
        </div>

        <Dialog open={msgOpen} onOpenChange={setMsgOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{displayName} kişisine mesaj</DialogTitle>
              <DialogDescription>
                Mesajınız doğrudan gelen kutusuna iletilir.
              </DialogDescription>
            </DialogHeader>
            <Textarea
              value={msgBody}
              onChange={(e) => setMsgBody(e.target.value)}
              rows={5}
              placeholder="Merhaba, ürünleriniz hakkında..."
            />
            <DialogFooter>
              <Button variant="outline" onClick={() => setMsgOpen(false)}>
                İptal
              </Button>
              <Button onClick={sendMessage} disabled={sending}>
                {sending ? "Gönderiliyor..." : "Gönder"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Card>
          <CardHeader>
            <CardTitle>Aktif ilanlar</CardTitle>
            <CardDescription>Bu satıcının şu an satışta olan ürünleri</CardDescription>
          </CardHeader>
          <CardContent>
            {gridMaterials.length === 0 ? (
              <p className="text-sm text-muted-foreground">Gösterilecek aktif ilan yok.</p>
            ) : (
              <MaterialGrid materials={gridMaterials} hideToolbar />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
