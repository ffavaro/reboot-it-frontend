"use client"

import * as React from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { Search01Icon, Cancel01Icon } from "@hugeicons/core-free-icons"

import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"

type SearchInputProps = Omit<React.ComponentProps<typeof Input>, "type" | "onChange"> & {
  value: string
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
}

function SearchInput({ className, value, onChange, placeholder = "Buscar...", ...props }: SearchInputProps) {
  return (
    <div data-slot="search-input" className={cn("relative w-full", className)}>
      <HugeiconsIcon
        icon={Search01Icon}
        strokeWidth={2}
        className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
      />
      <Input
        type="text"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="pl-9.5 pr-8"
        {...props}
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange({ target: { value: "" } } as React.ChangeEvent<HTMLInputElement>)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
        >
          <HugeiconsIcon icon={Cancel01Icon} strokeWidth={2} className="size-3.5" />
          <span className="sr-only">Limpiar búsqueda</span>
        </button>
      )}
    </div>
  )
}

export { SearchInput }
