"use client";

import { useMemo, useState, type FormEvent } from "react";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import {
  AlertTriangle,
  Calendar,
  Check,
  CheckCircle2,
  ChevronDown,
  Copy,
  Crown,
  CreditCard,
  ExternalLink,
  Landmark,
  Package,
  TrendingUp,
  Upload,
  Wallet,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ApiError } from "@/lib/api";
import { copyToClipboard } from "@/lib/clipboard";
import { formatCardNumber, formatSum } from "@/lib/money";
import { formatDateTime } from "@/lib/relative-time";
import type { BillingPlan, Payment } from "@/lib/api/billing";
import {
  useBalance,
  useCreateOnlinePayment,
  usePaymentRequisites,
  usePayments,
  usePlans,
  useSubscribePlan,
  useUploadReceipt,
} from "@/hooks/use-billing";
import { usePlan } from "@/hooks/use-stats";
import { YbCard } from "@/components/yb/card";
import { YbButton } from "@/components/yb/button";
import { YbInput } from "@/components/yb/input";
import { YbModal } from "@/components/yb/modal";
import { YbDataTable, type YbColumn } from "@/components/yb/data-table";

const MIN_TOPUP = 1000;
const FAQ_IDS = [
  "faq-1",
  "faq-2",
  "faq-3",
  "faq-4",
  "faq-5",
  "faq-6",
] as const;
const FEATURE_KEYS = ["accounts", "products", "analytics", "crm"] as const;

export type BillingSection = "pricing" | "billing";

function formatSom(value: string | number | null | undefined): string {
  const formatted = formatSum(value);
  return formatted === null ? "—" : `${formatted} so'm`;
}

/** "10000" -> "10 000" for the amount input. */
function groupDigits(value: string): string {
  return value.replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}

function planVisual(plan: BillingPlan, index: number) {
  if (plan.lead_limit === null) {
    return { Icon: Crown, gradient: "from-accent-500 to-accent-600" };
  }
  const icons = [Package, Zap, Zap];
  const gradients = [
    "from-gray-500 to-gray-600",
    "from-primary-500 to-primary-600",
    "from-secondary-500 to-secondary-600",
  ];
  const i = Math.min(index, icons.length - 1);
  return { Icon: icons[i], gradient: gradients[i] };
}

// --- Pricing section ---

