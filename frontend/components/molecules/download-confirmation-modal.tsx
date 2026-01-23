"use client"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface DownloadConfirmationModalProps {
  isOpen: boolean
  title: string
  description?: string
  itemCount: number
  onConfirm: () => void
  onCancel: () => void
  isLoading?: boolean
}

export function DownloadConfirmationModal({
  isOpen,
  title,
  description,
  itemCount,
  onConfirm,
  onCancel,
  isLoading = false,
}: DownloadConfirmationModalProps) {
  return (
    <AlertDialog open={isOpen} onOpenChange={onCancel}>
      <AlertDialogContent className="rounded-2xl bg-white">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-xl font-bold">
            {title}
          </AlertDialogTitle>

          <AlertDialogDescription className="text-base">
            {description ??
              `¿Estás seguro que deseas descargar ${itemCount} foto${
                itemCount === 1 ? "" : "s"
              }?`}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="flex gap-2">
          <AlertDialogCancel className="rounded-lg border-gray-200 font-semibold">
            Cancelar
          </AlertDialogCancel>

          <AlertDialogAction
            onClick={onConfirm}
            disabled={isLoading}
            className="rounded-lg bg-primary text-foreground font-semibold disabled:opacity-50"
          >
            {isLoading ? "Preparando descarga..." : "Descargar"}
          </AlertDialogAction>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  )
}
