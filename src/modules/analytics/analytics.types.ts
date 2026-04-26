export interface DashboardKpi {
  label: string;
  value: string;
  subValue?: string;
  intent?: "default" | "success" | "warning" | "danger";
}

export interface DashboardTopProduct {
  productId: string;
  title: string;
  unitsSold: number;
  revenueCents: number;
  currency: string;
}

export interface DashboardRecentOrder {
  id: string;
  status:
    | "pending"
    | "paid"
    | "fulfilled"
    | "failed"
    | "refunded"
    | "cancelled";
  email: string | null;
  totalCents: number;
  currency: string;
  createdAt: string;
}

export interface DashboardSummary {
  revenueMtdCents: number;
  revenueMtdCurrency: string;
  ordersMtd: number;
  pendingOrders: number;
  failedMtd: number;
  publishedProducts: number;
  draftProducts: number;
  topProduct: DashboardTopProduct | null;
  recentOrders: DashboardRecentOrder[];
  generatedAt: string;
}
