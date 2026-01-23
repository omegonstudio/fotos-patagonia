"use client"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Order, OrderStatus, PaymentMethod } from "@/lib/types"
import { useEffect, useState } from "react"
import { useOrders } from "@/hooks/orders/useOrders"

interface EditOrderModalProps {
  order: Order | null
  isOpen: boolean
  onClose: () => void
  onOrderUpdate: () => void
}

export function EditOrderModal({
  order,
  isOpen,
  onClose,
  onOrderUpdate,
}: EditOrderModalProps) {
  const [paymentMethod, setPaymentMethod] = useState(order?.payment_method || "")
  const [total, setTotal] = useState(order?.total || 0)
  const [status, setStatus] = useState(order?.order_status || "")
  const { updateOrder } = useOrders()

  useEffect(() => {
    if (order) {
      setPaymentMethod(order.payment_method || "")
      setTotal(order.total || 0)
      setStatus(order.order_status || "")
    }
  }, [order])

  const handleSave = async () => {
    if (order) {
      await updateOrder(order.id.toString(), {
        payment_method: paymentMethod as PaymentMethod,
        total,
        order_status: status as OrderStatus,
      })
      onOrderUpdate()
      onClose()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar Pedido</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="paymentMethod" className="text-right">
              Forma de Pago
            </Label>
            <Select
              value={paymentMethod}
              onValueChange={setPaymentMethod}
            >
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Seleccionar forma de pago" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="efectivo">Efectivo</SelectItem>
                <SelectItem value="transferencia">Transferencia</SelectItem>
                <SelectItem value="posnet">Tarjeta</SelectItem>
                <SelectItem value="mp">Mercado Pago</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="total" className="text-right">
              Monto Total
            </Label>
            <Input
              id="total"
              type="number"
              value={total}
              onChange={(e) => setTotal(Number(e.target.value))}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="status" className="text-right">
              Estado
            </Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Seleccionar estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pendiente</SelectItem>
                <SelectItem value="paid">Pagado</SelectItem>
                <SelectItem value="completed">Completado</SelectItem>
                <SelectItem value="shipped">Enviado</SelectItem>
                <SelectItem value="rejected">Rechazado</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleSave}>Guardar Cambios</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
