import {
  Analytics01Icon,
  Coins01Icon,
  CreditCardIcon,
  DashboardSpeed01Icon,
  Globe02Icon,
  Home01Icon,
  Key01Icon,
  Link01Icon,
  Package01Icon,
  PlugSocketIcon,
  Settings01Icon,
  ShoppingCart01Icon,
  Wallet01Icon,
} from "@hugeicons/core-free-icons";

export interface NavItem {
  /** Translation key under the `nav` namespace. */
  key:
    | "dashboard"
    | "integrations"
    | "reports"
    | "products"
    | "leadPacing"
    | "finance"
    | "orders"
    | "connections"
    | "domains"
    | "apiKeys"
    | "pricing"
    | "balance"
    | "settings";
  href: string;
  icon: typeof Home01Icon;
}

export const navItems: NavItem[] = [
  { key: "dashboard", href: "/dashboard", icon: Home01Icon },
  { key: "integrations", href: "/dashboard/integrations", icon: PlugSocketIcon },
  { key: "reports", href: "/dashboard/reports", icon: Analytics01Icon },
  { key: "products", href: "/dashboard/products", icon: Package01Icon },
  { key: "leadPacing", href: "/dashboard/lead-pacing", icon: DashboardSpeed01Icon },
  { key: "finance", href: "/dashboard/finance/insights", icon: Coins01Icon },
  { key: "orders", href: "/dashboard/finance/orders", icon: ShoppingCart01Icon },
  { key: "connections", href: "/dashboard/connections", icon: Link01Icon },
  { key: "domains", href: "/dashboard/domains", icon: Globe02Icon },
  { key: "apiKeys", href: "/dashboard/api-keys", icon: Key01Icon },
  { key: "pricing", href: "/dashboard/pricing", icon: CreditCardIcon },
  { key: "balance", href: "/dashboard/balance", icon: Wallet01Icon },
  { key: "settings", href: "/dashboard/settings", icon: Settings01Icon },
];
