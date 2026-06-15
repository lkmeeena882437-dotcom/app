import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useCart } from "@/context/CartContext";
import api from "@/lib/api";
import { toast } from "sonner";
import { CART } from "@/constants/testIds";
import { ArrowRight, Minus, Plus, Trash2 } from "lucide-react";

export default function CartPage() {
  const { items, setQty, remove, subtotal } = useCart();
  const [busy, setBusy] = useState(false);
  const nav = useNavigate();

  const checkout = async () => {
    if (!items.length) return;
    setBusy(true);
    try {
      const r = await api.post("/checkout/session", {
        items: items.map((x) => ({ product_id: x.product.id, quantity: x.quantity })),
        origin_url: window.location.origin,
      });
      if (r.data?.url) window.location.href = r.data.url;
      else throw new Error("No URL");
    } catch (e) {
      toast.error("Checkout failed. Try again.");
      setBusy(false);
    }
  };

  return (
    <main className="bg-[#050505] pt-28 pb-24 min-h-screen">
      <div className="max-w-5xl mx-auto px-6 sm:px-8 lg:px-12">
        <div className="overline">Your bag</div>
        <h1 className="display text-5xl sm:text-6xl mt-3">Cart</h1>

        {items.length === 0 ? (
          <div className="mt-12 glass rounded-2xl p-12 text-center">
            <p className="text-white/70">Your cart is empty.</p>
            <Link to="/shop" className="mt-6 inline-flex px-6 py-3 rounded-full bg-white text-black text-sm font-medium">Browse collection</Link>
          </div>
        ) : (
          <div className="mt-10 grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-8">
            <div className="space-y-4">
              {items.map(({ product, quantity }) => (
                <div key={product.id} className="flex gap-4 p-4 rounded-2xl border border-white/10 bg-white/[0.02]">
                  <div className="w-28 h-28 rounded-xl overflow-hidden bg-black/40">
                    <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 flex flex-col justify-between">
                    <div className="flex justify-between gap-2">
                      <div>
                        <p className="font-medium">{product.name}</p>
                        <p className="text-xs text-white/50">{product.color}</p>
                      </div>
                      <p className="display">${(product.price * quantity).toFixed(2)}</p>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="inline-flex items-center border border-white/15 rounded-full">
                        <button onClick={() => setQty(product.id, quantity - 1)} className="w-9 h-9 grid place-items-center hover:text-[#00F0FF]"><Minus className="w-3 h-3"/></button>
                        <span className="w-9 text-center text-sm">{quantity}</span>
                        <button onClick={() => setQty(product.id, quantity + 1)} className="w-9 h-9 grid place-items-center hover:text-[#00F0FF]"><Plus className="w-3 h-3"/></button>
                      </div>
                      <button onClick={() => remove(product.id)} className="text-xs text-white/50 hover:text-white inline-flex items-center gap-1"><Trash2 className="w-3 h-3"/> Remove</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <aside className="glass rounded-2xl p-6 h-fit sticky top-24">
              <div className="overline">Summary</div>
              <div className="mt-4 space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-white/60">Subtotal</span><span>${subtotal.toFixed(2)}</span></div>
                <div className="flex justify-between"><span className="text-white/60">Shipping</span><span>Free</span></div>
                <div className="flex justify-between"><span className="text-white/60">Taxes</span><span>At checkout</span></div>
              </div>
              <div className="mt-6 flex justify-between border-t border-white/10 pt-4">
                <span>Total</span>
                <span data-testid={CART.total} className="display text-xl">${subtotal.toFixed(2)}</span>
              </div>
              <button
                data-testid={CART.checkoutButton}
                onClick={checkout}
                disabled={busy}
                className="btn-glow mt-6 w-full bg-white text-black rounded-full py-4 font-medium flex items-center justify-center gap-2"
              >
                {busy ? "Redirecting…" : "Checkout"} <ArrowRight className="w-4 h-4"/>
              </button>
              <p className="text-[11px] text-white/40 mt-3">Stripe-secured. Guest checkout available.</p>
              <button onClick={() => nav("/shop")} className="mt-6 w-full text-sm text-white/60 hover:text-white">Continue shopping</button>
            </aside>
          </div>
        )}
      </div>
    </main>
  );
}
