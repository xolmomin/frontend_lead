"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Phone, Lock } from "lucide-react";
import { login } from "@/lib/api";
import { formatPhoneInput, normalizePhone } from "@/lib/phone";
import { YbCard } from "@/components/yb/card";
import { YbInput } from "@/components/yb/input";
import { YbButton } from "@/components/yb/button";
import { SocialAuth } from "@/components/auth/social-auth";
import { LanguageSwitcher } from "@/components/auth/language-switcher";

/** True when the value is being typed as a phone number (not an email). */
function looksLikePhone(value: string) {
  return /^[+\d\s]*$/.test(value);
}

export default function LoginPage() {
  const t = useTranslations("auth");
  const router = useRouter();
  const [identifier, setIdentifier] = useState("+998");
  const [submitting, setSubmitting] = useState(false);
  const [socialBusy, setSocialBusy] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);
    setFieldErrors({});

    const formData = new FormData(event.currentTarget);
    const password = String(formData.get("password") ?? "");
    const rawId = identifier.trim();
    const isPhone = looksLikePhone(rawId);
    const normalized = isPhone ? normalizePhone(rawId) : rawId;

    const errors: Record<string, string> = {};
    if (!rawId || rawId === "+998") {
      errors.phone = t("login.validation.phoneRequired");
    } else if (isPhone && !/^\+998\d{9}$/.test(normalized)) {
      errors.phone = t("login.validation.phoneInvalid");
    }
    if (!password) errors.password = t("login.validation.passwordRequired");
    if (Object.keys(errors).length) {
      setFieldErrors(errors);
      return;
    }

    setSubmitting(true);
    try {
      await login({ email: normalized, password });
      router.push("/dashboard");
    } catch {
      setFormError(t("login.errors.invalidCredentials"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="w-full max-w-md relative z-10 animate-in fade-in slide-in-from-bottom-5 duration-500">
      <YbCard variant="glass" className="p-8">
        <div className="absolute top-4 right-4">
          <LanguageSwitcher />
        </div>
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 mb-4 animate-in zoom-in duration-300 delay-200 fill-mode-both">
            <img
              src="https://cdn.yuboraman.uz/static/logo.png"
              alt="Yuboraman Logo"
              className="w-full h-full object-contain"
              fetchPriority="high"
              decoding="async"
            />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            {t("login.title")}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {t("login.subtitle")}
          </p>
        </div>

        <form onSubmit={onSubmit} className="space-y-5" noValidate>
          <YbInput
            name="phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            label={t("login.phoneLabel")}
            placeholder={t("login.phonePlaceholder")}
            leftIcon={<Phone className="w-5 h-5" />}
            error={fieldErrors.phone}
            disabled={submitting}
            value={identifier}
            onChange={(e) => {
              const next = e.target.value;
              setIdentifier(looksLikePhone(next) ? formatPhoneInput(next) : next);
            }}
          />
          <YbInput
            name="password"
            type="password"
            autoComplete="current-password"
            label={t("login.passwordLabel")}
            placeholder={t("login.passwordPlaceholder")}
            leftIcon={<Lock className="w-5 h-5" />}
            error={fieldErrors.password}
            disabled={submitting}
          />

          <div className="flex items-center justify-between">
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                name="remember"
                className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-2 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700"
                disabled={submitting}
              />
              <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                {t("login.rememberMe")}
              </span>
            </label>
            <Link
              href="/forgot-password"
              className="text-sm font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
            >
              {t("login.forgotPassword")}
            </Link>
          </div>

          {formError && (
            <p role="alert" className="text-sm text-red-600 dark:text-red-400">
              {formError}
            </p>
          )}

          <YbButton
            type="submit"
            variant="primary"
            size="lg"
            className="w-full"
            loading={submitting}
            disabled={submitting || socialBusy}
          >
            {submitting ? t("login.loggingIn") : t("login.loginButton")}
          </YbButton>
        </form>

        <SocialAuth
          disabled={submitting}
          onBusyChange={setSocialBusy}
          onError={setFormError}
        />

        <div className="text-center pt-6">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {t("login.noAccount")}{" "}
            <Link
              href="/register"
              className="font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
            >
              {t("login.signUp")}
            </Link>
          </p>
        </div>
      </YbCard>

      <div className="text-center mt-8 animate-in fade-in duration-500 delay-500 fill-mode-both">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {t("login.footer")}
        </p>
      </div>
    </div>
  );
}
