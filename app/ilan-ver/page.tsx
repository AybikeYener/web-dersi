"use client"

import { useMemo, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { Leaf, Recycle } from "lucide-react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { createClient } from "@/utils/supabase/client"

const FALLBACK_IMAGE_URL = "https://placehold.co/600x400/2563eb/ffffff?text=Yeni+Ilan"

const CATEGORIES = ["Plastik", "Cam", "Metal", "Ahsap", "Kompozit", "Kagit/Karton"] as const
const DIFFICULTIES = ["Kolay", "Orta", "Zor"] as const

function safeUrl(value: string) {
  try {
    const parsed = new URL(value)
    return parsed.protocol.startsWith("http") ? value : FALLBACK_IMAGE_URL
  } catch {
    return FALLBACK_IMAGE_URL
  }
}

export default function IlanVerPage() {
  const router = useRouter()
  const lockRef = useRef(false)

  const [materialName, setMaterialName] = useState("")
  const [title, setTitle] = useState("")
  const [price, setPrice] = useState("")
  const [category, setCategory] = useState<(typeof CATEGORIES)[number]>("Plastik")
  const [difficulty, setDifficulty] = useState<(typeof DIFFICULTIES)[number]>("Kolay")
  const [file, setFile] = useState<File | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const canSubmit = useMemo(() => {
    const p = Number.parseFloat(price.replace(",", "."))
    return (
      materialName.trim().length > 1 &&
      title.trim().length > 1 &&
      Number.isFinite(p) &&
      p >= 0 &&
      !isSubmitting
    )
  }, [materialName, title, price, isSubmitting])

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (lockRef.current || !canSubmit) return

    try {
      lockRef.current = true
      setIsSubmitting(true)
      setError(null)

      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push("/login")
        return
      }

      let imageUrl = FALLBACK_IMAGE_URL

      if (file) {
        const ext = file.name.split(".").pop()
        const fileName = `${Date.now()}${ext ? `.${ext}` : ""}`

        try {
          const { error: uploadError } = await supabase.storage.from("materials").upload(fileName, file)
          if (uploadError) throw uploadError

          const { data } = supabase.storage.from("materials").getPublicUrl(fileName)
          if (data?.publicUrl) {
            imageUrl = safeUrl(data.publicUrl)
          }
        } catch (uploadErr) {
          console.error("IlanVer storage upload failed, using fallback image:", uploadErr)
          imageUrl = FALLBACK_IMAGE_URL
        }
      }

      const res = await fetch("/api/materials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image_url: imageUrl,
          title: materialName.trim(),
          material_type: category,
          difficulty,
          projects: [title.trim()],
          price: Number.parseFloat(price.replace(",", ".")),
        }),
      })

      if (!res.ok) {
        const payload = (await res.json().catch(() => null)) as { error?: string } | null
        throw new Error(payload?.error ?? "Ilan kaydi basarisiz oldu.")
      }

      router.push("/")
      router.refresh()
    } catch (err) {
      const message = err instanceof Error ? err.message : "Bilinmeyen hata olustu."
      setError(message)
    } finally {
      setIsSubmitting(false)
      lockRef.current = false
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <Card className="w-full max-w-lg rounded-2xl border-emerald-200/50 bg-card/95 shadow-xl ring-1 ring-emerald-900/5">
        <CardHeader className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-100 to-teal-100 text-emerald-800">
              <Recycle className="size-5" aria-hidden />
            </span>
            <CardTitle className="flex items-center gap-2 text-2xl text-emerald-950">
              <Leaf className="size-6 text-emerald-600" aria-hidden />
              Yeni ilan ver
            </CardTitle>
          </div>
          <CardDescription>Hızlıca sürdürülebilir bir malzeme ilanı oluşturun.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="materialName">Malzeme Adi</Label>
              <Input
                id="materialName"
                value={materialName}
                onChange={(e) => setMaterialName(e.target.value)}
                placeholder="Orn: PET Plastik Ambalaj"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="title">Ilan Basligi / Proje Adi</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Orn: Kus yemligi projesi"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="price">Fiyat (₺)</Label>
              <Input
                id="price"
                type="number"
                inputMode="decimal"
                min={0}
                step="0.01"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="Orn: 299.90"
                required
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Kategori</Label>
                <Select value={category} onValueChange={(v) => setCategory(v as any)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Kategori secin" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Zorluk Derecesi</Label>
                <Select value={difficulty} onValueChange={(v) => setDifficulty(v as any)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Zorluk secin" />
                  </SelectTrigger>
                  <SelectContent>
                    {DIFFICULTIES.map((d) => (
                      <SelectItem key={d} value={d}>
                        {d}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="image">Gorsel Yukle</Label>
              <Input
                id="image"
                type="file"
                accept="image/*"
                disabled={isSubmitting}
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              />
              <p className="text-xs text-muted-foreground">
                Gorsel yukleme basarisiz olursa otomatik placeholder kullanilir.
              </p>
            </div>

            {error ? (
              <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </p>
            ) : null}

            <Button type="submit" className="w-full" disabled={!canSubmit}>
              {isSubmitting ? "Kaydediliyor..." : "Ilan Ver"}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="text-xs text-muted-foreground">
          Kayit basarili olunca ana sayfaya yonlendirilirsiniz.
        </CardFooter>
      </Card>
    </main>
  )
}

