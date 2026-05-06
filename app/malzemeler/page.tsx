import { DashboardSidebar } from "@/components/dashboard/sidebar"
import { GlassTopBar } from "@/components/dashboard/glass-top-bar"
import { MaterialGrid } from "@/components/dashboard/material-grid"
import { createClient } from "@/utils/supabase/server"
import Link from "next/link"
import { Leaf } from "lucide-react"
import { Button } from "@/components/ui/button"
import { normalizeAiProjects } from "@/lib/material-ai"

export default async function MalzemelerPage() {
  const supabase = await createClient()
  const { data: materialsData } = await supabase
    .from("materials")
    .select(
      "id,title,price,status,image_url,created_at,user_id,ai_suggestions(material_type,projects,difficulty)",
    )
    .order("created_at", { ascending: false })

  const rows = materialsData ?? []
  const ownerIds = [
    ...new Set(rows.map((m) => m.user_id).filter((id): id is string => typeof id === "string" && id.length > 0)),
  ]
  let ownerById: Record<string, { email: string | null; full_name: string | null }> = {}
  if (ownerIds.length > 0) {
    const { data: profs } = await supabase.from("profiles").select("id,email,full_name").in("id", ownerIds)
    ownerById = Object.fromEntries(
      (profs ?? []).map((p) => [p.id, { email: p.email ?? null, full_name: p.full_name ?? null }]),
    )
  }

  const materials = rows.map((material) => {
    const suggestion = material.ai_suggestions?.[0]
    const uid = material.user_id ?? null
    const aiProjects = normalizeAiProjects(suggestion?.projects)
    return {
      id: material.id,
      title: material.title || "Isimsiz Malzeme",
      category: suggestion?.material_type || "Genel",
      price: material.price ?? 0,
      status: material.status ?? "Satışta",
      image: material.image_url,
      aiProjects,
      aiDifficulty: suggestion?.difficulty ?? null,
      createdAt: material.created_at,
      sellerUserId: uid,
      sellerEmail: uid ? ownerById[uid]?.email ?? null : null,
    }
  })

  return (
    <div className="min-h-screen bg-background">
      <DashboardSidebar />
      <main className="lg:pl-64">
        <GlassTopBar />
        <div className="px-4 py-6 sm:px-6 lg:px-8">
          <div className="mb-8 flex flex-col gap-3 pt-12 sm:flex-row sm:items-start sm:justify-between lg:pt-0">
            <div>
              <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-emerald-950 sm:text-3xl">
                <Leaf className="size-7 shrink-0 text-emerald-600" aria-hidden />
                Malzeme ilanları
              </h1>
              <p className="text-muted-foreground">Tüm malzeme ilanlarını görüntüleyin ve yönetin.</p>
            </div>
            <Button asChild className="w-full sm:w-auto">
              <Link href="/ilan-ver">İlan ver</Link>
            </Button>
          </div>
          <MaterialGrid materials={materials} />
        </div>
      </main>
    </div>
  )
}
