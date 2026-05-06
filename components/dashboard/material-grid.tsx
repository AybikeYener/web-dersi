"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { ChevronDown, Filter, Search, Sparkles, User } from "lucide-react"
import { createClient } from "@/utils/supabase/client"
import { formatAiProjectsPreview } from "@/lib/material-ai"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"

export type MaterialCardData = {
  id: string
  title: string
  category: string
  price: number
  status?: string
  image: string | null
  /** @deprecated Eski API; aiProjects kullanın */
  tags?: string[]
  aiProjects?: string[]
  aiDifficulty?: string | null
  createdAt?: string | null
  sellerUserId?: string | null
  sellerEmail?: string | null
}

const categories = [
  "Tumu",
  "Plastik",
  "Cam",
  "Metal",
  "Ahsap",
  "Kompozit",
  "Kagit/Karton",
  "Genel",
]

const formatTry = (n: number) =>
  new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" }).format(n)

const PLACEHOLDER_IMAGE =
  "https://placehold.co/600x400/1f2937/ffffff?text=Gorsel+Bulunamadi"

type ProfileHit = { id: string; email: string | null; full_name: string | null }

export function MaterialGrid({
  materials,
  hideToolbar,
}: {
  materials: MaterialCardData[]
  hideToolbar?: boolean
}) {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("Tumu")
  const [profileHits, setProfileHits] = useState<ProfileHit[]>([])
  const [openPanelId, setOpenPanelId] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    const q = searchQuery.trim()
    if (q.length < 2) {
      setProfileHits([])
      return
    }
    const supabase = createClient()
    const pattern = `%${q.replace(/%/g, "")}%`

    void Promise.all([
      supabase.from("profiles").select("id,email,full_name").ilike("email", pattern).limit(8),
      supabase.from("profiles").select("id,email,full_name").ilike("full_name", pattern).limit(8),
    ]).then(([eRes, nRes]) => {
      if (cancelled) return
      const map = new Map<string, ProfileHit>()
      for (const row of [...(eRes.data ?? []), ...(nRes.data ?? [])]) {
        map.set(row.id, row as ProfileHit)
      }
      setProfileHits([...map.values()])
    })

    return () => {
      cancelled = true
    }
  }, [searchQuery])

  const qLower = searchQuery.toLowerCase().trim()

  const filteredMaterials = materials.filter((material) => {
    const matchesTitle = material.title.toLowerCase().includes(qLower)
    const email = material.sellerEmail?.toLowerCase() ?? ""
    const matchesEmail = qLower.length > 0 && email.includes(qLower)
    const matchesSearch = matchesTitle || matchesEmail
    const matchesCategory = selectedCategory === "Tumu" || material.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  return (
    <div className="space-y-6">
      {!hideToolbar ? (
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative max-w-md flex-1">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-emerald-700/50" />
            <Input
              placeholder="Malzeme adı veya satıcı e-postası..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="border-emerald-200/60 pl-10"
            />
          </div>
          <div className="flex items-center gap-3">
            <Filter className="size-4 text-emerald-700/50" />
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-[180px] border-emerald-200/60">
                <SelectValue placeholder="Kategori secin" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      ) : null}

      {!hideToolbar && profileHits.length > 0 && qLower.length >= 2 ? (
        <div className="rounded-2xl border border-emerald-200/50 bg-emerald-50/40 p-4">
          <p className="mb-2 flex items-center gap-2 text-sm font-medium text-emerald-900">
            <User className="size-4" />
            Eşleşen kullanıcılar
          </p>
          <ul className="flex flex-wrap gap-2">
            {profileHits.map((p) => (
              <li key={p.id}>
                <Link
                  href={`/profil/${p.id}`}
                  className="inline-flex items-center rounded-full border border-emerald-200/80 bg-background px-3 py-1.5 text-sm font-medium text-emerald-800 underline-offset-4 hover:bg-emerald-50 hover:underline"
                >
                  {p.full_name?.trim() || p.email || "Profil"}
                  {p.email ? (
                    <span className="ml-2 text-xs font-normal text-muted-foreground">{p.email}</span>
                  ) : null}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filteredMaterials.map((material) => {
          const merged = material.aiProjects ?? []
          const { label, hasReal } = formatAiProjectsPreview(merged)
          const difficulty = material.aiDifficulty ?? null

          return (
            <Card
              key={material.id}
              className={cn(
                "group flex h-full flex-col gap-0 overflow-hidden py-0 shadow-md ring-1 ring-emerald-900/5 transition-all duration-300",
                "hover:-translate-y-2 hover:shadow-xl hover:ring-emerald-600/15",
              )}
            >
              <Link href={`/malzemeler/${material.id}`} className="block flex-1 min-h-0">
                <div className="relative aspect-[4/3] overflow-hidden bg-muted">
                  <img
                    src={material.image || PLACEHOLDER_IMAGE}
                    alt={material.title}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    loading="lazy"
                  />
                  <div className="absolute right-2 top-2 flex flex-col items-end gap-1">
                    <Badge
                      variant="secondary"
                      className="border border-white/30 bg-background/90 text-emerald-900 backdrop-blur-sm"
                    >
                      {material.category}
                    </Badge>
                    {material.status === "Satıldı" ? (
                      <Badge className="bg-destructive/90 text-destructive-foreground">Satıldı</Badge>
                    ) : null}
                  </div>
                </div>

                <CardContent className="space-y-3 p-4">
                  <h3 className="line-clamp-1 font-semibold text-foreground">{material.title}</h3>

                  <div className="flex items-center justify-between border-t border-emerald-100 pt-3">
                    <span className="text-lg font-extrabold tracking-tight text-emerald-900">
                      {formatTry(material.price)}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {material.createdAt
                        ? new Date(material.createdAt).toLocaleDateString("tr-TR")
                        : "Yeni"}
                    </span>
                  </div>

                  {material.sellerUserId &&
                  material.sellerEmail &&
                  qLower &&
                  material.sellerEmail.toLowerCase().includes(qLower) ? (
                    <div className="border-t border-emerald-100 pt-2">
                      <Link
                        href={`/profil/${material.sellerUserId}`}
                        onClick={(e) => e.stopPropagation()}
                        className="text-xs font-medium text-emerald-700 hover:underline"
                      >
                        Satıcı profili: {material.sellerEmail}
                      </Link>
                    </div>
                  ) : null}
                </CardContent>
              </Link>

              <div className="border-t border-emerald-100/80 bg-gradient-to-b from-emerald-50/30 to-transparent px-4 pb-3 pt-2">
                <Collapsible
                  open={openPanelId === material.id}
                  onOpenChange={(open) => setOpenPanelId(open ? material.id : null)}
                >
                  <div className="flex items-start gap-1.5">
                    <Link
                      href={`/malzemeler/${material.id}#ai-onerileri`}
                      onClick={(e) => e.stopPropagation()}
                      className={cn(
                        "inline-flex min-w-0 flex-1 items-center gap-1.5 rounded-full border px-2.5 py-1.5 text-left text-[11px] font-semibold leading-tight shadow-sm transition hover:brightness-95",
                        hasReal
                          ? "border-emerald-400/40 bg-gradient-to-r from-teal-200/95 via-emerald-300/90 to-emerald-600 text-emerald-950"
                          : "border-border bg-muted/80 text-muted-foreground",
                      )}
                      title="İlanda AI önerileri bölümüne git"
                    >
                      <Sparkles className="size-3.5 shrink-0 opacity-90" aria-hidden />
                      <span className="line-clamp-2">{label}</span>
                    </Link>
                    {hasReal && merged.length > 0 ? (
                      <CollapsibleTrigger asChild>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="size-8 shrink-0 rounded-full text-emerald-800 hover:bg-emerald-500/15"
                          aria-label="AI önerilerini aç veya kapat"
                        >
                          <ChevronDown
                            className={cn(
                              "size-4 transition-transform duration-200",
                              openPanelId === material.id && "rotate-180",
                            )}
                          />
                        </Button>
                      </CollapsibleTrigger>
                    ) : null}
                  </div>
                  <CollapsibleContent className="mt-2 overflow-hidden">
                    <div className="space-y-2 rounded-xl border border-emerald-200/60 bg-emerald-50/80 px-3 py-2.5 text-xs shadow-inner">
                      <p className="font-semibold text-emerald-900">Önerilen projeler</p>
                      <ul className="list-inside list-disc space-y-0.5 text-emerald-900/85">
                        {merged.map((p) => (
                          <li key={p}>{p}</li>
                        ))}
                      </ul>
                      {difficulty ? (
                        <p className="text-[11px] font-medium text-emerald-800">Zorluk: {difficulty}</p>
                      ) : null}
                      <Link
                        href={`/malzemeler/${material.id}#ai-onerileri`}
                        className="inline-block pt-1 text-[11px] font-semibold text-emerald-700 underline-offset-2 hover:underline"
                      >
                        İlanda tamamını gör →
                      </Link>
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              </div>
            </Card>
          )
        })}
      </div>

      {filteredMaterials.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-emerald-200/80 bg-emerald-50/40 py-14 text-center">
          <div className="mb-4 flex size-16 items-center justify-center rounded-full bg-emerald-100/80 text-emerald-700 ring-2 ring-emerald-200/60">
            <Search className="size-8" />
          </div>
          <h3 className="mb-1 text-lg font-medium text-emerald-950">Sonuç bulunamadı</h3>
          <p className="max-w-sm text-sm text-emerald-900/70">
            Arama kriterlerinize uygun malzeme bulunamadı. Filtreleri veya aramayı değiştirmeyi deneyin.
          </p>
        </div>
      )}
    </div>
  )
}
