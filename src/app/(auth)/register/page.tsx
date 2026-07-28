"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { z } from "zod";
import {
  UserIcon,
  Mail01Icon,
  Call02Icon,
  SquareLock01Icon,
  Loading03Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { ApiError, login, register } from "@/lib/api";
import { AuthField } from "@/components/auth/auth-field";
import { SocialAuth } from "@/components/auth/social-auth";
import { LanguageSwitcher } from "@/components/auth/language-switcher";
import { Checkbox } from "@/components/ui/checkbox";

export default function RegisterPage() {
  const t = useTranslations("auth");
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);

  const schema = z.object({
    full_name: z.string().min(2, t("errors.fullNameRequired")),
    email: z.email(t("errors.emailInvalid")),
    phone: z.string().regex(/^\+?[0-9]{9,15}$/, t("errors.phoneInvalid")),
    password: z.string().min(8, t("errors.passwordMin")),
  });

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);
    setFieldErrors({});

    const formData = new FormData(event.currentTarget);
    const values = {
      full_name: String(formData.get("full_name") ?? "").trim(),
      email: String(formData.get("email") ?? "").trim(),
      phone: String(formData.get("phone") ?? "").replace(/[\s-]/g, ""),
      password: String(formData.get("password") ?? ""),
    };
    const confirm = String(formData.get("confirm_password") ?? "");

    const result = schema.safeParse(values);
    const errors: Record<string, string> = {};
    if (!result.success) {
      for (const issue of result.error.issues) {
        const key = String(issue.path[0]);
        errors[key] ??= issue.message;
      }
    }
    if (values.password && confirm !== values.password) {
      errors.confirm_password ??= t("errors.confirmMismatch");
    }
    if (!agreed) {
      errors.terms ??= t("errors.termsRequired");
    }
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setSubmitting(true);
    try {
      await register(result.data!);
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        setFieldErrors({ email: t("errors.emailTaken") });
      } else {
        setFormError(t("errors.registerFailed"));
      }
      setSubmitting(false);
      return;
    }
    try {
      await login({ email: result.data!.email, password: result.data!.password });
      router.push("/dashboard");
    } catch {
      // The account WAS created — don't show "register failed"; let them sign in.
      router.push("/login");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="glass w-full max-w-md rounded-xl border border-border p-8 shadow-lg">
      <div className="mb-4 flex justify-end">
        <LanguageSwitcher />
      </div>

      <div className="mb-6 text-center">
        <h1 className="text-3xl font-bold text-foreground">
          {t("registerTitle")}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {t("registerSubtitle")}
        </p>
      </div>

      <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
        <AuthField
          id="full_name"
          name="full_name"
          label={t("fullName")}
          icon={UserIcon}
          autoComplete="name"
          placeholder={t("fullNamePlaceholder")}
          error={fieldErrors.full_name}
        />
        <AuthField
          id="email"
          name="email"
          type="email"
          label={t("email")}
          icon={Mail01Icon}
          autoComplete="email"
          placeholder={t("emailPlaceholder")}
          error={fieldErrors.email}
        />
        <AuthField
          id="phone"
          name="phone"
          type="tel"
          label={t("phone")}
          icon={Call02Icon}
          autoComplete="tel"
          defaultValue="+998"
          error={fieldErrors.phone}
        />
        <AuthField
          id="password"
          name="password"
          label={t("password")}
          icon={SquareLock01Icon}
          autoComplete="new-password"
          placeholder={t("passwordPlaceholderCreate")}
          toggleable
          showLabel={t("showPassword")}
          hideLabel={t("hidePassword")}
          error={fieldErrors.password}
        />
        <AuthField
          id="confirm_password"
          name="confirm_password"
          label={t("confirmPassword")}
          icon={SquareLock01Icon}
          autoComplete="new-password"
          placeholder={t("confirmPasswordPlaceholder")}
          toggleable
          showLabel={t("showPassword")}
          hideLabel={t("hidePassword")}
          error={fieldErrors.confirm_password}
        />

        <div className="flex flex-col gap-1">
          <label className="flex items-start gap-2 text-sm text-muted-foreground">
            <Checkbox
              className="mt-0.5"
              checked={agreed}
              onCheckedChange={(v) => setAgreed(v === true)}
            />
            <span>
              {t.rich("termsAgree", {
                terms: (chunks) => (
                  <Link href="#" className="text-primary hover:underline">
                    {chunks}
                  </Link>
                ),
                privacy: (chunks) => (
                  <Link href="#" className="text-primary hover:underline">
                    {chunks}
                  </Link>
                ),
              })}
            </span>
          </label>
          {fieldErrors.terms && (
            <p className="text-xs text-destructive">{fieldErrors.terms}</p>
          )}
        </div>

        {formError && <p className="text-sm text-destructive">{formError}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="btn-teal-gradient flex h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-xl font-medium text-white shadow-sm transition-opacity hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting && (
            <HugeiconsIcon
              icon={Loading03Icon}
              size={18}
              className="animate-spin"
            />
          )}
          {submitting ? t("submitting") : t("registerButton")}
        </button>
      </form>

      <SocialAuth onError={setFormError} />

      <p className="mt-6 text-center text-sm text-muted-foreground">
        {t("haveAccount")}{" "}
        <Link href="/login" className="font-medium text-primary hover:underline">
          {t("loginLink")}
        </Link>
      </p>

      <p className="mt-6 text-center text-xs text-muted-foreground/70">
        {t("copyright")}
      </p>
    </div>
  );
}
