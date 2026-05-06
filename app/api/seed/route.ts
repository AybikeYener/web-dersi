import { NextResponse } from "next/server"
import { createClient } from "@/utils/supabase/server"

const SEED_DATA = [
  {
    material_type: "Geri Donusturulmus Cam",
    projects: ["Dekoratif Vazo", "Mumluk"],
    difficulty: "Orta",
    image_url: "https://placehold.co/600x400/0f172a/ffffff?text=Cam+Sise",
  },
  {
    material_type: "Endustriyel Ahsap Palet",
    projects: ["Balkon Koltugu", "Duvar Rafi"],
    difficulty: "Zor",
    image_url: "https://placehold.co/600x400/451a03/ffffff?text=Ahsap+Palet",
  },
  {
    material_type: "PET Plastik Ambalaj",
    projects: ["Kus Yemligi", "Saksi"],
    difficulty: "Kolay",
    image_url: "https://placehold.co/600x400/064e3b/ffffff?text=Plastik+Atik",
  },
  {
    material_type: "Aluminyum Kutu",
    projects: ["Ruzgar Cani", "Kalemlik"],
    difficulty: "Orta",
    image_url: "https://placehold.co/600x400/1e3a8a/ffffff?text=Aluminyum+Kutu",
  },
]

export async function POST() {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { count, error: countError } = await supabase
      .from("materials")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)

    if (countError) {
      console.error("Seed count query failed:", countError.message)
      return NextResponse.json({ seeded: false }, { status: 200 })
    }

    if ((count ?? 0) > 0) {
      return NextResponse.json({ seeded: false, reason: "already_exists" }, { status: 200 })
    }

    const { data: insertedMaterials, error: insertError } = await supabase
      .from("materials")
      .insert(
        SEED_DATA.map((item, index) => ({
          title: item.projects?.[0] ?? "Isimsiz Malzeme",
          image_url: item.image_url,
          user_id: user.id,
          price: (index + 1) * 150,
          status: "Satışta",
        })),
      )
      .select("id")

    if (insertError || !insertedMaterials?.length) {
      console.error("Seed materials insert failed:", insertError?.message)
      return NextResponse.json({ seeded: false }, { status: 200 })
    }

    const suggestionRows = insertedMaterials.map((material, index) => ({
      material_id: material.id,
      material_type: SEED_DATA[index]?.material_type ?? "Bilinmeyen",
      projects: SEED_DATA[index]?.projects ?? ["Oneri Yok"],
      difficulty: SEED_DATA[index]?.difficulty ?? "Orta",
    }))
    const { error: suggestionError } = await supabase.from("ai_suggestions").insert(suggestionRows)
    if (suggestionError) {
      console.error("Seed ai_suggestions insert failed:", suggestionError.message)
    }

    return NextResponse.json({ seeded: true }, { status: 200 })
  } catch (error) {
    console.error("Seed route failed:", error)
    return NextResponse.json({ seeded: false }, { status: 200 })
  }
}
