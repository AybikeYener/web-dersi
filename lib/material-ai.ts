/** Normalize AI project names from Supabase / API (string[], JSON, or single string). */
export function normalizeAiProjects(raw: unknown): string[] {
  if (raw == null) return []
  if (Array.isArray(raw)) {
    return raw
      .map((x) => (typeof x === "string" ? x.trim() : x != null ? String(x).trim() : ""))
      .filter((s) => s.length > 0)
  }
  if (typeof raw === "string" && raw.trim()) return [raw.trim()]
  return []
}

export function mergeAiProjectsFromSuggestions(
  suggestions: { projects?: unknown }[] | null | undefined,
): string[] {
  if (!Array.isArray(suggestions) || suggestions.length === 0) return []
  const seen = new Set<string>()
  const out: string[] = []
  for (const row of suggestions) {
    for (const p of normalizeAiProjects(row?.projects)) {
      if (!seen.has(p)) {
        seen.add(p)
        out.push(p)
      }
    }
  }
  return out
}

export function formatAiProjectsPreview(projects: string[]): { label: string; hasReal: boolean } {
  const p = projects.filter(Boolean)
  if (p.length === 0) return { label: "AI önerisi bekleniyor", hasReal: false }
  const two = p.slice(0, 2).join(", ")
  const label = p.length > 2 ? `${two}…` : two
  return { label, hasReal: true }
}
