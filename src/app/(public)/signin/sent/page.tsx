import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { t } from "@/content/strings";


export default function CheckEmailPage() {
  return (
    <div className="flex min-h-svh items-center justify-center bg-muted/30 p-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <span className="text-2xl font-semibold tracking-tight">{t("brand.name")}</span>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              {t("auth.checkEmailTitle")}
            </CardTitle>
            <CardDescription>{t("auth.checkEmailMessage")}</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              {t("auth.checkEmailExpiry")}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
