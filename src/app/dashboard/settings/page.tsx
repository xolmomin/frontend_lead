import { getTranslations } from "next-intl/server";

export default async function SettingsPage() {
  const t = await getTranslations("nav");
  const tCommon = await getTranslations("common");

  return (
    <div className="flex flex-col gap-2">
      <h1 className="text-2xl font-bold">{t("settings")}</h1>
      <p className="text-muted-foreground">{tCommon("comingSoon")}</p>
    </div>
  );
}
