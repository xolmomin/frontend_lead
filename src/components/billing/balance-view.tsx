"use client";

import { useRef, useState, type FormEvent } from "react";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { HugeiconsIcon } from "@hugeicons/react";
import { Copy01Icon } from "@hugeicons/core-free-icons";
import { copyToClipboard } from "@/lib/clipboard";
import { formatCardNumber, formatSum } from "@/lib/money";
import { formatDateTime, formatRelativeTime } from "@/lib/relative-time";
import type { Payment, PaymentStatus } from "@/lib/api/billing";
import {
  useBalance,
  useCreateOnlinePayment,
  usePaymentRequisites,
  usePayments,
  useUploadReceipt,
} from "@/hooks/use-billing";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

const MAX_RECEIPT_SIZE = 5 * 1024 * 1024; // ~5MB
const RECEIPT_TYPES = /^image\/|^application\/pdf$/;

// Some browsers leave `file.type` empty — fall back to the extension.
function isAllowedReceipt(file: File): boolean {
  if (RECEIPT_TYPES.test(file.type)) return true;
  return /\.(pdf|png|jpe?g|gif|webp|heic|heif|bmp)$/i.test(file.name);
}

function LoadErrorState({ onRetry }: { onRetry: () => void }) {
  const t = useTranslations("dashboard");
  return (
    <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed py-10 text-center">
      <p className="text-sm text-muted-foreground">{t("loadError")}</p>
      <Button variant="outline" onClick={onRetry}>
        {t("retry")}
      </Button>
    </div>
  );
}

