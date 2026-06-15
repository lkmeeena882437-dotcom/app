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
    <footer className="relative border-t border-[#E5E5EA] bg-white">
      <div className="hairline" />
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-20 grid grid-cols-1 md:grid-cols-12 gap-12">
        <div className="md:col-span-5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full silver-border grid place-items-center bg-white">
              <Sparkles className="w-4 h-4 text-[#1D1D1F]" />
            </div>
            <span className="display text-xl ink">OCULUX</span>
          </div>
          <p className="mt-6 ink-mute text-sm max-w-sm leading-relaxed">
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
              className="flex-1 bg-white border border-[#E5E5EA] rounded-lg px-4 py-3 text-sm text-[#1D1D1F] placeholder-[#A1A1A6] focus:outline-none focus:border-[#1D1D1F]"
            />
            <button
              data-testid={FOOTER.newsletterSubmit}
              type="submit"
              disabled={busy}
              className="px-5 py-3 rounded-lg bg-[#1D1D1F] text-white text-sm font-medium hover:bg-black transition-colors flex items-center gap-2"
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
                  <li key={label}><Link to={to} className="text-sm ink-soft hover:text-[#0A0A0B] transition-colors">{label}</Link></li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 pb-10 flex flex-col sm:flex-row justify-between items-center gap-4 border-t border-[#E5E5EA] pt-6">
        <p className="text-xs ink-faint">© {new Date().getFullYear()} Oculux. All sights reserved.</p>
        <p className="mono text-[10px] ink-faint">v2.1 · CINEMATIC INTELLIGENCE</p>
      </div>
    </footer>
  );
}
