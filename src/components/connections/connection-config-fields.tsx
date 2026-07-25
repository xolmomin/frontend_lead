"use client";

import { useTranslations } from "next-intl";
import { z } from "zod";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { DeliveryType } from "@/lib/api/integrations";

interface FieldDef {
  key: string;
  /** Translation key under `connections.config`. */
  label: string;
  hint?: string;
  placeholder?: string;
  textarea?: boolean;
  optional?: boolean;
  url?: boolean;
}

const CONFIG_FIELDS: Record<DeliveryType, FieldDef[]> = {
  webhook: [
    { key: "url", label: "webhookUrl", url: true, placeholder: "https://example.com/leads" },
    {
      key: "headers",
      label: "webhookHeaders",
      hint: "webhookHeadersHint",
      textarea: true,
      optional: true,
      placeholder: "Authorization: Bearer abc123",
    },
  ],
  telegram: [
    { key: "bot_token", label: "botToken", placeholder: "123456:ABC-DEF..." },
    { key: "chat_id", label: "chatId", placeholder: "-1001234567890" },
  ],
  sheets: [
    { key: "spreadsheet_id", label: "spreadsheetId", placeholder: "1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms" },
  ],
  bitrix24: [
    { key: "webhook_url", label: "bitrixWebhookUrl", url: true, placeholder: "https://company.bitrix24.ru/rest/1/abc123/" },
  ],
  amocrm: [
    { key: "subdomain", label: "subdomain", placeholder: "mycompany" },
    { key: "token", label: "token" },
  ],
  cpa: [{ key: "api_key", label: "apiKey" }],
};

function parseHeaderLines(text: string): Record<string, string> {
  const headers: Record<string, string> = {};
  for (const line of text.split("\n")) {
    const idx = line.indexOf(":");
    if (idx <= 0) continue;
    const name = line.slice(0, idx).trim();
    const value = line.slice(idx + 1).trim();
    if (name) headers[name] = value;
  }
  return headers;
}

function headersToLines(value: unknown): string {
  if (!value || typeof value !== "object") return "";
  return Object.entries(value as Record<string, unknown>)
    .map(([k, v]) => `${k}: ${String(v)}`)
    .join("\n");
}

export type ConfigParseResult =
  | { ok: true; config: Record<string, unknown> }
  | { ok: false; errors: Record<string, string> };

/**
 * Read `config_*` inputs rendered by {@link ConnectionConfigFields} out of a
 * form and validate them with zod.
 */
export function parseConnectionConfig(
  formData: FormData,
  type: DeliveryType,
  t: (key: string) => string,
): ConfigParseResult {
  const errors: Record<string, string> = {};
  const config: Record<string, unknown> = {};

  for (const field of CONFIG_FIELDS[type]) {
    const raw = String(formData.get(`config_${field.key}`) ?? "").trim();

    if (field.key === "headers") {
      const headers = parseHeaderLines(raw);
      if (Object.keys(headers).length > 0) config.headers = headers;
      continue;
    }

    const schema = field.url
      ? z.url(t("invalidUrl"))
      : z.string().min(1, t("required"));
    const result = schema.safeParse(raw);
    if (!result.success && !(field.optional && raw === "")) {
      errors[field.key] = result.error.issues[0]?.message ?? t("required");
      continue;
    }
    if (raw) config[field.key] = raw;
  }

  if (Object.keys(errors).length > 0) return { ok: false, errors };
  return { ok: true, config };
}

/** Per-type config inputs. Uncontrolled — read back via {@link parseConnectionConfig}. */
export function ConnectionConfigFields({
  type,
  defaults,
  errors = {},
}: {
  type: DeliveryType;
  defaults?: Record<string, unknown>;
  errors?: Record<string, string>;
}) {
  const t = useTranslations("connections.config");

  return (
    <>
      {CONFIG_FIELDS[type].map((field) => {
        const id = `config_${field.key}`;
        const defaultValue =
          field.key === "headers"
            ? headersToLines(defaults?.headers)
            : String(defaults?.[field.key] ?? "");
        return (
          <div key={`${type}-${field.key}`} className="flex flex-col gap-2">
            <Label htmlFor={id}>{t(field.label)}</Label>
            {field.textarea ? (
              <Textarea
                id={id}
                name={id}
                rows={3}
                placeholder={field.placeholder}
                defaultValue={defaultValue}
              />
            ) : (
              <Input
                id={id}
                name={id}
                placeholder={field.placeholder}
                defaultValue={defaultValue}
                autoComplete="off"
              />
            )}
            {field.hint && (
              <p className="text-xs text-muted-foreground">{t(field.hint)}</p>
            )}
            {errors[field.key] && (
              <p className="text-sm text-destructive">{errors[field.key]}</p>
            )}
          </div>
        );
      })}
    </>
  );
}
