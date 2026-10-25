// CSS de impresión compartido por las pantallas de reportes: oculta los filtros (.no-print),
// muestra el encabezado dedicado (.print-show) y da formato a la tabla del reporte.
// `extra` deja que cada reporte agregue sus propias reglas (color del badge de estado, tags, etc).
export function ReportePrintStyles({ extra }: { extra?: string }) {
  return (
    <style>{`
      @media print {
        .no-print { display: none !important; }
        .print-show { display: block !important; }
        body { font-size: 11px; color: #000; }
        .report-table { width: 100%; border-collapse: collapse; }
        .report-table th,
        .report-table td { border: 1px solid #aaa; padding: 4px 6px; text-align: left; }
        .report-table th { background-color: #eee !important; font-weight: 600; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        .report-table tr:nth-child(even) td { background-color: #f9f9f9 !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        ${extra ?? ""}
      }
      .print-show { display: none; }
    `}</style>
  )
}
