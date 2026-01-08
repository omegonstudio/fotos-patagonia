"use client"

import type React from "react"
import { useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import { Header } from "@/components/organisms/header"
import { useAuthStore } from "@/lib/store"
import { getUserRoleName } from "@/lib/types"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, user, initialized, token } = useAuthStore()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (!initialized) return
  
    if (!token) {
      router.push("/")
    }
  }, [initialized, token, router])
  
  
  // Obtener nombre del rol
  const roleName = getUserRoleName(user)

  // Mostrar mensaje mientras se verifica autenticación
  if (!initialized || (token && !user)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">Verificando autenticación...</p>
        </div>
      </div>
    )
  }

  // Detectar si está en /admin raíz o en una subruta
  const isAdminRoot = pathname === "/admin" || pathname === "/admin/"
  const isAdminSection = pathname?.startsWith("/admin/") && !isAdminRoot

  return (
    <div className="min-h-screen">
      <Header />
      <div className="container mx-auto px-4 py-6">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Panel de Administración</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Conectado como:{" "}
              <span className="font-medium capitalize">
                {roleName || "Usuario"}
              </span>
            </p>

            {isAdminRoot ? (
              <Link
                href="/"
                className="mb-4 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="h-4 w-4" />
                Volver home
              </Link>
            ) : isAdminSection ? (
              <Link
                href="/admin"
                className="mb-4 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="h-4 w-4" />
                Volver al panel
              </Link>
            ) : null}
          </div>

          <div className="px-3 py-1 rounded-full bg-[#ffecce] text-[#f9a01b] text-sm font-medium">
            {user?.email}
          </div>
        </div>

        {children}
      </div>
    </div>
  )
}
