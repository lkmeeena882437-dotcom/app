import React, { useEffect, useState } from "react";
import { Navigate, Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import api from "@/lib/api";
import { toast } from "sonner";
import { formatINR } from "@/lib/format";
import {
  LayoutDashboard, Package, ShoppingBag, Users, IndianRupee,
  Plus, Pencil, Trash2, X, Shield, FileText, Save,
} from "lucide-react";

const TIERS = ["pro", "kids", "senior"];

function StatCard({ icon: Icon, label, value }) {
  return (
    <div className="rounded-2xl border border-[#E5E5EA] bg-white p-6">
      <div className="flex items-center justify-between">
        <span className="overline">{label}</span>
        <Icon className="w-4 h-4 ink-mute" />
      </div>
      <div className="display text-3xl sm:text-4xl mt-3">{value}</div>
    </div>
  );
}

const inputCls = "w-full bg-white border border-[#E5E5EA] rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#1D1D1F]";
const Field = ({ label, children, hint }) => (
  <label className="block">
    <span className="overline">{label}</span>
    <div className="mt-1.5">{children}</div>
    {hint && <p className="mt-1 text-[10px] ink-faint">{hint}</p>}
  </label>
);
const Input = ({ value, onChange, name, ...rest }) => (
  <input className={inputCls} name={name} value={value ?? ""} onChange={(e)=>onChange(e.target.value)} data-testid={name ? `admin-input-${name}` : undefined} {...rest}/>
);

function ProductForm({ initial, onClose, onSaved }) {
  const isEdit = !!initial?.id;
  const [form, setForm] = useState(() => ({
    slug: initial?.slug || "",
    name: initial?.name || "",
    tagline: initial?.tagline || "",
    description: initial?.description || "",
    price: initial?.price ?? 0,
    compare_at_price: initial?.compare_at_price ?? "",
    currency: "inr",
    tier: initial?.tier || "pro",
    color: initial?.color || "",
    image: initial?.image || "",
    stock: initial?.stock ?? 100,
    color_options: (initial?.color_options || []).join(", "),
    size_options: (initial?.size_options || []).join(", "),
    frame_designs: (initial?.frame_designs || []).join(", "),
    hd_camera: initial?.hd_camera ?? true,
    lens_quality: initial?.lens_quality || "Oakley/Meta-grade polycarbonate, anti-glare, UV400, 99.9% optical clarity",
    free_delivery: initial?.free_delivery ?? true,
    features: (initial?.features || []).join("\n"),
    specs: Object.entries(initial?.specs || {}).map(([k,v]) => `${k}: ${v}`).join("\n"),
  }));
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const payload = {
        ...form,
        price: parseFloat(form.price),
        compare_at_price: form.compare_at_price === "" ? null : parseFloat(form.compare_at_price),
        stock: parseInt(form.stock, 10),
        color_options: form.color_options.split(",").map(s=>s.trim()).filter(Boolean),
        size_options: form.size_options.split(",").map(s=>s.trim()).filter(Boolean),
        frame_designs: form.frame_designs.split(",").map(s=>s.trim()).filter(Boolean),
        features: form.features.split("\n").map((s)=>s.trim()).filter(Boolean),
        specs: Object.fromEntries(
          form.specs.split("\n").map((s)=>s.split(":")).filter((p)=>p.length>=2).map(([k,...r])=>[k.trim(), r.join(":").trim()])
        ),
        gallery: initial?.gallery || [],
      };
      if (isEdit) {
        await api.put(`/admin/products/${initial.id}`, payload);
        toast.success("Product updated");
      } else {
        await api.post("/admin/products", payload);
        toast.success("Product created");
      }
      onSaved(); onClose();
    } catch (e) {
      toast.error(e?.response?.data?.detail || "Save failed");
    } finally { setBusy(false); }
  };

  return (
    <div className="fixed inset-0 z-[70] bg-black/30 backdrop-blur-sm grid place-items-center px-4">
      <div className="w-full max-w-2xl bg-white rounded-2xl border border-[#E5E5EA] shadow-2xl max-h-[88vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E5E5EA] sticky top-0 bg-white z-10">
          <div>
            <div className="overline">{isEdit ? "Edit" : "New"} product</div>
            <p className="display text-xl mt-1 ink">{form.name || "Untitled"}</p>
          </div>
          <button onClick={onClose} className="w-9 h-9 grid place-items-center rounded-full border border-[#E5E5EA]"><X className="w-4 h-4"/></button>
        </div>
        <form onSubmit={submit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Name"><Input name="name" value={form.name} onChange={(v)=>setForm({...form, name:v})} required/></Field>
            <Field label="Slug"><Input name="slug" value={form.slug} onChange={(v)=>setForm({...form, slug:v})} required disabled={isEdit}/></Field>
            <Field label="Tier">
              <select name="tier" data-testid="admin-input-tier" className={inputCls} value={form.tier} onChange={(e)=>setForm({...form, tier:e.target.value})}>
                {TIERS.map((t)=><option key={t} value={t}>{t}</option>)}
              </select>
            </Field>
            <Field label="Default Colour"><Input name="color" value={form.color} onChange={(v)=>setForm({...form, color:v})}/></Field>
            <Field label="Price (₹)"><Input name="price" type="number" step="1" value={form.price} onChange={(v)=>setForm({...form, price:v})} required/></Field>
            <Field label="Compare-at Price (₹)" hint="Leave empty for no discount"><Input name="compare_at_price" type="number" step="1" value={form.compare_at_price} onChange={(v)=>setForm({...form, compare_at_price:v})}/></Field>
            <Field label="Stock"><Input name="stock" type="number" value={form.stock} onChange={(v)=>setForm({...form, stock:v})}/></Field>
            <Field label="Free Delivery">
              <label className="flex items-center gap-2 text-sm mt-2"><input type="checkbox" checked={!!form.free_delivery} onChange={(e)=>setForm({...form, free_delivery:e.target.checked})}/> Eligible</label>
            </Field>
          </div>
          <Field label="Tagline"><Input name="tagline" value={form.tagline} onChange={(v)=>setForm({...form, tagline:v})}/></Field>
          <Field label="Image URL"><Input name="image" value={form.image} onChange={(v)=>setForm({...form, image:v})}/></Field>
          <Field label="Lens quality (HD camera is standard)"><Input name="lens_quality" value={form.lens_quality} onChange={(v)=>setForm({...form, lens_quality:v})}/></Field>
          <Field label="Colour options (comma-separated)" hint="e.g. Matte Onyx, Pearl Champagne, Aurora Blue">
            <Input name="color_options" value={form.color_options} onChange={(v)=>setForm({...form, color_options:v})}/>
          </Field>
          <Field label="Sizes (comma-separated)" hint="e.g. S, M, L">
            <Input name="size_options" value={form.size_options} onChange={(v)=>setForm({...form, size_options:v})}/>
          </Field>
          <Field label="Frame designs (comma-separated)" hint="e.g. Aviator, Wayfarer, Round">
            <Input name="frame_designs" value={form.frame_designs} onChange={(v)=>setForm({...form, frame_designs:v})}/>
          </Field>
          <Field label="Description"><textarea name="description" data-testid="admin-input-description" rows={4} className={inputCls} value={form.description} onChange={(e)=>setForm({...form, description:e.target.value})}/></Field>
          <Field label="Features (one per line)"><textarea name="features" data-testid="admin-input-features" rows={3} className={inputCls} value={form.features} onChange={(e)=>setForm({...form, features:e.target.value})}/></Field>
          <Field label="Specs (key: value per line)"><textarea name="specs" data-testid="admin-input-specs" rows={3} className={inputCls} value={form.specs} onChange={(e)=>setForm({...form, specs:e.target.value})}/></Field>
          <div className="flex justify-end gap-2 pt-2 sticky bottom-0 bg-white pb-2">
            <button type="button" data-testid="admin-form-cancel" onClick={onClose} className="btn-ghost text-sm">Cancel</button>
            <button data-testid="admin-form-save" disabled={busy} className="btn-ink text-sm">{busy ? "Saving…" : "Save"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ContentEditor({ onSaved }) {
  const [c, setC] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api.get("/site/content").then((r) => setC(r.data));
  }, []);

  const save = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await api.put("/admin/site/content", c);
      toast.success("Homepage updated");
      onSaved?.();
    } catch (e) {
      toast.error(e?.response?.data?.detail || "Save failed");
    } finally { setBusy(false); }
  };

  if (!c) return <p className="ink-mute">Loading…</p>;

  return (
    <form onSubmit={save} className="bg-white rounded-2xl border border-[#E5E5EA] p-6 space-y-4 max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <div className="overline">Live homepage content</div>
          <p className="display text-2xl mt-1">Edit hero & headlines</p>
        </div>
        <button data-testid="cms-save" disabled={busy} className="btn-ink inline-flex items-center gap-2 text-sm">
          <Save className="w-4 h-4"/> {busy ? "Saving…" : "Publish"}
        </button>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Brand name (huge centerpiece)"><Input name="hero_brand" value={c.hero_brand} onChange={(v)=>setC({...c, hero_brand:v})}/></Field>
        <Field label="Overline"><Input name="hero_overline" value={c.hero_overline} onChange={(v)=>setC({...c, hero_overline:v})}/></Field>
        <Field label="Headline line 1"><Input name="hero_headline_1" value={c.hero_headline_1} onChange={(v)=>setC({...c, hero_headline_1:v})}/></Field>
        <Field label="Headline line 2"><Input name="hero_headline_2" value={c.hero_headline_2} onChange={(v)=>setC({...c, hero_headline_2:v})}/></Field>
        <Field label="Headline emphasis"><Input name="hero_headline_emph" value={c.hero_headline_emph} onChange={(v)=>setC({...c, hero_headline_emph:v})}/></Field>
        <Field label="Free delivery label"><Input name="free_delivery_label" value={c.free_delivery_label} onChange={(v)=>setC({...c, free_delivery_label:v})}/></Field>
      </div>
      <Field label="Subhead"><textarea name="hero_subhead" rows={2} className={inputCls} value={c.hero_subhead} onChange={(e)=>setC({...c, hero_subhead:e.target.value})}/></Field>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Primary CTA text"><Input name="hero_cta_primary" value={c.hero_cta_primary} onChange={(v)=>setC({...c, hero_cta_primary:v})}/></Field>
        <Field label="Secondary CTA text"><Input name="hero_cta_secondary" value={c.hero_cta_secondary} onChange={(v)=>setC({...c, hero_cta_secondary:v})}/></Field>
      </div>
      <Field label="Hero background image URL"><Input name="hero_image" value={c.hero_image} onChange={(v)=>setC({...c, hero_image:v})}/></Field>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Tier section overline"><Input name="section_tier_overline" value={c.section_tier_overline} onChange={(v)=>setC({...c, section_tier_overline:v})}/></Field>
        <Field label="Tier section headline"><Input name="section_tier_headline" value={c.section_tier_headline} onChange={(v)=>setC({...c, section_tier_headline:v})}/></Field>
      </div>
    </form>
  );
}

