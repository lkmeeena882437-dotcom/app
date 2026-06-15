import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Sparkles, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";
import { FOOTER } from "@/constants/testIds";

export default function Footer() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;
    setBusy(true);
    try {
      await api.post("/newsletter", { email });
      toast.success("Welcome to the Oculux signal.");
      setEmail("");
    } catch (err) {
      toast.error("Please enter a valid email.");
    } finally { setBusy(false); }
  };

  return (
    <footer className="relative border-t border-white/10 bg-[#050505]">
      <div className="cyber-line" />
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-20 grid grid-cols-1 md:grid-cols-12 gap-12">
        <div className="md:col-span-5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full border border-[#00F0FF]/40 grid place-items-center">
              <Sparkles className="w-4 h-4 text-[#00F0FF]" />
            </div>
            <span className="display text-xl">OCULUX</span>
          </div>
          <p className="mt-6 text-white/60 text-sm max-w-sm leading-relaxed">
            Cinematic intelligence, worn beautifully. Crafted for the next
            generation of seeing.
          </p>
          <form onSubmit={submit} className="mt-8 flex gap-2 max-w-sm">
            <input
              data-testid={FOOTER.newsletterInput}
              type="email"
              required
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-sm text-white placeholder-white/40 focus:outline-none focus:border-[#00F0FF]/60"
            />
            <button
              data-testid={FOOTER.newsletterSubmit}
              type="submit"
              disabled={busy}
              className="px-5 py-3 rounded-lg bg-white text-black text-sm font-medium hover:bg-[#00F0FF] transition-colors flex items-center gap-2"
            >
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>

        <div className="md:col-span-7 grid grid-cols-2 sm:grid-cols-3 gap-8">
          {[
            { title: "Shop", links: [["All glasses","/shop"], ["Professional","/shop?tier=pro"], ["Kids","/shop?tier=kids"], ["Seniors","/shop?tier=senior"]] },
            { title: "Discover", links: [["Technology","/technology"], ["AR Try-On","/ar-try-on"], ["Reviews","/#reviews"]] },
            { title: "Company", links: [["About","/#about"], ["Contact","/#contact"], ["Press","/#press"]] },
          ].map((col) => (
            <div key={col.title}>
              <div className="overline mb-4">{col.title}</div>
              <ul className="space-y-3">
                {col.links.map(([label,to]) => (
                  <li key={label}><Link to={to} className="text-sm text-white/70 hover:text-white transition-colors">{label}</Link></li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 pb-10 flex flex-col sm:flex-row justify-between items-center gap-4 border-t border-white/5 pt-6">
        <p className="text-xs text-white/40">© {new Date().getFullYear()} Oculux. All sights reserved.</p>
        <p className="mono text-[10px] text-white/40">v2.0 · CINEMATIC INTELLIGENCE</p>
      </div>
    </footer>
  );
}
