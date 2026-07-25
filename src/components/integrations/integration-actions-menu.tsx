"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Copy01Icon,
  Delete02Icon,
  EyeIcon,
  MoreVerticalIcon,
  PauseIcon,
  PencilEdit01Icon,
  PlayIcon,
  RefreshIcon,
  SentIcon,
} from "@hugeicons/core-free-icons";
import {
  webhookIncomingUrl,
  type Integration,
  type IntegrationAction,
} from "@/lib/api/integrations";
import { copyToClipboard } from "@/lib/clipboard";
import { useIntegrationAction } from "@/hooks/use-integrations";
import {
  DeleteIntegrationDialog,
  EditIntegrationDialog,
} from "@/components/integrations/integration-dialogs";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function IntegrationActionsMenu({
  integration,
  showOpenDetail = false,
  onDeleted,
  trigger,
}: {
  integration: Integration;
  showOpenDetail?: boolean;
  onDeleted?: () => void;
  trigger?: ReactNode;
}) {
  const t = useTranslations("integrations.actions");
  const tToasts = useTranslations("integrations.toasts");
  const actionMutation = useIntegrationAction();
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  function runAction(action: IntegrationAction) {
    actionMutation.mutate(
      { id: integration.id, action },
      {
        onSuccess: () => toast.success(tToasts("actionDone")),
        onError: () => toast.error(tToasts("error")),
      },
    );
  }

  const hasWebhookUrl =
    integration.source_type !== "facebook" && Boolean(integration.webhook_token);

  async function copyWebhook() {
    if (!integration.webhook_token) return;
    const ok = await copyToClipboard(webhookIncomingUrl(integration.webhook_token));
    if (ok) toast.success(tToasts("copied"));
    else toast.error(tToasts("error"));
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          {trigger ?? (
            <Button variant="ghost" size="icon-sm" aria-label={t("edit")}>
              <HugeiconsIcon icon={MoreVerticalIcon} />
            </Button>
          )}
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          {showOpenDetail && (
            <DropdownMenuItem asChild>
              <Link href={`/dashboard/integrations/${integration.id}`}>
                <HugeiconsIcon icon={EyeIcon} />
                {t("openDetail")}
              </Link>
            </DropdownMenuItem>
          )}
          {integration.status === "active" ? (
            <DropdownMenuItem onClick={() => runAction("pause")}>
              <HugeiconsIcon icon={PauseIcon} />
              {t("pause")}
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem onClick={() => runAction("start")}>
              <HugeiconsIcon icon={PlayIcon} />
              {t("start")}
            </DropdownMenuItem>
          )}
          <DropdownMenuItem onClick={() => runAction("send")}>
            <HugeiconsIcon icon={SentIcon} />
            {t("send")}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => runAction("reset")}>
            <HugeiconsIcon icon={RefreshIcon} />
            {t("reset")}
          </DropdownMenuItem>
          {hasWebhookUrl && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={copyWebhook}>
                <HugeiconsIcon icon={Copy01Icon} />
                {t("copyWebhook")}
              </DropdownMenuItem>
            </>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setEditOpen(true)}>
            <HugeiconsIcon icon={PencilEdit01Icon} />
            {t("edit")}
          </DropdownMenuItem>
          <DropdownMenuItem
            variant="destructive"
            onClick={() => setDeleteOpen(true)}
          >
            <HugeiconsIcon icon={Delete02Icon} />
            {t("delete")}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {editOpen && (
        <EditIntegrationDialog
          integration={integration}
          open={editOpen}
          onOpenChange={setEditOpen}
        />
      )}
      <DeleteIntegrationDialog
        integration={integration}
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        onDeleted={onDeleted}
      />
    </>
  );
}
