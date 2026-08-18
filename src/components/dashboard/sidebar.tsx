"use client";

import { Fragment, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  ChevronDown,
  CreditCard,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
  Sparkles,
} from "lucide-react";
import { cn, initials } from "@/lib/utils";
import { formatSum } from "@/lib/money";
import { logout } from "@/lib/api";
import { useUser } from "@/hooks/use-user";
import { useBalance } from "@/hooks/use-billing";
import { usePlan } from "@/hooks/use-stats";
import { navItems, type NavItem } from "./nav-items";
import { ConfirmModal } from "./confirm-modal";

function GroupSeparator({
  group,
  collapsed,
}: {
  group: string;
  collapsed: boolean;
}) {
  const t = useTranslations("navigation");
  return (
    <div className={cn("pt-1.5 pb-0.5", collapsed ? "px-2" : "px-4")}>
      {collapsed ? (
        <div className="h-px bg-muted" />
      ) : (
        <div className="flex items-center gap-2">
          <div className="flex-1 h-px bg-muted" />
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            {t(`group.${group}`)}
          </span>
          <div className="flex-1 h-px bg-muted" />
        </div>
      )}
    </div>
  );
}

export function SidebarContent({
  collapsed = false,
  onToggle,
  onNavigate,
}: {
  collapsed?: boolean;
  onToggle?: () => void;
  onNavigate?: () => void;
}) {
  const t = useTranslations("navigation");
  const tCommon = useTranslations("common");
  const pathname = usePathname();
  const router = useRouter();
  const { data: user } = useUser();
  const balanceQuery = useBalance();
  const planQuery = usePlan();

  const [expanded, setExpanded] = useState<Set<string>>(() => new Set());
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const balance = balanceQuery.data?.balance ?? user?.balance ?? 0;
  const planName = planQuery.data?.plan_name ?? "Bepul";

  function toggleExpand(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function isExpanded(item: NavItem) {
    return (
      expanded.has(item.id) ||
      (item.children?.some((c) => c.path && pathname.startsWith(c.path)) ??
        false)
    );
  }

  function renderLink(item: NavItem, isChild = false) {
    const Icon = item.icon;
    const active =
      item.path === "/dashboard"
        ? pathname === "/dashboard"
        : !!item.path && pathname.startsWith(item.path);
    return (
      <Link
        href={item.path ?? "#"}
        onClick={onNavigate}
        title={collapsed ? t(`menu.${item.id}`) : undefined}
      >
        <div
          className={cn(
            "flex items-center rounded-lg transition-colors duration-200",
            collapsed
              ? "justify-center px-2 py-3"
              : isChild
                ? "gap-3 px-4 py-2"
                : "gap-3 px-4 py-3",
            active
              ? "gradient-primary text-white shadow-e2"
              : isChild
                ? "text-muted-foreground hover:bg-muted"
                : "text-foreground/80 hover:bg-muted",
          )}
        >
          <Icon
            className={cn("flex-shrink-0", isChild ? "w-4 h-4" : "w-5 h-5")}
          />
          {!collapsed && (
            <span className={cn("font-medium", isChild && "text-sm")}>
              {t(`menu.${item.id}`)}
            </span>
          )}
        </div>
      </Link>
    );
  }

  async function onConfirmLogout() {
    setLoggingOut(true);
    try {
      await logout();
    } finally {
      setLoggingOut(false);
      setLogoutOpen(false);
      router.push("/login");
    }
  }

  const displayName = user?.full_name || user?.email || tCommon("user");

  return (
    <div className="flex h-full flex-col">
      <div className="h-16 flex items-center justify-between px-4 border-b border-border">
        <div
          className={cn(
            "flex items-center gap-3",
            collapsed && "justify-center w-full",
          )}
        >
          <div className="w-10 h-10 flex items-center justify-center flex-shrink-0">
            <Image
              src="https://cdn.lidlar.uz/static/logo.png"
              alt="Lidlar Logo"
              className="w-full h-full object-contain"
              width={40}
              height={40}
              priority
            />
          </div>
          {!collapsed && <span className="t-h3 text-foreground">Lidlar</span>}
        </div>
        {!collapsed && onToggle && (
          <button
            onClick={onToggle}
            className="p-2 rounded-lg hover:bg-muted transition-colors"
            title="Menyuni yopish"
          >
            <PanelLeftClose className="w-5 h-5 text-muted-foreground" />
          </button>
        )}
      </div>
      {collapsed && onToggle && (
        <button
          onClick={onToggle}
          className="mx-auto mt-2 p-2 rounded-lg hover:bg-muted transition-colors"
          title="Menyuni ochish"
        >
          <PanelLeftOpen className="w-5 h-5 text-muted-foreground" />
        </button>
      )}

      <nav
        className={cn(
          "flex-1 space-y-2 overflow-y-auto",
          collapsed ? "p-2" : "p-4",
        )}
      >
        {navItems.map((item, index) => {
          const separator =
            item.group && item.group !== navItems[index - 1]?.group ? (
              <GroupSeparator group={item.group} collapsed={collapsed} />
            ) : null;

          if (item.children) {
            if (collapsed) {
              return (
                <Fragment key={item.id}>
                  {separator}
                  {item.children.map((child) => (
                    <Fragment key={child.id}>{renderLink(child)}</Fragment>
                  ))}
                </Fragment>
              );
            }
            const open = isExpanded(item);
            const ParentIcon = item.icon;
            const submenuId = `nav-submenu-${item.id}`;
            return (
              <Fragment key={item.id}>
                {separator}
                <button
                  type="button"
                  onClick={() => toggleExpand(item.id)}
                  aria-expanded={open}
                  aria-controls={submenuId}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-foreground/80 hover:bg-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <ParentIcon className="w-5 h-5 flex-shrink-0" />
                  <span className="font-medium flex-1 text-left">
                    {t(`menu.${item.id}`)}
                  </span>
                  <ChevronDown
                    className={cn(
                      "w-4 h-4 flex-shrink-0 transition-transform duration-200",
                      open && "rotate-180",
                    )}
                  />
                </button>
                {open && (
                  <div
                    id={submenuId}
                    role="group"
                    aria-label={t(`menu.${item.id}`)}
                    className="mt-1 ml-4 pl-3 space-y-1 border-l border-border"
                  >
                    {item.children.map((child) => (
                      <Fragment key={child.id}>
                        {renderLink(child, true)}
                      </Fragment>
                    ))}
                  </div>
                )}
              </Fragment>
            );
          }

          return (
            <Fragment key={item.id}>
              {separator}
              {renderLink(item)}
            </Fragment>
          );
        })}
      </nav>

      <div className={cn("border-t border-border", collapsed ? "p-2" : "p-4")}>
        {collapsed ? (
          <div className="flex flex-col items-center gap-2">
            <div
              className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center flex-shrink-0"
              title={displayName}
            >
              <span className="text-sm font-bold text-white">
                {initials(displayName)}
              </span>
            </div>
            <button
              onClick={() => setLogoutOpen(true)}
              className="p-2 rounded-lg text-destructive hover:bg-destructive-muted transition-colors"
              title={t("user.logout")}
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted mb-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-bold text-white">
                  {initials(displayName)}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {displayName}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {user?.phone || "+998 00 000 00 00"}
                </p>
              </div>
            </div>
            <div className="space-y-2 mb-3">
              <div className="flex items-center gap-2 p-2.5 rounded-lg bg-gradient-to-r from-primary-500/10 to-secondary-500/10 dark:from-primary-500/20 dark:to-secondary-500/20">
                <div className="p-1.5 rounded-md bg-primary/20/30">
                  <CreditCard className="w-4 h-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground">
                    {tCommon("balance")}
                  </p>
                  <p className="text-sm font-semibold text-foreground truncate">
                    {formatSum(balance) ?? "0"} so&apos;m
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 p-2.5 rounded-lg bg-primary/10">
                <div className="p-1.5 rounded-md bg-primary/20">
                  <Sparkles className="w-4 h-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground">
                    {tCommon("plan")}
                  </p>
                  <div className="flex items-center gap-2">
                    <span className="inline-block px-2 py-0.5 rounded text-xs font-semibold bg-muted text-muted-foreground">
                      {planName}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <button
              onClick={() => setLogoutOpen(true)}
              className="w-full flex cursor-pointer items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-destructive transition-colors hover:bg-destructive-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <LogOut className="w-5 h-5" />
              <span className="font-medium">{t("user.logout")}</span>
            </button>
          </>
        )}
      </div>

      <ConfirmModal
        isOpen={logoutOpen}
        onClose={() => setLogoutOpen(false)}
        onConfirm={onConfirmLogout}
        title={tCommon("logoutTitle")}
        message={tCommon("logoutMessage")}
        confirmText={tCommon("logoutConfirm")}
        cancelText={tCommon("logoutCancel")}
        type="danger"
        loading={loggingOut}
      />
    </div>
  );
}

export function Sidebar({
  collapsed,
  onToggle,
}: {
  collapsed: boolean;
  onToggle: () => void;
}) {
  return (
    <aside
      className={cn(
        "hidden md:flex md:flex-col fixed inset-y-0 left-0 bg-card border-r border-border z-40 transition-all duration-300",
        collapsed ? "w-20" : "w-72",
      )}
    >
      <SidebarContent collapsed={collapsed} onToggle={onToggle} />
    </aside>
  );
}
