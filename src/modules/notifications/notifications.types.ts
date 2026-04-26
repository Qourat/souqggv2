export interface DownloadReadyEmailItem {
  productTitle: string;
  filename: string;
  downloadUrl: string;
}

export interface DownloadReadyEmailInput {
  to: string;
  locale: string;
  orderId: string;
  totalCents: number;
  currency: string;
  items: DownloadReadyEmailItem[];
}
