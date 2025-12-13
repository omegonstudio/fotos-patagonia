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
import type { PrintFormat } from "@/lib/types"
import { getActivePrintFormats } from "@/lib/print-formats"

interface PrintFormatModalProps {
  isOpen: boolean
  onClose: () => void
  onSelectFormat: (format: PrintFormat) => void
  currentFormat?: PrintFormat
  photoCount?: number
}

export function PrintFormatModal({
  isOpen,
  onClose,
  onSelectFormat,
  currentFormat,
  photoCount = 1,
}: PrintFormatModalProps) {
  const [selectedFormat, setSelectedFormat] = useState<PrintFormat | undefined>(currentFormat)

  useEffect(() => {
    setSelectedFormat(currentFormat)
  }, [currentFormat])

  const handleConfirm = () => {
    if (selectedFormat) {
      onSelectFormat(selectedFormat)
      onClose()
    }
  }

  const activeFormats = getActivePrintFormats()

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-heading">
            Elegir Formato de Impresión
          </DialogTitle>
        {/*   <DialogDescription>
            Selecciona el formato para {photoCount === 1 ? "la foto" : `las ${photoCount} fotos`}
          </DialogDescription> */}
        </DialogHeader>

        <ScrollArea className="max-h-[600px] pr-4">
          <div className="grid gap-3">
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
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-lg">{format.name}</h3>
                      <p className="text-sm text-muted-foreground">{format.size}</p>
                      {format.description && (
                        <p className="mt-1 text-sm text-muted-foreground">
                          {format.description}
                        </p>
                      )}
                    </div>

                    <div className="text-right">
                      <p className="text-lg font-bold text-primary">${format.price}</p>
                      <p className="text-xs text-muted-foreground">por foto</p>

                      {photoCount > 1 && (
                        <p className="mt-1 text-sm font-semibold">
                          Total: ${format.price * photoCount}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </ScrollArea>

        <div className="flex gap-3 border-t pt-4">
          <Button variant="outline" onClick={onClose} className="flex-1 rounded-xl">
            Cancelar
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!selectedFormat}
            className="flex-1 rounded-xl bg-primary text-foreground hover:bg-primary-hover"
          >
            Confirmar Formato
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
