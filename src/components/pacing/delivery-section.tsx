"use client";

import { useId } from "react";
import { useTranslations } from "next-intl";

const SELECT_DISABLED_CLASS =
  "w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 disabled:cursor-not-allowed";

/**
 * Production renders a full Telegram delivery block here (custom bot picker,
 * saved-chat picker with add-group/add-channel modals, manual chat id input
 * and forum-topic thread id). The local backend has no Telegram bot/chat
 * endpoints and the pacing payload carries no delivery fields, so this keeps
 * the production section shell with disabled placeholders: the default-bot
 * option and the chat picker are shown but not interactive.
 */
export function DeliverySection() {
  const botId = useId();
  const chatId = useId();
  const t = useTranslations("leadPacing");
  const tPicker = useTranslations("integrations");
  const tChat = useTranslations("connections");

  return (
    <div className="space-y-3 pt-3 border-t border-gray-200 dark:border-gray-700">
      <p className="text-xs font-semibold text-gray-600 dark:text-gray-300">
        {t("delivery.title")}
      </p>

      <div>
        <label
          htmlFor={botId}
          className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1"
        >
          {tPicker("telegram_picker.label")}
        </label>
        <select id={botId} disabled className={SELECT_DISABLED_CLASS}>
          <option>{tPicker("telegram_picker.default_bot")}</option>
        </select>
        <p className="text-xs text-gray-500 dark:text-gray-400 px-1 mt-1">
          {tPicker("telegram_picker.default_hint")}
        </p>
      </div>

      <div>
        <label
          htmlFor={chatId}
          className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1"
        >
          {tChat("chat_picker.label")}
        </label>
        <select id={chatId} disabled className={SELECT_DISABLED_CLASS}>
          <option>{tChat("chat_picker.placeholder")}</option>
        </select>
      </div>

      <p className="text-[11px] text-gray-400">{t("delivery.hint")}</p>
    </div>
  );
}
