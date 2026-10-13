"use client"

import * as React from "react"
import { Input } from "@/components/ui/input"

function toDDMMYYYY(iso: string): string {
  if (!iso) return ""
  const parts = iso.split("-")
  if (parts.length !== 3) return ""
  const [y, m, d] = parts
  return `${d}/${m}/${y}`
}

function toISO(formatted: string): string {
  const parts = formatted.split("/")
  if (parts.length !== 3 || parts[2].length !== 4) return ""
  const [d, m, y] = parts
  return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`
}

type DateInputProps = Omit<React.ComponentProps<typeof Input>, "value" | "onChange" | "type"> & {
  value: string        // yyyy-MM-dd or ""
  onChange: (value: string) => void  // yyyy-MM-dd or ""
}

export function DateInput({ value, onChange, placeholder = "dd/MM/yyyy", ...props }: DateInputProps) {
  const [display, setDisplay] = React.useState(() => toDDMMYYYY(value))

  React.useEffect(() => {
    setDisplay(toDDMMYYYY(value))
  }, [value])

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value.replace(/\D/g, "").slice(0, 8)

    let formatted = raw
    if (raw.length > 4) {
      formatted = `${raw.slice(0, 2)}/${raw.slice(2, 4)}/${raw.slice(4)}`
    } else if (raw.length > 2) {
      formatted = `${raw.slice(0, 2)}/${raw.slice(2)}`
    }

    setDisplay(formatted)

    if (raw.length === 8) {
      onChange(toISO(formatted))
    } else if (raw.length === 0) {
      onChange("")
    }
  }

  return (
    <Input
      type="text"
      value={display}
      onChange={handleChange}
      placeholder={placeholder}
      maxLength={10}
      {...props}
    />
  )
}
