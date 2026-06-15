import React, { useState } from "react";
import { X, Minus, Plus, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { useCart } from "@/context/CartContext";
import { toast } from "sonner";
import api from "@/lib/api";
import { CART } from "@/constants/testIds";

export default function CartDrawer() {
  const { items, open, setOpen, remove, setQty, subtotal } = useCart();
  const [busy, setBusy] = useState(false);

  const checkout = async () => {
    if (!items.length) return;
    setBusy(true);
    try {
      const body = {
        items: items.map((x) => ({ product_id: x.product.id, quantity: x.quantity })),
        origin_url: window.location.origin,
      };
      const r = await api.post("/checkout/session", body);
      if (r.data?.url) {
        window.location.href = r.data.url;
      } else {
        throw new Error("No checkout URL");
      }
    } catch (e) {
      toast.error("Checkout could not start. Please retry.");
      setBusy(false);
    }
  };

  return (
    <>
      <div
        className={`fixed inset-0 bg-black/70 backdrop-blur-sm z-[59] transition-opacity ${
          open ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={() => setOpen(false)}
      />
      <aside
        data-testid={CART.drawer}
        className={`fixed right-0 top-0 h-full w-full sm:w-[420px] bg-[#070707] border-l border-white/10 shadow-2xl z-[60] transition-transform duration-300 ${
          open ? "translate-x-0" : "translate-x-full"
        } flex flex-col`}
      >
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/10">
          <div>
            <div className="overline">Your Cart</div>
            <div className="display text-2xl mt-1">{items.length ? `${items.length} item${items.length>1?"s":""}` : "Empty"}</div>
          </div>
          <button
            data-testid={CART.closeButton}
            onClick={() => setOpen(false)}
            className="w-10 h-10 grid place-items-center rounded-full border border-white/10 hover:border-white/30"
            aria-label="Close cart"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {items.length === 0 && (
            <div className="text-center py-16 space-y-4">
              <p className="text-white/60">Your cart is quiet.</p>
              <Link to="/shop" onClick={() => setOpen(false)} className="inline-block px-5 py-3 rounded-full border border-white/20 text-sm hover:border-[#00F0FF]">
                Discover Oculux
              </Link>
            </div>
          )}
          {items.map(({ product, quantity }) => (
            <div
              key={product.id}
              data-testid={CART.item(product.id)}
              className="flex gap-4 p-3 rounded-xl border border-white/5 bg-white/[0.02]"
            >
              <div className="w-20 h-20 rounded-lg overflow-hidden bg-black/40 shrink-0">
                <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium truncate">{product.name}</p>
                    <p className="text-xs text-white/40">{product.color}</p>
                  </div>
                  <p className="text-sm">${(product.price * quantity).toFixed(2)}</p>
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <div className="inline-flex items-center border border-white/10 rounded-full">
                    <button data-testid={CART.decQty(product.id)} onClick={() => setQty(product.id, quantity - 1)} className="w-8 h-8 grid place-items-center hover:text-[#00F0FF]"><Minus className="w-3 h-3"/></button>
                    <span className="w-8 text-center text-sm">{quantity}</span>
                    <button data-testid={CART.incQty(product.id)} onClick={() => setQty(product.id, quantity + 1)} className="w-8 h-8 grid place-items-center hover:text-[#00F0FF]"><Plus className="w-3 h-3"/></button>
                  </div>
                  <button data-testid={CART.removeItem(product.id)} onClick={() => remove(product.id)} className="text-xs text-white/40 hover:text-white">Remove</button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {items.length > 0 && (
          <div className="px-6 py-5 border-t border-white/10 space-y-4">
            <div className="flex justify-between">
              <span className="text-sm text-white/60">Subtotal</span>
              <span data-testid={CART.total} className="display text-xl">${subtotal.toFixed(2)}</span>
            </div>
            <p className="text-xs text-white/40">Taxes & shipping calculated at checkout.</p>
            <button
              data-testid={CART.checkoutButton}
              onClick={checkout}
              disabled={busy}
              className="btn-glow w-full bg-white text-black rounded-full py-4 font-medium hover:scale-[1.01] transition-transform flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {busy ? "Redirecting…" : "Checkout"} <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </aside>
    </>
  );
}
