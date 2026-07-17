"use client";

import { useActionState } from "react";
import { t } from "@/content/strings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { requestMagicLink, signInWithPassword } from "../actions";

export function SignInForm({ defaultTab = "magic" }: { defaultTab?: "magic" | "password" }) {
  const [mlState, mlAction, mlPending] = useActionState(requestMagicLink, null);
  const [pwState, pwAction, pwPending] = useActionState(signInWithPassword, null);

  return (
    <Tabs defaultValue={defaultTab}>
      <TabsList className="w-full mb-5">
        <TabsTrigger value="magic" className="flex-1">
          {t("auth.magicLinkTab")}
        </TabsTrigger>
        <TabsTrigger value="password" className="flex-1">
          {t("auth.passwordTab")}
        </TabsTrigger>
      </TabsList>

      <TabsContent value="magic">
        <form action={mlAction} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="ml-email">{t("auth.emailLabel")}</Label>
            <Input
              id="ml-email"
              name="email"
              type="email"
              autoComplete="email"
              required
              placeholder={t("auth.emailPlaceholder")}
              disabled={mlPending}
              className="h-10"
            />
          </div>
          {mlState?.error && (
            <p className="text-sm text-destructive">{t("auth.errorDefault")}</p>
          )}
          <Button type="submit" disabled={mlPending} className="h-10 w-full">
            {mlPending ? t("common.sending") : t("auth.sendLinkButton")}
          </Button>
        </form>
      </TabsContent>

      <TabsContent value="password">
        <form action={pwAction} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="pw-email">{t("auth.emailLabel")}</Label>
            <Input
              id="pw-email"
              name="email"
              type="email"
              autoComplete="email"
              required
              placeholder={t("auth.emailPlaceholder")}
              disabled={pwPending}
              className="h-10"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="pw-password">{t("auth.passwordLabel")}</Label>
            <Input
              id="pw-password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              placeholder={t("auth.passwordPlaceholder")}
              disabled={pwPending}
              className="h-10"
            />
          </div>
          {pwState?.error && (
            <p className="text-sm text-destructive">
              {pwState.error === "invalidCredentials"
                ? t("auth.invalidCredentials")
                : t("auth.errorDefault")}
            </p>
          )}
          <Button type="submit" disabled={pwPending} className="h-10 w-full">
            {pwPending ? t("common.loading") : t("auth.signInWithPasswordButton")}
          </Button>
        </form>
      </TabsContent>
    </Tabs>
  );
}
