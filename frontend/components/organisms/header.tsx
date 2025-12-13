"use client"

import Link from "next/link"
import { ShoppingCart, User, LogOut } from "lucide-react"
import { useState, useCallback, memo } from "react"
import { Logo } from "@/components/atoms/logo"
import { IconButton } from "@/components/atoms/icon-button"
import { useCartStore, useAuthStore } from "@/lib/store"
import { useAuth } from "@/hooks/auth/useAuth"
import { getUserRoleName } from "@/lib/types"
import { LoginModal } from "./login-modal"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

function HeaderComponent() {
  const cartItemCount = useCartStore((state) => state.items.length)
  const { user, isAuthenticated } = useAuthStore()
  const { logout: backendLogout } = useAuth()
  const [showLoginModal, setShowLoginModal] = useState(false)

  const handleUserClick = useCallback(() => {
    if (!isAuthenticated) {
      setShowLoginModal(true)
    }
  }, [isAuthenticated])

  const handleLogout = useCallback(async () => {
    await backendLogout()
  }, [backendLogout])
  
  // Obtener nombre del rol para mostrar
  const roleName = getUserRoleName(user)

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-gray-200 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-20 items-center justify-between px-4">
        <Link
          href="/"
          className="flex flex-row items-center transition-opacity hover:opacity-70"
        >
          <Logo />
          <div>
          <h1 className="text-center font-bold px-4">Fotos Patagonia</h1>
          </div>
        </Link>

          <nav className="hidden items-center gap-6 md:flex">
            <Link
              href="/galeria"
              className="text-sm font-medium text-foreground transition-colors hover:text-[#f9a01b] hover:bg-[#ffecce] px-3 py-2 rounded-md"
            >
              Galería
            </Link>
            <Link
              href="/albumes"
              className="text-sm font-medium text-foreground transition-colors hover:text-[#f9a01b] hover:bg-[#ffecce] px-3 py-2 rounded-md"
            >
              Álbumes
            </Link>
            <Link
              href="/contacto"
              className="text-sm font-medium text-foreground transition-colors hover:text-[#f9a01b] hover:bg-[#ffecce] px-3 py-2 rounded-md"
            >
              Contacto
            </Link>
          </nav>

          <div className="flex items-center gap-2">
            <Link href="/carrito" className="relative">
              <IconButton icon={ShoppingCart} ariaLabel="Ver carrito" className="hover:bg-[#ffecce]" />
              {cartItemCount > 0 && (
                <div className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-[#f9a01b] text-xs font-bold text-white">
                  {cartItemCount}
                </div>
              )}
            </Link>

            {isAuthenticated && user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="rounded-full hover:bg-[#ffecce]">
                    <User className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 bg-[#f2f2e4]">
                  <DropdownMenuLabel>
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium">{user.email}</p>
                      <p className="text-xs text-muted-foreground capitalize">
                        {roleName || "Usuario"}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/admin">Panel de Administración</Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                    <LogOut className="mr-2 h-4 w-4" />
                    Cerrar Sesión
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <IconButton
                icon={User}
                ariaLabel="Iniciar sesión"
                className="hover:bg-[#ffecce]"
                onClick={handleUserClick}
              />
            )}
          </div>
        </div>
      </header>

      <LoginModal open={showLoginModal} onOpenChange={setShowLoginModal} />
    </>
  )
}

export const Header = memo(HeaderComponent)
Header.displayName = 'Header'
