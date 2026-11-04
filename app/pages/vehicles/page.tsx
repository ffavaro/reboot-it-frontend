"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import { PanelVehiculos } from "@/components/vehiculos/panel-vehiculos"
import { PanelTipos } from "@/components/vehiculos/panel-tipos"

const PESTANAS = [
  { id: "vehiculos", titulo: "Vehículos" },
  { id: "tipos", titulo: "Tipos de vehículo" },
] as const

type Pestana = (typeof PESTANAS)[number]["id"]

export default function VehiclesPage() {
  const [pestana, setPestana] = useState<Pestana>("vehiculos")

  return (
    <div className="flex flex-col gap-6 p-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight">Gestión de Vehículos</h1>
        <p className="text-sm text-muted-foreground">
          Administrá los vehículos, su kilometraje y los tipos de vehículo.
        </p>
      </header>

      <div role="tablist" className="flex w-fit gap-1 rounded-xl bg-muted p-1">
        {PESTANAS.map(({ id, titulo }) => (
          <button
            key={id}
            role="tab"
            aria-selected={pestana === id}
            onClick={() => setPestana(id)}
            className={cn(
              "rounded-lg px-4 py-1.5 text-sm font-medium transition-colors",
              pestana === id ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {titulo}
          </button>
        ))}
      </div>

      {pestana === "vehiculos" ? <PanelVehiculos /> : <PanelTipos />}
    </div>
  )
}