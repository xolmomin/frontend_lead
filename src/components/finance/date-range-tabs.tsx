"use client";

import { useTranslations } from "next-intl";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DATE_RANGE_PRESETS, type DateRangePreset } from "@/lib/date-range";

/** Preset selector shared by the finance insights and orders pages. */
export function DateRangeTabs({
  value,
  onChange,
}: {
  value: DateRangePreset;
  onChange: (preset: DateRangePreset) => void;
}) {
  const t = useTranslations("dateRange");

  return (
    <Tabs
      value={value}
      onValueChange={(next) => onChange(next as DateRangePreset)}
    >
      <TabsList className="max-w-full overflow-x-auto">
        {DATE_RANGE_PRESETS.map((preset) => (
          <TabsTrigger key={preset} value={preset}>
            {t(preset)}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}
