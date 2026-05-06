"use client"

import { useState } from "react"
import { toast } from "sonner"
import { createClient } from "@/utils/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export type ProfileRow = {
  id: string
  full_name: string | null
  phone: string | null
  address: string | null
  email: string | null
}

export function SettingsProfileForm({
  userId,
  email,
  initialProfile,
}: {
  userId: string
  email: string | null
  initialProfile: ProfileRow | null
}) {
  const [fullName, setFullName] = useState(initialProfile?.full_name ?? "")
  const [phone, setPhone] = useState(initialProfile?.phone ?? "")
  const [address, setAddress] = useState(initialProfile?.address ?? "")
  const [saving, setSaving] = useState(false)

  const onSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!fullName.trim()) {
      toast.error("Ad Soyad alanı zorunludur.")
      return
    }
    setSaving(true)
    try {
      const supabase = createClient()
      const { error } = await supabase.from("profiles").upsert(
        {
          id: userId,
          full_name: fullName.trim(),
          phone: phone.trim() || null,
          address: address.trim() || null,
          email: email?.trim() || null,
        },
        { onConflict: "id" },
      )

      if (error) {
        console.error(error)
        toast.error(`Kaydedilemedi: ${error.message}`)
        return
      }
      toast.success("Profil bilgileriniz kaydedildi.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profil</CardTitle>
        <CardDescription>Ad Soyad, telefon ve açık adres bilgileriniz.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSave} className="space-y-4 max-w-lg">
          <div className="space-y-2">
            <Label htmlFor="email">E-posta</Label>
            <Input id="email" type="email" value={email ?? ""} disabled readOnly />
          </div>
          <div className="space-y-2">
            <Label htmlFor="full_name">Ad Soyad</Label>
            <Input
              id="full_name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Telefon numarası</Label>
            <Input
              id="phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+90 5xx xxx xx xx"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="address">Açık adres</Label>
            <Textarea
              id="address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              rows={4}
              placeholder="Mahalle, sokak, bina no, ilçe, il"
            />
          </div>
          <Button type="submit" disabled={saving}>
            {saving ? "Kaydediliyor..." : "Kaydet"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
