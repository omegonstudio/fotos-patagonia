"use client"

import { useState } from "react"
import Link from "next/link"
import { Plus, ArrowLeft, Edit, Trash2, Loader2 } from "lucide-react"
import { Card, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useTags } from "@/hooks/tags/useTags"
import { useToast } from "@/hooks/use-toast"
import { TagModal } from "@/components/molecules/tag-modal"
import { DeleteConfirmationModal } from "@/components/molecules/delete-confirmation-modal"

// Colores predeterminados para tags (solo frontend)
const TAG_COLORS = [
  "#f9a01b", "#3b82f6", "#10b981", "#ef4444", "#8b5cf6", 
  "#f59e0b", "#06b6d4", "#ec4899", "#84cc16", "#6366f1"
]

export default function TagsManagementPage() {
  const { tags, loading, error, refetch, createTag, updateTag, deleteTag } = useTags()
  const { toast } = useToast()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingTag, setEditingTag] = useState<any>(undefined)
  const [deleteConfirmation, setDeleteConfirmation] = useState<{ isOpen: boolean; tagId: number | null }>({
    isOpen: false,
    tagId: null,
  })
  
  // Almacenar colores en localStorage (solo frontend)
  const getTagColor = (tagId: number): string => {
    const savedColors = localStorage.getItem('tag-colors')
    if (savedColors) {
      const colors = JSON.parse(savedColors)
      return colors[tagId] || TAG_COLORS[tagId % TAG_COLORS.length]
    }
    return TAG_COLORS[tagId % TAG_COLORS.length]
  }
  
  const saveTagColor = (tagId: number, color: string) => {
    const savedColors = localStorage.getItem('tag-colors')
    const colors = savedColors ? JSON.parse(savedColors) : {}
    colors[tagId] = color
    localStorage.setItem('tag-colors', JSON.stringify(colors))
  }

  const handleOpenAdd = () => {
    setEditingTag(undefined)
    setIsModalOpen(true)
  }

  const handleOpenEdit = (tag: any) => {
    // Agregar color desde localStorage
    setEditingTag({
      ...tag,
      color: getTagColor(tag.id)
    })
    setIsModalOpen(true)
  }

  const handleOpenDelete = (tagId: number) => {
    setDeleteConfirmation({ isOpen: true, tagId })
  }

  const handleDelete = async (id: number) => {
    try {
      await deleteTag(id)
      toast({
        title: "Tag eliminado",
        description: "El tag ha sido eliminado exitosamente",
      })
      refetch()
      setDeleteConfirmation({ isOpen: false, tagId: null })
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo eliminar el tag",
        variant: "destructive",
      })
    }
  }

  const handleSaveTag = async (tagData: { name: string; color?: string }) => {
    try {
      if (editingTag) {
        // Actualizar tag
        const updated = await updateTag(editingTag.id, tagData.name)
        // Guardar color en localStorage
        if (tagData.color) {
          saveTagColor(updated.id, tagData.color)
        }
        toast({
          title: "Tag actualizado",
          description: "El tag ha sido actualizado exitosamente",
        })
      } else {
        // Crear tag
        const created = await createTag(tagData.name)
        // Guardar color en localStorage
        if (tagData.color) {
          saveTagColor(created.id, tagData.color)
        }
        toast({
          title: "Tag creado",
          description: "El tag ha sido creado exitosamente",
        })
      }
      refetch()
    } catch (error) {
      toast({
        title: "Error",
        description: `No se pudo ${editingTag ? "actualizar" : "crear"} el tag`,
        variant: "destructive",
      })
    }
  }

  const tagToDelete = tags.find((t) => t.id === deleteConfirmation.tagId)

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
            <p className="text-destructive mb-4">Error al cargar los tags</p>
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
          <h2 className="text-4xl font-bold">Gestión de Tags</h2>
          <p className="text-muted-foreground">Total: {tags.length} tags</p>
        </div>
        <Button
          onClick={handleOpenAdd}
          className="rounded-xl bg-primary font-semibold text-foreground hover:bg-primary-hover"
        >
          <Plus className="mr-2 h-4 w-4" />
          Nuevo Tag
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {tags.map((tag) => (
          <Card key={tag.id} className="rounded-2xl border-gray-200">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div 
                    className="h-6 w-6 rounded-full" 
                    style={{ backgroundColor: getTagColor(tag.id) }} 
                  />
                  <CardTitle className="text-base">{tag.name}</CardTitle>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="rounded-lg bg-transparent"
                    onClick={() => handleOpenEdit(tag)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                   size="sm"
                   variant="outline"
                   className="rounded-lg bg-transparent"
                  onClick={() => handleOpenDelete(tag.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
          </Card>
        ))}
      </div>

      <TagModal
        isOpen={isModalOpen}
        mode={editingTag ? "edit" : "add"}
        tag={editingTag}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveTag}
      />

      {tags.length === 0 && !loading && (
        <Card className="rounded-2xl border-gray-200">
          <CardHeader>
            <div className="py-8 text-center text-muted-foreground">
              No hay tags creados. Crea el primero!
            </div>
          </CardHeader>
        </Card>
      )}

      <DeleteConfirmationModal
        isOpen={deleteConfirmation.isOpen}
        title="Eliminar tag"
        entityName={`el tag "${tagToDelete?.name}"`}
        onConfirm={() => deleteConfirmation.tagId && handleDelete(deleteConfirmation.tagId)}
        onCancel={() => setDeleteConfirmation({ isOpen: false, tagId: null })}
      />
    </div>
  )
}
