"use client"

import { useEffect, useRef, useState, type ReactNode } from "react"
import { useRouter } from "next/navigation"
import { Leaf } from "lucide-react"
import { DashboardSidebar } from "@/components/dashboard/sidebar"
import { GlassTopBar } from "@/components/dashboard/glass-top-bar"
import { StatCards } from "@/components/dashboard/stat-cards"
import { MaterialGrid } from "@/components/dashboard/material-grid"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { createClient } from "@/utils/supabase/client"
import { normalizeAiProjects } from "@/lib/material-ai"

type DashboardContentProps = {
  userId: string
  userEmail: string
  topBarEnd?: ReactNode
  initialMaterials: {
    id: string
    title?: string | null
    price?: number | null
    status?: string | null
    image_url: string | null
    created_at: string | null
    user_id?: string | null
    ownerEmail?: string | null
    ownerName?: string | null
    ai_suggestions: {
      material_type: string | null
      projects: string[] | null
      difficulty: string | null
    }[]
  }[]
}

const UPLOAD_FALLBACK_URL =
  "https://placehold.co/600x400/991b1b/ffffff?text=Yeni+Malzeme+(Gorsel+Yuklenemedi)"

function ensureValidImageUrl(value: string) {
  try {
    const parsed = new URL(value)
    if (!parsed.protocol.startsWith("http")) {
      return UPLOAD_FALLBACK_URL
    }
    return value
  } catch {
    return UPLOAD_FALLBACK_URL
  }
}

