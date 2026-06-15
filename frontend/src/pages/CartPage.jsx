import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import api from "@/lib/api";
import { toast } from "sonner";
import { formatINR } from "@/lib/format";
import { CART } from "@/constants/testIds";
import { ArrowRight, Minus, Plus, Trash2, Truck, MapPin, Loader2, CreditCard, Smartphone } from "lucide-react";

const PAYMENT_METHODS = [
  { key: "stripe", label: "Card (Stripe Test)", icon: CreditCard, real: true,
    sub: "Visa · Mastercard · Amex · 3D Secure" },
  { key: "upi", label: "UPI (Mock)", icon: Smartphone, real: false,
    sub: "Pay via Google Pay, PhonePe, BHIM" },
  { key: "rupay", label: "RuPay (Mock)", icon: CreditCard, real: false,
    sub: "Domestic RuPay debit / credit" },
  { key: "paytm", label: "Paytm Wallet (Mock)", icon: Smartphone, real: false,
    sub: "Paytm balance & postpaid" },
];

export default function CartPage() {
  const { items, setQty, remove, subtotal, clear } = useCart();
  const { user } = useAuth();
  const [busy, setBusy] = useState(false);
  const [detecting, setDetecting] = useState(false);
  const [method, setMethod] = useState("stripe");
  const [ship, setShip] = useState({
    full_name: user?.name || "",
    phone: user?.phone || "",
    address: "",
    pin: "",
    city: "",
    state: "",
  });
  const nav = useNavigate();

  const detectLocation = () => {
    if (!navigator.geolocation) return toast.error("Geolocation not supported");
    setDetecting(true);
    navigator.geolocation.getCurrentPosition(async (pos) => {
      try {
        const { latitude, longitude } = pos.coords;
        const r = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}&zoom=14&addressdetails=1`, {
          headers: { "Accept-Language": "en" },
        });
        const j = await r.json();
        const a = j.address || {};
        setShip((s) => ({
          ...s,
          pin: a.postcode || s.pin,
          city: a.city || a.town || a.village || a.county || s.city,
          state: a.state || s.state,
          address: s.address || [a.road, a.suburb, a.neighbourhood].filter(Boolean).join(", "),
        }));
        toast.success("Location detected");
      } catch { toast.error("Could not look up address"); }
      finally { setDetecting(false); }
    }, () => { setDetecting(false); toast.error("Permission denied"); }, { timeout: 8000 });
  };

  const validShipping = ship.full_name && ship.phone && ship.address && /^\d{5,6}$/.test(ship.pin) && ship.city && ship.state;

  const checkout = async () => {
    if (!items.length) return;
    if (!validShipping) { toast.error("Please fill all shipping fields (PIN required)"); return; }
    setBusy(true);
    try {
      const r = await api.post("/checkout/session", {
        items: items.map((x) => ({
          product_id: x.product.id, quantity: x.quantity,
          color: x.product.color || null,
          size: x.product.size || null,
          frame_design: x.product.frame_design || null,
        })),
        origin_url: window.location.origin,
        shipping: ship,
        payment_method: method,
      });
      if (r.data?.mocked) {
        clear();
        window.location.href = r.data.url;
        return;
      }
      if (r.data?.url) window.location.href = r.data.url;
      else throw new Error("No URL");
    } catch (e) {
      toast.error(e?.response?.data?.detail || "Checkout failed");
      setBusy(false);
    }
  };

  const Field = ({ label, children, required }) => (
    <label className="block">
      <span className="overline">{label}{required && <span className="text-red-600 ml-0.5">*</span>}</span>
      <div className="mt-1.5">{children}</div>
    </label>
  );
  const inputCls = "w-full bg-white border border-[#E5E5EA] rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:border-[#1D1D1F]";

  return (
    <main className="bg-white pt-28 pb-24 min-h-screen">
      <div className="max-w-6xl mx-auto px-6 sm:px-8 lg:px-12">
        <div className="overline">Your bag</div>
        <h1 className="display text-5xl sm:text-6xl mt-3">Cart</h1>

        {items.length === 0 ? (
          <div className="mt-12 glass-card rounded-2xl p-12 text-center">
            <p className="ink-mute">Your cart is empty.</p>
            <Link to="/shop" className="btn-ink mt-6 inline-flex">Browse collection</Link>
          </div>
        ) : (
          <div className="mt-10 grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-8">
            <div className="space-y-8">
              {/* Items */}
              <div className="space-y-3">
                {items.map(({ product, quantity }) => (
                  <div key={product.id} className="flex gap-4 p-4 rounded-2xl border border-[#E5E5EA] bg-[#F5F5F7]">
                    <div className="w-28 h-28 rounded-xl overflow-hidden bg-white">
                      <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 flex flex-col justify-between">
                      <div className="flex justify-between gap-2">
                        <div>
                          <p className="font-medium ink">{product.name}</p>
                          <p className="text-xs ink-faint">
                            {[product.color, product.size, product.frame_design].filter(Boolean).join(" · ")}
                          </p>
                        </div>
                        <p className="display ink">{formatINR(product.price * quantity)}</p>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="inline-flex items-center border border-[#E5E5EA] rounded-full bg-white">
                          <button onClick={() => setQty(product.id, quantity - 1)} className="w-9 h-9 grid place-items-center"><Minus className="w-3 h-3"/></button>
                          <span className="w-9 text-center text-sm">{quantity}</span>
                          <button onClick={() => setQty(product.id, quantity + 1)} className="w-9 h-9 grid place-items-center"><Plus className="w-3 h-3"/></button>
                        </div>
                        <button onClick={() => remove(product.id)} className="text-xs ink-mute hover:text-[#0A0A0B] inline-flex items-center gap-1"><Trash2 className="w-3 h-3"/> Remove</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Shipping */}
              <div className="rounded-2xl border border-[#E5E5EA] p-6 bg-white">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div>
                    <div className="overline">Shipping</div>
                    <p className="display text-2xl mt-1">Delivery address</p>
                    <p className="text-xs text-emerald-700 mt-1 inline-flex items-center gap-1"><Truck className="w-3 h-3"/> Free Home Delivery across India</p>
                  </div>
                  <button
                    type="button" data-testid="cart-detect-location"
                    onClick={detectLocation} disabled={detecting}
                    className="btn-ghost text-xs inline-flex items-center gap-2"
                  >
                    {detecting ? <Loader2 className="w-3.5 h-3.5 animate-spin"/> : <MapPin className="w-3.5 h-3.5"/>}
                    Detect my location
                  </button>
                </div>
                <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Field label="Full name" required><input data-testid="ship-name" className={inputCls} value={ship.full_name} onChange={(e)=>setShip({...ship, full_name:e.target.value})}/></Field>
                  <Field label="Mobile" required><input data-testid="ship-phone" className={inputCls} value={ship.phone} onChange={(e)=>setShip({...ship, phone:e.target.value})} placeholder="+91…"/></Field>
                  <Field label="Address" required>
                    <input data-testid="ship-address" className={inputCls} value={ship.address} onChange={(e)=>setShip({...ship, address:e.target.value})} placeholder="House, street, area"/>
                  </Field>
                  <Field label="PIN code" required>
                    <input data-testid="ship-pin" className={inputCls} inputMode="numeric" maxLength={6} value={ship.pin} onChange={(e)=>setShip({...ship, pin:e.target.value.replace(/\D/g,'')})} placeholder="6-digit PIN"/>
                  </Field>
                  <Field label="City" required><input data-testid="ship-city" className={inputCls} value={ship.city} onChange={(e)=>setShip({...ship, city:e.target.value})}/></Field>
                  <Field label="State" required><input data-testid="ship-state" className={inputCls} value={ship.state} onChange={(e)=>setShip({...ship, state:e.target.value})}/></Field>
                </div>
              </div>

              {/* Payment method */}
              <div className="rounded-2xl border border-[#E5E5EA] p-6 bg-white">
                <div className="overline">Payment</div>
                <p className="display text-2xl mt-1">Choose method</p>
                <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {PAYMENT_METHODS.map((m) => (
                    <button
                      key={m.key} type="button"
                      data-testid={`pay-method-${m.key}`}
                      onClick={() => setMethod(m.key)}
                      className={`text-left rounded-xl border p-4 transition-colors ${
                        method === m.key ? "border-[#1D1D1F] bg-[#FAFAFB]" : "border-[#E5E5EA] hover:border-[#1D1D1F]"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg silver-border bg-white grid place-items-center"><m.icon className="w-4 h-4 text-[#1D1D1F]"/></div>
                        <div className="flex-1">
                          <div className="text-sm font-medium ink flex items-center gap-2">
                            {m.label}
                            {!m.real && <span className="mono text-[9px] uppercase tracking-widest px-1.5 py-0.5 rounded-full bg-yellow-100 text-yellow-800">Mock</span>}
                          </div>
                          <div className="text-[11px] ink-faint mt-0.5">{m.sub}</div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
                <p className="mt-3 text-[11px] ink-faint">Stripe (Test) processes a real card payment. UPI/RuPay/Paytm are mocked end-to-end for now — orders are still created.</p>
              </div>
            </div>

            <aside className="glass-card rounded-2xl p-6 h-fit sticky top-24">
              <div className="overline">Summary</div>
              <div className="mt-4 space-y-2 text-sm">
                <div className="flex justify-between"><span className="ink-mute">Subtotal</span><span>{formatINR(subtotal)}</span></div>
                <div className="flex justify-between"><span className="ink-mute">Shipping</span><span className="text-emerald-700">Free</span></div>
                <div className="flex justify-between"><span className="ink-mute">Taxes</span><span>Included</span></div>
              </div>
              <div className="mt-6 flex justify-between border-t border-[#E5E5EA] pt-4">
                <span>Total</span>
                <span data-testid={CART.total} className="display text-xl">{formatINR(subtotal)}</span>
              </div>
              <button
                data-testid={CART.checkoutButton}
                onClick={checkout} disabled={busy}
                className="btn-ink mt-6 w-full inline-flex items-center justify-center gap-2 disabled:opacity-60"
              >{busy ? "Processing…" : `Pay with ${PAYMENT_METHODS.find(p=>p.key===method)?.label.split(' ')[0]}`} <ArrowRight className="w-4 h-4"/></button>
              <p className="text-[11px] ink-faint mt-3">Secure checkout. Free returns within 14 days.</p>
              <button onClick={() => nav("/shop")} className="mt-6 w-full text-sm ink-mute hover:text-[#0A0A0B]">Continue shopping</button>
            </aside>
          </div>
        )}
      </div>
    </main>
  );
}
