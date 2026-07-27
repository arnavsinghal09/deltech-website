"use client"

import { useRef, useCallback } from "react"
import type { UseFormReturn } from "react-hook-form"
import { DTU_INSTITUTION, type RegisterFormValues } from "@/lib/schemas/register"

/**
 * Ticking "I am a DTU student" fills and locks the institution field; unticking
 * restores whatever the delegate had typed before.
 *
 * Call this in RegistrationForm, not in the step — wizard steps unmount on
 * navigation, which would discard the remembered value.
 */
export function useDtuInstitution(form: UseFormReturn<RegisterFormValues>) {
  const previous = useRef("")

  const onDtuChange = useCallback(
    (checked: boolean) => {
      if (checked) {
        previous.current = form.getValues("institution")
      }
      form.setValue("institution", checked ? DTU_INSTITUTION : previous.current, {
        shouldValidate: true,
        shouldDirty: true,
      })
      form.setValue("isDtu", checked, { shouldDirty: true })
    },
    [form]
  )

  return { onDtuChange }
}
