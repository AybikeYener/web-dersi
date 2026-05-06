import { Package, Clock, TrendingUp } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

export function StatCards({ totalMaterials = 0 }: { totalMaterials?: number }) {
  const stats = [
    {
      title: "Toplam Ilan",
      value: totalMaterials.toString(),
      change: "Canli",
      changeType: "positive" as const,
      icon: Package,
      description: "Supabase materials",
    },
    {
      title: "Bekleyen Projeler",
      value: Math.max(totalMaterials - 1, 0).toString(),
      change: "Guncel",
      changeType: "negative" as const,
      icon: Clock,
      description: "AI isleme hazir",
    },
    {
      title: "Aktif Teklifler",
      value: Math.max(Math.floor(totalMaterials * 0.6), 0).toString(),
      change: "Canli",
      changeType: "positive" as const,
      icon: TrendingUp,
      description: "Bu hafta",
    },
  ]

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {stats.map((stat) => (
        <Card key={stat.title} className="overflow-hidden border-emerald-100/70 bg-gradient-to-br from-card to-emerald-50/30">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-emerald-900/60">{stat.title}</p>
                <div className="flex items-baseline gap-2">
                  <p className="text-3xl font-bold tracking-tight text-emerald-950">{stat.value}</p>
                  <span
                    className={`text-xs font-medium ${
                      stat.changeType === "positive" ? "text-emerald-600" : "text-destructive"
                    }`}
                  >
                    {stat.change}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">{stat.description}</p>
              </div>
              <div className="flex size-12 items-center justify-center rounded-lg bg-primary/10">
                <stat.icon className="size-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
