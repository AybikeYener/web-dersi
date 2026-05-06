import { redirect } from "next/navigation"
import { Button } from "@/components/ui/button"
import { DashboardContent } from "@/app/dashboard-content"
import { createClient } from "@/utils/supabase/server"

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  const { data: userScopedData, error: userScopedError } = await supabase
    .from("materials")
    .select(
      "id,title,price,status,image_url,created_at,user_id,ai_suggestions(material_type,projects,difficulty)",
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })

  if (userScopedError) {
    console.error("User scoped materials query failed:", userScopedError.message)
  }

  let materialsData = userScopedData ?? []
  if (materialsData.length === 0) {
    const { data: fallbackData, error: fallbackError } = await supabase
      .from("materials")
      .select(
        "id,title,price,status,image_url,created_at,user_id,ai_suggestions(material_type,projects,difficulty)",
      )
      .order("created_at", { ascending: false })

    if (fallbackError) {
      console.error("Fallback all-materials query failed:", fallbackError.message)
    } else {
      materialsData = fallbackData ?? []
    }
  }

  console.log("Materials query result size:", materialsData.length)

  const ownerIds = [
    ...new Set(
      materialsData.map((m) => m.user_id).filter((id): id is string => typeof id === "string" && id.length > 0),
    ),
  ]
  let ownerById: Record<string, { email: string | null; full_name: string | null }> = {}
  if (ownerIds.length > 0) {
    const { data: profs } = await supabase.from("profiles").select("id,email,full_name").in("id", ownerIds)
    ownerById = Object.fromEntries(
      (profs ?? []).map((p) => [p.id, { email: p.email ?? null, full_name: p.full_name ?? null }]),
    )
  }

  const materialsForDashboard = materialsData.map((m) => ({
    ...m,
    ownerEmail: m.user_id ? ownerById[m.user_id]?.email ?? null : null,
    ownerName: m.user_id ? ownerById[m.user_id]?.full_name ?? null : null,
  }))

  async function signOut() {
    "use server"
    const serverSupabase = await createClient()
    await serverSupabase.auth.signOut()
    redirect("/login")
  }

  return (
    <DashboardContent
      userId={user.id}
      userEmail={user.email ?? "Bilinmiyor"}
      topBarEnd={
        <form action={signOut}>
          <Button
            type="submit"
            variant="outline"
            size="sm"
            className="border-emerald-200 bg-background text-emerald-900 hover:bg-emerald-50"
          >
            Çıkış yap
          </Button>
        </form>
      }
      initialMaterials={materialsForDashboard}
    />
  )
}
