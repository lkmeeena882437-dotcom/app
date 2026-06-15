import React, { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import api from "@/lib/api";
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
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="ink-mute">Loading collection…</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {products.map((p) => (
              <Link
                key={p.id}
                to={`/product/${p.slug}`}
                data-testid={PRODUCT.card(p.id)}
                className="group relative aspect-[4/5] rounded-2xl overflow-hidden bg-[#F5F5F7] border border-[#E5E5EA] hover:border-[#1D1D1F] transition-colors"
              >
                <img src={p.image} alt={p.name} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/15 to-transparent" />
                <div className="absolute top-4 left-4">
                  <span className="chip">{p.tier}</span>
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-5 text-white">
                  <h3 className="display text-2xl text-white">{p.name}</h3>
                  <p className="text-sm opacity-85 mt-1">{p.tagline}</p>
                  <div className="mt-4 flex items-center justify-between">
                    <span className="mono">${p.price.toFixed(0)}</span>
                    <span className="inline-flex items-center gap-1 text-sm">View <ArrowRight className="w-4 h-4"/></span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
