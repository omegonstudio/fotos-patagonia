"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Search, Plus, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
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
import type { UploadingPhoto } from "@/lib/types";
import { AlertCircle } from "lucide-react";

type Cursor = { createdAt: string; id: number } | null;

// Debounce ligero para inputs
function useDebouncedValue<T>(value: T, delay = 220) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
}

type ThrottledFn<T extends (...args: any[]) => void> = ((...args: Parameters<T>) => void) & {
  cancel: () => void;
};

function createThrottle<T extends (...args: any[]) => void>(fn: T, wait: number): ThrottledFn<T> {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  let lastArgs: Parameters<T> | null = null;
  let lastCall = 0;

  const throttled = ((...args: Parameters<T>) => {
    const now = Date.now();
    lastArgs = args;

    const invoke = () => {
      lastCall = Date.now();
      timeout = null;
      fn(...(lastArgs as Parameters<T>));
    };

    if (now - lastCall >= wait) {
      invoke();
    } else if (!timeout) {
      timeout = setTimeout(invoke, wait - (now - lastCall));
    }
  }) as ThrottledFn<T>;

  throttled.cancel = () => {
    if (timeout) {
      clearTimeout(timeout);
      timeout = null;
    }
  };

  return throttled;
}

export default function FotosPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebouncedValue(searchTerm, 220);
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
  const [uploadingPhotos, setUploadingPhotos] = useState<UploadingPhoto[]>([]);
  const [newPhotos, setNewPhotos] = useState<BackendPhoto[]>([]);
  const [oldPhotos, setOldPhotos] = useState<BackendPhoto[]>([]);
  const [cursor, setCursor] = useState<Cursor>(null);
  const LIMIT = 10;
  const [hasMore, setHasMore] = useState(true);

  // Obtener fotos y sesiones del backend
  const { loading, deletePhoto, fetchPhotosCursor, getPhoto } = usePhotos();
  const { sessions } = useSessions();

  // Mantener ids existentes sin re-crear deps en handleLoadMore
  const existingIdsRef = useRef<Set<number>>(new Set());
  useEffect(() => {
    existingIdsRef.current = new Set(
      [...newPhotos, ...oldPhotos].map((p) => p.id)
    );
  }, [newPhotos, oldPhotos]);

  const combinedPhotos = useMemo(
    () => [...newPhotos, ...oldPhotos],
    [newPhotos, oldPhotos]
  );

  const filteredPhotos = useMemo(() => {
    console.time?.("photos/filter");
    const searchLower = debouncedSearch.toLowerCase();
    const result = combinedPhotos.filter((photo) => {
      if (!searchLower) return true;
      return (
        photo.filename?.toLowerCase().includes(searchLower) ||
        photo.description?.toLowerCase().includes(searchLower) ||
        photo.photographer?.name?.toLowerCase().includes(searchLower)
      );
    });
    console.timeEnd?.("photos/filter");
    return result;
  }, [combinedPhotos, debouncedSearch]);

  const selectedIdsSet = useMemo(
    () => new Set(selectedPhotoIds),
    [selectedPhotoIds]
  );

  const getSessionName = useCallback(
    (sessionId?: number) => {
      if (!sessionId) return "Sin sesión";
      const session = sessions.find((s) => s.id === sessionId);
      return session?.event_name || "Sin sesión";
    },
    [sessions]
  );

  const handleAddPhoto = useCallback(() => {
    setModalMode("add");
    setSelectedPhoto(undefined);
    setIsModalOpen(true);
  }, []);

  const handleEditPhoto = useCallback((photo: BackendPhoto) => {
    setModalMode("edit");
    setSelectedPhoto(photo);
    setIsModalOpen(true);
  }, []);

  // Preparar eliminación individual: reutiliza el modal de confirmación
  const handleDeletePhoto = useCallback((photo: BackendPhoto) => {
    setDeleteTargetIds([photo.id]);
    setIsConfirmOpen(true);
  }, []);

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
      // Limpiar selección y actualizar listas locales
      setSelectedPhotoIds((prev) =>
        prev.filter((id) => !deleteTargetIds.includes(id))
      );
      setNewPhotos((prev) =>
        prev.filter((photo) => !deleteTargetIds.includes(photo.id))
      );
      setOldPhotos((prev) =>
        prev.filter((photo) => !deleteTargetIds.includes(photo.id))
      );
      setDeleteTargetIds([]);
      setIsConfirmOpen(false);
    } finally {
      setDeleting(false);
    }
  };

  const handlePhotoSaved = async () => {
    if (!selectedPhoto) return;
    try {
      const updated = await getPhoto(selectedPhoto.id);
      setNewPhotos((prev) =>
        prev.map((photo) => (photo.id === updated.id ? updated : photo))
      );
      setOldPhotos((prev) =>
        prev.map((photo) => (photo.id === updated.id ? updated : photo))
      );
    } catch (error) {
      console.error("Error actualizando foto editada", error);
    }
  };

  const toggleSelect = useCallback((id: number) => {
    setSelectedPhotoIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }, []);

  const handleCheckboxClick = useCallback(
    (e: React.MouseEvent, id?: number) => {
      e.stopPropagation();
      if (id !== undefined) toggleSelect(id);
    },
    [toggleSelect]
  );

  const isSelected = useCallback(
    (id: number) => selectedIdsSet.has(id),
    [selectedIdsSet]
  );


  //sellecccionar todas las fotos
  const allFilteredIds = filteredPhotos.map((p) => p.id);

  const areAllFilteredSelected =
    allFilteredIds.length > 0 &&
    allFilteredIds.every((id) => selectedPhotoIds.includes(id));
  
  const handleSelectAll = useCallback(() => {
    if (areAllFilteredSelected) {
      setSelectedPhotoIds((prev) =>
        prev.filter((id) => !allFilteredIds.includes(id))
      );
    } else {
      setSelectedPhotoIds((prev) =>
        Array.from(new Set([...prev, ...allFilteredIds]))
      );
    }
  }, [areAllFilteredSelected, allFilteredIds]);

  const handleUploadStart = useCallback((items: UploadingPhoto[]) => {
    if (!items.length) return;
    setUploadingPhotos((prev) => [...items, ...prev]);
  }, []);

  const throttledUploadProgress = useMemo(
    () =>
      createThrottle((tempIds: string[], progress: number) => {
        if (!tempIds.length) return;
        setUploadingPhotos((prev) =>
          prev.map((photo) =>
            tempIds.includes(photo.tempId)
              ? {
                  ...photo,
                  progress,
                  status: photo.status === "error" ? "error" : "uploading",
                }
              : photo
          )
        );
      }, 150),
    []
  );

  useEffect(() => {
    return () => {
      throttledUploadProgress.cancel();
    };
  }, [throttledUploadProgress]);

  const handleUploadProgress = useCallback(
    (tempIds: string[], progress: number) => {
      throttledUploadProgress(tempIds, progress);
    },
    [throttledUploadProgress]
  );

  const handleUploadComplete = useCallback((result: {
    success: string[];
    failed: string[];
    createdPhotos?: BackendPhoto[];
  }) => {
    const successSet = new Set(result.success);
    const failedSet = new Set(result.failed);
    setUploadingPhotos((prev) =>
      prev
        .filter((photo) => !successSet.has(photo.tempId))
        .map((photo) =>
          failedSet.has(photo.tempId)
            ? { ...photo, status: "error", progress: undefined }
            : photo
        )
    );
    const created = result.createdPhotos ?? [];
    if (created.length > 0) {
      const createdIds = new Set(created.map((p) => p.id));
      setNewPhotos((prev) => {
        const existingIds = new Set(prev.map((p) => p.id));
        const unique = created.filter((p) => !existingIds.has(p.id));
        return [...unique, ...prev];
      });
      setOldPhotos((prev) =>
        prev.filter((photo) => !createdIds.has(photo.id))
      );
    }
  }, []);

  const handleUploadError = useCallback((tempIds: string[]) => {
    if (!tempIds.length) return;
    setUploadingPhotos((prev) =>
      prev.map((photo) =>
        tempIds.includes(photo.tempId)
          ? { ...photo, status: "error", progress: undefined }
          : photo
      )
    );
  }, []);

  const handleLoadMore = useCallback(async () => {
    if (!hasMore || loading) return;

    console.time?.("photos/loadMore");
    try {
      const data = await fetchPhotosCursor({ cursor, limit: LIMIT });
      const items = data?.items ?? [];
      const next = data?.nextCursor ?? null;

      setOldPhotos((prev) => {
        const merged = new Map<number, BackendPhoto>();
        // mantener orden previo
        prev.forEach((p) => merged.set(p.id, p));
        items.forEach((photo) => {
          if (!existingIdsRef.current.has(photo.id)) {
            merged.set(photo.id, photo);
          }
        });
        return Array.from(merged.values());
      });

      setCursor(next);
      setHasMore(next !== null);
    } catch (error) {
      console.error("Error cargando más fotos", error);
    } finally {
      console.timeEnd?.("photos/loadMore");
    }
  }, [hasMore, loading, fetchPhotosCursor, cursor]);
  
  
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
            {filteredPhotos.length > 0 && (
              <Button
                variant="outline"
                onClick={handleSelectAll}
                className="rounded-xl"
              >
                {areAllFilteredSelected ? "Deseleccionar todas" : "Seleccionar todas"}
              </Button>
            )}
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
            {uploadingPhotos.map((photo) => {
              const isError = photo.status === "error";
              return (
                <div
                  key={photo.tempId}
                  className={cn(
                    "relative overflow-hidden rounded-2xl border-2 bg-muted",
                    isError ? "border-destructive" : "border-primary/40"
                  )}
                >
                  <div className="relative aspect-square overflow-hidden">
                    <img
                      src={photo.previewUrl || "/placeholder.svg"}
                      alt="Subiendo foto"
                      className={cn(
                        "h-full w-full object-cover transition-opacity",
                        isError ? "opacity-60" : "opacity-80"
                      )}
                    />
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/40 text-white">
                      {isError ? (
                        <AlertCircle className="h-6 w-6 text-destructive" />
                      ) : (
                        <Loader2 className="h-6 w-6 animate-spin text-primary" />
                      )}
                      <span className="text-sm font-semibold">
                        {isError ? "Error al subir" : "Subiendo..."}
                      </span>
                      {photo.progress !== undefined && !isError && (
                        <span className="text-xs text-white/80">
                          {Math.round(photo.progress)}%
                        </span>
                      )}
                      {isError && (
                        <span className="text-xs text-white/80">
                          Podés reintentar desde el modal
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
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

          {hasMore && (
            <div className="mt-8 flex justify-center">
              <Button
                variant="outline"
                onClick={handleLoadMore}
                disabled={loading}
                className="rounded-xl"
              >
                Ver más
              </Button>
            </div>
          )}

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
        onUploadStart={handleUploadStart}
        onUploadProgress={handleUploadProgress}
        onUploadComplete={handleUploadComplete}
        onUploadError={handleUploadError}
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