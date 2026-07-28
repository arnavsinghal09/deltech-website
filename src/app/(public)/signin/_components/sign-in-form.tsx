"use client";

import { useActionState, useState } from "react";
import { t } from "@/content/strings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { requestMagicLink, signInWithPassword } from "../actions";

export function SignInForm({
  defaultTab = "magic",
  callbackUrl = "",
}: {
  defaultTab?: "magic" | "password"
  callbackUrl?: string
}) {
  const [mlState, mlAction, mlPending] = useActionState(requestMagicLink, null);
  const [pwState, pwAction, pwPending] = useActionState(signInWithPassword, null);
  // Controlled so "Forgot password?" can hand the user to the magic-link tab.
  // That link is the whole password-recovery flow: the magic link is already a
  // single-use expiring token, so there is no separate reset token to mint.
  const [tab, setTab] = useState<string>(defaultTab);

  return (
    <Tabs value={tab} onValueChange={(v) => setTab(String(v))}>
      <TabsList className="mb-7 grid h-13 w-full grid-cols-2 rounded-none bg-black/5 p-1">
        <TabsTrigger value="magic" className="h-11 rounded-none text-sm font-bold data-[state=active]:bg-foreground data-[state=active]:text-background">
          {t("auth.magicLinkTab")}
        </TabsTrigger>
        <TabsTrigger value="password" className="h-11 rounded-none text-sm font-bold data-[state=active]:bg-foreground data-[state=active]:text-background">
          {t("auth.passwordTab")}
        </TabsTrigger>
      </TabsList>

      <TabsContent value="magic">
        <form action={mlAction} className="flex flex-col gap-5">
          <input type="hidden" name="callbackUrl" value={callbackUrl} />
          <div className="flex flex-col gap-2">
            <Label htmlFor="ml-email">{t("auth.emailLabel")}</Label>
            <Input
              id="ml-email"
              name="email"
              type="email"
              autoComplete="email"
              required
              placeholder={t("auth.emailPlaceholder")}
              disabled={mlPending}
              className="h-14 rounded-none border-0 border-b-2 border-black/30 bg-transparent px-0 text-base shadow-none focus-visible:border-teal-700 focus-visible:ring-0"
            />
          </div>
          {mlState?.error && (
            <p className="text-sm text-destructive">{t("auth.errorDefault")}</p>
          )}
          <Button type="submit" disabled={mlPending} className="h-14 w-full rounded-none text-base">
            {mlPending ? t("common.sending") : t("auth.sendLinkButton")}
          </Button>
        </form>
      </TabsContent>

      <TabsContent value="password">
        <form action={pwAction} className="flex flex-col gap-5">
          <input type="hidden" name="callbackUrl" value={callbackUrl} />
          <div className="flex flex-col gap-2">
            <Label htmlFor="pw-email">{t("auth.emailLabel")}</Label>
            <Input
              id="pw-email"
              name="email"
              type="email"
              autoComplete="email"
              required
              placeholder={t("auth.emailPlaceholder")}
              disabled={pwPending}
              className="h-14 rounded-none border-0 border-b-2 border-black/30 bg-transparent px-0 text-base shadow-none focus-visible:border-teal-700 focus-visible:ring-0"
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="pw-password">{t("auth.passwordLabel")}</Label>
            <Input
              id="pw-password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              placeholder={t("auth.passwordPlaceholder")}
              disabled={pwPending}
              className="h-14 rounded-none border-0 border-b-2 border-black/30 bg-transparent px-0 text-base shadow-none focus-visible:border-teal-700 focus-visible:ring-0"
            />
          </div>
          {pwState?.error && (
            <p className="text-sm text-destructive">
              {pwState.error === "invalidCredentials"
                ? t("auth.invalidCredentials")
                : t("auth.errorDefault")}
            </p>
          )}
          <Button type="submit" disabled={pwPending} className="h-14 w-full rounded-none text-base">
            {pwPending ? t("common.loading") : t("auth.signInWithPasswordButton")}
          </Button>

          <button
            type="button"
            onClick={() => setTab("magic")}
            className="-mt-1 self-start text-sm font-bold text-teal-800 underline underline-offset-2"
          >
            {t("auth.forgotPassword")}
          </button>

          {/* Invited staff have no passwordHash at all, so the generic
              "invalid email or password" is actively misleading for them.
              Stated up front rather than as an error, which would leak
              whether a given address has an account. */}
          <p className="text-xs leading-relaxed text-black/50">{t("auth.noPasswordYetHint")}</p>
        </form>
      </TabsContent>
    </Tabs>
  );
}
