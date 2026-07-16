"use client";

import { useActionState } from "react";
import { t } from "@/content/strings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { signupWithPassword, signupWithMagicLink } from "../actions";

const ERROR_MESSAGES: Record<string, string> = {
  passwordTooShort: "Password must be at least 8 characters.",
  passwordMismatch: "Passwords do not match.",
  accountExists: "An account with this email already exists. Sign in instead.",
  nonDelegateAccount: "This email is reserved for an admin or author account.",
  invalidCredentials: "Could not sign in after account creation. Please sign in manually.",
  errorDefault: "Something went wrong. Please try again.",
};

export function SignupForm() {
  const [pwState, pwAction, pwPending] = useActionState(signupWithPassword, null);
  const [mlState, mlAction, mlPending] = useActionState(signupWithMagicLink, null);

  return (
    <Tabs defaultValue="password">
      <TabsList className="w-full mb-5">
        <TabsTrigger value="password" className="flex-1">
          {t("auth.signUpPasswordTab")}
        </TabsTrigger>
        <TabsTrigger value="magic" className="flex-1">
          {t("auth.signUpMagicTab")}
        </TabsTrigger>
      </TabsList>

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
              autoComplete="new-password"
              required
              placeholder={t("auth.passwordPlaceholder")}
              disabled={pwPending}
              className="h-10"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="pw-confirm">{t("auth.confirmPasswordLabel")}</Label>
            <Input
              id="pw-confirm"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              required
              placeholder={t("auth.confirmPasswordPlaceholder")}
              disabled={pwPending}
              className="h-10"
            />
          </div>
          {pwState?.error && (
            <p className="text-sm text-destructive">
              {ERROR_MESSAGES[pwState.error] ?? ERROR_MESSAGES.errorDefault}
            </p>
          )}
          <Button type="submit" disabled={pwPending} className="h-10 w-full">
            {pwPending ? t("common.loading") : t("auth.createAccountButton")}
          </Button>
        </form>
      </TabsContent>

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
            <p className="text-sm text-destructive">
              {ERROR_MESSAGES[mlState.error] ?? ERROR_MESSAGES.errorDefault}
            </p>
          )}
          <Button type="submit" disabled={mlPending} className="h-10 w-full">
            {mlPending ? t("common.sending") : t("auth.sendMagicLinkButton")}
          </Button>
          <p className="text-xs text-center text-muted-foreground">
            We&apos;ll create your account and email you a sign-in link.
          </p>
        </form>
      </TabsContent>
    </Tabs>
  );
}
