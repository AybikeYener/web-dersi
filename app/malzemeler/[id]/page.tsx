import { notFound } from "next/navigation"
import { DashboardSidebar } from "@/components/dashboard/sidebar"
import { GlassTopBar } from "@/components/dashboard/glass-top-bar"
import { createClient } from "@/utils/supabase/server"
import { MaterialDetailClient, type CommentRow } from "./material-detail-client"

function normalizeAiSuggestions(raw: unknown) {
  if (Array.isArray(raw)) return raw
  if (raw && typeof raw === "object") return [raw]
  return []
}

export default async function MalzemeDetayPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const { data: materialRaw, error } = await supabase
    .from("materials")
    .select(
      "id,title,price,status,image_url,user_id,ai_suggestions(material_type,projects,difficulty)",
    )
    .eq("id", id)
    .maybeSingle()

  if (error) {
    console.error("Malzeme detay sorgusu:", error.message)
  }
  if (!materialRaw) {
    notFound()
  }

  const material = {
    ...materialRaw,
    ai_suggestions: normalizeAiSuggestions(materialRaw.ai_suggestions),
  }

  const { data: commentsRaw, error: commentsError } = await supabase
    .from("comments")
    .select("id,material_id,user_email,content,is_offer,offer_price,created_at")
    .eq("material_id", id)
    .order("created_at", { ascending: false })

  if (commentsError) {
    console.error("Yorumlar sorgusu:", commentsError.message)
  }

  const comments = (commentsRaw ?? []) as CommentRow[]

  let sellerProfile: {
    id: string
    full_name: string | null
    phone: string | null
    address: string | null
    email: string | null
  } | null = null

  const sellerId = (materialRaw as { user_id?: string | null }).user_id ?? null
  if (sellerId) {
    const { data: sp } = await supabase
      .from("profiles")
      .select("id,full_name,phone,address,email")
      .eq("id", sellerId)
      .maybeSingle()
    sellerProfile = sp
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardSidebar />
      <main className="lg:pl-64">
        <GlassTopBar />
        <MaterialDetailClient
          material={material}
          initialComments={comments}
          sellerId={sellerId}
          sellerProfile={sellerProfile}
        />
      </main>
    </div>
  )
}
