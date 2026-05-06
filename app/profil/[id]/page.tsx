import { createClient } from "@/utils/supabase/server"
import { ProfilePublicView } from "./profile-public-view"

export default async function ProfilPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: rawId } = await params
  const profileUserId = rawId.trim()

  const supabase = await createClient()

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id,full_name,phone,address,email")
    .eq("id", profileUserId)
    .maybeSingle()

  if (profileError) {
    console.error("Profil okuma:", profileError.message)
  }

  const { data: materials, error: matError } = await supabase
    .from("materials")
    .select("id,title,price,status,image_url,created_at,ai_suggestions(material_type,projects,difficulty)")
    .eq("user_id", profileUserId)
    .neq("status", "Satıldı")
    .order("created_at", { ascending: false })

  if (matError) {
    console.error("Profil ilanları:", matError.message)
  }

  const {
    data: { user },
  } = await supabase.auth.getUser()

  return (
    <ProfilePublicView
      profileUserId={profileUserId}
      profile={profile}
      profileLoadError={profileError?.message ?? null}
      materials={materials ?? []}
      viewerUserId={user?.id ?? null}
    />
  )
}
