"use client";

import { useActionState } from "react";
import { t } from "@/content/strings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { requestMagicLink } from "../actions";

export function SignInForm() {
  const [state, action, isPending] = useActionState(requestMagicLink, null);

  return (
    <form action={action} className="flex flex-col gap-5">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="email">{t("auth.emailLabel")}</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          placeholder={t("auth.emailPlaceholder")}
          disabled={isPending}
          className="h-10"
        />
      </div>

      {state?.error && (
        <p className="text-sm text-destructive">{t("auth.errorDefault")}</p>
      )}

      <Button type="submit" disabled={isPending} className="h-10 w-full">
        {isPending ? t("common.sending") : t("auth.sendLinkButton")}
      </Button>

      <p className="text-center text-xs text-muted-foreground">
        {t("auth.delegateNote")}
      </p>
    </form>
  );
}
