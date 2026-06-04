"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog"

type FormModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  onSave?: () => void
  isLoading?: boolean
  saveLabel?: string
  readOnly?: boolean
  children: React.ReactNode
}

export function FormModal({
  open,
  onOpenChange,
  title,
  description,
  onSave,
  isLoading,
  saveLabel = "Guardar",
  readOnly = false,
  children,
}: FormModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl gap-0 p-0">

        {/* Header con fondo */}
        <div className="rounded-t-2xl border-b bg-muted/50 px-6 py-4 pr-12">
          <DialogTitle className="text-lg font-semibold">{title}</DialogTitle>
          {description && (
            <DialogDescription className="mt-1 text-sm text-muted-foreground">
              {description}
            </DialogDescription>
          )}
        </div>

        {/* Cuerpo */}
        <div className="px-6 py-5">
          <fieldset disabled={readOnly} className="m-0 min-w-0 border-0 p-0">
            <div className={`flex flex-col gap-4${readOnly ? " pointer-events-none select-none opacity-60" : ""}`}>
              {children}
            </div>
          </fieldset>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 rounded-b-2xl border-t bg-muted/20 px-6 py-4">
          {readOnly ? (
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cerrar
            </Button>
          ) : (
            <>
              <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
                Cancelar
              </Button>
              <Button onClick={onSave} disabled={isLoading}>
                {isLoading ? "Guardando..." : saveLabel}
              </Button>
            </>
          )}
        </div>

      </DialogContent>
    </Dialog>
  )
}
