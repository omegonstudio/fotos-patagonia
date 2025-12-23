"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, Search, Plus, Loader2, Trash, Pencil } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PhotoModal } from "@/components/organisms/photo-modal";
import { usePhotos, type BackendPhoto } from "@/hooks/photos/usePhotos";
import { useSessions } from "@/hooks/sessions/useSessions";
import Image from "next/image";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { DeleteConfirmationModal } from "@/components/molecules/delete-confirmation-modal";
import { AdminPhotoCard } from "@/components/molecules/admin-photo-card"; // <- Importación correcta

export default function FotosPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit">("add");
  const [selectedPhoto, setSelectedPhoto] = useState<BackendPhoto | undefined>(
    undefined
  );

  // Nueva selección múltiple
  const [selectedPhotoIds, setSelectedPhotoIds] = useState<number[]>([]);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [deleteTargetIds, setDeleteTargetIds] = useState<number[]>([]);
  const [deleting, setDeleting] = useState(false);

  // Obtener fotos y sesiones del backend
  const { photos, loading, refetch, deletePhoto } = usePhotos();
  const { sessions } = useSessions();

  const filteredPhotos = photos.filter((photo) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      photo.filename?.toLowerCase().includes(searchLower) ||
      photo.description?.toLowerCase().includes(searchLower) ||
      photo.photographer?.name?.toLowerCase().includes(searchLower)
    );
  });

  const getSessionName = (sessionId?: number) => {
    if (!sessionId) return "Sin sesión";
    const session = sessions.find((s) => s.id === sessionId);
    return session?.event_name || "Sin sesión";
  };

  const handleAddPhoto = () => {
    setModalMode("add");
    setSelectedPhoto(undefined);
    setIsModalOpen(true);
  };

  const handleEditPhoto = (photo: BackendPhoto) => {
    setModalMode("edit");
    setSelectedPhoto(photo);
    setIsModalOpen(true);
  };

  // Preparar eliminación individual: reutiliza el modal de confirmación
  const handleDeletePhoto = (photo: BackendPhoto) => {
    setDeleteTargetIds([photo.id]);
    setIsConfirmOpen(true);
  };

  // Preparar eliminación múltiple
  const handleDeleteSelected = () => {
    if (selectedPhotoIds.length === 0) return;
    setDeleteTargetIds(selectedPhotoIds);
    setIsConfirmOpen(true);
  };

  const performDelete = async () => {
    if (deleteTargetIds.length === 0) return;
    setDeleting(true);
    try {
      // Eliminar en paralelo
      await Promise.all(deleteTargetIds.map((id) => deletePhoto(id)));
      // Refrescar y limpiar selección
      await refetch();
      setSelectedPhotoIds((prev) =>
        prev.filter((id) => !deleteTargetIds.includes(id))
      );
      setDeleteTargetIds([]);
      setIsConfirmOpen(false);
    } finally {
      setDeleting(false);
    }
  };

  const handlePhotoSaved = () => {
    // Refrescar la lista de fotos después de guardar
    refetch();
  };

  const toggleSelect = (id: number) => {
    setSelectedPhotoIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleCheckboxClick = (e: React.MouseEvent, id?: number) => {
    e.stopPropagation();
    if (id !== undefined) toggleSelect(id);
  };

  const isSelected = (id: number) => selectedPhotoIds.includes(id);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="mb-2 text-4xl font-bold">Gestión de Fotos</h1>
          <p className="text-muted-foreground">
            Administra el catálogo de fotos
          </p>
        </div>
        <div className="flex items-center gap-3">
          {selectedPhotoIds.length > 0 && (
            <Button
              onClick={handleDeleteSelected}
              variant="outline"
              className="rounded-xl border-destructive text-destructive font-semibold hover:bg-destructive/10"
              disabled={deleting}
            >
              Eliminar seleccionadas ({selectedPhotoIds.length})
            </Button>
          )}
          <Button
            onClick={handleAddPhoto}
            className="rounded-xl bg-primary font-semibold text-foreground hover:bg-primary-hover"
          >
            <Plus className="mr-2 h-4 w-4" />
            Agregar Foto
          </Button>
        </div>
      </div>

      {/* Search */}
      <Card className="mb-6 rounded-2xl border-gray-200">
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por lugar o fecha..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="rounded-xl pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Loading State */}
      {loading && (
        <Card className="rounded-2xl border-gray-200">
          <CardContent className="py-12 text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
            <p className="mt-4 text-muted-foreground">Cargando fotos...</p>
          </CardContent>
        </Card>
      )}

      {/* Photos Grid */}
      {!loading && (
        <>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {filteredPhotos.map((photo) => {
              const selected = isSelected(photo.id);
              return (
                <AdminPhotoCard
                  key={photo.id}
                  photo={photo}
                  isSelected={selected}
                  onCheckboxClick={(e) => handleCheckboxClick(e, photo.id)}
                  onEdit={() => handleEditPhoto(photo)}
                  onDelete={() => handleDeletePhoto(photo)}
                />
              );
            })}
          </div>

          {filteredPhotos.length === 0 && !loading && (
            <Card className="rounded-2xl border-gray-200">
              <CardContent className="py-12 text-center text-muted-foreground">
                No se encontraron fotos
              </CardContent>
            </Card>
          )}
        </>
      )}

      <PhotoModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        mode={modalMode}
        photo={selectedPhoto}
        onSave={handlePhotoSaved}
      />

      {/* Modal de confirmación reutilizable para eliminar 1 o varias fotos */}

          <DeleteConfirmationModal
            isOpen={isConfirmOpen}
            title={`Eliminar ${deleteTargetIds.length} fotos`}
            entityName={`estas ${deleteTargetIds.length} fotos`}
            isLoading={deleting}
            onConfirm={performDelete}
            onCancel={() => setIsConfirmOpen(false)}
          />
    </div>
  );
}