export default function Admin() {
  const { user, loading } = useAuth();
  const [tab, setTab] = useState("overview");
  const [stats, setStats] = useState({ orders: 0, users: 0, products: 0, revenue: 0 });
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [users, setUsers] = useState([]);
  const [editing, setEditing] = useState(null);

  const refresh = async () => {
    try {
      const [s, p, o, u] = await Promise.all([
        api.get("/admin/stats"), api.get("/admin/products"),
        api.get("/admin/orders"), api.get("/admin/users"),
      ]);
      setStats(s.data); setProducts(p.data); setOrders(o.data); setUsers(u.data);
    } catch (e) { toast.error("Admin load failed"); }
  };

  useEffect(() => { if (user?.is_admin) refresh(); }, [user]);

  if (loading) return <main className="pt-32 text-center ink-mute">Loading…</main>;
  if (!user) return <Navigate to="/auth" replace />;
  if (!user.is_admin) return (
    <main className="bg-white pt-28 pb-24 min-h-screen text-center px-6">
      <Shield className="w-10 h-10 mx-auto ink-mute"/>
      <h1 className="display text-3xl mt-4">Admin access only</h1>
      <p className="ink-mute mt-2">This area is restricted.</p>
      <Link to="/" className="btn-ink mt-6 inline-flex text-sm">Back to home</Link>
    </main>
  );

  const deleteProduct = async (id) => {
    if (!window.confirm("Delete this product?")) return;
    try { await api.delete(`/admin/products/${id}`); toast.success("Deleted"); refresh(); }
    catch (e) { toast.error("Delete failed"); }
  };

  const TABS = [
    { key: "overview", label: "Overview", icon: LayoutDashboard },
    { key: "content", label: "Site Content (CMS)", icon: FileText },
    { key: "products", label: "Products", icon: Package },
    { key: "orders", label: "Orders", icon: ShoppingBag },
    { key: "users", label: "Users", icon: Users },
  ];

  return (
    <main className="bg-[#F5F5F7] pt-24 pb-24 min-h-screen">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
        <div className="flex items-end justify-between flex-wrap gap-4">
          <div>
            <div className="overline">OculuxVision · Admin</div>
            <h1 className="display text-4xl sm:text-5xl mt-2">Operations</h1>
          </div>
          <div className="chip"><Shield className="w-3 h-3"/> {user.email}</div>
        </div>

        <nav className="mt-8 flex gap-2 overflow-x-auto">
          {TABS.map((t) => (
            <button
              key={t.key} data-testid={`admin-tab-${t.key}`} onClick={() => setTab(t.key)}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm whitespace-nowrap transition-colors ${
                tab === t.key ? "bg-[#1D1D1F] text-white" : "bg-white border border-[#E5E5EA] ink hover:border-[#1D1D1F]"
              }`}
            ><t.icon className="w-4 h-4"/> {t.label}</button>
          ))}
        </nav>

        {tab === "overview" && (
          <div className="mt-8 grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard icon={IndianRupee} label="Revenue" value={formatINR(stats.revenue)} />
            <StatCard icon={ShoppingBag} label="Orders" value={stats.orders} />
            <StatCard icon={Package} label="Products" value={stats.products} />
            <StatCard icon={Users} label="Customers" value={stats.users} />
          </div>
        )}

        {tab === "content" && (
          <div className="mt-8"><ContentEditor onSaved={refresh}/></div>
        )}

        {tab === "products" && (
          <div className="mt-8">
            <div className="flex items-center justify-between mb-4">
              <div className="overline">{products.length} products</div>
              <button data-testid="admin-new-product-btn" onClick={() => setEditing("new")} className="btn-ink inline-flex items-center gap-2 text-sm">
                <Plus className="w-4 h-4"/> New product
              </button>
            </div>
            <div className="bg-white border border-[#E5E5EA] rounded-2xl overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-[#FAFAFB] text-left ink-mute">
                  <tr>
                    <th className="px-5 py-3 font-medium">Product</th>
                    <th className="px-5 py-3 font-medium">Tier</th>
                    <th className="px-5 py-3 font-medium">Price (₹)</th>
                    <th className="px-5 py-3 font-medium">Compare</th>
                    <th className="px-5 py-3 font-medium">Stock</th>
                    <th className="px-5 py-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((p) => (
                    <tr key={p.id} className="border-t border-[#E5E5EA]">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <img src={p.image} alt="" className="w-10 h-10 rounded-md object-cover bg-[#F5F5F7]"/>
                          <div>
                            <div className="ink font-medium">{p.name}</div>
                            <div className="mono text-[10px] ink-faint">{p.slug}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3 ink"><span className="chip">{p.tier}</span></td>
                      <td className="px-5 py-3 ink">{formatINR(p.price)}</td>
                      <td className="px-5 py-3 ink-faint">{p.compare_at_price ? formatINR(p.compare_at_price) : "—"}</td>
                      <td className="px-5 py-3 ink">{p.stock ?? 0}</td>
                      <td className="px-5 py-3 text-right">
                        <button data-testid={`admin-row-edit-${p.id}`} onClick={() => setEditing(p)} className="inline-flex items-center gap-1 text-xs ink-soft hover:text-[#0A0A0B] mr-3"><Pencil className="w-3 h-3"/> Edit</button>
                        <button data-testid={`admin-row-delete-${p.id}`} onClick={() => deleteProduct(p.id)} className="inline-flex items-center gap-1 text-xs text-red-600 hover:text-red-700"><Trash2 className="w-3 h-3"/> Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {editing && <ProductForm initial={editing === "new" ? null : editing} onClose={() => setEditing(null)} onSaved={refresh}/>}
          </div>
        )}

        {tab === "orders" && (
          <div className="mt-8 bg-white border border-[#E5E5EA] rounded-2xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-[#FAFAFB] text-left ink-mute">
                <tr>
                  <th className="px-5 py-3 font-medium">Order</th>
                  <th className="px-5 py-3 font-medium">Customer</th>
                  <th className="px-5 py-3 font-medium">Method</th>
                  <th className="px-5 py-3 font-medium">PIN</th>
                  <th className="px-5 py-3 font-medium">Total</th>
                  <th className="px-5 py-3 font-medium">Date</th>
                </tr>
              </thead>
              <tbody>
                {orders.length === 0 && <tr><td colSpan="6" className="px-5 py-10 text-center ink-mute">No orders yet.</td></tr>}
                {orders.map((o) => (
                  <tr key={o.id} className="border-t border-[#E5E5EA]">
                    <td className="px-5 py-3 mono text-xs">#{o.id.slice(0,8).toUpperCase()}</td>
                    <td className="px-5 py-3 ink">{o.user_phone || o.user_email || "guest"}</td>
                    <td className="px-5 py-3 ink-soft">{o.payment_method?.toUpperCase() || "STRIPE"}</td>
                    <td className="px-5 py-3 ink-soft">{o.shipping?.pin || "—"}</td>
                    <td className="px-5 py-3 ink">{formatINR(o.amount_total ?? 0)}</td>
                    <td className="px-5 py-3 ink-mute">{new Date(o.created_at).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {tab === "users" && (
          <div className="mt-8 bg-white border border-[#E5E5EA] rounded-2xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-[#FAFAFB] text-left ink-mute">
                <tr>
                  <th className="px-5 py-3 font-medium">Name</th>
                  <th className="px-5 py-3 font-medium">Contact</th>
                  <th className="px-5 py-3 font-medium">Role</th>
                  <th className="px-5 py-3 font-medium">Joined</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-t border-[#E5E5EA]">
                    <td className="px-5 py-3 ink">{u.name}</td>
                    <td className="px-5 py-3 ink-soft">{u.email || u.phone || "—"}</td>
                    <td className="px-5 py-3">{u.is_admin ? <span className="chip">Admin</span> : <span className="text-xs ink-mute">Customer</span>}</td>
                    <td className="px-5 py-3 ink-mute">{u.created_at ? new Date(u.created_at).toLocaleDateString() : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}
