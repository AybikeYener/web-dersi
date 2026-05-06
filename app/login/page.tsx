import Link from "next/link"
import { redirect } from "next/navigation"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { createClient } from "@/utils/supabase/server"

type LoginPageProps = {
  searchParams: Promise<{ error?: string }>
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams
  const error = params.error

  async function login(formData: FormData) {
    "use server"

    const email = String(formData.get("email") ?? "")
    const password = String(formData.get("password") ?? "")
    const supabase = await createClient()

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (signInError) {
      redirect(`/login?error=${encodeURIComponent(signInError.message)}`)
    }

    redirect("/")
  }

  async function signup(formData: FormData) {
    "use server"

    const email = String(formData.get("email") ?? "")
    const password = String(formData.get("password") ?? "")
    const supabase = await createClient()

    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
    })

    if (signUpError) {
      redirect(`/login?error=${encodeURIComponent(signUpError.message)}`)
    }

    redirect("/")
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md border-border/60 bg-card/95 shadow-xl">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl">EcoLoop Auth</CardTitle>
          <CardDescription>Email ve sifren ile giris yap veya yeni hesap olustur.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" required placeholder="ornek@ecoloop.com" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Sifre</Label>
              <Input id="password" name="password" type="password" required minLength={6} />
            </div>
            {error ? (
              <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </p>
            ) : null}
            <Button type="submit" className="w-full" formAction={login}>
              Giris Yap
            </Button>
            <Button type="submit" variant="secondary" className="w-full" formAction={signup}>
              Kayit Ol
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col gap-3">
          <p className="text-xs text-muted-foreground">
            Giris yaptiginizda ana panele yonlendirilirsiniz. <Link href="/" className="underline">Panele git</Link>
          </p>
        </CardFooter>
      </Card>
    </main>
  )
}
