"use client"

import { useCallback, useEffect, useState } from "react"
import { toast } from "sonner"
import { Leaf, Pencil, Trash2 } from "lucide-react"
import { createClient } from "@/utils/supabase/client"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

type Row = {
  id: string
  title: string | null
  price: number | null
  status: string | null
}

const formatTry = (n: number) =>
  new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" }).format(n)

export function IlanlarimClient({ userId }: { userId: string }) {
  const [rows, setRows] = useState<Row[]>([])
  const [loading, setLoading] = useState(true)
  const [editRow, setEditRow] = useState<Row | null>(null)
  const [editTitle, setEditTitle] = useState("")
  const [editPrice, setEditPrice] = useState("")
  const [saving, setSaving] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const load = useCallback(async () => {
    const supabase = createClient()
    const { data, error } = await supabase
      .from("materials")
      .select("id,title,price,status")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })

    if (error) {
      console.error(error)
      toast.error(`Listelenemedi: ${error.message}`)
      setRows([])
    } else {
      setRows((data ?? []) as Row[])
    }
    setLoading(false)
  }, [userId])

  useEffect(() => {
    load()
  }, [load])

  const confirmDelete = async () => {
    if (!deleteId) return
    const supabase = createClient()
    const { error } = await supabase
      .from("materials")
      .delete()
      .eq("id", deleteId)
      .eq("user_id", userId)
    setDeleteId(null)
    if (error) {
      toast.error(`Silinemedi: ${error.message}`)
      return
    }
    toast.success("İlan silindi.")
    load()
  }

  const openEdit = (r: Row) => {
    setEditRow(r)
    setEditTitle(r.title || "")
    setEditPrice(String(r.price ?? 0))
  }

  const saveEdit = async () => {
    if (!editRow) return
    const p = Number.parseFloat(editPrice.replace(",", "."))
    if (!editTitle.trim()) {
      toast.error("Başlık boş olamaz.")
      return
    }
    if (!Number.isFinite(p) || p < 0) {
      toast.error("Geçerli bir fiyat girin.")
      return
    }
    setSaving(true)
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from("materials")
        .update({ title: editTitle.trim(), price: p })
        .eq("id", editRow.id)
        .eq("user_id", userId)

      if (error) {
        toast.error(`Güncellenemedi: ${error.message}`)
        return
      }
      toast.success("İlan güncellendi.")
      setEditRow(null)
      load()
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <div className="px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-8 pt-12 lg:pt-0">
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-emerald-950 sm:text-3xl">
            <Leaf className="size-7 text-emerald-600" aria-hidden />
            İlanlarım
          </h1>
          <p className="text-muted-foreground">Yalnızca sizin yayınladığınız ilanlar.</p>
        </div>

        {loading ? (
          <p className="text-sm text-emerald-900/70">Yükleniyor...</p>
        ) : rows.length === 0 ? (
          <Card className="rounded-2xl border-dashed border-emerald-200/80 bg-emerald-50/40">
            <CardHeader>
              <CardTitle className="text-emerald-950">Henüz ilan yok</CardTitle>
              <CardDescription className="text-emerald-900/70">
                İlk ilanınızı oluşturmak için &quot;İlan Ver&quot; sayfasına gidin.
              </CardDescription>
            </CardHeader>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {rows.map((r) => (
              <Card key={r.id} className="rounded-2xl border-emerald-100/60 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
                <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0">
                  <div>
                    <CardTitle className="text-lg">{r.title || "İsimsiz Malzeme"}</CardTitle>
                    <CardDescription className="mt-1">{formatTry(r.price ?? 0)}</CardDescription>
                  </div>
                  <Badge variant="outline">{r.status ?? "Satışta"}</Badge>
                </CardHeader>
                <CardContent className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => openEdit(r)}>
                    <Pencil className="mr-1 size-4" />
                    Düzenle
                  </Button>
                  <Button variant="destructive" size="sm" onClick={() => setDeleteId(r.id)}>
                    <Trash2 className="mr-1 size-4" />
                    Sil
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>İlanı silinsin mi?</AlertDialogTitle>
            <AlertDialogDescription>
              Bu işlem geri alınamaz. İlanınız kalıcı olarak kaldırılır.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Vazgeç</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={confirmDelete}
            >
              Evet, sil
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={!!editRow} onOpenChange={(o) => !o && setEditRow(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>İlanı düzenle</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 py-2">
            <div className="space-y-2">
              <Label>Başlık</Label>
              <Input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Fiyat (₺)</Label>
              <Input value={editPrice} onChange={(e) => setEditPrice(e.target.value)} type="number" min={0} step="0.01" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditRow(null)}>
              İptal
            </Button>
            <Button onClick={saveEdit} disabled={saving}>
              {saving ? "Kaydediliyor..." : "Kaydet"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
