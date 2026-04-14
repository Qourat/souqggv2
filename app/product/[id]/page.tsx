import Link from "next/link";
import { notFound } from "next/navigation";
import { sql } from "@/lib/db";
import Nav from "../../components/Nav";
import ProductPageClient from "./ProductPageClient";

export const revalidate = 60;

async function getProduct(slug: string) {
  const [product] = await sql`
    SELECT p.*, c.name as category_name, c.slug as category_slug,
           pr.id as seller_id, pr.username as seller_username,
           pr.display_name as seller_display_name, pr.bio as seller_bio,
           pr.avatar_url as seller_avatar, pr.headline as seller_headline,
           pr.follower_count as seller_followers, pr.product_count as seller_product_count
    FROM public.products p
    LEFT JOIN public.categories c ON p.category_id = c.id
    LEFT JOIN public.profiles pr ON p.seller_id = pr.id
    WHERE p.slug = ${slug} AND p.status = 'active'
  `;
  return product || null;
}

async function getCategories() {
  return sql`
    SELECT c.id, c.name, c.slug FROM public.categories c
    ORDER BY c.name LIMIT 12
  `;
}

async function getReviews(productId: string) {
  return sql`
    SELECT r.id, r.rating, r.title, r.body, r.created_at,
           pr.username as reviewer_username, pr.display_name as reviewer_name,
           pr.avatar_url as reviewer_avatar
    FROM public.reviews r
    JOIN public.profiles pr ON r.user_id = pr.id
    WHERE r.product_id = ${productId}
    ORDER BY r.created_at DESC LIMIT 20
  `;
}

async function getComments(productId: string) {
  return sql`
    SELECT c.id, c.body, c.parent_id, c.created_at,
           pr.username as commenter_username, pr.display_name as commenter_name,
           pr.avatar_url as commenter_avatar
    FROM public.comments c
    JOIN public.profiles pr ON c.user_id = pr.id
    WHERE c.product_id = ${productId}
    ORDER BY c.created_at DESC LIMIT 30
  `;
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const product = await getProduct(id);
  if (!product) return { title: "Product not found | SOUQ.GG" };
  return {
    title: `${product.title} | SOUQ.GG`,
    description: product.description?.slice(0, 160) || `Buy ${product.title} on SOUQ.GG`,
  };
}

export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const product = await getProduct(id);
  if (!product) notFound();

  const categories = await getCategories();
  const reviews = await getReviews(product.id);
  const comments = await getComments(product.id);

  const reviewStats = reviews.length > 0
    ? {
        total: reviews.length,
        avgRating: Number((reviews.reduce((s: number, r: any) => s + Number(r.rating), 0) / reviews.length).toFixed(1)),
      }
    : { total: 0, avgRating: 0 };

  return (
    <ProductPageClient
      product={product as any}
      categories={categories as any[]}
      reviews={reviews as any[]}
      comments={comments as any[]}
      reviewStats={reviewStats}
    />
  );
}