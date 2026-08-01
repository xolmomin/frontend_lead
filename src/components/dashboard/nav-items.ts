import {
  BarChart3,
  CreditCard,
  Globe,
  Home,
  Key,
  Link2,
  Package,
  PieChart,
  Settings,
  ShoppingCart,
  Tag,
  TrendingUp,
  Wallet,
  Zap,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  /** Translation key under `navigation.menu`. */
  id: string;
  path?: string;
  icon: LucideIcon;
  /** Translation key under `navigation.group` — set on the first item of a group. */
  group?: "overview" | "finance" | "workspace" | "system";
  children?: NavItem[];
}

/** Mirrors the production sidebar config (admin-only and CAPI entries omitted). */
export const navItems: NavItem[] = [
  { id: "dashboard", path: "/dashboard", icon: Home, group: "overview" },
  {
    id: "integrations",
    path: "/dashboard/integrations",
    icon: Zap,
    group: "overview",
  },
  {
    id: "reports",
    path: "/dashboard/reports",
    icon: BarChart3,
    group: "overview",
  },
  {
    id: "products",
    path: "/dashboard/products",
    icon: Package,
    group: "overview",
  },
  {
    id: "lead-pacing",
    path: "/dashboard/lead-pacing",
    icon: TrendingUp,
    group: "overview",
  },
  {
    id: "finance-insights",
    path: "/dashboard/finance/insights",
    icon: PieChart,
    group: "finance",
  },
  {
    id: "finance-orders",
    path: "/dashboard/finance/orders",
    icon: ShoppingCart,
    group: "finance",
  },
  {
    id: "connections",
    path: "/dashboard/connections",
    icon: Link2,
    group: "workspace",
  },
  {
    id: "domains",
    path: "/dashboard/domains",
    icon: Globe,
    group: "workspace",
  },
  {
    id: "api-keys",
    path: "/dashboard/api-keys",
    icon: Key,
    group: "workspace",
  },
  {
    id: "payments",
    icon: CreditCard,
    group: "system",
    children: [
      { id: "pricing", path: "/dashboard/pricing", icon: Tag },
      { id: "balance", path: "/dashboard/balance", icon: Wallet },
    ],
  },
  {
    id: "settings",
    path: "/dashboard/settings",
    icon: Settings,
    group: "system",
  },
];
