"use client"

import Link from "next/link"
import { AlertTriangle } from "lucide-react"

import { Button } from "@/components/ui/button"

export default function CheckoutErrorPage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="mx-auto max-w-md text-center">
        <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-red-500/10">
          <AlertTriangle className="h-10 w-10 text-red-600 dark:text-red-400" />
        </div>
        <h1 className="mb-4 text-3xl font-bold">Hubo un problema</h1>
        <p className="mb-8 text-muted-foreground">
          No pudimos procesar tu pago. Por favor, intenta de nuevo con otro método de pago o contacta a soporte si el problema persiste.
        </p>
        <div className="flex justify-center gap-4">
          <Link href="/carrito">
            <Button variant="outline" className="rounded-xl">
              Volver al carrito
            </Button>
          </Link>
          <Link href="/galeria">
            <Button className="rounded-xl bg-primary font-semibold text-foreground hover:bg-primary-hover">
              Ir a la galería
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
