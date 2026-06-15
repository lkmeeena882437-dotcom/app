import React, { useState } from "react";
import { MessageCircle, X, Send } from "lucide-react";
import { SUPPORT } from "@/constants/testIds";

export default function SupportWidget() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        data-testid={SUPPORT.toggle}
        onClick={() => setOpen((s) => !s)}
        className="fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full bg-[#0a0a0a] border border-[#00F0FF]/40 grid place-items-center shadow-[0_0_30px_rgba(0,240,255,0.25)] hover:shadow-[0_0_44px_rgba(0,240,255,0.45)] transition-shadow"
        aria-label="Toggle support"
      >
        {open ? <X className="w-5 h-5" /> : <MessageCircle className="w-5 h-5 text-[#00F0FF]" />}
      </button>
      {open && (
        <div
          data-testid={SUPPORT.widget}
          className="fixed bottom-24 right-6 z-40 w-[320px] glass rounded-2xl p-5 border-[#00F0FF]/20"
        >
          <div className="overline">Concierge</div>
          <p className="display text-lg mt-1">How can we help?</p>
          <p className="text-xs text-white/50 mt-1">Our team replies in &lt; 2 minutes.</p>
          <div className="mt-4 space-y-2">
            {["Order status", "AR Try-On help", "Sizing & fit", "Returns"].map((q) => (
              <button key={q} className="w-full text-left text-sm px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
                {q}
              </button>
            ))}
          </div>
          <div className="mt-4 flex gap-2">
            <input placeholder="Type a message…" className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#00F0FF]/60" />
            <button className="w-10 h-10 grid place-items-center rounded-lg bg-[#00F0FF] text-black"><Send className="w-4 h-4"/></button>
          </div>
        </div>
      )}
    </>
  );
}