function BalanceCard() {
  const t = useTranslations("billing.balance");
  const tCommon = useTranslations("common");
  const tDashboard = useTranslations("dashboard");
  const balanceQuery = useBalance();

  const balance =
    balanceQuery.data !== null && balanceQuery.data !== undefined
      ? formatSum(balanceQuery.data.balance)
      : null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {t("currentBalance")}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {balanceQuery.isLoading ? (
          <Skeleton className="h-10 w-40" />
        ) : balanceQuery.isError ? (
          <div className="flex items-center gap-3">
            <p className="text-sm text-muted-foreground">
              {tCommon("error")}
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => balanceQuery.refetch()}
            >
              {tDashboard("retry")}
            </Button>
          </div>
        ) : (
          <p className="text-4xl font-bold text-primary">
            {balance ?? "—"}{" "}
            <span className="text-lg font-medium text-muted-foreground">
              {tCommon("sum")}
            </span>
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function RequisitesBlock() {
  const t = useTranslations("billing.balance");
  const requisitesQuery = usePaymentRequisites();

  if (requisitesQuery.isLoading) {
    return (
      <div className="flex flex-col gap-2 rounded-lg border bg-muted/40 p-4">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-4 w-32" />
      </div>
    );
  }

  if (requisitesQuery.isError || !requisitesQuery.data) {
    return <LoadErrorState onRetry={() => requisitesQuery.refetch()} />;
  }

  const { card_number, card_holder } = requisitesQuery.data;
  const formattedCard = formatCardNumber(card_number);

  async function handleCopy() {
    const ok = await copyToClipboard(card_number.replace(/\s+/g, ""));
    if (ok) toast.success(t("copied"));
    else toast.error(t("copyFailed"));
  }

  return (
    <div className="flex flex-col gap-1 rounded-lg border bg-muted/40 p-4">
      <p className="text-xs text-muted-foreground">{t("cardNumber")}</p>
      <div className="flex items-center gap-2">
        <p className="font-mono text-lg font-semibold tracking-wide">
          {formattedCard}
        </p>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label={t("copy")}
          onClick={handleCopy}
        >
          <HugeiconsIcon icon={Copy01Icon} className="size-4" />
        </Button>
      </div>
      <p className="text-sm text-muted-foreground">
        {t("cardHolder")}: {card_holder}
      </p>
    </div>
  );
}

function ReceiptTab() {
  const t = useTranslations("billing.balance");
  const upload = useUploadReceipt();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formError, setFormError] = useState<string | null>(null);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (upload.isPending) return;

    const form = event.currentTarget;
    const amount = Number(
      String(new FormData(form).get("amount") ?? "").replace(/\s+/g, ""),
    );
    const file = fileInputRef.current?.files?.[0];

    if (!Number.isFinite(amount) || amount <= 0) {
      setFormError(t("amountRequired"));
      return;
    }
    if (!file) {
      setFormError(t("fileRequired"));
      return;
    }
    if (!isAllowedReceipt(file)) {
      setFormError(t("invalidFileType"));
      return;
    }
    if (file.size > MAX_RECEIPT_SIZE) {
      setFormError(t("fileTooLarge"));
      return;
    }
    setFormError(null);

    upload.mutate(
      { amount, receipt: file },
      {
        onSuccess: () => {
          form.reset();
          toast.success(t("receiptPending"));
        },
        onError: () => toast.error(t("receiptError")),
      },
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <RequisitesBlock />
      <p className="text-sm text-muted-foreground">{t("receiptHint")}</p>
      <div className="flex flex-col gap-2">
        <Label htmlFor="receipt-amount">{t("amount")}</Label>
        <Input
          id="receipt-amount"
          name="amount"
          type="number"
          min={1}
          step="any"
          inputMode="numeric"
          placeholder={t("amountPlaceholder")}
          required
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="receipt-file">{t("receiptFile")}</Label>
        <Input
          id="receipt-file"
          name="receipt"
          type="file"
          accept="image/*,application/pdf,.pdf"
          ref={fileInputRef}
          required
        />
      </div>
      {formError && <p className="text-sm text-destructive">{formError}</p>}
      <Button type="submit" disabled={upload.isPending} className="self-start">
        {upload.isPending ? t("submitting") : t("submitReceipt")}
      </Button>
    </form>
  );
}

function OnlineTab() {
  const t = useTranslations("billing.balance");
  const online = useCreateOnlinePayment();

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (online.isPending) return;

    const form = event.currentTarget;
    const amount = Number(
      String(new FormData(form).get("amount") ?? "").replace(/\s+/g, ""),
    );
    if (!Number.isFinite(amount) || amount <= 0) return;

    online.mutate(amount, {
      onSuccess: (data) => {
        form.reset();
        window.open(data.payment_url, "_blank", "noopener,noreferrer");
      },
      onError: () => toast.error(t("onlineError")),
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <p className="text-sm text-muted-foreground">{t("onlineHint")}</p>
      <div className="flex flex-col gap-2">
        <Label htmlFor="online-amount">{t("amount")}</Label>
        <Input
          id="online-amount"
          name="amount"
          type="number"
          min={1}
          step="any"
          inputMode="numeric"
          placeholder={t("amountPlaceholder")}
          required
        />
      </div>
      <Button type="submit" disabled={online.isPending} className="self-start">
        {online.isPending ? t("submitting") : t("pay")}
      </Button>
    </form>
  );
}

const STATUS_VARIANT: Record<
  PaymentStatus,
  "default" | "outline" | "destructive"
> = {
  confirmed: "default",
  pending: "outline",
  rejected: "destructive",
};

function PaymentsHistory() {
  const t = useTranslations("billing.balance");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const paymentsQuery = usePayments();

  function statusLabel(status: Payment["status"]): string {
    switch (status) {
      case "confirmed":
        return t("statusConfirmed");
      case "rejected":
        return t("statusRejected");
      default:
        return t("statusPending");
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("historyTitle")}</CardTitle>
      </CardHeader>
      <CardContent>
        {paymentsQuery.isLoading ? (
          <div className="flex flex-col gap-2">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} className="h-10 w-full" />
            ))}
          </div>
        ) : paymentsQuery.isError || !paymentsQuery.data ? (
          <LoadErrorState onRetry={() => paymentsQuery.refetch()} />
        ) : paymentsQuery.data.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            {t("noPayments")}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("colDate")}</TableHead>
                  <TableHead>{t("colAmount")}</TableHead>
                  <TableHead>{t("colMethod")}</TableHead>
                  <TableHead>{t("colStatus")}</TableHead>
                  <TableHead>{t("colReceipt")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paymentsQuery.data.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell
                      className="whitespace-nowrap"
                      title={formatDateTime(payment.created_at, locale) ?? ""}
                    >
                      {formatRelativeTime(payment.created_at, locale) ?? "—"}
                    </TableCell>
                    <TableCell className="whitespace-nowrap font-medium">
                      {formatSum(payment.amount) ?? "—"} {tCommon("sum")}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      {payment.method === "online"
                        ? t("methodOnline")
                        : t("methodReceipt")}
                    </TableCell>
                    <TableCell>
                      <Badge variant={STATUS_VARIANT[payment.status]}>
                        {statusLabel(payment.status)}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-48 truncate text-muted-foreground">
                      {payment.receipt_filename || payment.comment || "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function BalanceView() {
  const t = useTranslations("billing.balance");

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold">{t("title")}</h1>

      <div className="grid items-start gap-6 xl:grid-cols-2">
        <div className="flex flex-col gap-6">
          <BalanceCard />
          <Card>
            <CardHeader>
              <CardTitle>{t("topUpTitle")}</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="receipt">
                <TabsList className="mb-4">
                  <TabsTrigger value="receipt">{t("tabReceipt")}</TabsTrigger>
                  <TabsTrigger value="online">{t("tabOnline")}</TabsTrigger>
                </TabsList>
                <TabsContent value="receipt">
                  <ReceiptTab />
                </TabsContent>
                <TabsContent value="online">
                  <OnlineTab />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
        <PaymentsHistory />
      </div>
    </div>
  );
}
