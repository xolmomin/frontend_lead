"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { z } from "zod";
import {
  Mail01Icon,
  SquareLock01Icon,
  Loading03Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { login } from "@/lib/api";
import { AuthField } from "@/components/auth/auth-field";
import { SocialAuth } from "@/components/auth/social-auth";
import { LanguageSwitcher } from "@/components/auth/language-switcher";
import { Checkbox } from "@/components/ui/checkbox";

export default function LoginPage() {
  const t = useTranslations("auth");
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);

  const schema = z.object({
    email: z.email(t("errors.emailInvalid")),
    password: z.string().min(8, t("errors.passwordMin")),
  });

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);
    setFieldErrors({});

    const formData = new FormData(event.currentTarget);
    const values = {
      email: String(formData.get("email") ?? ""),
      password: String(formData.get("password") ?? ""),
    };

    const result = schema.safeParse(values);
    if (!result.success) {
      const errors: Record<string, string> = {};
      for (const issue of result.error.issues) {
        const key = String(issue.path[0]);
        errors[key] ??= issue.message;
      }
      setFieldErrors(errors);
      return;
    }

    setSubmitting(true);
    try {
      await login(result.data);
      router.push("/dashboard");
    } catch {
      setFormError(t("errors.loginFailed"));
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
          {t("loginTitle")}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {t("loginSubtitle")}
        </p>
      </div>

      <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
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
          id="password"
          name="password"
          label={t("password")}
          icon={SquareLock01Icon}
          autoComplete="current-password"
          placeholder={t("passwordPlaceholder")}
          toggleable
          showLabel={t("showPassword")}
          hideLabel={t("hidePassword")}
          error={fieldErrors.password}
        />

        <div className="flex items-center justify-between text-sm">
          <label className="flex cursor-pointer items-center gap-2 text-muted-foreground">
            <Checkbox name="remember" />
            <span>{t("rememberMe")}</span>
          </label>
          <Link href="#" className="font-medium text-primary hover:underline">
            {t("forgotPassword")}
          </Link>
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
          {submitting ? t("submitting") : t("loginButton")}
        </button>
      </form>

      <SocialAuth onError={setFormError} />

      <p className="mt-6 text-center text-sm text-muted-foreground">
        {t("noAccount")}{" "}
        <Link
          href="/register"
          className="font-medium text-primary hover:underline"
        >
          {t("registerLink")}
        </Link>
      </p>

      <p className="mt-6 text-center text-xs text-muted-foreground/70">
        {t("copyright")}
      </p>
    </div>
  );
}
