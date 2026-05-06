"use client"

import { useRouter } from "next/navigation"
import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { toast } from "sonner"
import { ArrowLeft, CreditCard, MessageCircle, Send, Sparkles, User } from "lucide-react"
import { createClient } from "@/utils/supabase/client"
import { normalizeAiProjects } from "@/lib/material-ai"
import { Badge } from "@/components/ui/badge"
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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"

const PLACEHOLDER =
  "https://placehold.co/600x400/1f2937/ffffff?text=Gorsel+Bulunamadi"

const formatTry = (n: number) =>
  new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" }).format(n)

export type CommentRow = {
  id: string
  material_id: string
  user_email: string | null
  content: string | null
  is_offer: boolean | null
  offer_price: number | null
  created_at: string | null
}

type AiSuggestion = {
  material_type: string | null
  projects: string[] | null
  difficulty: string | null
}

type MaterialRow = {
  id: string
  title: string | null
  price: number | null
  status: string | null
  image_url: string | null
  user_id?: string | null
  ai_suggestions: AiSuggestion[] | null
}

export type SellerProfileRow = {
  id: string
  full_name: string | null
  phone: string | null
  address: string | null
  email: string | null
} | null

export function MaterialDetailClient({
  material: initialMaterial,
  initialComments,
  sellerId,
  sellerProfile,
}: {
  material: MaterialRow
  initialComments: CommentRow[]
  sellerId: string | null
  sellerProfile: SellerProfileRow
}) {
  const router = useRouter()
  const [material, setMaterial] = useState(initialMaterial)
  const [comments, setComments] = useState(initialComments)
  const [buyOpen, setBuyOpen] = useState(false)
  const [cardNumber, setCardNumber] = useState("")
  const [cardName, setCardName] = useState("")
  const [cardExpiry, setCardExpiry] = useState("")
  const [cardCvc, setCardCvc] = useState("")
  const [buyLoading, setBuyLoading] = useState(false)

  const [message, setMessage] = useState("")
  const [isOffer, setIsOffer] = useState(false)
  const [offerPrice, setOfferPrice] = useState("")
  const [commentLoading, setCommentLoading] = useState(false)

  const kategori = material.ai_suggestions?.[0]?.material_type ?? "Genel"
  const statusLabel = material.status === "Satıldı" ? "Satıldı" : "Satışta"
  const isSold = material.status === "Satıldı"

  const aiProjectList = useMemo(() => {
    const rows = material.ai_suggestions
    if (!Array.isArray(rows)) return []
    const seen = new Set<string>()
    const out: string[] = []
    for (const row of rows) {
      for (const p of normalizeAiProjects(row?.projects)) {
        if (!seen.has(p)) {
          seen.add(p)
          out.push(p)
        }
      }
    }
    return out
  }, [material.ai_suggestions])

  const aiDifficultyLabel = useMemo(() => {
    const rows = material.ai_suggestions
    if (!Array.isArray(rows)) return null
    for (const row of rows) {
      if (row?.difficulty?.trim()) return row.difficulty.trim()
    }
    return null
  }, [material.ai_suggestions])

  useEffect(() => {
    if (typeof window === "undefined") return
    if (window.location.hash !== "#ai-onerileri") return
    const t = window.setTimeout(() => {
      document.getElementById("ai-onerileri")?.scrollIntoView({ behavior: "smooth", block: "start" })
    }, 100)
    return () => window.clearTimeout(t)
  }, [material.id])

  const imageSrc = useMemo(
    () => (material.image_url?.startsWith("http") ? material.image_url : PLACEHOLDER),
    [material.image_url],
  )

  const handlePurchase = async () => {
    if (!cardNumber.trim() || !cardName.trim() || !cardExpiry.trim() || !cardCvc.trim()) {
      toast.error("Lütfen ödeme formundaki tüm alanları doldurun.")
      return
    }
    setBuyLoading(true)
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from("materials")
        .update({ status: "Satıldı" })
        .eq("id", material.id)

      if (error) {
        console.error(error)
        toast.error(`Satın alma başarısız: ${error.message}`)
        return
      }
      setMaterial((m) => ({ ...m, status: "Satıldı" }))
      setBuyOpen(false)
      toast.success("Ödeme alındı. İlan satıldı olarak işaretlendi.")
      router.refresh()
    } finally {
      setBuyLoading(false)
    }
  }

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!message.trim()) {
      toast.error("Lütfen bir mesaj yazın.")
      return
    }
    if (isOffer) {
      const p = Number.parseFloat(offerPrice.replace(",", "."))
      if (!Number.isFinite(p) || p <= 0) {
        toast.error("Geçerli bir teklif fiyatı girin.")
        return
      }
    }

    setCommentLoading(true)
    try {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user?.email) {
        toast.error("Oturum bulunamadı. Lütfen tekrar giriş yapın.")
        return
      }

      const offerNum = isOffer
        ? Number.parseFloat(offerPrice.replace(",", "."))
        : null

      const { data: row, error } = await supabase
        .from("comments")
        .insert({
          material_id: material.id,
          user_email: user.email,
          content: message.trim(),
          is_offer: isOffer,
          offer_price: offerNum,
        })
        .select("id,material_id,user_email,content,is_offer,offer_price,created_at")
        .single()

      if (error) {
        console.error(error)
        toast.error(`Gönderilemedi: ${error.message}`)
        return
      }

      if (row) setComments((c) => [row as CommentRow, ...c])
      setMessage("")
      setIsOffer(false)
      setOfferPrice("")
      toast.success(isOffer ? "Fiyat teklifiniz gönderildi." : "Yorumunuz yayınlandı.")

      if (isOffer && offerNum != null && sellerId && user.id !== sellerId) {
        const { error: nErr } = await supabase.from("notifications").insert({
          user_id: sellerId,
          title: "İlanınıza Teklif Geldi",
          body: `${user.email ?? "Bir alıcı"} «${material.title ?? "İlan"}» için ${formatTry(offerNum)} teklif verdi.`,
          is_read: false,
        })
        if (nErr) console.error("Bildirim kaydı:", nErr)
      }
    } finally {
      setCommentLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-6xl px-4 pb-8 pt-4 sm:pt-6">
        <Button variant="ghost" className="mb-6 -ml-2" asChild>
          <Link href="/malzemeler">
            <ArrowLeft className="mr-2 size-4" />
            Geri dön
          </Link>
        </Button>

        <div className="grid gap-8 lg:grid-cols-2">
          <div className="overflow-hidden rounded-2xl border border-emerald-100/80 bg-card shadow-md ring-1 ring-emerald-900/5">
            <img
              src={imageSrc}
              alt={material.title ?? "Malzeme"}
              className="aspect-square w-full object-cover"
            />
          </div>

          <div className="flex flex-col gap-6">
            <div>
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <Badge variant="outline" className="text-sm">
                  {kategori}
                </Badge>
                <Badge
                  className={
                    isSold
                      ? "bg-muted text-muted-foreground"
                      : "bg-emerald-500/15 text-emerald-700 border-emerald-500/30"
                  }
                  variant="outline"
                >
                  {statusLabel}
                </Badge>
              </div>
              <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                {material.title || "İsimsiz Malzeme"}
              </h1>
              <p className="mt-3 text-3xl font-extrabold tracking-tight text-emerald-900">
                {formatTry(material.price ?? 0)}
              </p>
            </div>

            {sellerId ? (
              <Card className="overflow-hidden border-primary/25 bg-gradient-to-br from-primary/5 to-transparent shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <User className="size-4 text-primary" />
                    Satıcı Bilgileri
                  </CardTitle>
                  <CardDescription>Satıcı profilini görüntüleyin veya mesaj gönderin</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Link
                    href={`/profil/${sellerId}`}
                    className="block text-lg font-semibold text-primary underline-offset-4 hover:underline"
                  >
                    {sellerProfile?.full_name?.trim() || sellerProfile?.email || "Satıcı profili"}
                  </Link>
                  {sellerProfile?.email ? (
                    <p className="text-sm text-muted-foreground">{sellerProfile.email}</p>
                  ) : null}
                  {sellerProfile?.phone ? (
                    <p className="text-sm text-foreground/90">{sellerProfile.phone}</p>
                  ) : null}
                </CardContent>
              </Card>
            ) : null}

            <Separator />

            <Button
              size="lg"
              className="w-full text-base font-semibold shadow-lg sm:w-auto"
              disabled={isSold}
              onClick={() => setBuyOpen(true)}
            >
              <CreditCard className="mr-2 size-5" />
              {isSold ? "Satıldı" : "Hemen Satın Al"}
            </Button>

            <Dialog open={buyOpen} onOpenChange={setBuyOpen}>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Güvenli Ödeme</DialogTitle>
                  <DialogDescription>
                    Sunum modu: Kart bilgileri yalnızca arayüzde kalır; gerçek ödeme alınmaz.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-3 py-2">
                  <div className="space-y-2">
                    <Label>Kart üzerindeki isim</Label>
                    <Input value={cardName} onChange={(e) => setCardName(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Kart numarası</Label>
                    <Input
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value)}
                      placeholder="4242 4242 4242 4242"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>Son kullanma</Label>
                      <Input value={cardExpiry} onChange={(e) => setCardExpiry(e.target.value)} placeholder="AA/YY" />
                    </div>
                    <div className="space-y-2">
                      <Label>CVC</Label>
                      <Input value={cardCvc} onChange={(e) => setCardCvc(e.target.value)} />
                    </div>
                  </div>
                </div>
                <DialogFooter className="gap-2 sm:gap-0">
                  <Button variant="outline" onClick={() => setBuyOpen(false)}>
                    Vazgeç
                  </Button>
                  <Button onClick={handlePurchase} disabled={buyLoading}>
                    {buyLoading ? "İşleniyor..." : "Ödemeyi Onayla"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <section
          id="ai-onerileri"
          className="scroll-mt-32 rounded-2xl border border-emerald-200/60 bg-gradient-to-br from-emerald-50/90 via-teal-50/50 to-background p-6 shadow-sm ring-1 ring-emerald-900/5"
          aria-labelledby="ai-onerileri-baslik"
        >
          <div className="mb-4 flex items-center gap-2">
            <span className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-teal-200/90 to-emerald-600 text-emerald-950 shadow-sm">
              <Sparkles className="size-5" aria-hidden />
            </span>
            <div>
              <h2 id="ai-onerileri-baslik" className="text-lg font-semibold text-emerald-950">
                AI önerileri
              </h2>
              <p className="text-sm text-emerald-900/70">
                Bu malzeme için önerilen projeler ve zorluk bilgisi
              </p>
            </div>
          </div>
          {aiProjectList.length === 0 ? (
            <p className="text-sm text-emerald-900/65">
              Henüz kayıtlı bir AI proje önerisi yok. Görsel analizi veya ilan güncellemesi sonrası burada
              listelenir.
            </p>
          ) : (
            <ul className="grid gap-2 sm:grid-cols-2">
              {aiProjectList.map((project) => (
                <li
                  key={project}
                  className="rounded-xl border border-emerald-200/50 bg-background/80 px-3 py-2 text-sm font-medium text-emerald-950 shadow-sm"
                >
                  {project}
                </li>
              ))}
            </ul>
          )}
          {aiDifficultyLabel ? (
            <p className="mt-4 text-sm font-semibold text-emerald-800">
              Zorluk derecesi: <span className="font-bold">{aiDifficultyLabel}</span>
            </p>
          ) : null}
        </section>

        <Separator className="my-10 border-emerald-100/80" />

        <div className="grid gap-8 lg:grid-cols-2">
          <Card className="rounded-2xl border-emerald-100/60 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageCircle className="size-5 text-emerald-600" />
                Yorum veya teklif
              </CardTitle>
              <CardDescription>
                Yorum yazın veya fiyat teklifi vermek için anahtarı açın.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCommentSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="msg">Mesaj</Label>
                  <Textarea
                    id="msg"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Merhaba, ürün hâlâ satılık mı?"
                    rows={4}
                  />
                </div>
                <div className="flex items-center justify-between rounded-lg border p-3">
                  <div className="space-y-0.5">
                    <Label htmlFor="offer-switch">Fiyat teklifi ver</Label>
                    <p className="text-xs text-muted-foreground">Teklifiniz ilan sahibine kaydedilir.</p>
                  </div>
                  <Switch id="offer-switch" checked={isOffer} onCheckedChange={setIsOffer} />
                </div>
                {isOffer ? (
                  <div className="space-y-2">
                    <Label htmlFor="offer">Teklif (₺)</Label>
                    <Input
                      id="offer"
                      type="number"
                      min={0}
                      step="0.01"
                      value={offerPrice}
                      onChange={(e) => setOfferPrice(e.target.value)}
                    />
                  </div>
                ) : null}
                <Button type="submit" className="w-full" disabled={commentLoading}>
                  <Send className="mr-2 size-4" />
                  {commentLoading ? "Gönderiliyor..." : "Gönder"}
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-emerald-100/60 shadow-sm">
            <CardHeader>
              <CardTitle>Yorumlar ve teklifler</CardTitle>
              <CardDescription>Son mesajlar</CardDescription>
            </CardHeader>
            <CardContent className="max-h-[480px] space-y-3 overflow-y-auto">
              {comments.length === 0 ? (
                <p className="rounded-xl border border-dashed border-emerald-200/70 bg-emerald-50/40 px-3 py-6 text-center text-sm text-emerald-900/75">
                  Henüz mesaj yok. İlk siz yazın.
                </p>
              ) : (
                comments.map((c) => (
                  <div key={c.id} className="rounded-lg border bg-muted/30 p-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-sm font-medium">{c.user_email ?? "Anonim"}</span>
                      {c.is_offer && c.offer_price != null ? (
                        <Badge variant="secondary">Teklif: {formatTry(Number(c.offer_price))}</Badge>
                      ) : null}
                    </div>
                    <p className="mt-2 text-sm text-foreground/90">{c.content}</p>
                    {c.created_at ? (
                      <p className="mt-1 text-xs text-muted-foreground">
                        {new Date(c.created_at).toLocaleString("tr-TR")}
                      </p>
                    ) : null}
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
