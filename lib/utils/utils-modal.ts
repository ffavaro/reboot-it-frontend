"use client"
import React from "react"

interface SetFormParams<K extends string> {
  setFrom: React.Dispatch<React.SetStateAction<any>>
  fileds: K
  value: string | number
  clearError: (field: K) => void
}

interface OpenModalParams {
  setIsViewing: React.Dispatch<React.SetStateAction<boolean>>
  setEditing: React.Dispatch<React.SetStateAction<any>>
  setForm: React.Dispatch<React.SetStateAction<any>>
  reset: () => void
  setModalOpen: React.Dispatch<React.SetStateAction<boolean>>
  jsonEntidad: any
  t: any
}

export const set = <K extends string>({
  setFrom,
  fileds,
  value,
  clearError,
}: SetFormParams<K>) => {
  setFrom((f: any) => ({ ...f, [fileds]: value }))
  clearError(fileds)
}

export const openCreate = ({
  setIsViewing,
  setEditing,
  setForm,
  reset,
  setModalOpen,
  EMPTY_FORM,
}: any) => {
  setIsViewing(false)
  setEditing(null)
  setForm(EMPTY_FORM)
  reset()
  setModalOpen(true)
}

export const openEdit = ({
  t,
  setIsViewing,
  setEditing,
  setForm,
  reset,
  setModalOpen,
  jsonEntidad,
}: OpenModalParams) => {
  setIsViewing(false)
  setEditing(t)
  setForm(jsonEntidad)
  reset()
  setModalOpen(true)
}

export const openView = ({
  t,
  setIsViewing,
  setEditing,
  setForm,
  reset,
  setModalOpen,
  jsonEntidad,
}: OpenModalParams) => {
  setIsViewing(true)
  setEditing(t)
  setForm(jsonEntidad)
  reset()
  setModalOpen(true)
}

export const filterBySearch  = (data: any[], search: string, fields: string[]) => {
  return data.filter((item) =>
    fields.some((field) =>
      (item[field] ?? "").toLowerCase().includes(search.toLowerCase())
    )
  )
}
