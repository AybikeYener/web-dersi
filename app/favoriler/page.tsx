import { DashboardSidebar } from "@/components/dashboard/sidebar"
import { GlassTopBar } from "@/components/dashboard/glass-top-bar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Heart, Calendar, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

const favoriteProjects = [
  {
    id: 1,
    title: "Otomotiv Parça Üretimi",
    description: "Paslanmaz çelik ve alüminyum alaşımlı parça üretim projesi",
    status: "Devam Ediyor",
    date: "12 Ocak 2026",
    materials: 8,
  },
  {
    id: 2,
    title: "Havacılık Bileşenleri",
    description: "Karbon fiber ve titanyum bazlı hafif yapı malzemeleri",
    status: "Planlama",
    date: "28 Aralık 2025",
    materials: 5,
  },
  {
    id: 3,
    title: "Endüstriyel Kalıp Tasarımı",
    description: "Yüksek dayanımlı plastik enjeksiyon kalıp projesi",
    status: "Tamamlandı",
    date: "5 Kasım 2025",
    materials: 12,
  },
]

const statusColors: Record<string, string> = {
  "Devam Ediyor": "bg-accent text-accent-foreground",
  "Planlama": "bg-chart-3 text-white",
  "Tamamlandı": "bg-primary text-primary-foreground",
}

export default function FavorilerPage() {
  return (
    <div className="min-h-screen bg-background">
      <DashboardSidebar />
      <main className="lg:pl-64">
        <GlassTopBar />
        <div className="px-4 py-6 sm:px-6 lg:px-8">
          <div className="mb-8 pt-12 lg:pt-0">
            <div className="mb-1 flex items-center gap-2">
              <span className="flex size-9 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600">
                <Heart className="size-5 fill-emerald-500/25" strokeWidth={2} />
              </span>
              <h1 className="text-2xl font-bold tracking-tight text-emerald-950 sm:text-3xl">
                Favori projeler
              </h1>
            </div>
            <p className="text-muted-foreground">
              Kaydettiğiniz ve takip ettiğiniz projeler.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {favoriteProjects.map((project) => (
              <Card
                key={project.id}
                className="group rounded-2xl border-emerald-100/60 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-4">
                    <CardTitle className="text-lg line-clamp-1">{project.title}</CardTitle>
                    <Badge className={statusColors[project.status]}>
                      {project.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {project.description}
                  </p>
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <Calendar className="size-4" />
                      {project.date}
                    </div>
                    <span className="text-muted-foreground">
                      {project.materials} malzeme
                    </span>
                  </div>
                  <Button
                    asChild
                    variant="outline"
                    className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
                  >
                    <Link href={`/projeler/${project.id}`}>
                      Projeyi Goruntule
                      <ArrowRight className="size-4 ml-2" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}
