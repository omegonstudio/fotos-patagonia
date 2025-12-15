"use client";

import type React from "react";

import { useState, useCallback, useEffect, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Camera, Upload, X, ImageIcon, Loader2 } from "lucide-react";
import { usePhotoUpload } from "@/hooks/photos/usePhotoUpload";
import { usePhotographers } from "@/hooks/photographers/usePhotographers";
import { useToast } from "@/hooks/use-toast";
import { useAlbums } from "@/hooks/albums/useAlbums";
import { useTags } from "@/hooks/tags/useTags";
import { apiFetch } from "@/lib/api";
import type { BackendPhoto } from "@/hooks/photos/usePhotos";

interface PhotoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "add" | "edit";
  photo?: BackendPhoto;
  onSave?: () => void;
}

const DEFAULT_PRICE = "100";


export function PhotoModal({
  open,
  onOpenChange,
  mode,
  photo,
  onSave,
}: PhotoModalProps) {
  const isAddMode = mode === "add";
  const [selectedAlbum, setSelectedAlbum] = useState<string>("");
  const [selectedPhotographer, setSelectedPhotographer] = useState<string>("");
  const [price, setPrice] = useState<string>(DEFAULT_PRICE);
  const [description, setDescription] = useState<string>("");
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  const { uploadPhotos, uploading, progress } = usePhotoUpload();
  const { photographers, loading: photographersLoading } = usePhotographers();
  const { data: albumsData, loading: albumsLoading } = useAlbums();
  const { tags: availableTags, loading: tagsLoading } = useTags();
  const { toast } = useToast();

  const albums = useMemo(
    () =>
      Array.isArray(albumsData) ? albumsData : albumsData ? [albumsData] : [],
    [albumsData]
  );

  const fallbackTagMap = useMemo(
    () =>
      new Map((photo?.tags ?? []).map((tag) => [tag.id.toString(), tag.name])),
    [photo]
  );

  const tagNameMap = useMemo(() => {
    const map = new Map<string, string>();
    availableTags.forEach((tag) => {
      map.set(tag.id.toString(), tag.name);
    });
    fallbackTagMap.forEach((name, id) => {
      if (!map.has(id)) {
        map.set(id, name);
      }
    });
    return map;
  }, [availableTags, fallbackTagMap]);

  const selectedTagNames = useMemo(
    () =>
      selectedTagIds
        .map((tagId) => tagNameMap.get(tagId))
        .filter((name): name is string => Boolean(name)),
    [selectedTagIds, tagNameMap]
  );

  useEffect(() => {
    if (!open) {
      return;
    }

    if (isAddMode) {
      setSelectedAlbum("");
      setSelectedPhotographer("");
      setDescription("");
      setPrice(DEFAULT_PRICE);
      setSelectedTagIds([]);
      setUploadedFiles([]);
      setPreviewUrls([]);
      return;
    }

    if (photo) {
      setSelectedPhotographer(photo.photographer_id?.toString() ?? "");
      setDescription(photo.description || "");
      setPrice(
        photo.price !== undefined ? photo.price.toString() : DEFAULT_PRICE
      );
      setSelectedTagIds(photo.tags?.map((tag) => tag.id.toString()) ?? []);
    }
  }, [open, photo, isAddMode]);

  const handleAlbumChange = useCallback((value: string) => {
    setSelectedAlbum(value);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files).filter((file) =>
      file.type.startsWith("image/")
    );
    handleFiles(files);
  }, []);

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files) {
        const files = Array.from(e.target.files).filter((file) =>
          file.type.startsWith("image/")
        );
        handleFiles(files);
      }
    },
    []
  );

  const handleFiles = (files: File[]) => {
    setUploadedFiles((prev) => [...prev, ...files]);

    files.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrls((prev) => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeFile = (index: number) => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index));
    setPreviewUrls((prev) => prev.filter((_, i) => i !== index));
  };

  const toggleTagSelection = (tagId: string) => {
    setSelectedTagIds((prev) =>
      prev.includes(tagId)
        ? prev.filter((id) => id !== tagId)
        : [...prev, tagId]
    );
  };

  const assignTagsToPhotos = async (photoIds: number[], tagNames: string[]) => {
    if (!photoIds.length) return;
    await Promise.all(
      photoIds.map((photoId) =>
        apiFetch(`/photos/${photoId}/tags`, {
          method: "POST",
          body: JSON.stringify({ tag_names: tagNames }),
        })
      )
    );
  };

  const handleSave = async () => {
    const numericPrice = parseFloat(price);
    if (Number.isNaN(numericPrice)) {
      toast({
        title: "Precio inválido",
        description: "Ingresá un precio válido para continuar.",
        variant: "destructive",
      });
      return;
    }

    if (isAddMode) {

      if (!selectedAlbum) {
        toast({
          title: "Álbum requerido",
          description: "Seleccioná un álbum antes de subir las fotos.",
          variant: "destructive",
        });
        return;
}

      if (!selectedPhotographer || uploadedFiles.length === 0) {
        toast({
          title: "Campos incompletos",
          description: "Seleccioná un fotógrafo y al menos una imagen.",
          variant: "destructive",
        });
        return;
      }

      try {
        
        const createdPhotos = await uploadPhotos({
          files: uploadedFiles,
          photographer_id: parseInt(selectedPhotographer),
          price: numericPrice,
          description: description || undefined,
          album_id: Number(selectedAlbum),
        });


        if (selectedTagNames.length && Array.isArray(createdPhotos)) {
          const newPhotoIds = createdPhotos
            .map((createdPhoto: { id?: number }) => createdPhoto.id)
            .filter((id): id is number => typeof id === "number");
          await assignTagsToPhotos(newPhotoIds, selectedTagNames);
        }

        toast({
          title: "Fotos subidas",
          description: `${uploadedFiles.length} foto(s) creada(s) correctamente.`,
        });

        onSave?.();
        onOpenChange(false);
      } catch (error: any) {
        toast({
          title: "Error al subir",
          description: error?.message || "No se pudieron subir las fotos.",
          variant: "destructive",
        });
      }
      return;
    }

    if (!photo) {
      toast({
        title: "Sin foto seleccionada",
        description: "No se encontró la foto para editar.",
        variant: "destructive",
      });
      return;
    }

    try {
      await apiFetch(`/photos/${photo.id}`, {
        method: "PUT",
        body: JSON.stringify({
          filename: photo.filename,
          description: description || "",
          price: numericPrice,
          url: photo.url,
          watermark_url: photo.watermark_url,
        }),
      });

      await assignTagsToPhotos([photo.id], selectedTagNames);

      toast({
        title: "Foto actualizada",
        description: "Los cambios se guardaron correctamente.",
      });

      onSave?.();
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "Error al actualizar",
        description: error?.message || "No se pudo actualizar la foto.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto bg-[#f2f2e4] sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">
            {isAddMode ? "Agregar Foto" : "Editar Foto"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="space-y-2">
            <Label className="text-base font-semibold">
              Álbum {isAddMode && <span className="text-destructive">*</span>}
            </Label>
            <Select
              value={selectedAlbum}
              onValueChange={handleAlbumChange}
              disabled={!isAddMode || uploading}
            >
              <SelectTrigger className="rounded-xl border-gray-200 bg-white">
                <SelectValue
                  placeholder={
                    albumsLoading
                      ? "Cargando álbumes..."
                      : isAddMode
                      ? "Seleccioná un álbum"
                      : "Álbum asociado"
                  }
                />
              </SelectTrigger>
              <SelectContent className="bg-white">
                {albums.map((album) => (
                  <SelectItem key={album.id} value={album.id.toString()}>
                    {album.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {!isAddMode ? (
              <p className="text-xs text-muted-foreground">
                La reasignación de álbum se hará desde backend en una próxima
                versión.
              </p>
            ) : (
              <p className="text-xs text-muted-foreground">
                Elegí un álbum para organizar tus fotos antes de subirlas.
              </p>
            )}
          </div>

          <div className="space-y-3">
            <Label className="text-base font-semibold">
              Fotógrafo <span className="text-destructive">*</span>
            </Label>
            <div className="grid gap-3 sm:grid-cols-2">
              {photographersLoading ? (
                <div className="col-span-2 py-4 text-center text-sm text-muted-foreground">
                  Cargando fotógrafos...
                </div>
              ) : photographers.length === 0 ? (
                <div className="col-span-2 py-4 text-center text-sm text-muted-foreground">
                  No hay fotógrafos disponibles.
                </div>
              ) : (
                photographers.map((photographer) => {
                  const isSelected =
                    selectedPhotographer === photographer.id.toString();
                  return (
                    <button
                      key={photographer.id}
                      type="button"
                      onClick={() =>
                        setSelectedPhotographer(photographer.id.toString())
                      }
                      disabled={uploading || !isAddMode}
                      className={`flex items-center gap-3 rounded-xl border-2 p-4 transition-all hover:border-primary disabled:cursor-not-allowed disabled:opacity-50 ${
                        isSelected
                          ? "border-primary bg-[#ffecce]"
                          : "border-gray-200 bg-white"
                      }`}
                    >
                      <div
                        className={`flex h-10 w-10 items-center justify-center rounded-full ${
                          isSelected ? "bg-primary" : "bg-gray-200"
                        }`}
                      >
                        <Camera
                          className={`h-5 w-5 ${
                            isSelected ? "text-white" : "text-gray-600"
                          }`}
                        />
                      </div>
                      <div className="text-left">
                        <p className="font-semibold">{photographer.name}</p>
                        {photographer.contact_info && (
                          <p className="text-sm text-muted-foreground">
                            {photographer.contact_info}
                          </p>
                        )}
                      </div>
                    </button>
                  );
                })
              )}
            </div>
            {!isAddMode && (
              <p className="text-xs text-muted-foreground">
                El cambio de fotógrafo se realizará en una iteración futura.
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="price" className="text-base font-semibold">
              Precio <span className="text-destructive">*</span>
            </Label>
            <Input
              id="price"
              type="number"
              step="0.01"
              min="0"
              placeholder="100.00"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              disabled={uploading}
              className="rounded-xl border-gray-200 bg-white"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="text-base font-semibold">
              Descripción
            </Label>
            <Input
              id="description"
              placeholder="Descripción de la foto (opcional)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={uploading}
              className="rounded-xl border-gray-200 bg-white"
            />
          </div>

          <div className="space-y-3">
            <Label className="text-base font-semibold">Tags</Label>
            {tagsLoading ? (
              <p className="text-sm text-muted-foreground">Cargando tags...</p>
            ) : availableTags.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No hay tags disponibles. Crealos desde el panel de tags.
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {availableTags.map((tag) => {
                  const tagId = tag.id.toString();
                  const isSelected = selectedTagIds.includes(tagId);
                  return (
                    <button
                      key={tag.id}
                      type="button"
                      onClick={() => toggleTagSelection(tagId)}
                      className={`rounded-full border px-3 py-1 text-sm transition-colors ${
                        isSelected
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-gray-200 bg-white text-foreground"
                      }`}
                    >
                      {tag.name}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {isAddMode && (
            <div className="space-y-2">
              <Label className="text-base font-semibold">Imágenes</Label>
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`relative rounded-2xl border-2 border-dashed p-8 text-center transition-colors ${
                  isDragging
                    ? "border-primary bg-[#ffecce]"
                    : "border-gray-300 bg-white"
                }`}
              >
                <input
                  type="file"
                  id="file-upload"
                  multiple
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <label htmlFor="file-upload" className="cursor-pointer">
                  <div className="flex flex-col items-center gap-3">
                    <div className="rounded-full bg-primary/10 p-4">
                      <ImageIcon className="h-8 w-8 text-primary" />
                    </div>
                    <div>
                      <p className="text-lg font-semibold">
                        Arrastra imágenes aquí
                      </p>
                      <p className="text-sm text-muted-foreground">
                        o haz clic para seleccionar archivos
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      className="rounded-xl bg-transparent hover:bg-[#ffecce]"
                    >
                      <Upload className="mr-2 h-4 w-4" />
                      Seleccionar archivos
                    </Button>
                  </div>
                </label>
              </div>

              {previewUrls.length > 0 && (
                <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
                  {previewUrls.map((url, index) => (
                    <div
                      key={index}
                      className="group relative aspect-square overflow-hidden rounded-xl"
                    >
                      <img
                        src={url || "/placeholder.svg"}
                        alt={`Preview ${index + 1}`}
                        className="h-full w-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => removeFile(index)}
                        className="absolute right-1 top-1 rounded-full bg-destructive p-1 opacity-0 transition-opacity group-hover:opacity-100"
                      >
                        <X className="h-4 w-4 text-white" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {uploading && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">Subiendo fotos...</span>
                <span className="text-muted-foreground">{progress}%</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
                <div
                  className="h-full bg-primary transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={uploading}
              className="rounded-xl bg-transparent hover:bg-[#ffecce]"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleSave}
              className="rounded-xl bg-primary font-semibold text-foreground hover:bg-primary/90"
              /* disabled={
                uploading ||
                !price ||
                (isAddMode && (!selectedPhotographer || uploadedFiles.length === 0))
              } */
            >
              {uploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Subiendo...
                </>
              ) : (
                "Guardar"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
