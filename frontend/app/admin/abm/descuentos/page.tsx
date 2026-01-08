"use client"

import { useState } from "react"
import Link from "next/link"
import { Plus, ArrowLeft, Edit, Trash2, Loader2, Percent, Calendar as CalendarIcon, CheckCircle, XCircle } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useDiscounts } from "@/hooks/discounts/useDiscounts"
import { useToast } from "@/hooks/use-toast"
import { DiscountModal } from "@/components/molecules/discount-modal"
import { DeleteConfirmationModal } from "@/components/molecules/delete-confirmation-modal"
import { formatDateOnly, parseUtcNaiveDate } from "@/lib/datetime"

export default function DiscountsManagementPage() {
  const { discounts, loading, error, refetch, createDiscount, updateDiscount, deleteDiscount } = useDiscounts()
  const { toast } = useToast()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingDiscount, setEditingDiscount] = useState<any>(undefined)
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    isOpen: boolean
    discountId: number | null
  }>({ isOpen: false, discountId: null })

  const handleOpenAdd = () => {
    setEditingDiscount(undefined)
    setIsModalOpen(true)
  }

  const handleOpenEdit = (discount: any) => {
    setEditingDiscount(discount)
    setIsModalOpen(true)
  }

  const handleOpenDelete = (discountId: number) => {
    setDeleteConfirmation({ isOpen: true, discountId })
  }

  const handleDelete = async (id: number) => {
    try {
      await deleteDiscount(id)
      toast({
        title: "Descuento eliminado",
        description: "El código de descuento ha sido eliminado exitosamente",
      })
      refetch()
      setDeleteConfirmation({ isOpen: false, discountId: null })
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo eliminar el descuento",
        variant: "destructive",
      })
    }
  }

  const handleSave = async (discountData: any) => {
    try {
      if (editingDiscount) {
        await updateDiscount(editingDiscount.id, discountData)
        toast({
          title: "Descuento actualizado",
          description: "El código de descuento ha sido actualizado exitosamente",
        })
      } else {
        await createDiscount(discountData)
        toast({
          title: "Descuento creado",
          description: "El código de descuento ha sido creado exitosamente",
        })
      }
      refetch()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || `No se pudo ${editingDiscount ? "actualizar" : "crear"} el descuento`,
        variant: "destructive",
      })
    }
  }

  const isExpired = (expiresAt?: string | null) => {
    if (!expiresAt) return false
    const parsed = parseUtcNaiveDate(expiresAt)
    if (!parsed) return false
    return parsed.getTime() < Date.now()
  }

  const discountToDelete = discounts.find((d) => d.id === deleteConfirmation.discountId)

  // Loading state
  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex min-h-[400px] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex min-h-[400px] items-center justify-center">
          <div className="text-center">
            <p className="text-destructive mb-4">Error al cargar los descuentos</p>
            <Button onClick={refetch}>Reintentar</Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <Link
            href="/admin/abm"
            className="mb-4 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver
          </Link>
          <h2 className="text-4xl font-bold">Gestión de Descuentos</h2>
          <p className="text-muted-foreground">Total: {discounts.length} código(s) de descuento</p>
        </div>
        <Button
          onClick={handleOpenAdd}
          className="rounded-xl bg-primary font-semibold text-foreground hover:bg-primary-hover"
        >
          <Plus className="mr-2 h-4 w-4" />
          Nuevo Código
        </Button>
      </div>

      {discounts.length === 0 && !loading ? (
        <Card className="rounded-2xl border-gray-200">
          <CardContent className="flex min-h-[300px] items-center justify-center">
            <div className="text-center">
              <Percent className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
              <p className="text-lg font-semibold text-muted-foreground">No hay códigos de descuento</p>
              <p className="text-sm text-muted-foreground">Crea el primer código de descuento</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {discounts.map((discount) => (
            <Card key={discount.id} className="rounded-2xl border-gray-200 shadow-md">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <CardTitle className="font-mono text-lg">{discount.code}</CardTitle>
                      {discount.is_active ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <XCircle className="h-4 w-4 text-gray-400" />
                      )}
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                      <Badge variant={discount.is_active ? "default" : "secondary"}>
                        {discount.is_active ? "Activo" : "Inactivo"}
                      </Badge>
                      {isExpired(discount.expires_at) && (
                        <Badge variant="destructive">Expirado</Badge>
                      )}
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Percent className="h-4 w-4" />
                    <span className="text-2xl font-bold text-foreground">{discount.percentage}%</span>
                    <span className="text-sm">de descuento</span>
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CalendarIcon className="h-4 w-4" />
                    <span>
                      {discount.expires_at 
                        ? `Vence: ${formatDateOnly(discount.expires_at, { month: "short" }) || "Fecha inválida"}`
                        : "Sin vencimiento"}
                    </span>
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleOpenEdit(discount)}
                    className="flex-1 rounded-lg bg-transparent"
                  >
                    <Edit className="mr-1 h-4 w-4" />
                    Editar
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleOpenDelete(discount.id)}
                    className="rounded-lg text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <DiscountModal
        isOpen={isModalOpen}
        mode={editingDiscount ? "edit" : "add"}
        discount={editingDiscount}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
      />

      <DeleteConfirmationModal
        isOpen={deleteConfirmation.isOpen}
        title="Eliminar código de descuento"
        entityName={`el código "${discountToDelete?.code}"`}
        onConfirm={() => deleteConfirmation.discountId && handleDelete(deleteConfirmation.discountId)}
        onCancel={() => setDeleteConfirmation({ isOpen: false, discountId: null })}
      />
    </div>
  )
}
