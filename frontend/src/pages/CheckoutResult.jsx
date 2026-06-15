import React, { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Check, X, Loader2 } from "lucide-react";
import api from "@/lib/api";
import { useCart } from "@/context/CartContext";
import { formatINR } from "@/lib/format";

export default function CheckoutResult({ outcome }) {
  const loc = useLocation();
  const nav = useNavigate();
  const { clear } = useCart();
  const [status, setStatus] = useState(outcome === "cancel" ? "cancelled" : "polling");
  const [tx, setTx] = useState(null);
  const attempts = useRef(0);

  useEffect(() => {
    if (outcome !== "success") return;
    const params = new URLSearchParams(loc.search);
    const isMock = params.get("mock") === "1";
    const sessionId = params.get("session_id") || (params.get("order_id") ? `mock_${params.get("order_id")}` : null);
    if (!sessionId) { setStatus("error"); return; }

    // Mock path resolves immediately on the backend
    if (isMock) {
      api.get(`/checkout/status/${sessionId}`).then((r) => {
        setTx(r.data); setStatus("paid"); clear();
      }).catch(() => setStatus("error"));
      return;
    }

    let cancelled = false;
    const poll = async () => {
      attempts.current += 1;
      if (attempts.current > 12) { setStatus("timeout"); return; }
      try {
        const r = await api.get(`/checkout/status/${sessionId}`);
        if (cancelled) return;
        setTx(r.data);
        if (r.data.payment_status === "paid") { setStatus("paid"); clear(); return; }
        if (r.data.status === "expired") { setStatus("expired"); return; }
        setTimeout(poll, 2000);
      } catch (e) { if (!cancelled) setStatus("error"); }
    };
    poll();
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [outcome]);

  return (
    <main className="bg-white pt-28 pb-24 min-h-screen">
      <div className="max-w-xl mx-auto px-6 text-center">
        {status === "polling" && (
          <>
            <Loader2 className="w-10 h-10 text-[#1D1D1F] mx-auto animate-spin" />
            <h1 className="display text-4xl mt-6">Confirming your payment…</h1>
            <p className="ink-mute mt-2">This usually takes a few seconds.</p>
          </>
        )}
        {status === "paid" && (
          <>
            <div className="w-16 h-16 mx-auto rounded-full bg-[#1D1D1F] grid place-items-center">
              <Check className="w-7 h-7 text-white"/>
            </div>
            <h1 className="display text-5xl mt-6">Order confirmed.</h1>
            <p className="ink-mute mt-2">A receipt is on its way. We'll start crafting your OculuxVision.</p>
            {tx && (
              <p className="mono text-xs ink-faint mt-4">Total: {formatINR((tx.amount_total||0)/100)} {tx.currency?.toUpperCase()}</p>
            )}
            <div className="mt-8 flex justify-center gap-3 flex-wrap">
              <Link to="/account" className="btn-ink text-sm">View orders</Link>
              <Link to="/shop" className="btn-ghost text-sm">Keep exploring</Link>
            </div>
          </>
        )}
        {status === "cancelled" && (
          <>
            <div className="w-14 h-14 mx-auto rounded-full bg-[#F5F5F7] border border-[#E5E5EA] grid place-items-center"><X className="w-5 h-5 ink-mute"/></div>
            <h1 className="display text-4xl mt-6">Checkout cancelled.</h1>
            <p className="ink-mute mt-2">Your cart is preserved — pick up where you left off.</p>
            <button onClick={() => nav("/cart")} className="btn-ink mt-8 text-sm">Return to cart</button>
          </>
        )}
        {(status === "expired" || status === "timeout" || status === "error") && (
          <>
            <h1 className="display text-4xl mt-6">We couldn't confirm that payment.</h1>
            <p className="ink-mute mt-2">Please contact our Telegram concierge or retry checkout.</p>
            <button onClick={() => nav("/cart")} className="btn-ink mt-8 text-sm">Retry</button>
          </>
        )}
      </div>
    </main>
  );
}
