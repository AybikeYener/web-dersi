import Link from "next/link"
import { ArrowLeft, CalendarDays, Target } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"

const MOCK_PROJECTS: Record<
  string,
  {
    title: string
    status: "Devam Ediyor" | "Planlama" | "Tamamlandı"
    description: string
    startDate: string
    goals: string[]
    materials: Array<{ name: string; note: string }>
  }
> = {
  "1": {
    title: "Otomotiv Parça Üretimi",
    status: "Devam Ediyor",
    description:
      "Paslanmaz çelik ve alüminyum alaşımlı araç parçaları için optimize edilmiş geri dönüşüm ve üretim hattı projesi.",
    startDate: "12 Ocak 2026",
    goals: ["Hurda geri kazanım verimini artırmak", "Maliyetleri düşürmek", "Kalite sürekliliği sağlamak"],
    materials: [
      { name: "Paslanmaz Celik", note: "Yuksek dayanimli parcalar icin" },
      { name: "Aluminyum Alasimi", note: "Hafiflik ve korozyon direnci" },
      { name: "Bakir Kablo", note: "Elektrik bilesenleri icin" },
    ],
  },
  "2": {
    title: "Havacılık Bileşenleri",
    status: "Planlama",
    description:
      "Karbon fiber ve titanyum bazlı hafif yapı malzemeleri ile sürdürülebilir üretim süreçlerinin planlanması.",
    startDate: "28 Aralik 2025",
    goals: ["Hafifletme hedefleri", "Malzeme israfini azaltma", "Tedarik zinciri standardizasyonu"],
    materials: [
      { name: "Karbon Fiber", note: "Hafif ve dayanikli paneller" },
      { name: "Titanyum", note: "Yuksek sicaklik/dayanim ihtiyaci" },
    ],
  },
  "3": {
    title: "Endüstriyel Kalıp Tasarımı",
    status: "Tamamlandı",
    description:
      "Yüksek dayanımlı plastik enjeksiyon kalıp tasarımı ve geri dönüştürülmüş polimer optimizasyonu.",
    startDate: "5 Kasim 2025",
    goals: ["Daha hizli kalip degisimi", "Fire oranini azaltma", "Geri donusum uyumunu artirma"],
    materials: [
      { name: "Geri Donusturulmus Polimer", note: "Enjeksiyon prosesine uygun" },
      { name: "Kompozit", note: "Guc ve esneklik dengesi" },
    ],
  },
}

const statusBadgeClass: Record<string, string> = {
  "Devam Ediyor": "bg-emerald-500/15 text-emerald-600 border-emerald-500/25",
  Planlama: "bg-amber-500/15 text-amber-600 border-amber-500/25",
  Tamamlandı: "bg-sky-500/15 text-sky-600 border-sky-500/25",
}

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const project = MOCK_PROJECTS[id]

  if (!project) {
    return (
      <main className="min-h-screen bg-background px-4 py-10">
        <div className="mx-auto w-full max-w-3xl space-y-6">
          <Button asChild variant="outline">
            <Link href="/favoriler">
              <ArrowLeft className="mr-2 size-4" />
              Geri Don
            </Link>
          </Button>
          <Card className="border-border/60">
            <CardHeader>
              <CardTitle>Proje Bulunamadi</CardTitle>
              <CardDescription>Bu ID ile eslesen bir proje yok. (404)</CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild>
                <Link href="/favoriler">Favorilere Don</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-background px-4 py-10">
      <div className="mx-auto w-full max-w-4xl space-y-6">
        <Button asChild variant="outline" className="w-fit">
          <Link href="/favoriler">
            <ArrowLeft className="mr-2 size-4" />
            Geri Don
          </Link>
        </Button>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              {project.title}
            </h1>
            <p className="text-sm text-muted-foreground">Proje Detay Panosu</p>
          </div>
          <Badge
            variant="outline"
            className={`w-fit px-3 py-1 text-sm ${statusBadgeClass[project.status] ?? ""}`}
          >
            {project.status}
          </Badge>
        </div>

        <Card className="border-border/60">
          <CardHeader className="space-y-2">
            <CardTitle>Genel Bakis</CardTitle>
            <CardDescription>Ozet bilgi, baslangic tarihi ve hedefler.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <p className="text-sm leading-relaxed text-foreground/90">{project.description}</p>

            <Separator />

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex items-start gap-3 rounded-lg border bg-card/60 p-4">
                <CalendarDays className="mt-0.5 size-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium text-foreground">Baslangic Tarihi</p>
                  <p className="text-sm text-muted-foreground">{project.startDate}</p>
                </div>
              </div>
              <div className="flex items-start gap-3 rounded-lg border bg-card/60 p-4">
                <Target className="mt-0.5 size-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium text-foreground">Hedefler</p>
                  <ul className="mt-1 list-disc pl-4 text-sm text-muted-foreground">
                    {project.goals.map((goal) => (
                      <li key={goal}>{goal}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardHeader>
            <CardTitle>Bu Projede Kullanilan Geri Donusum Malzemeleri</CardTitle>
            <CardDescription>Ornek materyaller listesi.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            {project.materials.map((m) => (
              <Card key={m.name} className="border-border/60 bg-card/60">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">{m.name}</CardTitle>
                  <CardDescription>{m.note}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </CardContent>
        </Card>
      </div>
    </main>
  )
}

