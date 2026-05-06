import { redirect } from "next/navigation"
import { DashboardSidebar } from "@/components/dashboard/sidebar"
import { GlassTopBar } from "@/components/dashboard/glass-top-bar"
import { createClient } from "@/utils/supabase/server"
import { MessageSquare } from "lucide-react"
import { MesajlarClient, type MessageRow, type PartnerProfile } from "./mesajlar-client"

export default async function MesajlarPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  const { data: raw, error } = await supabase
    .from("messages")
    .select("id,sender_id,receiver_id,content,created_at")
    .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
    .order("created_at", { ascending: true })

  if (error) {
    console.error("Mesajlar:", error.message)
  }

  const messages = (raw ?? []) as MessageRow[]
  const partnerIds = [...new Set(messages.map((m) => (m.sender_id === user.id ? m.receiver_id : m.sender_id)))]

  let partnerProfiles: PartnerProfile[] = []
  if (partnerIds.length > 0) {
    const { data: profs } = await supabase
      .from("profiles")
      .select("id,full_name,email")
      .in("id", partnerIds)
    partnerProfiles = (profs as PartnerProfile[]) ?? []
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardSidebar />
      <main className="lg:pl-64">
        <GlassTopBar />
        <div className="px-4 py-6 sm:px-6 lg:px-8">
          <div className="mb-6 pt-12 lg:pt-0">
            <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-emerald-950 sm:text-3xl">
              <span className="flex size-9 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
                <MessageSquare className="size-5" aria-hidden />
              </span>
              Mesajlar
            </h1>
            <p className="text-muted-foreground">Gelen kutunuz ve sohbetleriniz</p>
          </div>
          <MesajlarClient
            currentUserId={user.id}
            initialMessages={messages}
            partnerProfiles={partnerProfiles}
          />
        </div>
      </main>
    </div>
  )
}
