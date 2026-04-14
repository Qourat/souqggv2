import Link from "next/link";
import { notFound } from "next/navigation";
import { sql } from "@/lib/db";
import Nav from "../../components/Nav";
import ProfilePageClient from "./ProfilePageClient";

export const revalidate = 60;

async function getData(username: string) {
  const [profile] = await sql`
    SELECT p.id, p.username, p.display_name, p.bio, p.avatar_url, p.website, p.twitter,
           p.github, p.location, p.headline, p.social_links, p.role, p.created_at,
           p.product_count, p.follower_count, p.following_count, p.total_sales,
           sp.bio as seller_bio
    FROM public.profiles p
    LEFT JOIN public.seller_profiles sp ON p.id = sp.profile_id
    WHERE p.username = ${username}
  `;
  if (!profile) return null;

  const products = await sql`
    SELECT p.id, p.title, p.slug, p.price_cents, p.upvotes, p.created_at,
           p.description, p.screenshot_url, p.product_type,
           c.name as category_name, c.slug as category_slug
    FROM public.products p
    LEFT JOIN public.categories c ON p.category_id = c.id
    WHERE p.seller_id = ${profile.id} AND p.status = 'active'
    ORDER BY p.upvotes DESC
  `;

  const reviewStats = await sql`
    SELECT COUNT(*) as total,
           COALESCE(AVG(r.rating), 0) as avg_rating
    FROM public.reviews r
    JOIN public.products p ON r.product_id = p.id
    WHERE p.seller_id = ${profile.id}
  `;

  const categories = await sql`
    SELECT c.id, c.name, c.slug FROM public.categories c ORDER BY c.name LIMIT 12
  `;

  return {
    profile,
    products,
    reviewStats: reviewStats[0] || { total: 0, avg_rating: 0 },
    categories,
  };
}

export async function generateMetadata({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  const data = await getData(username);
  if (!data) return { title: "User not found | SOUQ.GG" };
  return {
    title: `${data.profile.display_name || data.profile.username} | SOUQ.GG`,
    description: data.profile.bio?.slice(0, 160) || `Profile on SOUQ.GG`,
  };
}

export default async function ProfilePage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  const data = await getData(username);
  if (!data) notFound();

  return <ProfilePageClient data={data as any} />;
}