import { TriangleAlert } from "lucide-react"

export function AvisoTransportistas({ sinFicha, conProblemas }: { sinFicha: number; conProblemas: number }) {
  if (!sinFicha && !conProblemas) return null
  return (
    <div
      role="status"
      className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900"
    >
      <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" />
      <div className="flex flex-col gap-1">
        {sinFicha > 0 && (
          <p>
            {sinFicha === 1
              ? "Hay 1 empleado con rol Transportista que no tiene ficha de transportista."
              : `Hay ${sinFicha} empleados con rol Transportista que no tienen ficha de transportista.`}
          </p>
        )}
        {conProblemas > 0 && (
          <p>
            {conProblemas === 1
              ? "1 transportista tiene el carnet vencido o sin cargar."
              : `${conProblemas} transportistas tienen el carnet vencido o sin cargar.`}
          </p>
        )}
      </div>
    </div>
  )
}
