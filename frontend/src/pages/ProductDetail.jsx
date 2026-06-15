import React, { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { ShoppingBag, Sparkles, Check, Camera, Truck } from "lucide-react";
import api from "@/lib/api";
import { formatINR } from "@/lib/format";
import { useCart } from "@/context/CartContext";
import Product360 from "@/components/Product360";
import { PRODUCT } from "@/constants/testIds";
import { toast } from "sonner";

function Pills({ value, options, onChange, testid }) {
  return (
    <div className="flex flex-wrap gap-2" data-testid={testid}>
      {options.map((o) => (
        <button
          key={o}
          type="button"
          onClick={() => onChange(o)}
          data-testid={`${testid}-${o}`}
          className={`px-3.5 py-2 rounded-full text-xs border transition-colors ${
            value === o ? "bg-[#1D1D1F] text-white border-[#1D1D1F]" : "border-[#E5E5EA] ink hover:border-[#1D1D1F]"
          }`}
        >{o}</button>
      ))}
    </div>
  );
}

export default function ProductDetail() {
  const { slug } = useParams();
  const [p, setP] = useState(null);
  const [qty, setQty] = useState(1);
  const [color, setColor] = useState("");
  const [size, setSize] = useState("");
  const [frame, setFrame] = useState("");
  const { add } = useCart();
  const nav = useNavigate();

  useEffect(() => {
    api.get(`/products/${slug}`).then((r) => {
      setP(r.data);
      setColor(r.data.color_options?.[0] || r.data.color);
      setSize(r.data.size_options?.[0] || "M");
      setFrame(r.data.frame_designs?.[0] || "");
    });
  }, [slug]);

  if (!p) return <main className="pt-32 pb-24 text-center ink-mute">Loading product…</main>;

  const hasDiscount = p.compare_at_price && p.compare_at_price > p.price;
  const variantPayload = { color, size, frame_design: frame };

  return (
    <main className="bg-white pt-28 pb-24">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
        <Link to="/shop" className="overline hover:text-[#0A0A0B]">← Back to collection</Link>

        <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-12">
          <div>
            <Product360 image={p.image} alt={p.name} />
            <div className="mt-4 grid grid-cols-4 gap-3">
              {[p.image, ...(p.gallery || [])].slice(0, 4).map((src, i) => (
                <div key={i} data-testid={PRODUCT.thumb(i)} className="aspect-square rounded-xl overflow-hidden border border-[#E5E5EA] bg-[#F5F5F7]">
                  <img src={src} alt={`${p.name} ${i}`} className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
            <Link to="/ar-try-on" data-testid={PRODUCT.tryOn} className="mt-6 inline-flex w-full items-center justify-center gap-2 btn-ghost">
              <Sparkles className="w-4 h-4" /> Try on with AR Mirror
            </Link>
          </div>

          <div>
            <div className="overline">{p.tier === "pro" ? "Professional" : p.tier === "kids" ? "Kids" : "Seniors"}</div>
            <h1 className="display text-5xl sm:text-6xl mt-3 leading-none">{p.name}</h1>
            <p className="ink-mute mt-3 text-lg">{p.tagline}</p>

            <div className="mt-3 flex flex-wrap gap-2">
              <span className="chip"><Camera className="w-3 h-3"/> Integrated HD camera</span>
              <span className="chip">{p.lens_quality?.split(',')[0] || 'Oakley-grade lens'}</span>
              <span className="chip text-[#1D1D1F]"><Truck className="w-3 h-3"/> Free Home Delivery</span>
            </div>

            <div className="mt-6 flex items-baseline gap-4">
              <span className="display text-3xl ink">{formatINR(p.price)}</span>
              {hasDiscount && (
                <>
                  <span className="mono text-base ink-faint line-through">{formatINR(p.compare_at_price)}</span>
                  <span className="mono text-xs text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    Save {formatINR(p.compare_at_price - p.price)}
                  </span>
                </>
              )}
            </div>
            <p className="mt-1 mono text-[11px] ink-faint">Inclusive of all taxes · INR</p>

            <p className="mt-8 ink-soft leading-relaxed">{p.description}</p>

            <div className="mt-8 grid grid-cols-2 gap-2">
              {p.features.map((f) => (
                <div key={f} className="flex items-center gap-2 text-sm ink">
                  <Check className="w-4 h-4 text-[#1D1D1F]" /> {f}
                </div>
              ))}
            </div>

            {/* Variation selectors */}
            <div className="mt-10 space-y-5">
              {p.color_options?.length > 0 && (
                <div>
                  <div className="overline mb-2">Colour · <span className="ink">{color}</span></div>
                  <Pills value={color} options={p.color_options} onChange={setColor} testid="pdp-color"/>
                </div>
              )}
              {p.size_options?.length > 0 && (
                <div>
                  <div className="overline mb-2">Size · <span className="ink">{size}</span></div>
                  <Pills value={size} options={p.size_options} onChange={setSize} testid="pdp-size"/>
                </div>
              )}
              {p.frame_designs?.length > 0 && (
                <div>
                  <div className="overline mb-2">Frame design · <span className="ink">{frame}</span></div>
                  <Pills value={frame} options={p.frame_designs} onChange={setFrame} testid="pdp-frame"/>
                </div>
              )}
            </div>

            <div className="mt-8 flex items-center gap-3">
              <div className="inline-flex items-center border border-[#E5E5EA] rounded-full bg-white">
                <button onClick={() => setQty((q) => Math.max(1, q - 1))} className="w-10 h-10 grid place-items-center">−</button>
                <span className="w-10 text-center">{qty}</span>
                <button onClick={() => setQty((q) => Math.min(10, q + 1))} className="w-10 h-10 grid place-items-center">+</button>
              </div>
              <button
                data-testid={PRODUCT.addToCart}
                onClick={() => { add({ ...p, ...variantPayload }, qty); toast.success("Added to cart"); }}
                className="btn-ink flex-1 inline-flex items-center justify-center gap-2"
              >
                <ShoppingBag className="w-4 h-4" /> Add to cart · {formatINR(p.price * qty)}
              </button>
            </div>
            <button
              data-testid={PRODUCT.buyNow}
              onClick={() => { add({ ...p, ...variantPayload }, qty); nav("/cart"); }}
              className="btn-ghost mt-3 w-full"
            >Buy now</button>

            <div className="mt-12 border-t border-[#E5E5EA] pt-8">
              <div className="overline mb-4">Specs</div>
              <dl className="grid grid-cols-2 gap-y-3 gap-x-8 text-sm">
                {Object.entries(p.specs || {}).map(([k,v]) => (
                  <React.Fragment key={k}>
                    <dt className="ink-mute">{k}</dt>
                    <dd className="ink">{v}</dd>
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
