import { getTranslations } from "next-intl/server";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Facebook02Icon,
  GoogleSheetIcon,
  Link01Icon,
  TelegramIcon,
} from "@hugeicons/core-free-icons";
import { SectionHeader } from "./section-header";

type Tile = {
  name: string;
  cat: "source" | "bot" | "sheets" | "crm" | "site" | "cpa";
  icon?: typeof Facebook02Icon;
  initials?: string;
};

const TILES: Tile[] = [
  { name: "Facebook", cat: "source", icon: Facebook02Icon },
  { name: "Telegram", cat: "bot", icon: TelegramIcon },
  { name: "Google Sheets", cat: "sheets", icon: GoogleSheetIcon },
  { name: "Bitrix24", cat: "crm", initials: "B24" },
  { name: "amoCRM / Kommo", cat: "crm", initials: "amo" },
  { name: "Tilda", cat: "site", initials: "T" },
  { name: "Creatium", cat: "site", initials: "Cr" },
  { name: "jin.uz", cat: "cpa", initials: "jin" },
];

export async function Integrations() {
  const t = await getTranslations("marketing.integrationsSec");

  return (
    <section id="integratsiyalar" className="mk-anchor border-y bg-muted/30">
      <div className="mx-auto w-full max-w-6xl px-4 py-20 sm:px-6 sm:py-24">
        <SectionHeader
          eyebrow={t("eyebrow")}
          title={t("title")}
          subtitle={t("subtitle")}
        />

        <ul className="mt-12 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {TILES.map((tile) => (
            <li
              key={tile.name}
              className="flex items-center gap-3 rounded-xl border bg-card p-4 transition-colors hover:border-primary/40"
            >
              <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted font-mono text-xs font-semibold text-foreground">
                {tile.icon ? (
                  <HugeiconsIcon icon={tile.icon} className="size-5" />
                ) : (
                  tile.initials
                )}
              </span>
              <span className="min-w-0">
                <span className="block truncate text-sm font-medium">
                  {tile.name}
                </span>
                <span className="block truncate font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                  {t(`cat.${tile.cat}`)}
                </span>
              </span>
            </li>
          ))}
        </ul>

        <div className="mt-3 flex flex-col items-start gap-2 rounded-xl border border-dashed bg-card/50 px-5 py-4 sm:flex-row sm:items-center sm:gap-4">
          <span className="flex items-center gap-2 font-mono text-sm font-semibold text-primary">
            <HugeiconsIcon icon={Link01Icon} className="size-4" />
            {t("moreTitle")}
          </span>
          <span className="text-sm text-muted-foreground">{t("moreDesc")}</span>
        </div>
      </div>
    </section>
  );
}
