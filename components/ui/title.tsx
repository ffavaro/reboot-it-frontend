"use client"
import { SiPuede } from "../permisos/si-puede"
import { Button } from "./button"
import { SearchInput } from "./search-input"
import { Plus } from "lucide-react"

const Title = ({
  titlePage,
  description,
  search,
  setSearch,
  filtered,
  openCreate,
}: {
  titlePage: string
  description: string
  search: string
  setSearch: (value: string) => void
  filtered: any[]
  openCreate: () => void
}) => {
  return (
    <>
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight">{titlePage}</h1>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <SearchInput
          placeholder="Buscar por nombre o descripción..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
        <span className="text-sm text-muted-foreground">
          {filtered.length} método{filtered.length !== 1 ? "s" : ""}
        </span>
        <SiPuede accion="crear">
          <Button className="ml-auto" onClick={openCreate}>
            <Plus className="h-4 w-4" />
            Nuevo método
          </Button>
        </SiPuede>
      </div>
    </>
  )
}

export default Title