function PricingSection() {
  const t = useTranslations("pricing");
  const tBilling = useTranslations("billing.pricing");

  const plansQuery = usePlans();
  const planQuery = usePlan();
  const balanceQuery = useBalance();
  const subscribe = useSubscribePlan();
  const onlinePayment = useCreateOnlinePayment();

  const [confirmPlan, setConfirmPlan] = useState<BillingPlan | null>(null);
  const [openFaq, setOpenFaq] = useState<string | null>(null);

  const plans = plansQuery.data ?? [];
  const currentPlanName = planQuery.data?.plan_name ?? null;
  const balance = Number(balanceQuery.data?.balance ?? 0);

  const isCurrent = (plan: BillingPlan) =>
    currentPlanName !== null && plan.name === currentPlanName;

  const handleSubscribe = () => {
    const plan = confirmPlan;
    if (!plan || subscribe.isPending) return;
    subscribe.mutate(
      { plan_id: plan.id, period: "monthly" },
      {
        onSuccess: () => {
          setConfirmPlan(null);
          toast.success(t("toast.subscribeSuccess"));
        },
        onError: (error) => {
          setConfirmPlan(null);
          toast.error(
            error instanceof ApiError && error.status === 402
              ? tBilling("insufficientBalance")
              : t("toast.subscribeError"),
          );
        },
      },
    );
  };

  const handleTopUpShortfall = (shortfall: number) => {
    const amount = Math.max(shortfall, MIN_TOPUP);
    onlinePayment.mutate(amount, {
      onSuccess: (data) => {
        setConfirmPlan(null);
        window.open(data.payment_url, "_blank", "noopener,noreferrer");
      },
      onError: () => toast.error(t("toast.invoiceError")),
    });
  };

  return (
    <div className="space-y-8">
      {/* Plan cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {plans.map((plan, index) => {
          const { Icon, gradient } = planVisual(plan, index);
          const current = isCurrent(plan);
          const popular = plan.lead_limit === null;
          const price = plan.price_monthly;
          return (
            <div
              key={String(plan.id)}
              className="animate-in fade-in slide-in-from-bottom-4 duration-300"
            >
              <YbCard
                className={cn(
                  "relative overflow-hidden h-full flex flex-col",
                  current
                    ? "ring-2 ring-green-500 dark:ring-green-400"
                    : popular &&
                        "ring-2 ring-primary-500 dark:ring-primary-400",
                )}
              >
                {current ? (
                  <div className="absolute top-0 right-0">
                    <div className="flex items-center gap-1 bg-green-500 text-white text-xs font-semibold px-3 py-1.5 rounded-bl-xl">
                      <Check className="w-3.5 h-3.5" />
                      {t("badges.current")}
                    </div>
                  </div>
                ) : (
                  popular && (
                    <div className="absolute top-0 right-0">
                      <div className="bg-gradient-to-r from-primary-500 to-secondary-500 text-white text-xs font-semibold px-4 py-1.5 rounded-bl-xl">
                        {t("badges.popular")}
                      </div>
                    </div>
                  )
                )}
                <div className="flex flex-col h-full">
                  <div
                    className={cn(
                      "w-14 h-14 rounded-xl bg-gradient-to-br flex items-center justify-center mb-4",
                      gradient,
                    )}
                  >
                    <Icon className="w-7 h-7 text-white" />
                  </div>
                  <div className="mb-4">
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-1">
                      {plan.name}
                    </h3>
                  </div>
                  <div className="mb-6">
                    {plan.is_free || price === 0 ? (
                      <span className="text-4xl font-bold text-gray-900 dark:text-gray-100">
                        {t("badges.free")}
                      </span>
                    ) : (
                      <div className="flex items-baseline gap-1">
                        <span className="text-4xl font-bold text-gray-900 dark:text-gray-100">
                          {formatSum(Math.round(price))}
                        </span>
                        <span className="text-gray-600 dark:text-gray-400">
                          {t("billing.perMonth")}
                        </span>
                      </div>
                    )}
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mt-2">
                      {plan.lead_limit === null
                        ? t("billing.unlimitedLeads")
                        : t("billing.leadsPerMonth", {
                            leads: formatSum(plan.lead_limit) ?? "0",
                          })}
                    </p>
                  </div>
                  <div className="flex-1 mb-6">
                    <ul className="space-y-3">
                      {FEATURE_KEYS.map((key) => (
                        <li key={key} className="flex items-start gap-3">
                          <div
                            className={cn(
                              "w-5 h-5 rounded-full bg-gradient-to-br flex items-center justify-center flex-shrink-0 mt-0.5",
                              gradient,
                            )}
                          >
                            <Check className="w-3 h-3 text-white" />
                          </div>
                          <span className="text-sm text-gray-700 dark:text-gray-300">
                            {tBilling(`features.${key}`)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <YbButton
                    variant={popular ? "primary" : "outline"}
                    size="md"
                    className="w-full"
                    onClick={() => setConfirmPlan(plan)}
                    disabled={subscribe.isPending || (current && plan.is_free)}
                    loading={
                      subscribe.isPending && confirmPlan?.id === plan.id
                    }
                  >
                    {current
                      ? plan.is_free
                        ? t("buttons.currentPlan")
                        : t("buttons.renew")
                      : t("buttons.subscribe")}
                  </YbButton>
                </div>
              </YbCard>
            </div>
          );
        })}
      </div>

      {/* Custom needs */}
      <YbCard className="bg-gradient-to-r from-primary-50 to-secondary-50 dark:from-slate-800 dark:to-slate-800 border-primary-200 dark:border-slate-700">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">
              {t("sections.customNeeds")}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {t("sections.customNeedsDesc")}
            </p>
          </div>
          <YbButton
            variant="primary"
            size="md"
            onClick={() =>
              window.open(
                "https://t.me/LidlarUz",
                "_blank",
                "noopener,noreferrer",
              )
            }
            className="whitespace-nowrap"
          >
            {t("buttons.contact")}
          </YbButton>
        </div>
      </YbCard>

      {/* Feature trio */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
        <YbCard className="text-center">
          <div className="w-12 h-12 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center mx-auto mb-4">
            <Check className="w-6 h-6 text-primary-600 dark:text-primary-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
            {t("features.cancellation")}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {t("features.cancellationDesc")}
          </p>
        </YbCard>
        <YbCard className="text-center">
          <div className="w-12 h-12 rounded-full bg-secondary-100 dark:bg-secondary-900/30 flex items-center justify-center mx-auto mb-4">
            <Zap className="w-6 h-6 text-secondary-600 dark:text-secondary-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
            {t("features.instantActivation")}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {t("features.instantActivationDesc")}
          </p>
        </YbCard>
        <YbCard className="text-center">
          <div className="w-12 h-12 rounded-full bg-accent-100 dark:bg-accent-900/30 flex items-center justify-center mx-auto mb-4">
            <TrendingUp className="w-6 h-6 text-accent-600 dark:text-accent-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
            {t("features.planChange")}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {t("features.planChangeDesc")}
          </p>
        </YbCard>
      </div>

      {/* FAQ */}
      <div className="mt-12">
        <div className="text-center mb-8">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100 mb-3">
            {t("faq.title")}
          </h2>
          <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            {t("faq.subtitle")}
          </p>
        </div>
        <div className="max-w-3xl mx-auto space-y-4">
          {FAQ_IDS.map((id) => {
            const open = openFaq === id;
            return (
              <YbCard
                key={id}
                className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer p-0"
                onClick={() => setOpenFaq(open ? null : id)}
              >
                <div className="p-4 md:p-5">
                  <div className="flex items-center justify-between gap-4">
                    <h3 className="text-base md:text-lg font-semibold text-gray-900 dark:text-gray-100 flex-1">
                      {t(`faq.${id}.question`)}
                    </h3>
                    <div className="flex-shrink-0">
                      <ChevronDown
                        className={cn(
                          "w-5 h-5 text-gray-500 dark:text-gray-400 transition-transform duration-200",
                          open && "rotate-180",
                        )}
                      />
                    </div>
                  </div>
                  {open && (
                    <div className="overflow-hidden animate-in fade-in slide-in-from-top-1 duration-200">
                      <p className="text-sm md:text-base text-gray-600 dark:text-gray-400 mt-3 leading-relaxed">
                        {t(`faq.${id}.answer`)}
                      </p>
                    </div>
                  )}
                </div>
              </YbCard>
            );
          })}
        </div>
      </div>

      {/* Plan confirm modal */}
      <YbModal
        isOpen={confirmPlan !== null}
        onClose={() => setConfirmPlan(null)}
        title={t("modal.confirmTitle")}
        size="md"
      >
        {confirmPlan !== null &&
          (() => {
            const price = confirmPlan.price_monthly;
            const free = confirmPlan.is_free || price === 0;
            const shortfall = Math.max(0, price - balance);
            const needsTopUp = !free && shortfall > 0;
            const current = isCurrent(confirmPlan);
            return (
              <div className="space-y-4">
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                  <h4 className="font-semibold text-lg text-gray-900 dark:text-gray-100 mb-1">
                    {confirmPlan.name}
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                    {confirmPlan.lead_limit === null
                      ? t("billing.unlimitedLeads")
                      : t("billing.leadsPerMonth", {
                          leads: formatSum(confirmPlan.lead_limit) ?? "0",
                        })}
                  </p>
                  <div className="flex items-baseline gap-2">
                    {free ? (
                      <span className="text-2xl font-bold text-primary-600 dark:text-primary-400">
                        {t("badges.free")}
                      </span>
                    ) : (
                      <>
                        <span className="text-2xl font-bold text-primary-600 dark:text-primary-400">
                          {formatSom(price)}
                        </span>
                        <span className="text-gray-600 dark:text-gray-400">
                          {t("billing.perMonth")}
                        </span>
                      </>
                    )}
                  </div>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {current
                    ? t("modal.renewConfirm")
                    : t("modal.subscribeConfirm")}
                </p>
                {current && !free && (
                  <div className="flex gap-3 p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
                    <AlertTriangle className="w-5 h-5 flex-shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
                    <p className="text-sm text-amber-800 dark:text-amber-200">
                      {t("modal.renewWarning")}
                    </p>
                  </div>
                )}
                {!free && (
                  <div className="rounded-lg border border-gray-200 dark:border-gray-700 divide-y divide-gray-200 dark:divide-gray-700 text-sm">
                    <div className="flex items-center justify-between p-3">
                      <span className="text-gray-600 dark:text-gray-400">
                        {t("balance.currentBalance")}
                      </span>
                      <span className="font-semibold text-gray-900 dark:text-gray-100">
                        {formatSom(balance)}
                      </span>
                    </div>
                    {needsTopUp && (
                      <div className="flex items-center justify-between p-3 bg-amber-50 dark:bg-amber-900/10">
                        <span className="text-amber-700 dark:text-amber-300">
                          {t("modal.shortfall")}
                        </span>
                        <span className="font-bold text-amber-700 dark:text-amber-300">
                          {formatSom(shortfall)}
                        </span>
                      </div>
                    )}
                  </div>
                )}
                <div className="flex gap-3 pt-2">
                  <YbButton
                    variant="outline"
                    className="flex-1"
                    onClick={() => setConfirmPlan(null)}
                  >
                    {t("modal.cancel")}
                  </YbButton>
                  {needsTopUp ? (
                    <YbButton
                      variant="primary"
                      className="flex-1"
                      onClick={() => handleTopUpShortfall(shortfall)}
                      loading={onlinePayment.isPending}
                      leftIcon={<Wallet className="w-4 h-4" />}
                    >
                      {t("modal.topUp", {
                        amount: formatSom(Math.max(shortfall, MIN_TOPUP)),
                      })}
                    </YbButton>
                  ) : (
                    <YbButton
                      variant="primary"
                      className="flex-1"
                      onClick={handleSubscribe}
                      loading={subscribe.isPending}
                    >
                      {current
                        ? t("buttons.renew")
                        : t("modal.confirm")}
                    </YbButton>
                  )}
                </div>
              </div>
            );
          })()}
      </YbModal>
    </div>
  );
}

// --- Billing (balance) section ---

const PAYMENT_STATUS_CLASSES: Record<Payment["status"], string> = {
  confirmed:
    "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  rejected: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  pending:
    "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
};

function BillingSectionView() {
  const t = useTranslations("pricing");
  const locale = useLocale();

  const balanceQuery = useBalance();
  const requisitesQuery = usePaymentRequisites();
  const paymentsQuery = usePayments();
  const uploadReceipt = useUploadReceipt();
  const onlinePayment = useCreateOnlinePayment();

  const [method, setMethod] = useState<"online" | "manual">("online");
  const [amount, setAmount] = useState("");
  const [receipt, setReceipt] = useState<File | null>(null);

  const payments = paymentsQuery.data ?? [];
  const amountValue = Number(amount || 0);

  const statusBadge = (status: Payment["status"]) => (
    <span
      className={cn(
        "px-2 py-1 text-xs font-medium rounded-full",
        PAYMENT_STATUS_CLASSES[status] ?? PAYMENT_STATUS_CLASSES.pending,
      )}
    >
      {status === "confirmed"
        ? t("status.active")
        : status === "rejected"
          ? t("status.error")
          : t("status.pending")}
    </span>
  );

  const handleCopyCard = async (cardNumber: string) => {
    const ok = await copyToClipboard(cardNumber.replace(/\s+/g, ""));
    if (ok) toast.success(t("toast.copied"));
  };

  const handleOnlinePay = () => {
    if (!amount || amountValue < MIN_TOPUP) {
      toast.error(t("toast.amountError"));
      return;
    }
    onlinePayment.mutate(amountValue, {
      onSuccess: (data) => {
        window.open(data.payment_url, "_blank", "noopener,noreferrer");
      },
      onError: () => toast.error(t("toast.invoiceError")),
    });
  };

  const handleReceiptSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!amount || amountValue <= 0) {
      toast.error(t("toast.amountError"));
      return;
    }
    if (!receipt) {
      toast.error(t("toast.receiptError"));
      return;
    }
    uploadReceipt.mutate(
      { amount: amountValue, receipt },
      {
        onSuccess: () => {
          toast.success(t("toast.submitSuccess"));
          setAmount("");
          setReceipt(null);
        },
        onError: () => toast.error(t("toast.submitError")),
      },
    );
  };

  const columns = useMemo<YbColumn<Payment>[]>(
    () => [
      {
        key: "amount",
        header: t("table.amount"),
        sortable: true,
        searchValue: (row) => String(row.amount),
        accessor: (row) => (
          <span className="font-semibold text-gray-900 dark:text-gray-100">
            {formatSom(row.amount)}
          </span>
        ),
      },
      {
        key: "receipt",
        header: t("table.receipt"),
        sortable: false,
        accessor: (row) =>
          row.receipt_filename ? (
            <span className="text-gray-600 dark:text-gray-400 truncate max-w-48 inline-block align-bottom">
              {row.receipt_filename}
            </span>
          ) : (
            <span className="text-gray-400">—</span>
          ),
      },
      {
        key: "status",
        header: t("table.status"),
        sortable: true,
        searchValue: (row) => row.status,
        accessor: (row) => statusBadge(row.status),
      },
      {
        key: "created_at",
        header: t("table.date"),
        sortable: true,
        searchValue: (row) => formatDateTime(row.created_at, locale) ?? "",
        accessor: (row) => (
          <span className="text-gray-500 dark:text-gray-400 flex items-center gap-1">
            <Calendar className="w-4 h-4" />
            {formatDateTime(row.created_at, locale) ?? "—"}
          </span>
        ),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [t, locale],
  );

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Balance + payment info */}
        <YbCard>
          <div className="flex items-center gap-4 mb-6">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center">
              <Wallet className="w-7 h-7 text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {t("balance.currentBalance")}
              </p>
              <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                {formatSom(balanceQuery.data?.balance)}
              </p>
            </div>
          </div>
          <div className="space-y-3">
            <h4 className="font-semibold text-gray-900 dark:text-gray-100">
              {t("balance.paymentInfo")}
            </h4>
            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {t("balance.cardNumber")}
                </p>
                <p className="font-mono font-semibold text-gray-900 dark:text-gray-100">
                  {requisitesQuery.data
                    ? formatCardNumber(requisitesQuery.data.card_number)
                    : "—"}
                </p>
              </div>
              {requisitesQuery.data && (
                <YbButton
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    handleCopyCard(requisitesQuery.data.card_number)
                  }
                  leftIcon={<Copy className="w-4 h-4" />}
                >
                  {t("buttons.copy")}
                </YbButton>
              )}
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {t("balance.cardHolder")}
                </p>
                <p className="font-semibold text-gray-900 dark:text-gray-100">
                  {requisitesQuery.data?.card_holder ?? "—"}
                </p>
              </div>
            </div>
          </div>
          <div className="mt-4 p-4 rounded-xl bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800">
            <h4 className="font-semibold text-yellow-800 dark:text-yellow-200 mb-2 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              {t("warnings.title")}
            </h4>
            <ul className="text-sm text-yellow-700 dark:text-yellow-300 space-y-1 list-disc list-inside">
              <li>{t("warnings.cardDigits")}</li>
              <li>{t("warnings.noReceipt")}</li>
              <li>{t("warnings.manualReview")}</li>
              <li>{t("warnings.timeRequired")}</li>
            </ul>
            <p className="mt-3 text-sm text-yellow-700 dark:text-yellow-300">
              {t("warnings.issuesContact")}{" "}
              <a
                href="https://t.me/LidlarMuhokama"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium underline inline-flex items-center gap-1"
              >
                @LidlarMuhokama <ExternalLink className="w-3 h-3" />
              </a>
            </p>
          </div>
        </YbCard>

        {/* Top up */}
        <YbCard>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            {t("balance.topUp")}
          </h3>
          <div className="grid grid-cols-2 gap-3 mb-5">
            {(
              [
                {
                  key: "online" as const,
                  Icon: CreditCard,
                  label: t("balance.onlinePayment"),
                },
                {
                  key: "manual" as const,
                  Icon: Landmark,
                  label: t("balance.manualPayment"),
                },
              ] as const
            ).map(({ key, Icon, label }) => (
              <button
                key={key}
                type="button"
                onClick={() => setMethod(key)}
                className={cn(
                  "relative flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all",
                  method === key
                    ? "border-primary-500 bg-primary-50 dark:bg-primary-900/20 shadow-sm"
                    : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600",
                )}
              >
                <div
                  className={cn(
                    "w-10 h-10 rounded-lg flex items-center justify-center",
                    method === key
                      ? "bg-primary-100 dark:bg-primary-800/40"
                      : "bg-gray-100 dark:bg-gray-800",
                  )}
                >
                  <Icon
                    className={cn(
                      "w-5 h-5",
                      method === key
                        ? "text-primary-600 dark:text-primary-400"
                        : "text-gray-500 dark:text-gray-400",
                    )}
                  />
                </div>
                <span
                  className={cn(
                    "text-sm font-medium",
                    method === key
                      ? "text-primary-700 dark:text-primary-300"
                      : "text-gray-700 dark:text-gray-300",
                  )}
                >
                  {label}
                </span>
              </button>
            ))}
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
            {t(
              method === "online"
                ? "balance.onlinePaymentDesc"
                : "balance.manualPaymentDesc",
            )}
          </p>
          <div className="space-y-4">
            <div>
              <YbInput
                label={t("balance.amount")}
                type="text"
                inputMode="numeric"
                pattern="[0-9 ]*"
                value={groupDigits(amount)}
                onChange={(e) =>
                  setAmount(e.target.value.replace(/\D/g, ""))
                }
                placeholder={t("balance.amountPlaceholder")}
                required
              />
              {method === "online" && (
                <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
                  {t("balance.minAmount", {
                    amount: formatSum(MIN_TOPUP) ?? String(MIN_TOPUP),
                  })}
                </p>
              )}
            </div>
            {method === "online" && (
              <div className="space-y-3">
                <YbButton
                  type="button"
                  variant="primary"
                  onClick={handleOnlinePay}
                  loading={onlinePayment.isPending}
                  disabled={
                    onlinePayment.isPending ||
                    !amount ||
                    amountValue < MIN_TOPUP
                  }
                  leftIcon={<CreditCard className="w-5 h-5" />}
                  className="w-full bg-[#00AEEF] hover:bg-[#009BD6] border-[#00AEEF]"
                >
                  {t("balance.payVia")}
                </YbButton>
              </div>
            )}
            {method === "manual" && (
              <form onSubmit={handleReceiptSubmit} className="space-y-4">
                <div>
                  <label
                    htmlFor="payment-image"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                  >
                    {t("balance.receipt")}
                  </label>
                  <button
                    type="button"
                    onClick={() =>
                      document.getElementById("payment-image")?.click()
                    }
                    className={cn(
                      "w-full border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors",
                      receipt
                        ? "border-green-300 bg-green-50 dark:border-green-700 dark:bg-green-900/20"
                        : "border-gray-300 dark:border-gray-600 hover:border-primary-400",
                    )}
                  >
                    {receipt ? (
                      <div className="flex items-center justify-center gap-2 text-green-600 dark:text-green-400">
                        <CheckCircle2 className="w-5 h-5" />
                        <span>{receipt.name}</span>
                      </div>
                    ) : (
                      <div className="text-gray-500 dark:text-gray-400">
                        <Upload className="w-8 h-8 mx-auto mb-2" />
                        <p>{t("balance.uploadReceipt")}</p>
                      </div>
                    )}
                  </button>
                  <input
                    id="payment-image"
                    type="file"
                    accept="image/*,application/pdf,.pdf"
                    onChange={(e) => setReceipt(e.target.files?.[0] || null)}
                    className="hidden"
                    aria-label={t("balance.uploadReceipt")}
                  />
                </div>
                <YbButton
                  type="submit"
                  variant="primary"
                  loading={uploadReceipt.isPending}
                  leftIcon={<Wallet className="w-4 h-4" />}
                  className="w-full"
                >
                  {t("buttons.topUp")}
                </YbButton>
              </form>
            )}
          </div>
        </YbCard>
      </div>

      {/* Payment history */}
      <YbCard>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          {t("balance.paymentHistory")}
        </h3>
        {payments.length === 0 && !paymentsQuery.isLoading ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <Wallet className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>{t("balance.noPayments")}</p>
          </div>
        ) : (
          <YbDataTable
            data={payments}
            columns={columns}
            loading={paymentsQuery.isLoading}
            searchPlaceholder={t("balance.searchPayments")}
            emptyMessage={t("balance.noPayments")}
            defaultPageSize={10}
            pageSizeOptions={[10, 25, 50]}
          />
        )}
      </YbCard>
    </div>
  );
}

// --- Shell ---

export function BillingView({ section }: { section: BillingSection }) {
  const t = useTranslations("pricing");
  const balanceQuery = useBalance();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">
            {t(section === "billing" ? "tabs.balance" : "tabs.pricing")}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {t(section === "billing" ? "balanceSubtitle" : "subtitle")}
          </p>
        </div>
        <div className="flex items-center gap-3 px-4 py-2 bg-gradient-to-r from-primary-500/10 to-secondary-500/10 dark:from-primary-500/20 dark:to-secondary-500/20 rounded-xl">
          <Wallet className="w-5 h-5 text-primary-600 dark:text-primary-400" />
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {t("balance.current")}
            </p>
            <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
              {formatSom(balanceQuery.data?.balance)}
            </p>
          </div>
        </div>
      </div>

      <div className="animate-in fade-in slide-in-from-bottom-2 duration-200">
        {section === "pricing" ? <PricingSection /> : <BillingSectionView />}
      </div>
    </div>
  );
}
