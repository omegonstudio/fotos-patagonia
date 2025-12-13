"use client"

import { useState } from "react"
import Link from "next/link"
import { Plus, ArrowLeft, Edit, Trash2, Package, Loader2, CheckCircle, XCircle } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ComboModal } from "@/components/molecules/combo-modal"
import { DeleteConfirmationModal } from "@/components/molecules/delete-confirmation-modal"
import { useCombos } from "@/hooks/combos/useCombos"
import { useToast } from "@/hooks/use-toast"

export default function CombosManagementPage() {
  const { combos, loading, error, refetch, createCombo, updateCombo, deleteCombo } = useCombos()
  const { toast } = useToast()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingCombo, setEditingCombo] = useState<any>(undefined)
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    isOpen: boolean
    comboId: number | null
  }>({ isOpen: false, comboId: null })

  const handleOpenAdd = () => {
    setEditingCombo(undefined)
    setIsModalOpen(true)
  }

  const handleOpenEdit = (combo: any) => {
    setEditingCombo(combo)
    setIsModalOpen(true)
  }

  const handleOpenDelete = (comboId: number) => {
    setDeleteConfirmation({ isOpen: true, comboId })
  }

  const handleDelete = async (id: number) => {
    try {
      await deleteCombo(id)
      toast({
        title: "Combo eliminado",
        description: "El combo ha sido eliminado exitosamente",
      })
      refetch()
      setDeleteConfirmation({ isOpen: false, comboId: null })
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "No se pudo eliminar el combo",
        variant: "destructive",
      })
    }
  }

  const handleSave = async (comboData: any) => {
    try {
      if (editingCombo) {
        await updateCombo(editingCombo.id, comboData)
        toast({
          title: "Combo actualizado",
          description: "El combo ha sido actualizado exitosamente",
        })
      } else {
        await createCombo(comboData)
        toast({
          title: "Combo creado",
          description: "El combo ha sido creado exitosamente",
        })
      }
      refetch()
      setIsModalOpen(false)
      setEditingCombo(undefined)
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "No se pudo guardar el combo",
        variant: "destructive",
      })
    }
  }

  const comboToDelete = combos.find((c) => c.id === deleteConfirmation.comboId)

  // Ordenar combos: primero por cantidad de fotos, luego por album completo
  const sortedCombos = [...combos].sort((a, b) => {
    if (a.isFullAlbum) return 1
    if (b.isFullAlbum) return -1
    return a.totalPhotos - b.totalPhotos
  })

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2 text-muted-foreground">Cargando combos...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-center">
          <p className="text-red-800">Error al cargar los combos: {error}</p>
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
          <h2 className="text-4xl font-bold">Gestión de Combos de Fotos</h2>
          <p className="text-muted-foreground">Total: {combos.length} combos configurados</p>
        </div>
        <Button
          onClick={handleOpenAdd}
          className="rounded-xl bg-primary font-semibold text-foreground hover:bg-primary-hover"
        >
          <Plus className="mr-2 h-4 w-4" />
          Nuevo Combo
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {sortedCombos.map((combo) => {
          return (
            <Card key={combo.id} className="rounded-2xl border-gray-200 shadow-md">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-primary/10 p-2">
                      <Package className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{combo.name}</CardTitle>
                      {combo.description && (
                        <CardDescription className="text-xs">{combo.description}</CardDescription>
                      )}
                    </div>
                  </div>
                  {combo.active ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : (
                    <XCircle className="h-5 w-5 text-gray-400" />
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  {combo.isFullAlbum ? (
                    <div className="rounded-lg bg-gradient-to-r from-primary/10 to-primary/5 p-4">
                      <p className="text-sm font-medium text-muted-foreground">Álbum Completo</p>
                      <p className="text-3xl font-bold text-primary">
                        ${combo.price.toLocaleString("es-AR")}
                      </p>
                      <Badge className="mt-2 bg-primary text-foreground">
                        MEJOR OFERTA
                      </Badge>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center justify-between rounded-lg bg-muted p-3">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Cantidad</p>
                          <p className="text-2xl font-bold text-primary">
                            {combo.totalPhotos} {combo.totalPhotos === 1 ? "foto" : "fotos"}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-muted-foreground">Precio Total</p>
                          <p className="text-2xl font-bold">
                            ${combo.price.toLocaleString("es-AR")}
                          </p>
                        </div>
                      </div>
                      <div className="rounded-lg bg-primary/5 p-3">
                        <p className="text-xs text-muted-foreground">Precio por foto</p>
                        <p className="text-xl font-bold text-primary">
                          ${(combo.price / combo.totalPhotos).toLocaleString("es-AR", { maximumFractionDigits: 0 })}
                        </p>
                      </div>
                    </>
                  )}
                </div>

                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleOpenEdit(combo)}
                    className="flex-1 rounded-lg bg-transparent"
                  >
                    <Edit className="mr-1 h-4 w-4" />
                    Editar
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleOpenDelete(combo.id)}
                    className="rounded-lg text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                <div className="pt-2">
                  <Badge variant={combo.active ? "default" : "secondary"} className="w-full justify-center">
                    {combo.active ? "Activo" : "Inactivo"}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {combos.length === 0 && (
        <Card className="rounded-2xl border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Package className="mb-4 h-12 w-12 text-muted-foreground" />
            <h3 className="mb-2 text-lg font-semibold">No hay combos configurados</h3>
            <p className="mb-4 text-center text-sm text-muted-foreground">
              Crea tu primer combo de fotos para ofrecer descuentos por cantidad
            </p>
            <Button onClick={handleOpenAdd} className="rounded-xl bg-primary text-foreground">
              <Plus className="mr-2 h-4 w-4" />
              Crear Primer Combo
            </Button>
          </CardContent>
        </Card>
      )}

      <ComboModal
        isOpen={isModalOpen}
        mode={editingCombo ? "edit" : "add"}
        combo={editingCombo}
        onClose={() => {
          setIsModalOpen(false)
          setEditingCombo(undefined)
        }}
        onSave={handleSave}
      />

      <DeleteConfirmationModal
        isOpen={deleteConfirmation.isOpen}
        title="Eliminar combo"
        entityName={`el combo "${comboToDelete?.name}"`}
        onConfirm={() => deleteConfirmation.comboId && handleDelete(deleteConfirmation.comboId)}
        onCancel={() => setDeleteConfirmation({ isOpen: false, comboId: null })}
      />
    </div>
  )
}

