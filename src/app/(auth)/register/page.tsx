"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { User, Mail, Phone, Lock } from "lucide-react";
import { ApiError, login, register } from "@/lib/api";
import { formatPhoneInput, toDigits } from "@/lib/phone";
import { cn } from "@/lib/utils";
import { YbCard } from "@/components/yb/card";
import { YbInput } from "@/components/yb/input";
import { YbButton } from "@/components/yb/button";
import { SocialAuth } from "@/components/auth/social-auth";
import { LanguageSwitcher } from "@/components/auth/language-switcher";

type Strength = "weak" | "medium" | "strong";

function passwordStrength(value: string): Strength {
  let score = 0;
  if (value.length >= 10) score++;
  if (/[A-Z]/.test(value)) score++;
  if (/\d/.test(value)) score++;
  if (/[^A-Za-z0-9]/.test(value)) score++;
  if (score >= 4) return "strong";
  if (score >= 2) return "medium";
  return "weak";
}

const STRENGTH_BAR: Record<Strength, string> = {
  weak: "bg-red-500",
  medium: "bg-yellow-500",
  strong: "bg-green-500",
};

export default function RegisterPage() {
  const t = useTranslations("auth");
  const router = useRouter();
  const [phone, setPhone] = useState("+998");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [socialBusy, setSocialBusy] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);

  const strength = passwordStrength(password);
  const strengthLabel: Record<Strength, string> = {
    weak: t("register.passwordWeak"),
    medium: t("register.passwordMedium"),
    strong: t("register.passwordStrong"),
  };

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);
    setFieldErrors({});

    const formData = new FormData(event.currentTarget);
    const values = {
      fullName: String(formData.get("fullName") ?? "").trim(),
      email: String(formData.get("email") ?? "").trim(),
      phone: toDigits(phone),
      password,
      confirmPassword: String(formData.get("confirmPassword") ?? ""),
      termsAccepted: formData.get("termsAccepted") === "on",
    };

    const v = (key: string) => t(`register.validation.${key}`);
    const errors: Record<string, string> = {};
    if (!values.fullName) errors.fullName = v("nameRequired");
    else if (values.fullName.length < 2) errors.fullName = v("nameMin");
    if (!values.email) errors.email = v("emailRequired");
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email))
      errors.email = v("emailInvalid");
    if (!values.phone || values.phone === "998") errors.phone = v("phoneRequired");
    else if (!/^998\d{9}$/.test(values.phone)) errors.phone = v("phoneInvalid");
    if (!values.password) errors.password = v("passwordRequired");
    else if (values.password.length < 10) errors.password = v("passwordMin");
    else if (
      !/[A-Z]/.test(values.password) ||
      !/\d/.test(values.password) ||
      !/[^A-Za-z0-9]/.test(values.password)
    )
      errors.password = v("passwordStrength");
    if (!values.confirmPassword)
      errors.confirmPassword = v("confirmPasswordRequired");
    else if (values.confirmPassword !== values.password)
      errors.confirmPassword = v("passwordsMatch");
    if (!values.termsAccepted) errors.termsAccepted = v("termsRequired");
    if (Object.keys(errors).length) {
      setFieldErrors(errors);
      return;
    }

    setSubmitting(true);
    try {
      await register({
        full_name: values.fullName,
        email: values.email,
        phone: values.phone,
        password: values.password,
      });
      await login({
        email: values.email,
        password: values.password,
        remember: true,
      });
      router.push("/dashboard");
    } catch (error) {
      if (error instanceof ApiError && error.status === 409) {
        setFormError(t("register.errors.emailExists"));
      } else {
        setFormError(t("register.errors.generic"));
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="w-full max-w-md relative z-10 py-12 animate-in fade-in slide-in-from-bottom-5 duration-500">
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
            {t("register.title")}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {t("register.subtitle")}
          </p>
        </div>

        <form onSubmit={onSubmit} className="space-y-5" noValidate>
          <YbInput
            name="fullName"
            autoComplete="name"
            label={t("register.fullNameLabel")}
            placeholder={t("register.fullNamePlaceholder")}
            leftIcon={<User className="w-5 h-5" />}
            error={fieldErrors.fullName}
            disabled={submitting}
          />
          <YbInput
            name="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            label={t("register.emailLabel")}
            placeholder={t("register.emailPlaceholder")}
            leftIcon={<Mail className="w-5 h-5" />}
            error={fieldErrors.email}
            disabled={submitting}
          />
          <YbInput
            name="phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            label={t("register.phoneLabel")}
            placeholder={t("register.phonePlaceholder")}
            leftIcon={<Phone className="w-5 h-5" />}
            error={fieldErrors.phone}
            disabled={submitting}
            value={phone}
            onChange={(e) => setPhone(formatPhoneInput(e.target.value))}
          />
          <div>
            <YbInput
              name="password"
              type="password"
              autoComplete="new-password"
              label={t("register.passwordLabel")}
              placeholder={t("register.passwordPlaceholder")}
              leftIcon={<Lock className="w-5 h-5" />}
              error={fieldErrors.password}
              disabled={submitting}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            {password && !fieldErrors.password && (
              <div className="mt-2">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-gray-600 dark:text-gray-400">
                    {t("register.passwordStrength")}
                  </span>
                  <span
                    className={cn(
                      "text-xs font-medium",
                      strength === "weak" && "text-red-600",
                      strength === "medium" && "text-yellow-600",
                      strength === "strong" && "text-green-600",
                    )}
                  >
                    {strengthLabel[strength]}
                  </span>
                </div>
                <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className={cn(
                      "h-full transition-all duration-300",
                      STRENGTH_BAR[strength],
                    )}
                    style={{
                      width:
                        strength === "weak"
                          ? "33%"
                          : strength === "medium"
                            ? "66%"
                            : "100%",
                    }}
                  />
                </div>
              </div>
            )}
          </div>
          <YbInput
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            label={t("register.confirmPasswordLabel")}
            placeholder={t("register.confirmPasswordPlaceholder")}
            leftIcon={<Lock className="w-5 h-5" />}
            error={fieldErrors.confirmPassword}
            disabled={submitting}
          />

          <div>
            <label className="flex items-start cursor-pointer">
              <input
                type="checkbox"
                name="termsAccepted"
                className="w-4 h-4 mt-0.5 text-primary-600 border-gray-300 rounded focus:ring-2 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700"
                disabled={submitting}
              />
              <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                {t("register.termsAgreement")}{" "}
                <Link
                  href="/terms-of-service"
                  className="text-primary-600 hover:text-primary-700 dark:text-primary-400"
                >
                  {t("register.termsLink")}
                </Link>{" "}
                {t("register.and")}{" "}
                <Link
                  href="/privacy-policy"
                  className="text-primary-600 hover:text-primary-700 dark:text-primary-400"
                >
                  {t("register.privacyLink")}
                </Link>
                {t("register.termsEnd")}
              </span>
            </label>
            {fieldErrors.termsAccepted && (
              <p className="mt-1.5 text-sm text-red-600 dark:text-red-400">
                {fieldErrors.termsAccepted}
              </p>
            )}
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
            {submitting
              ? t("register.registering")
              : t("register.registerButton")}
          </YbButton>

          <SocialAuth
            disabled={submitting}
            onBusyChange={setSocialBusy}
            onError={setFormError}
          />

          <div className="text-center pt-6">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {t("register.haveAccount")}{" "}
              <Link
                href="/login"
                className="font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
              >
                {t("register.signIn")}
              </Link>
            </p>
          </div>
        </form>
      </YbCard>

      <div className="text-center mt-8 animate-in fade-in duration-500 delay-500 fill-mode-both">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {t("register.footer")}
        </p>
      </div>
    </div>
  );
}
