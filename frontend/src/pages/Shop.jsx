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
    <main className="bg-[#050505] pt-32 pb-24">
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
                onClick={() => {
                  if (t.key) setParams({ tier: t.key }); else setParams({});
                }}
                className={`px-4 py-2 rounded-full text-xs mono uppercase tracking-widest border transition-colors ${
                  tier === t.key
                    ? "bg-[#00F0FF] text-black border-[#00F0FF]"
                    : "border-white/15 text-white/70 hover:border-white/40"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="text-white/50">Loading collection…</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {products.map((p) => (
              <Link
                key={p.id}
                to={`/product/${p.slug}`}
                data-testid={PRODUCT.card(p.id)}
                className="group relative aspect-[4/5] rounded-2xl overflow-hidden bg-[#0a0a0a] border border-white/5 hover:border-[#00F0FF]/30 transition-colors"
              >
                <img src={p.image} alt={p.name} className="absolute inset-0 w-full h-full object-cover opacity-85 group-hover:scale-105 group-hover:opacity-100 transition-all duration-700" />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />
                <div className="absolute top-4 left-4">
                  <span className="mono text-[10px] tracking-widest uppercase text-white/70 border border-white/15 rounded-full px-2 py-1">{p.tier}</span>
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-5">
                  <h3 className="display text-2xl">{p.name}</h3>
                  <p className="text-sm text-white/60 mt-1">{p.tagline}</p>
                  <div className="mt-4 flex items-center justify-between">
                    <span className="mono text-white">${p.price.toFixed(0)}</span>
                    <span className="inline-flex items-center gap-1 text-[#00F0FF] text-sm">View <ArrowRight className="w-4 h-4"/></span>
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
