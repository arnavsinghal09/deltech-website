import { type UseFormReturn } from "react-hook-form"
import type { RegisterFormValues } from "@/lib/schemas/register"
import { FormField, FormItem, FormControl, FormMessage } from "@/components/ui/form"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { t } from "@/content/strings"

interface Props {
  form: UseFormReturn<RegisterFormValues>
}

export function StepAccommodation({ form }: Props) {
  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">{t("register.accommodation.note")}</p>

      <FormField
        control={form.control}
        name="needsAccommodation"
        render={({ field }) => (
          <FormItem>
            <div className="flex items-center gap-3">
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={(checked) => field.onChange(checked)}
                />
              </FormControl>
              <Label className="cursor-pointer">{t("register.accommodation.needsLabel")}</Label>
            </div>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="outsideNcr"
        render={({ field }) => (
          <FormItem>
            <div className="flex items-center gap-3">
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={(checked) => field.onChange(checked)}
                />
              </FormControl>
              <Label className="cursor-pointer">{t("register.accommodation.outsideNcrLabel")}</Label>
            </div>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  )
}
