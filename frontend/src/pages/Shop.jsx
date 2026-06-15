import React, { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ArrowRight, Truck, Camera } from "lucide-react";
import api from "@/lib/api";
import { formatINR } from "@/lib/format";
import { PRODUCT } from "@/constants/testIds";

const TIERS = [
  { key: "", label: "All" },
  { key: "pro", label: "Professional" },
  { key: "kids", label: "Kids" },
  { key: "senior", label: "Seniors" },
];

export default function Shop() {
  const [params, setParams] = useSearchParams();
  const tier = params.get("tier") || "";
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.get("/products", { params: tier ? { tier } : {} })
      .then((r) => setProducts(r.data))
      .finally(() => setLoading(false));
  }, [tier]);

  return (
    <main className="bg-white pt-32 pb-24">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <div className="overline">The Collection</div>
            <h1 className="display text-5xl sm:text-6xl lg:text-7xl mt-3">Every frame, perfected.</h1>
            <div className="mt-4 flex flex-wrap gap-3 text-xs">
              <span className="chip"><Truck className="w-3 h-3"/> Free Home Delivery</span>
              <span className="chip"><Camera className="w-3 h-3"/> HD camera in every pair</span>
              <span className="chip">Oakley/Meta-grade lens</span>
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            {TIERS.map((t) => (
              <button
                key={t.label}
                onClick={() => { if (t.key) setParams({ tier: t.key }); else setParams({}); }}
                className={`px-4 py-2 rounded-full text-xs mono uppercase tracking-widest border transition-colors ${
                  tier === t.key
                    ? "bg-[#1D1D1F] text-white border-[#1D1D1F]"
                    : "border-[#E5E5EA] text-[#1D1D1F] hover:border-[#1D1D1F]"
                }`}
              >{t.label}</button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="ink-mute">Loading collection…</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {products.map((p) => {
              const hasDiscount = p.compare_at_price && p.compare_at_price > p.price;
              const discountPct = hasDiscount ? Math.round((1 - p.price / p.compare_at_price) * 100) : 0;
              return (
                <Link
                  key={p.id}
                  to={`/product/${p.slug}`}
                  data-testid={PRODUCT.card(p.id)}
                  className="group relative aspect-[4/5] rounded-2xl overflow-hidden bg-[#F5F5F7] border border-[#E5E5EA] hover:border-[#1D1D1F] transition-colors"
                >
                  <img src={p.image} alt={p.name} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/15 to-transparent" />
                  <div className="absolute top-4 left-4 flex flex-col gap-2">
                    <span className="chip">{p.tier}</span>
                    {hasDiscount && <span className="px-2 py-1 rounded-full bg-[#1D1D1F] text-white text-[10px] mono">-{discountPct}%</span>}
                  </div>
                  <div className="absolute top-4 right-4 flex flex-col gap-2 items-end">
                    <span className="px-2 py-1 rounded-full bg-white/85 backdrop-blur text-[#1D1D1F] text-[10px] mono inline-flex items-center gap-1"><Truck className="w-3 h-3"/> Free</span>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 p-5 text-white">
                    <h3 className="display text-2xl text-white">{p.name}</h3>
                    <p className="text-sm opacity-85 mt-1 line-clamp-1">{p.tagline}</p>
                    <div className="mt-4 flex items-center justify-between">
                      <div className="flex items-baseline gap-2">
                        <span className="mono">{formatINR(p.price)}</span>
                        {hasDiscount && <span className="mono text-xs opacity-60 line-through">{formatINR(p.compare_at_price)}</span>}
                      </div>
                      <span className="inline-flex items-center gap-1 text-sm">View <ArrowRight className="w-4 h-4"/></span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
