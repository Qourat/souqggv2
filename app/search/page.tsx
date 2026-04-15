"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import SouqMarketingHeader from "@/app/components/SouqMarketingHeader";

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    category: "",
    sort: "newest",
    maxPrice: "",
  });

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/products?q=${encodeURIComponent(query)}&category=${filters.category}&sort=${filters.sort}&maxPrice=${filters.maxPrice}`);
        const data = await res.json();
        setProducts(data.products || []);
      } catch (e) {
        console.error("Search error:", e);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, [query, filters]);

  return (
    <div className="min-h-screen bg-souq-base font-sans text-souq-text">
      <SouqMarketingHeader
        trailing={
          <Link href="/login" className="souq-badge-pill">
            Login
          </Link>
        }
      />

      <main className="max-w-4xl mx-auto p-4 px-4">
        <div className="mb-8 mt-4">
          <h1 className="text-2xl font-bold mb-4">Search Marketplace</h1>
          <div className="flex gap-2">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search high-value digital assets..."
              className="flex-1 border border-souq-border p-2 rounded text-sm focus:border-souq-terra focus:outline-none"
            />
            <button className="bg-souq-terra text-white px-4 py-2 rounded text-sm font-bold hover:bg-souq-terra-hover">
              Search
            </button>
          </div>
          
          <div className="flex flex-wrap gap-4 mt-4 text-xs">
            <div className="flex flex-col gap-1">
              <label className="font-bold uppercase tracking-wider text-souq-muted">Category</label>
              <select 
                value={filters.category} 
                onChange={(e) => setFilters({...filters, category: e.target.value})}
                className="border border-souq-border p-1 rounded bg-souq-card"
              >
                <option value="">All Categories</option>
                <option value="ai-masterclass">AI Masterclass</option>
                <option value="saas-boilerplates">SaaS Boilerplates</option>
                <option value="growth-hacking">Growth Hacking</option>
                <option value="cybersecurity">Cybersecurity</option>
                <option value="quant-trading">Quant Trading</option>
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="font-bold uppercase tracking-wider text-souq-muted">Sort By</label>
              <select 
                value={filters.sort} 
                onChange={(e) => setFilters({...filters, sort: e.target.value})}
                className="border border-souq-border p-1 rounded bg-souq-card"
              >
                <option value="newest">Newest</option>
                <option value="popular">Most Popular</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="font-bold uppercase tracking-wider text-souq-muted">Max Price ($)</label>
              <input 
                type="number" 
                value={filters.maxPrice} 
                onChange={(e) => setFilters({...filters, maxPrice: e.target.value})}
                className="border border-souq-border p-1 rounded bg-souq-card w-20"
              />
            </div>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12 text-souq-muted italic">Searching high-value assets...</div>
        ) : (
          <div className="space-y-2">
            {products.length === 0 ? (
              <p className="text-center py-12 text-souq-muted">No matching assets found in the vault.</p>
            ) : (
            products.map((p: any) => (
              <div key={p.id} className="flex items-start gap-2 py-2 border-b border-souq-line product-row">
                <div className="flex flex-col items-center w-6 text-[10px] text-souq-muted">
                  <span className="font-bold">{p.upvotes || 0}</span>
                </div>
                <div className="flex-1">
                  <div className="flex items-baseline gap-1">
                    <Link href={`/product/${p.slug}`} className="text-sm font-medium hover:underline">
                      {p.title}
                    </Link>
                    <span className="text-xs text-souq-muted">({p.price_cents === 0 ? "Free" : `$${(p.price_cents/100).toFixed(2)}`})</span>
                  </div>
                  <div className="text-[11px] text-souq-muted">
                    <span className="text-souq-terra font-bold">{p.category_name || "general"}</span>
                    {p.description && <> &bull; {p.description.slice(0, 120)}... {p.description.length > 120 ? "..." : ""}</>}
                    {p.seller_username && <> &bull; by <span className="text-souq-muted">{p.seller_username}</span></>}
                  </div>
                </div>
                <Link
                  href={`/checkout/${p.slug}`}
                  className="text-[10px] bg-souq-card border border-dashed border-souq-terra text-souq-terra px-2 py-0.5 rounded hover:bg-souq-terra hover:text-souq-card transition-colors"
                >
                  {p.price_cents === 0 ? "Get" : "Buy"}
                </Link>
              </div>
            )))}
          </div>
        )}
      </main>
    </div>
  );
}