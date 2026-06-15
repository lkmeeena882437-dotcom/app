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
      const r = await api.post("/checkout/session", {
        items: items.map((x) => ({ product_id: x.product.id, quantity: x.quantity })),
        origin_url: window.location.origin,
      });
      if (r.data?.url) window.location.href = r.data.url;
      else throw new Error("No checkout URL");
    } catch (e) {
      toast.error("Checkout could not start. Please retry.");
      setBusy(false);
    }
  };

  return (
    <>
      <div
        className={`fixed inset-0 bg-black/30 backdrop-blur-sm z-[59] transition-opacity ${
          open ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={() => setOpen(false)}
      />
      <aside
        data-testid={CART.drawer}
        className={`fixed right-0 top-0 h-full w-full sm:w-[420px] bg-white border-l border-[#E5E5EA] shadow-2xl z-[60] transition-transform duration-300 ${
          open ? "translate-x-0" : "translate-x-full"
        } flex flex-col`}
      >
        <div className="flex items-center justify-between px-6 py-5 border-b border-[#E5E5EA]">
          <div>
            <div className="overline">Your Cart</div>
            <div className="display text-2xl mt-1 ink">{items.length ? `${items.length} item${items.length>1?"s":""}` : "Empty"}</div>
          </div>
          <button
            data-testid={CART.closeButton}
            onClick={() => setOpen(false)}
            className="w-10 h-10 grid place-items-center rounded-full border border-[#E5E5EA] hover:border-[#1D1D1F]"
            aria-label="Close cart"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {items.length === 0 && (
            <div className="text-center py-16 space-y-4">
              <p className="ink-mute">Your cart is quiet.</p>
              <Link to="/shop" onClick={() => setOpen(false)} className="btn-ghost inline-flex text-sm">
                Discover Oculux
              </Link>
            </div>
          )}
          {items.map(({ product, quantity }) => (
            <div
              key={product.id}
              data-testid={CART.item(product.id)}
              className="flex gap-4 p-3 rounded-xl border border-[#E5E5EA] bg-[#F5F5F7]"
            >
              <div className="w-20 h-20 rounded-lg overflow-hidden bg-white shrink-0">
                <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium truncate ink">{product.name}</p>
                    <p className="text-xs ink-faint">{product.color}</p>
                  </div>
                  <p className="text-sm ink">${(product.price * quantity).toFixed(2)}</p>
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <div className="inline-flex items-center border border-[#E5E5EA] rounded-full bg-white">
                    <button data-testid={CART.decQty(product.id)} onClick={() => setQty(product.id, quantity - 1)} className="w-8 h-8 grid place-items-center hover:text-[#0A0A0B]"><Minus className="w-3 h-3"/></button>
                    <span className="w-8 text-center text-sm">{quantity}</span>
                    <button data-testid={CART.incQty(product.id)} onClick={() => setQty(product.id, quantity + 1)} className="w-8 h-8 grid place-items-center hover:text-[#0A0A0B]"><Plus className="w-3 h-3"/></button>
                  </div>
                  <button data-testid={CART.removeItem(product.id)} onClick={() => remove(product.id)} className="text-xs ink-faint hover:text-[#0A0A0B]">Remove</button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {items.length > 0 && (
          <div className="px-6 py-5 border-t border-[#E5E5EA] space-y-4 bg-white">
            <div className="flex justify-between">
              <span className="text-sm ink-mute">Subtotal</span>
              <span data-testid={CART.total} className="display text-xl ink">${subtotal.toFixed(2)}</span>
            </div>
            <p className="text-xs ink-faint">Taxes & shipping calculated at checkout.</p>
            <button
              data-testid={CART.checkoutButton}
              onClick={checkout}
              disabled={busy}
              className="btn-ink w-full inline-flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {busy ? "Redirecting…" : "Checkout"} <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </aside>
    </>
  );
}
