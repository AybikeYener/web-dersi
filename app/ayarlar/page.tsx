import { redirect } from "next/navigation"
import { DashboardSidebar } from "@/components/dashboard/sidebar"
import { GlassTopBar } from "@/components/dashboard/glass-top-bar"
import { Leaf } from "lucide-react"
import { createClient } from "@/utils/supabase/server"
import { SettingsProfileForm, type ProfileRow } from "./settings-profile-form"

export default async function AyarlarPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("id,full_name,phone,address,email")
    .eq("id", user.id)
    .maybeSingle()

  if (error) {
    console.error("Profil okuma:", error.message)
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardSidebar />
      <main className="lg:pl-64">
        <GlassTopBar />
        <div className="px-4 py-6 sm:px-6 lg:px-8">
          <div className="mb-8 pt-12 lg:pt-0">
            <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-emerald-950 sm:text-3xl">
              <Leaf className="size-7 text-emerald-600" aria-hidden />
              Ayarlar
            </h1>
            <p className="text-muted-foreground">Hesap ve iletişim bilgilerinizi yönetin.</p>
          </div>

          <SettingsProfileForm
            userId={user.id}
            email={user.email ?? null}
            initialProfile={(profile as ProfileRow | null) ?? null}
          />
        </div>
      </main>
    </div>
  )
}
