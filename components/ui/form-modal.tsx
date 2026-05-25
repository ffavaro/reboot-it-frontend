"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
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
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        <fieldset disabled={readOnly} className="border-0 p-0 m-0 min-w-0">
          <div className={`flex flex-col gap-4${readOnly ? " opacity-60 pointer-events-none select-none" : ""}`}>
            {children}
          </div>
        </fieldset>
        <DialogFooter>
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
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
