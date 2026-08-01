"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Bell,
  Camera,
  Check,
  Circle,
  ExternalLink,
  Save,
  Shield,
  User as UserIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatSum } from "@/lib/money";
import { useUser } from "@/hooks/use-user";
import {
  getTelegramConnectToken,
  updateImage,
  updatePassword,
  updateSettings,
  type ProfileUser,
} from "@/lib/api/profile";
import { YbCard } from "@/components/yb/card";
import { YbButton } from "@/components/yb/button";
import { YbInput } from "@/components/yb/input";
import { YbTabs, tabId, tabPanelId, type YbTab } from "@/components/yb/tabs";

const TELEGRAM_BOT = "YuboramanBot";

const TELEGRAM_ICON_PATH =
  "M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z";

function initials(value: string): string {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function formatPhone(value: string): string {
  if (!value) return "";
  const match = value
    .replace(/\D/g, "")
    .slice(0, 12)
    .match(/(\d{0,3})(\d{0,2})(\d{0,3})(\d{0,2})(\d{0,2})/);
  if (match) {
    let out = "";
    if (match[1]) out = "+" + match[1];
    if (match[2]) out += " " + match[2];
    if (match[3]) out += " " + match[3];
    if (match[4]) out += " " + match[4];
    if (match[5]) out += " " + match[5];
    return out;
  }
  return value;
}

export function SettingsView() {
  const t = useTranslations("settings");
  const tCommon = useTranslations("common");
  const idBase = useId();
  const queryClient = useQueryClient();

  const userQuery = useUser();
  const user = (userQuery.data ?? null) as ProfileUser | null;
  const refreshUser = () =>
    queryClient.invalidateQueries({ queryKey: ["me"] });
  const hasPassword = user?.has_password ?? true;

  const tabs = useMemo<YbTab[]>(
    () => [
      {
        id: "profile",
        label: <span className="truncate">{t("tabs.profile")}</span>,
        icon: <UserIcon className="w-5 h-5 sm:w-4 sm:h-4" />,
      },
      {
        id: "security",
        label: <span className="truncate">{t("tabs.security")}</span>,
        icon: <Shield className="w-5 h-5 sm:w-4 sm:h-4" />,
      },
      {
        id: "notifications",
        label: <span className="truncate">{t("tabs.notifications")}</span>,
        icon: <Bell className="w-5 h-5 sm:w-4 sm:h-4" />,
      },
    ],
    [t],
  );

  const [activeTab, setActiveTab] = useState("profile");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState(user?.name || user?.full_name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [phone, setPhone] = useState("");
  const [telegramId, setTelegramId] = useState(
    user?.telegram_id?.toString() || "",
  );
  const [savingProfile, setSavingProfile] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);
  const [connectingTelegram, setConnectingTelegram] = useState(false);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [smsNotifications, setSmsNotifications] = useState(false);

  // Render-time sync (React "derive state from props" pattern): when a fresh
  // user object arrives, reset the editable fields from it.
  const [prevUser, setPrevUser] = useState(user);
  if (user !== prevUser) {
    setPrevUser(user);
    if (user) {
      setName(user.name || user.full_name || "");
      setEmail(user.email || "");
      if (user.phone) setPhone(formatPhone(user.phone));
      setTelegramId(user.telegram_id?.toString() || "");
    }
  }

  // While the Telegram account is not linked yet, poll for the change when the
  // tab is visible so the UI flips as soon as the bot verifies the user.
  useEffect(() => {
    if (!user || user.telegram_id) return;
    let interval: ReturnType<typeof setInterval> | null = null;
    const start = () => {
      if (interval === null) interval = setInterval(() => refreshUser(), 10_000);
    };
    const stop = () => {
      if (interval !== null) {
        clearInterval(interval);
        interval = null;
      }
    };
    if (!document.hidden) start();
    const onVisibility = () => {
      if (document.hidden) stop();
      else start();
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      stop();
      document.removeEventListener("visibilitychange", onVisibility);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.telegram_id]);

  const passwordChecks = {
    length: newPassword.length >= 10,
    uppercase: /[A-Z]/.test(newPassword),
    lowercase: /[a-z]/.test(newPassword),
    number: /\d/.test(newPassword),
    special: /[!@#$%^&*(),.?":{}|<>]/.test(newPassword),
  };
  const passwordValid = Object.values(passwordChecks).every(Boolean);

  const handleImageChange = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error(t("profile.imageError"));
      return;
    }
    setUploadingImage(true);
    try {
      const form = new FormData();
      form.append("image", file);
      await updateImage(form);
      toast.success(t("profile.imageSuccess"));
      refreshUser();
    } catch {
      toast.error(t("profile.imageUploadError"));
    } finally {
      setUploadingImage(false);
    }
  };

  const handleTelegramConnect = async () => {
    setConnectingTelegram(true);
    const win = window.open("", "_blank");
    if (win) {
      try {
        win.opener = null;
      } catch {}
    }
    try {
      const token = (await getTelegramConnectToken())?.token;
      if (!token) {
        win?.close();
        toast.error(tCommon("messages.error"));
        return;
      }
      const url = `tg://resolve?domain=${TELEGRAM_BOT}&start=verify_${token}`;
      if (win && !win.closed) win.location.href = url;
      else window.location.href = url;
    } catch {
      win?.close();
      toast.error(tCommon("messages.error"));
    } finally {
      setConnectingTelegram(false);
    }
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (name.length < 3) {
      toast.error(t("profile.nameError"));
      return;
    }
    if (!/^\+998\s?\d{2}\s?\d{3}\s?\d{2}\s?\d{2}$/.test(phone)) {
      toast.error(t("profile.phoneError"));
      return;
    }
    setSavingProfile(true);
    try {
      await updateSettings({
        name,
        email,
        phone: phone.replace(/\s/g, ""),
        telegram_id: telegramId,
      });
      toast.success(t("profile.saveSuccess"));
      refreshUser();
    } catch {
      toast.error(t("profile.saveError"));
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordValid) {
      toast.error(t("security.passwordInvalid"));
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error(t("security.passwordMismatch"));
      return;
    }
    setSavingPassword(true);
    try {
      await updatePassword({
        current_password: currentPassword,
        new_password: newPassword,
        confirm_new_password: confirmPassword,
      });
      toast.success(
        t(hasPassword ? "security.passwordSuccess" : "security.setPasswordSuccess"),
      );
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      await refreshUser();
    } catch {
      toast.error(t("security.passwordError"));
    } finally {
      setSavingPassword(false);
    }
  };

  const requirements: { key: keyof typeof passwordChecks; label: string }[] = [
    { key: "length", label: t("security.requirements.length") },
    { key: "uppercase", label: t("security.requirements.uppercase") },
    { key: "lowercase", label: t("security.requirements.lowercase") },
    { key: "number", label: t("security.requirements.number") },
    { key: "special", label: t("security.requirements.special") },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">
          {t("title")}
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">{t("subtitle")}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <YbCard className="lg:col-span-1">
          <div className="text-center py-8">
            <div className="relative inline-block mb-4">
              <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center mx-auto overflow-hidden">
                {user?.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={user.image}
                    alt={user.name ?? undefined}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <span className="text-3xl sm:text-4xl font-bold text-white">
                    {initials(user?.name || user?.full_name || user?.email || "U")}
                  </span>
                )}
              </div>
              <button
                type="button"
                aria-label={tCommon("actions.upload")}
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingImage}
                className="absolute bottom-0 right-0 p-2 rounded-full bg-primary-500 text-white hover:bg-primary-600 transition-colors shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-400"
              >
                {uploadingImage ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Camera className="w-5 h-5" />
                )}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
              />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {user?.name || user?.full_name || t("profile.user")}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {user?.email}
            </p>
            <div className="mt-6 p-4 rounded-xl bg-gradient-to-r from-primary-500/10 to-secondary-500/10 dark:from-primary-500/20 dark:to-secondary-500/20">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {t("profile.balance")}
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {formatSum(user?.balance ?? 0) ?? "0"} so&apos;m
              </p>
            </div>
          </div>
        </YbCard>

        <YbCard className="lg:col-span-3 p-0">
          <div className="p-0">
            <div className="border-b border-gray-200 dark:border-gray-700">
              <YbTabs
                tabs={tabs}
                active={activeTab}
                onChange={setActiveTab}
                ariaLabel={t("title")}
                idBase={idBase}
                className="grid grid-cols-3 sm:flex"
                tabClassName={({ isActive }) =>
                  cn(
                    "flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 px-2 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-medium border-b-2 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500",
                    isActive
                      ? "border-primary-500 text-primary-600 dark:text-primary-400 bg-primary-50/50 dark:bg-primary-900/20"
                      : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300",
                  )
                }
              />
            </div>
            <div className="p-4 sm:p-6">
              {activeTab === "profile" && (
                <form
                  role="tabpanel"
                  id={tabPanelId(idBase, "profile")}
                  aria-labelledby={tabId(idBase, "profile")}
                  tabIndex={0}
                  onSubmit={handleProfileSubmit}
                  className="space-y-5 focus:outline-none animate-in fade-in slide-in-from-bottom-2 duration-200"
                >
                  <YbInput
                    label={t("profile.name")}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={t("profile.namePlaceholder")}
                    required
                  />
                  <YbInput
                    label={t("profile.email")}
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={t("profile.emailPlaceholder")}
                    required
                  />
                  <YbInput
                    label={t("profile.phone")}
                    value={phone}
                    onChange={(e) => setPhone(formatPhone(e.target.value))}
                    placeholder={t("profile.phonePlaceholder")}
                    required
                  />
                  <div className="space-y-2">
                    <YbInput
                      label={t("profile.telegramId")}
                      value={telegramId}
                      onChange={(e) => setTelegramId(e.target.value)}
                      placeholder={t("profile.telegramIdPlaceholder")}
                      disabled
                    />
                    {!user?.telegram_id && user?.id != null && (
                      <button
                        type="button"
                        onClick={handleTelegramConnect}
                        disabled={connectingTelegram}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-[#0088cc] hover:bg-[#0077b5] text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
                      >
                        <svg
                          className="w-4 h-4"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                        >
                          <path d={TELEGRAM_ICON_PATH} />
                        </svg>
                        {connectingTelegram ? "..." : t("profile.verifyTelegram")}
                        <ExternalLink className="w-3.5 h-3.5" />
                      </button>
                    )}
                    {user?.telegram_id && (
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
                          <Check className="w-4 h-4" />
                          {t("profile.telegramVerified")}
                        </div>
                        <button
                          type="button"
                          onClick={handleTelegramConnect}
                          disabled={connectingTelegram}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-[#0088cc] hover:text-white hover:bg-[#0088cc] border border-[#0088cc] rounded-lg transition-colors disabled:opacity-50"
                        >
                          <svg
                            className="w-3.5 h-3.5"
                            viewBox="0 0 24 24"
                            fill="currentColor"
                          >
                            <path d={TELEGRAM_ICON_PATH} />
                          </svg>
                          {connectingTelegram
                            ? "..."
                            : t("profile.changeTelegram")}
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="flex justify-end pt-4">
                    <YbButton
                      type="submit"
                      variant="primary"
                      loading={savingProfile}
                      leftIcon={<Save className="w-4 h-4" />}
                    >
                      {t("profile.save")}
                    </YbButton>
                  </div>
                </form>
              )}

              {activeTab === "security" && (
                <form
                  role="tabpanel"
                  id={tabPanelId(idBase, "security")}
                  aria-labelledby={tabId(idBase, "security")}
                  tabIndex={0}
                  onSubmit={handlePasswordSubmit}
                  className="space-y-5 focus:outline-none animate-in fade-in slide-in-from-bottom-2 duration-200"
                >
                  {hasPassword ? (
                    <YbInput
                      label={t("security.currentPassword")}
                      type="password"
                      autoComplete="current-password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder={t("security.currentPasswordPlaceholder")}
                      required
                    />
                  ) : (
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {t("security.setPasswordHint")}
                    </p>
                  )}
                  <YbInput
                    label={t("security.newPassword")}
                    type="password"
                    autoComplete="new-password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder={t("security.newPasswordPlaceholder")}
                    required
                  />
                  {newPassword && (
                    <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 space-y-2">
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {t("security.passwordRequirements")}:
                      </p>
                      {requirements.map((req) => (
                        <div
                          key={req.key}
                          className="flex items-center gap-2 text-sm"
                        >
                          {passwordChecks[req.key] ? (
                            <Check className="w-4 h-4 text-green-500" />
                          ) : (
                            <Circle className="w-4 h-4 text-gray-400" />
                          )}
                          <span
                            className={
                              passwordChecks[req.key]
                                ? "text-green-600 dark:text-green-400"
                                : "text-gray-500"
                            }
                          >
                            {req.label}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                  <YbInput
                    label={t("security.confirmPassword")}
                    type="password"
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder={t("security.confirmPasswordPlaceholder")}
                    required
                  />
                  <div className="flex justify-end pt-4">
                    <YbButton
                      type="submit"
                      variant="primary"
                      loading={savingPassword}
                      disabled={!passwordValid || newPassword !== confirmPassword}
                      leftIcon={<Shield className="w-4 h-4" />}
                    >
                      {t(
                        hasPassword
                          ? "security.changePassword"
                          : "security.setPassword",
                      )}
                    </YbButton>
                  </div>
                </form>
              )}

              {activeTab === "notifications" && (
                <div
                  role="tabpanel"
                  id={tabPanelId(idBase, "notifications")}
                  aria-labelledby={tabId(idBase, "notifications")}
                  tabIndex={0}
                  className="space-y-6 focus:outline-none animate-in fade-in slide-in-from-bottom-2 duration-200"
                >
                  <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 opacity-60">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-gray-900 dark:text-gray-100">
                          {t("notifications.email")}
                        </p>
                        <span className="px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                          {t("notifications.comingSoonBadge")}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {t("notifications.emailDescription")}
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-not-allowed">
                      <input
                        type="checkbox"
                        checked={emailNotifications}
                        onChange={(e) => setEmailNotifications(e.target.checked)}
                        disabled
                        aria-disabled="true"
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-500" />
                    </label>
                  </div>
                  <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 opacity-60">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-gray-900 dark:text-gray-100">
                          {t("notifications.sms")}
                        </p>
                        <span className="px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                          {t("notifications.comingSoonBadge")}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {t("notifications.smsDescription")}
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-not-allowed">
                      <input
                        type="checkbox"
                        checked={smsNotifications}
                        onChange={(e) => setSmsNotifications(e.target.checked)}
                        disabled
                        aria-disabled="true"
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-500" />
                    </label>
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 italic">
                    {t("notifications.comingSoon")}
                  </p>
                </div>
              )}
            </div>
          </div>
        </YbCard>
      </div>
    </div>
  );
}