export function DashboardContent({ userId, userEmail, topBarEnd, initialMaterials }: DashboardContentProps) {
  const router = useRouter()
  const [imageUrl, setImageUrl] = useState("")
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const requestLockRef = useRef(false)
  const [analysis, setAnalysis] = useState<{
    material_type: string
    projects: string[]
    difficulty: string
  } | null>(null)
  const seededRef = useRef(false)

  useEffect(() => {
    if (seededRef.current) return
    seededRef.current = true

    fetch("/api/seed", { method: "POST" })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Seed API request failed")
        }
        return response.json()
      })
      .then((result: { seeded?: boolean }) => {
        if (result.seeded) {
          router.refresh()
        }
      })
      .catch((error) => {
        console.error("Client seed trigger failed:", error)
      })
  }, [router])

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (requestLockRef.current || isAnalyzing) return

    const file = event.target.files?.[0]
    if (!file) return

    try {
      requestLockRef.current = true
      setIsAnalyzing(true)
      setAnalysis(null)

      const supabase = createClient()
      const fileExtension = file.name.split(".").pop()
      const fileName = `${Date.now()}${fileExtension ? `.${fileExtension}` : ""}`
      let finalImageUrl = UPLOAD_FALLBACK_URL

      try {
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("materials")
          .upload(fileName, file)
        console.log("Storage upload result:", uploadData)

        if (uploadError) {
          throw uploadError
        }

        const {
          data: { publicUrl },
        } = supabase.storage.from("materials").getPublicUrl(fileName)
        if (publicUrl) {
          finalImageUrl = ensureValidImageUrl(publicUrl)
        }
      } catch (storageError) {
        console.error("Storage yukleme hatasi, fallback URL kullaniliyor:", storageError)
      }

      finalImageUrl = ensureValidImageUrl(finalImageUrl)
      console.log("Final image URL:", finalImageUrl)
      setImageUrl(finalImageUrl)

      const analyzeResponse = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrl: finalImageUrl }),
      })

      if (!analyzeResponse.ok) {
        const errorPayload = (await analyzeResponse.json().catch(() => null)) as
          | { error?: string }
          | null
        throw new Error(errorPayload?.error ?? "Gorsel analizi basarisiz oldu.")
      }

      const aiData = (await analyzeResponse.json()) as {
        material_type: string
        projects: string[]
        difficulty: string
      }

      const insertResponse = await fetch("/api/materials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image_url: finalImageUrl,
          user_id: userId,
          // Eger materials tablosunda user_id kolonu yoksa SQL editor'de:
          // alter table public.materials add column user_id uuid references auth.users(id);
          title: aiData.projects?.[0] ?? aiData.material_type ?? "Isimsiz Malzeme",
          material_type: aiData.material_type,
          projects: aiData.projects,
          difficulty: aiData.difficulty,
          price: 0,
        }),
      })

      if (!insertResponse.ok) {
        const payload = (await insertResponse.json().catch(() => null)) as { error?: string } | null
        throw new Error(payload?.error ?? "Veritabani kaydi basarisiz oldu.")
      }
      setAnalysis(aiData)
      router.refresh()
    } catch (error) {
      const message = error instanceof Error ? error.message : "Dosya yuklenirken bir hata olustu."
      alert(message)
    } finally {
      setIsAnalyzing(false)
      requestLockRef.current = false
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardSidebar />
      <main className="lg:pl-64">
        <GlassTopBar end={topBarEnd} />
        <div className="px-4 py-6 sm:px-6 lg:px-8">
          <div className="mb-8 flex flex-col gap-4 pt-12 lg:pt-0">
            <div className="flex flex-col gap-1">
              <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-emerald-950 sm:text-3xl">
                <Leaf className="size-7 text-emerald-600" aria-hidden />
                Atölye yönetim paneli
              </h1>
              <p className="text-muted-foreground">
                Malzeme ilanlarınızı yönetin, projeleri takip edin.
              </p>
            </div>
            <div className="rounded-2xl border border-emerald-200/50 bg-emerald-50/50 px-4 py-3 text-sm text-emerald-900/80">
              Giriş yapan kullanıcı: <span className="font-medium text-emerald-950">{userEmail}</span>
            </div>
          </div>

          <section className="mb-8">
            <h2 className="sr-only">Istatistikler</h2>
            <StatCards totalMaterials={initialMaterials.length} />
          </section>

          <section>
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-emerald-950">Malzeme ilanları</h2>
              <p className="text-sm text-muted-foreground">
                Atölyenizde bulunan tüm malzemeleri görüntüleyin ve yönetin.
              </p>
            </div>
            <div className="mb-6">
              <label className="mb-2 block text-sm font-medium text-foreground" htmlFor="material-image">
                Malzeme gorseli yukle
              </label>
              <input
                id="material-image"
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                disabled={isAnalyzing}
                className="block w-full text-sm text-muted-foreground file:mr-4 file:rounded-md file:border-0 file:bg-primary file:px-4 file:py-2 file:text-sm file:font-medium file:text-primary-foreground hover:file:bg-primary/90"
              />
              {imageUrl ? <p className="mt-2 text-xs text-muted-foreground">{imageUrl}</p> : null}
              {isAnalyzing ? (
                <p className="mt-3 inline-flex items-center rounded-md border border-primary/20 bg-primary/5 px-3 py-2 text-sm font-medium text-primary">
                  Analiz ediliyor...
                </p>
              ) : null}
            </div>
            {analysis ? (
              <div className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {analysis.projects.map((project, index) => (
                  <Card key={`${project}-${index}`} className="border-border/70 shadow-md">
                    <CardHeader className="gap-3">
                      <Badge variant="secondary" className="w-fit">
                        {analysis.material_type}
                      </Badge>
                      <CardTitle className="text-base">{project}</CardTitle>
                      <CardDescription>Zorluk seviyesi: {analysis.difficulty}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">
                        Bu malzeme ile uygulanabilir proje onerisi.
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : null}
            <MaterialGrid
              materials={initialMaterials.map((material) => {
                const suggestion = material.ai_suggestions?.[0]
                const title = material.title || "Isimsiz Malzeme"
                const category = suggestion?.material_type || "Genel"
                const aiProjects = normalizeAiProjects(suggestion?.projects)

                return {
                  id: material.id,
                  title,
                  category,
                  price: material.price ?? 0,
                  status: material.status ?? "Satışta",
                  image: material.image_url,
                  aiProjects,
                  aiDifficulty: suggestion?.difficulty ?? null,
                  createdAt: material.created_at,
                  sellerUserId: material.user_id ?? null,
                  sellerEmail: material.ownerEmail ?? null,
                }
              })}
            />
          </section>
        </div>
      </main>
    </div>
  )
}
