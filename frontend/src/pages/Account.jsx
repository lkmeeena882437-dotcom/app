import React, { useEffect, useState } from "react";
import { Navigate, Link } from "react-router-dom";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { AUTH } from "@/constants/testIds";
import { formatINR } from "@/lib/format";
import { Shield } from "lucide-react";

export default function Account() {
  const { user, loading, logout } = useAuth();
  const [orders, setOrders] = useState([]);
  const [busy, setBusy] = useState(true);

  useEffect(() => {
    if (!user) return;
    api.get("/orders").then((r) => setOrders(r.data)).finally(() => setBusy(false));
  }, [user]);

  if (loading) return <main className="pt-32 text-center ink-mute">Loading…</main>;
  if (!user) return <Navigate to="/auth" replace />;

  return (
    <main className="bg-white pt-28 pb-24 min-h-screen">
      <div className="max-w-5xl mx-auto px-6 sm:px-8 lg:px-12">
        <div className="flex items-end justify-between gap-4 flex-wrap">
          <div>
            <div className="overline">Your account</div>
            <h1 className="display text-5xl mt-3">Hello, {user.name}.</h1>
            <p className="ink-mute mt-2">{user.phone || user.email}</p>
          </div>
          <div className="flex items-center gap-2">
            {user.is_admin && (
              <Link to="/admin" className="btn-ghost inline-flex items-center gap-2 text-sm">
                <Shield className="w-4 h-4"/> Admin dashboard
              </Link>
            )}
            <button data-testid={AUTH.logoutButton} onClick={logout} className="btn-ghost text-sm">Sign out</button>
          </div>
        </div>

        <div className="mt-12">
          <div className="overline mb-4">Orders</div>
          {busy ? (
            <p className="ink-mute">Loading orders…</p>
          ) : orders.length === 0 ? (
            <div className="glass-card rounded-2xl p-12 text-center">
              <p className="ink-mute">No orders yet.</p>
              <Link to="/shop" className="btn-ink mt-4 inline-flex text-sm">Start shopping</Link>
            </div>
          ) : (
            <ul className="space-y-3">
              {orders.map((o) => (
                <li key={o.id} className="p-4 rounded-2xl border border-[#E5E5EA] bg-[#F5F5F7] flex justify-between items-center gap-3 flex-wrap">
                  <div>
                    <div className="mono text-xs ink-faint">#{o.id.slice(0,8).toUpperCase()} · {o.payment_method?.toUpperCase() || "STRIPE"}</div>
                    <div className="text-sm mt-1 ink">{o.items.length} item{o.items.length>1?"s":""} · {new Date(o.created_at).toLocaleDateString()}</div>
                    {o.shipping?.city && <div className="text-xs ink-mute mt-0.5">Shipping to {o.shipping.city}, {o.shipping.state} {o.shipping.pin}</div>}
                  </div>
                  <div className="display text-xl ink">{formatINR(o.amount_total || 0)}</div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </main>
  );
}
