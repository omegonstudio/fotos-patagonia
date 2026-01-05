"use client"

import { useState, useEffect } from "react"
import { Check } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import type { Photo, PrintFormat } from "@/lib/types"
import { getActivePrintFormats, getPackSize } from "@/lib/print-formats"

interface PrintFormatModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (format: PrintFormat, photoIds: string[]) => void
  printerPhotos: Array<{ photo: Photo; assignedFormat?: PrintFormat }>
  defaultSelectedPhotoIds?: string[]
}

export function PrintFormatModal({
  isOpen,
  onClose,
  onConfirm,
  printerPhotos,
  defaultSelectedPhotoIds = [],
}: PrintFormatModalProps) {
  const [selectedFormat, setSelectedFormat] = useState<PrintFormat | undefined>()
  const [selectedPhotoIds, setSelectedPhotoIds] = useState<string[]>(defaultSelectedPhotoIds)

  useEffect(() => {
    setSelectedPhotoIds(defaultSelectedPhotoIds)
  }, [defaultSelectedPhotoIds])

  useEffect(() => {
    if (!isOpen) {
      setSelectedFormat(undefined)
      setSelectedPhotoIds(defaultSelectedPhotoIds)
    }
  }, [isOpen, defaultSelectedPhotoIds])

  const handleConfirm = () => {
    if (!selectedFormat || selectedPhotoIds.length === 0) return
    onConfirm(selectedFormat, selectedPhotoIds)
    onClose()
  }

  const togglePhoto = (photoId: string) => {
    setSelectedPhotoIds((prev) =>
      prev.includes(photoId) ? prev.filter((id) => id !== photoId) : [...prev, photoId],
    )
  }

  const activeFormats = getActivePrintFormats()
  const packSize = selectedFormat ? getPackSize(selectedFormat) : 1
  const packsNeeded = selectedFormat ? Math.ceil(selectedPhotoIds.length / packSize) : 0
  const canConfirm = !!selectedFormat && selectedPhotoIds.length > 0
  const availablePhotos = printerPhotos.filter((p) => !p.assignedFormat)
  const noSelectablePhotos = availablePhotos.length === 0

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-heading">
            Elegir Formato de Impresión
          </DialogTitle>
          <DialogDescription>
            Asigná un formato a las fotos que marcaste para imprimir. Podés crear varios packs.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 lg:grid-cols-2">
          <ScrollArea className="max-h-[420px] rounded-xl border">
            <div className="grid gap-3 p-3">
              {activeFormats.map((format) => (
                <button
                  key={format.id}
                  onClick={() => setSelectedFormat(format)}
                  className={`relative flex items-start gap-4 rounded-xl border-2 p-4 text-left transition-all hover:bg-muted/50 ${
                    selectedFormat?.id === format.id
                      ? "border-primary bg-primary/5"
                      : "border-gray-200"
                  }`}
                >
                  <div className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-gray-300">
                    {selectedFormat?.id === format.id && (
                      <div className="h-3 w-3 rounded-full bg-primary">
                        <Check className="h-3 w-3 text-white" />
                      </div>
                    )}
                  </div>

                  <div className="flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="font-semibold text-lg">{format.name}</h3>
                        <p className="text-sm text-muted-foreground">{format.size}</p>
                        {format.description && (
                          <p className="mt-1 text-sm text-muted-foreground">
                            {format.description}
                          </p>
                        )}
                        <p className="mt-1 text-xs text-muted-foreground">
                          Pack de {getPackSize(format)} foto{getPackSize(format) > 1 ? "s" : ""}
                        </p>
                      </div>

                      <div className="text-right">
                        <p className="text-lg font-bold text-primary">${format.price}</p>
                        <p className="text-xs text-muted-foreground">precio por pack</p>
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </ScrollArea>

          <ScrollArea className="max-h-[420px] rounded-xl border">
            <div className="space-y-2 p-3">
              {printerPhotos.length === 0 ? (
                <p className="text-sm text-muted-foreground">No hay fotos marcadas para imprimir.</p>
              ) : (
                printerPhotos.map(({ photo, assignedFormat }) => {
                  const checked = selectedPhotoIds.includes(photo.id)
                  const disabled = !!assignedFormat
                  return (
                    <label
                      key={photo.id}
                      className={`flex items-center gap-3 rounded-lg border p-3 transition ${
                        disabled
                          ? "cursor-not-allowed bg-muted/40 text-muted-foreground"
                          : "cursor-pointer hover:bg-muted/60"
                      } ${
                        checked ? "border-primary bg-primary/5" : "border-gray-200"
                      }`}
                    >
                      <input
                        type="checkbox"
                        className="h-4 w-4 accent-primary"
                        checked={checked}
                        disabled={disabled}
                        onChange={() => {
                          if (disabled) return
                          togglePhoto(photo.id)
                        }}
                      />
                      <div className="flex-1">
                        <p className="text-sm font-medium">{photo.place || `Foto ${photo.id}`}</p>
                        {photo.takenAt && (
                          <p className="text-xs text-muted-foreground">
                            {new Date(photo.takenAt).toLocaleDateString("es-AR")}
                          </p>
                        )}
                        {assignedFormat && (
                          <p className="text-[11px] text-muted-foreground">
                            Ya asignada a {assignedFormat.name}
                          </p>
                        )}
                      </div>
                    </label>
                  )
                })
              )}
            </div>
          </ScrollArea>
          </div>

        <div className="flex flex-col gap-2 rounded-xl bg-muted/50 p-3 text-sm">
          {noSelectablePhotos && (
            <p className="text-[13px] text-muted-foreground">
              Todas las fotos ya tienen formato. Quitá el formato anterior para reasignar.
            </p>
          )}
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Fotos seleccionadas</span>
            <span className="font-semibold">{selectedPhotoIds.length}</span>
          </div>
          {selectedFormat && (
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">
                {packsNeeded} pack(s) de {packSize} foto{packSize > 1 ? "s" : ""}
              </span>
              <span className="font-semibold">
                ${selectedFormat.price} × {packsNeeded} = ${packsNeeded * selectedFormat.price}
              </span>
            </div>
          )}
        </div>

        <div className="flex gap-3 border-t pt-4">
          <Button variant="outline" onClick={onClose} className="flex-1 rounded-xl">
            Cancelar
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!canConfirm || noSelectablePhotos}
            className="flex-1 rounded-xl bg-primary text-foreground hover:bg-primary-hover"
          >
            Confirmar Formato
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
