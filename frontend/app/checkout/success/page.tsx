"use client"

import { useEffect } from "react"
import Link from "next/link"
import { CheckCircle } from "lucide-react"

import { Button } from "@/components/ui/button"
import { useCart } from "@/hooks/cart/useCart"

export default function CheckoutSuccessPage() {
  const { refetch } = useCart()

  // Forzar la recarga del estado del carrito desde el backend.
  // El webhook ya ha vaciado el carrito en la DB; esto simplemente
  // sincroniza el estado del frontend con el del backend.
  useEffect(() => {
    refetch()
  }, [refetch])

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="mx-auto max-w-md text-center">
        <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-green-500/10">
          <CheckCircle className="h-10 w-10 text-green-600 dark:text-green-400" />
        </div>
        <h1 className="mb-4 text-3xl font-bold">¡Pago exitoso!</h1>
        <p className="mb-8 text-muted-foreground">
          Gracias por tu compra. Hemos recibido tu pago y estamos procesando tu pedido. Recibirás un correo electrónico de confirmación en breve.
        </p>
        <div className="flex justify-center gap-4">
          <Link href="/pedidos">
            <Button variant="outline" className="rounded-xl">
              Ver mis pedidos
            </Button>
          </Link>
          <Link href="/galeria">
            <Button className="rounded-xl bg-primary font-semibold text-foreground hover:bg-primary-hover">
              Volver a la galería
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
