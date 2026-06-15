import React, { useEffect, useState } from "react";
import { Navigate, Link } from "react-router-dom";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { AUTH } from "@/constants/testIds";

export default function Account() {
  const { user, loading, logout } = useAuth();
  const [orders, setOrders] = useState([]);
  const [busy, setBusy] = useState(true);

  useEffect(() => {
    if (!user) return;
    api.get("/orders").then((r) => setOrders(r.data)).finally(() => setBusy(false));
  }, [user]);

  if (loading) return <main className="pt-32 text-center text-white/60">Loading…</main>;
  if (!user) return <Navigate to="/auth" replace />;

  return (
    <main className="bg-[#050505] pt-28 pb-24 min-h-screen">
      <div className="max-w-5xl mx-auto px-6 sm:px-8 lg:px-12">
        <div className="flex items-end justify-between gap-4 flex-wrap">
          <div>
            <div className="overline">Your account</div>
            <h1 className="display text-5xl mt-3">Hello, {user.name.split(" ")[0]}.</h1>
            <p className="text-white/60 mt-2">{user.email}</p>
          </div>
          <button data-testid={AUTH.logoutButton} onClick={logout} className="px-5 py-2.5 rounded-full border border-white/15 text-sm hover:border-white/40">Sign out</button>
        </div>

        <div className="mt-12">
          <div className="overline mb-4">Orders</div>
          {busy ? (
            <p className="text-white/50">Loading orders…</p>
          ) : orders.length === 0 ? (
            <div className="glass rounded-2xl p-12 text-center">
              <p className="text-white/70">No orders yet.</p>
              <Link to="/shop" className="mt-4 inline-flex px-5 py-2.5 rounded-full bg-white text-black text-sm">Start shopping</Link>
            </div>
          ) : (
            <ul className="space-y-3">
              {orders.map((o) => (
                <li key={o.id} className="p-4 rounded-2xl border border-white/10 bg-white/[0.02] flex justify-between items-center gap-3 flex-wrap">
                  <div>
                    <div className="mono text-xs text-white/40">#{o.id.slice(0,8).toUpperCase()}</div>
                    <div className="text-sm mt-1">{o.items.length} item{o.items.length>1?"s":""} · {new Date(o.created_at).toLocaleDateString()}</div>
                  </div>
                  <div className="display text-xl">${(o.amount_total ?? 0).toFixed(2)}</div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </main>
  );
}
