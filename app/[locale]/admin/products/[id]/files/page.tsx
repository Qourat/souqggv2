import { notFound } from "next/navigation";
import { setRequestLocale, getTranslations } from "next-intl/server";

import { AdminBanner } from "@/components/layout/admin-banner";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ProductFileDelete } from "@/components/admin/product-file-delete";
import { ProductFileUpload } from "@/components/admin/product-file-upload";
import { Link } from "@/shared/i18n/navigation";
import { hasSupabase } from "@/shared/db/has-supabase";
import { productsService } from "@/modules/products";
import { productFilesService } from "@/modules/products/product-files.service";
import { formatBytes } from "@/shared/utils";

export const dynamic = "force-dynamic";

export default async function AdminProductFilesPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();

  const productRes = await productsService.getById(id, locale);
  if (!productRes.ok || !productRes.value) notFound();
  const product = productRes.value;

  const filesRes = await productFilesService.list(id);
  const files = filesRes.ok ? filesRes.value : [];
  const supabaseReady = hasSupabase();

  return (
    <div className="container py-3 space-y-3">
      <div className="text-xs">
        <Link
          href={`/admin/products/${id}/edit`}
          className="label-mono hover:text-terracotta"
        >
          ← {t("admin.products.edit")}
        </Link>
      </div>

      <AdminPageHeader
        title={
          <span className="font-mono">
            files ·{" "}
            <span className="text-terracotta">{product.title}</span>
          </span>
        }
        subtitle={t("admin.files.subtitle")}
      />

      {!supabaseReady ? (
        <AdminBanner
          title={t("admin.banner.dbMissing.title")}
          body={t("admin.banner.dbMissing.body")}
        />
      ) : (
        <ProductFileUpload productId={id} />
      )}

      <div className="border-hairline rounded-sm bg-surface overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-surface-raised">
              <th className="text-start label-mono px-3 h-7">
                {t("admin.files.col.filename")}
              </th>
              <th className="text-start label-mono px-2 h-7 w-32">
                {t("admin.files.col.mime")}
              </th>
              <th className="text-end label-mono px-2 h-7 w-24">
                {t("admin.files.col.size")}
              </th>
              <th className="text-end label-mono px-2 h-7 w-20">
                {t("admin.files.col.version")}
              </th>
              <th className="text-end px-2 h-7 w-24" aria-label="" />
            </tr>
          </thead>
          <tbody>
            {files.map((f) => (
              <tr
                key={f.id}
                className="border-b border-border last:border-0 row-hover"
              >
                <td className="px-3 py-2 min-w-0">
                  <div className="font-mono text-sm truncate">{f.filename}</div>
                  <div className="label-mono truncate">{f.storagePath}</div>
                </td>
                <td className="px-2 py-2">
                  <Badge variant="outline">{f.mime ?? "?"}</Badge>
                </td>
                <td className="px-2 py-2 text-end label-mono tnum">
                  {formatBytes(f.sizeBytes, locale)}
                </td>
                <td className="px-2 py-2 text-end label-mono tnum">
                  v{f.version}
                </td>
                <td className="px-2 py-2 text-end">
                  <ProductFileDelete productId={id} fileId={f.id} />
                </td>
              </tr>
            ))}
            {files.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-3 py-6 text-center label-mono">
                  {t("admin.files.empty")}
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      <div className="flex justify-end">
        <Button asChild variant="outline" size="sm">
          <Link href="/admin/products">{t("common.back")}</Link>
        </Button>
      </div>
    </div>
  );
}
