"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { registerSchema, type RegisterFormValues } from "@/lib/schemas/register"
import { registerDelegate } from "../actions"
import { Form } from "@/components/ui/form"
import { Button } from "@/components/ui/button"
import { t } from "@/content/strings"
import { Stepper } from "./stepper"
import { StepPersonal } from "./step-personal"
import { StepPref1 } from "./step-pref1"
import { StepPref2OrCoDelegate } from "./step-pref2-or-co-delegate"
import { StepAccommodation } from "./step-accommodation"
import { StepUndertaking } from "./step-undertaking"

interface Committee {
  id: string
  name: string
  doubleDelegation: boolean
}

interface Props {
  committees: Committee[]
}

const STEPS = [
  t("register.steps.personal"),
  t("register.steps.preferences"),
  t("register.steps.coDelegateOrPref2"),
  t("register.steps.accommodation"),
  t("register.steps.undertaking"),
]

// Fields to trigger-validate when the user clicks "Next" on each step
const STEP_FIELDS: (keyof RegisterFormValues)[][] = [
  ["fullName", "email", "whatsapp", "institution"],
  ["pref1CommitteeId", "pref1Portfolio"],
  [], // step 3: handled dynamically below
  [], // step 4: all optional
  ["undertaking"],
]

export function RegistrationForm({ committees }: Props) {
  const [step, setStep] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const router = useRouter()

  const form = useForm<RegisterFormValues, unknown, RegisterFormValues>({
    resolver: zodResolver(registerSchema) as never,
    defaultValues: {
      fullName: "",
      email: "",
      whatsapp: "",
      altPhone: "",
      institution: "",
      isDtu: false,
      munExperience: "",
      pref1CommitteeId: "",
      pref1Portfolio: "",
      pref2CommitteeId: "",
      pref2Portfolio: "",
      needsAccommodation: false,
      outsideNcr: false,
      undertaking: false,
      reference: "",
    },
  })

  const pref1CommitteeId = form.watch("pref1CommitteeId")
  const pref1Committee = committees.find((c) => c.id === pref1CommitteeId)
  const isDoubleDelegation = pref1Committee?.doubleDelegation ?? false

  const handleNext = async () => {
    if (step === 2) {
      // Co-delegate fields are required when the chosen committee uses double-delegation
      if (isDoubleDelegation) {
        const valid = await form.trigger([
          "coDelegate.fullName",
          "coDelegate.email",
          "coDelegate.phone",
        ] as Parameters<typeof form.trigger>[0])
        if (!valid) return
      }
      setStep((s) => s + 1)
      return
    }

    const fields = STEP_FIELDS[step] as Parameters<typeof form.trigger>[0]
    const valid = await form.trigger(fields)
    if (valid) setStep((s) => s + 1)
  }

  const onSubmit = async (data: RegisterFormValues) => {
    setIsSubmitting(true)
    try {
      const result = await registerDelegate(data)
      if (result.success) {
        router.push("/register/success")
      } else {
        toast.error(result.error ?? t("toast.errorGeneric"))
      }
    } catch {
      toast.error(t("toast.errorGeneric"))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-8">
      <Stepper steps={STEPS} currentStep={step} />

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {step === 0 && <StepPersonal form={form} />}
          {step === 1 && <StepPref1 form={form} committees={committees} />}
          {step === 2 && (
            <StepPref2OrCoDelegate
              form={form}
              committees={committees}
              isDoubleDelegation={isDoubleDelegation}
            />
          )}
          {step === 3 && <StepAccommodation form={form} />}
          {step === 4 && <StepUndertaking form={form} isSubmitting={isSubmitting} />}

          <div className="flex items-center justify-between pt-2">
            {step > 0 ? (
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep((s) => s - 1)}
                disabled={isSubmitting}
              >
                {t("common.back")}
              </Button>
            ) : (
              <div />
            )}

            {step < STEPS.length - 1 ? (
              <Button type="button" onClick={handleNext}>
                {t("common.next")}
              </Button>
            ) : (
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? t("common.saving") : t("register.undertaking.submitButton")}
              </Button>
            )}
          </div>
        </form>
      </Form>
    </div>
  )
}
