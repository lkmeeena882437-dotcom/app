import React, { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { ShoppingBag, Sparkles, Check } from "lucide-react";
import api from "@/lib/api";
import { useCart } from "@/context/CartContext";
import Product360 from "@/components/Product360";
import { PRODUCT } from "@/constants/testIds";
import { toast } from "sonner";

export default function ProductDetail() {
  const { slug } = useParams();
  const [product, setProduct] = useState(null);
  const [qty, setQty] = useState(1);
  const { add } = useCart();
  const nav = useNavigate();

  useEffect(() => {
    api.get(`/products/${slug}`).then((r) => setProduct(r.data));
  }, [slug]);

  if (!product) {
    return (
      <main className="pt-32 pb-24 text-white/60 text-center">Loading product…</main>
    );
  }

  return (
    <main className="bg-[#050505] pt-28 pb-24">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
        <Link to="/shop" className="overline hover:text-white">← Back to collection</Link>

        <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* 360 + thumbs */}
          <div>
            <Product360 image={product.image} alt={product.name} />
            <div className="mt-4 grid grid-cols-4 gap-3">
              {[product.image, ...(product.gallery || [])].slice(0, 4).map((src, i) => (
                <div
                  key={i}
                  data-testid={PRODUCT.thumb(i)}
                  className="aspect-square rounded-xl overflow-hidden border border-white/10 bg-black/40"
                >
                  <img src={src} alt={`${product.name} ${i}`} className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
            <Link
              to="/ar-try-on"
              data-testid={PRODUCT.tryOn}
              className="mt-6 inline-flex w-full items-center justify-center gap-2 px-6 py-4 rounded-full bg-[#0a0a0a] border border-[#00F0FF]/30 text-[#00F0FF] hover:shadow-[0_0_30px_rgba(0,240,255,0.3)] transition-shadow"
            >
              <Sparkles className="w-4 h-4" /> Try on with AR Mirror
            </Link>
          </div>

          {/* Info */}
          <div>
            <div className="overline">{product.tier === "pro" ? "Professional" : product.tier === "kids" ? "Kids" : "Seniors"}</div>
            <h1 className="display text-5xl sm:text-6xl mt-3 leading-none">{product.name}</h1>
            <p className="text-white/60 mt-3 text-lg">{product.tagline}</p>

            <div className="mt-6 flex items-baseline gap-4">
              <span className="display text-3xl">${product.price.toFixed(2)}</span>
              <span className="mono text-xs text-white/40">USD · ships in 48h</span>
            </div>

            <p className="mt-8 text-white/70 leading-relaxed">{product.description}</p>

            <div className="mt-8 grid grid-cols-2 gap-2">
              {product.features.map((f) => (
                <div key={f} className="flex items-center gap-2 text-sm text-white/80">
                  <Check className="w-4 h-4 text-[#00F0FF]" /> {f}
                </div>
              ))}
            </div>

            <div className="mt-8 flex items-center gap-3">
              <div className="inline-flex items-center border border-white/15 rounded-full">
                <button onClick={() => setQty((q) => Math.max(1, q - 1))} className="w-10 h-10 grid place-items-center">−</button>
                <span className="w-10 text-center">{qty}</span>
                <button onClick={() => setQty((q) => Math.min(10, q + 1))} className="w-10 h-10 grid place-items-center">+</button>
              </div>
              <button
                data-testid={PRODUCT.addToCart}
                onClick={() => { add(product, qty); toast.success("Added to cart"); }}
                className="btn-glow flex-1 inline-flex items-center justify-center gap-2 px-7 py-4 rounded-full bg-white text-black font-medium hover:scale-[1.01] transition-transform"
              >
                <ShoppingBag className="w-4 h-4" /> Add to cart
              </button>
            </div>
            <button
              data-testid={PRODUCT.buyNow}
              onClick={() => { add(product, qty); nav("/cart"); }}
              className="mt-3 w-full px-7 py-4 rounded-full border border-white/15 text-white hover:border-[#00F0FF]/60 transition-colors"
            >
              Buy now
            </button>

            {/* Specs */}
            <div className="mt-12 border-t border-white/10 pt-8">
              <div className="overline mb-4">Specs</div>
              <dl className="grid grid-cols-2 gap-y-3 gap-x-8 text-sm">
                {Object.entries(product.specs || {}).map(([k,v]) => (
                  <React.Fragment key={k}>
                    <dt className="text-white/50">{k}</dt>
                    <dd className="text-white">{v}</dd>
                  </React.Fragment>
                ))}
              </dl>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
