"use client";

import { useState, type FormEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { ArrowLeft, Phone, CheckCircle2 } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { formatPhoneInput, normalizePhone } from "@/lib/phone";
import { YbCard } from "@/components/yb/card";
import { YbInput } from "@/components/yb/input";
import { YbButton } from "@/components/yb/button";
import { LanguageSwitcher } from "./language-switcher";

export function ForgotPasswordView() {
  const t = useTranslations("auth.forgotPassword");
  const [phone, setPhone] = useState("+998");
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  async function requestCode() {
    await apiFetch("/auth/forgot-password", {
      method: "POST",
      body: { phone: normalizePhone(phone) },
      skipRefresh: true,
    });
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFieldError(null);
    setFormError(null);

    const normalized = normalizePhone(phone);
    if (!normalized || normalized === "+998") {
      setFieldError(t("validation.phoneRequired"));
      return;
    }
    if (!/^\+998\d{9}$/.test(normalized)) {
      setFieldError(t("validation.phoneInvalid"));
      return;
    }

    setSubmitting(true);
    try {
      await requestCode();
      setSent(true);
    } catch {
      setFormError(t("errors.generic"));
    } finally {
      setSubmitting(false);
    }
  }

  if (sent) {
    return (
      <div className="w-full max-w-md relative z-10 animate-in fade-in slide-in-from-bottom-5 duration-500">
        <YbCard variant="glass" padding="lg" className="text-center">
          <div className="absolute top-4 right-4">
            <LanguageSwitcher />
          </div>
          <div className="inline-flex items-center justify-center w-20 h-20 mb-6 rounded-full bg-success-muted">
            <CheckCircle2 className="w-10 h-10 text-success" />
          </div>
          <h1 className="t-h3 text-foreground mb-3">{t("success.codeSent")}</h1>
          <p className="text-muted-foreground mb-8">
            {t("success.codeMessage")}
          </p>
          <div className="space-y-3">
            <Link href="/login" className="block">
              <YbButton variant="outline" className="w-full">
                {t("backToLogin")}
              </YbButton>
            </Link>
            <button
              type="button"
              onClick={() => setSent(false)}
              className="text-sm text-primary hover:text-primary"
            >
              {t("resendCode")}
            </button>
          </div>
        </YbCard>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md relative z-10 animate-in fade-in slide-in-from-bottom-5 duration-500">
      <YbCard variant="glass" padding="lg">
        <div className="absolute top-4 right-4">
          <LanguageSwitcher />
        </div>
        <Link
          href="/login"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          {t("backToLogin")}
        </Link>
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 mb-4 animate-in zoom-in duration-300 delay-200 fill-mode-both">
            <Image
              src="https://cdn.lidlar.uz/static/logo.png"
              alt="Lidlar Logo"
              width={80}
              height={80}
              priority
              className="w-full h-full object-contain"
            />
          </div>
          <h1 className="t-h2 text-foreground mb-2">{t("title")}</h1>
          <p className="text-muted-foreground">{t("subtitle")}</p>
        </div>

        <form onSubmit={onSubmit} className="space-y-5" noValidate>
          <YbInput
            name="phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            label={t("phoneLabel")}
            placeholder={t("phonePlaceholder")}
            leftIcon={<Phone className="w-5 h-5" />}
            error={fieldError ?? undefined}
            disabled={submitting}
            value={phone}
            onChange={(e) => setPhone(formatPhoneInput(e.target.value))}
          />

          {formError && (
            <p role="alert" className="text-sm text-destructive">
              {formError}
            </p>
          )}

          <YbButton
            type="submit"
            variant="primary"
            size="lg"
            className="w-full"
            loading={submitting}
            disabled={submitting}
          >
            {submitting ? t("sendingCode") : t("sendCodeButton")}
          </YbButton>
        </form>

        <div className="text-center pt-6">
          <p className="text-sm text-muted-foreground">
            {t("rememberPassword")}{" "}
            <Link
              href="/login"
              className="font-medium text-primary hover:text-primary"
            >
              {t("backToLogin")}
            </Link>
          </p>
        </div>
      </YbCard>
    </div>
  );
}
