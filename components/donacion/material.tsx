"use client"

import { Plus, X } from "lucide-react"
import { toast } from "react-toastify"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useTipoMateriales } from "@/hooks/use-tipo-material"
import { useCondicionesMaterial } from "@/hooks/use-condicion-material"
import { soloEnteros } from "@/lib/utils/text-limit"
import type { MaterialDonacion } from "@/lib/type/material"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

const CAMPO = "h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-60"

interface MaterialesProps {
    materiales: MaterialDonacion[]
    onChange: (materiales: MaterialDonacion[]) => void
}

export function Materiales({ materiales, onChange }: MaterialesProps) {
    const { tipoMateriales } = useTipoMateriales()
    const { condiciones } = useCondicionesMaterial()

    function cambiarMaterial(indice: number, cambios: Partial<MaterialDonacion>) {
        onChange(materiales.map((m, i) => (i === indice ? { ...m, ...cambios } : m)))
    }

    function escribirCantidad(indice: number, texto: string) {
        const limpia = soloEnteros(texto)
        if (limpia !== texto) toast.error("La cantidad debe ser un número entero, sin coma ni punto", { toastId: "cantidad-entera" })
        cambiarMaterial(indice, { cantidadEstimada: limpia })
    }

    function agregarMaterial() {
        onChange([...materiales, { tipoMaterialId: "", condicionMaterialId: "4", cantidadEstimada: "" }])
    }

    function quitarMaterial(indice: number) {
        onChange(materiales.filter((_, j) => j !== indice))
    }

    return (
        <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Materiales a donar *</span>
                <Button variant="outline" size="sm" type="button" onClick={agregarMaterial}>
                    <Plus className="h-3.5 w-3.5" />
                    Agregar
                </Button>
            </div>

            {materiales.length === 0 ? (
                <p className="py-1 text-sm italic text-muted-foreground">Sin materiales cargados. Agregá al menos uno.</p>
            ) : (
                <div className="overflow-x-auto rounded-md border">
                    <table className="w-full text-xs">
                        <thead>
                            <tr className="border-b bg-muted/50 text-left text-muted-foreground">
                                <th className="px-3 py-2 font-medium">Tipo de material *</th>
                                <th className="w-24 px-3 py-2 font-medium">Cantidad</th>
                                <th className="px-3 py-2 font-medium">Condición</th>
                                <th className="w-8" />
                            </tr>
                        </thead>
                        <tbody>
                            {materiales.map((m, i) => (
                                <tr key={i} className="border-b last:border-b-0">
                                    <td className="px-2 py-1.5">
                                        <Select
                                            value={m.tipoMaterialId || null}
                                            items={tipoMateriales.map((t) => ({ value: String(t.id), label: t.nombre }))}
                                            onValueChange={(valor) => cambiarMaterial(i, { tipoMaterialId: valor ?? "" })}
                                        >
                                            <SelectTrigger className={cn(CAMPO, "h-8 px-2 text-xs")}>
                                                <SelectValue placeholder="Seleccionar..." />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {tipoMateriales.map((t) => (
                                                    <SelectItem key={t.id} value={String(t.id)}>{t.nombre}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </td>
                                    <td className="px-2 py-1.5">
                                        <Input
                                            inputMode="numeric"
                                            placeholder="1"
                                            value={m.cantidadEstimada}
                                            onChange={(e) => escribirCantidad(i, e.target.value)}
                                            className="h-8 text-xs tabular-nums"
                                        />
                                    </td>
                                    <td className="px-3 py-1.5 text-muted-foreground">
                                        {condiciones.find((c) => String(c.id) === (m.condicionMaterialId || "4"))?.condicion ?? "A definir"}
                                    </td>
                                    <td className="px-2 py-1.5 text-center">
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            aria-label="Quitar material"
                                            onClick={() => quitarMaterial(i)}
                                            className="text-muted-foreground hover:text-destructive"
                                        >
                                            <X className="h-3.5 w-3.5" />
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    )
}
