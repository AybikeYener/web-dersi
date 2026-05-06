import { NextResponse } from "next/server"
import { createClient } from "@/utils/supabase/server"

export async function POST(req: Request) {
  try {
    const { image_url, material_type, projects, difficulty, title, price } = await req.json()

    if (typeof image_url !== "string" || !image_url) {
      return NextResponse.json({ error: "image_url required" }, { status: 400 })
    }

    const supabase = await createClient()
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    console.log("materials route auth user id:", user.id)

    const parsedPrice =
      typeof price === "number" && !Number.isNaN(price)
        ? price
        : typeof price === "string" && price.trim() !== ""
          ? Number.parseFloat(price.replace(",", "."))
          : 0

    const { data: materialRow, error: materialInsertError } = await supabase
      .from("materials")
      .insert({
        title: typeof title === "string" && title.trim().length ? title.trim() : "Isimsiz Malzeme",
        image_url,
        user_id: user.id,
        price: Number.isFinite(parsedPrice) ? parsedPrice : 0,
        status: "Satışta",
      })
      .select("id")
      .single()

    if (materialInsertError) {
      console.error("materials insert failed:", materialInsertError.message)
      return NextResponse.json({ error: materialInsertError.message }, { status: 400 })
    }
    console.log("materials insert result:", materialRow)

    const { error: suggestionInsertError } = await supabase.from("ai_suggestions").insert({
      material_id: materialRow.id,
      material_type: typeof material_type === "string" ? material_type : "Bilinmeyen Malzeme",
      projects: Array.isArray(projects) ? projects : ["Duzenleyici", "Dekoratif Aksesuar"],
      difficulty: typeof difficulty === "string" ? difficulty : "Orta",
    })

    if (suggestionInsertError) {
      console.error("ai_suggestions insert failed:", suggestionInsertError.message)
    }

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error) {
    console.error("materials route failed:", error)
    return NextResponse.json({ error: "Unexpected server error" }, { status: 500 })
  }
}
