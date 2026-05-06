"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Home,
  Package,
  Heart,
  Settings,
  Menu,
  X,
  Leaf,
  PlusCircle,
  ListOrdered,
  MessageSquare,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { useState } from "react"
const navItems = [
  { href: "/", label: "Ana Sayfa", icon: Home },
  { href: "/ilan-ver", label: "Ilan Ver", icon: PlusCircle },
  { href: "/ilanlarim", label: "Ilanlarim", icon: ListOrdered },
  { href: "/malzemeler", label: "Malzeme İlanları", icon: Package },
  { href: "/mesajlar", label: "Mesajlar", icon: MessageSquare },
  { href: "/favoriler", label: "Favori Projeler", icon: Heart },
  { href: "/ayarlar", label: "Ayarlar", icon: Settings },
]

function navItemActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/"
  return pathname === href || pathname.startsWith(`${href}/`)
}

export function DashboardSidebar() {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="fixed left-4 top-4 z-50 bg-sidebar text-sidebar-foreground hover:bg-sidebar-accent lg:hidden"
        onClick={() => setMobileOpen(!mobileOpen)}
      >
        {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
      </Button>

      {mobileOpen ? (
        <div className="fixed inset-0 z-30 bg-black/50 lg:hidden" onClick={() => setMobileOpen(false)} />
      ) : null}

      <aside
        className={cn(
          "fixed left-0 top-0 z-40 h-screen w-64 border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-transform duration-300 lg:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex h-full flex-col">
          <div className="flex h-16 items-center gap-2 border-b border-sidebar-border px-4">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-sidebar-primary">
              <Leaf className="size-5 text-sidebar-primary-foreground" />
            </div>
            <div className="min-w-0">
              <h1 className="truncate text-base font-semibold text-sidebar-foreground">EcoLoop</h1>
              <p className="truncate text-xs text-sidebar-foreground/60">Sürdürülebilir pazar</p>
            </div>
          </div>

          <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
            <p className="mb-3 px-3 text-xs font-medium uppercase tracking-wider text-sidebar-foreground/50">
              Menü
            </p>
            {navItems.map((item) => {
              const isActive = navItemActive(pathname, item.href)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-sidebar-accent text-sidebar-accent-foreground"
                      : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground",
                  )}
                >
                  <item.icon className="size-5" />
                  {item.label}
                </Link>
              )
            })}
          </nav>

          <div className="border-t border-sidebar-border p-4">
            <div className="flex items-center gap-3">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-sidebar-accent text-sm font-medium">
                AY
              </div>
              <div className="min-w-0 flex-1 truncate">
                <p className="truncate text-sm font-medium text-sidebar-foreground">Admin Kullanıcı</p>
                <p className="truncate text-xs text-sidebar-foreground/60">admin@atolye.com</p>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  )
}
