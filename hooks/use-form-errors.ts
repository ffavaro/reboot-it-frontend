"use client"
import { useState } from "react"
import { run, type Validator } from "@/lib/form-validators"

export type FormErrors<T> = Partial<Record<keyof T, string>>
type Schema<T> = Partial<Record<keyof T, Validator[]>>

export function useFormErrors<T extends object>() {
  const [errors, setErrors] = useState<FormErrors<T>>({})

  function validate(form: T, schema: Schema<T>): boolean {
    const next: FormErrors<T> = {}
    for (const key in schema) {
      const validators = schema[key as keyof T]
      if (!validators) continue
      const err = run(form[key as keyof T], validators)
      if (err) next[key as keyof T] = err
    }
    setErrors(next)
    return Object.keys(next).length === 0
  }

  function clearError(key: keyof T) {
    setErrors((e) => {
      const copy = { ...e }
      delete copy[key]
      return copy
    })
  }

  function reset() {
    setErrors({})
  }

  return { errors, validate, clearError, reset }
}
