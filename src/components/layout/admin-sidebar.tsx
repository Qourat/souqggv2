import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  FolderTree,
  TicketPercent,
  BarChart3,
  Sparkles,
  ScrollText,
  MessageSquare,
} from "lucide-react";
import { getTranslations } from "next-intl/server";

import { Link } from "@/shared/i18n/navigation";

const ITEMS = [
  { href: "/admin", icon: LayoutDashboard, key: "dashboard" },
  { href: "/admin/products", icon: Package, key: "products" },
  { href: "/admin/orders", icon: ShoppingCart, key: "orders" },
  { href: "/admin/users", icon: Users, key: "users" },
  { href: "/admin/categories", icon: FolderTree, key: "categories" },
  { href: "/admin/coupons", icon: TicketPercent, key: "coupons" },
  { href: "/admin/reviews", icon: MessageSquare, key: "reviews" },
  { href: "/admin/analytics", icon: BarChart3, key: "analytics" },
  { href: "/admin/ai-tools", icon: Sparkles, key: "aiTools" },
  { href: "/admin/audit-log", icon: ScrollText, key: "auditLog" },
] as const;

export async function AdminSidebar() {
  const t = await getTranslations();
  return (
    <aside className="w-44 shrink-0 border-r border-border bg-surface flex flex-col">
      <div className="h-header flex items-center px-3 border-b border-border">
        <span className="font-mono font-bold text-sm">souq</span>
        <span className="ml-1 label-mono">/admin</span>
      </div>
      <nav className="flex-1 py-1.5">
        {ITEMS.map(({ href, icon: Icon, key }) => (
          <Link
            key={href}
            href={href}
            className="flex items-center gap-2 px-3 h-7 label-mono text-muted-foreground hover:text-foreground hover:bg-surface-raised"
          >
            <Icon className="h-3.5 w-3.5" />
            {t(`admin.nav.${key}`)}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
