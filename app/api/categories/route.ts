import { NextResponse } from 'next/server';
import postgres from 'postgres';

const sql = postgres(process.env.DATABASE_URL || 'postgres://souq_user:souq123@localhost:5432/souq');

const LEGAL_DEFAULT_CATEGORIES = [
  ['templates', 'Templates'],
  ['code-snippets', 'Code Snippets'],
  ['ui-kits', 'UI Kits'],
  ['fonts', 'Fonts'],
  ['icons', 'Icons'],
  ['illustrations', 'Illustrations'],
  ['audio', 'Audio'],
  ['video', 'Video'],
  ['ebooks', 'eBooks'],
  ['courses', 'Courses'],
  ['datasets', 'Datasets'],
  ['ai-prompts', 'AI Prompts'],
  ['saas-tools', 'SaaS Tools'],
  ['apis', 'APIs'],
  ['plugins', 'Plugins'],
  ['presets', 'Presets'],
  ['3d-assets', '3D Assets'],
  ['automation', 'Automation'],
  ['productivity', 'Productivity'],
  ['cybersecurity', 'Cybersecurity'],
] as const;

// GET /api/categories — list all categories
export async function GET() {
  try {
    for (let i = 0; i < LEGAL_DEFAULT_CATEGORIES.length; i++) {
      const [slug, name] = LEGAL_DEFAULT_CATEGORIES[i];
      const existing = await sql`SELECT id FROM categories WHERE slug = ${slug} LIMIT 1`;
      if (existing.length === 0) {
        await sql`
          INSERT INTO categories (slug, name, sort_order)
          VALUES (${slug}, ${name}, ${i + 1})
        `;
      }
    }

    const categories = await sql`
      SELECT id, slug, name, description, sort_order,
        (SELECT COUNT(*) FROM products WHERE category_id = categories.id AND status = 'active') as product_count
      FROM categories
      ORDER BY sort_order
    `;

    return NextResponse.json({ success: true, categories });
  } catch (error: any) {
    console.error('Categories list error:', error);
    return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 });
  }
}