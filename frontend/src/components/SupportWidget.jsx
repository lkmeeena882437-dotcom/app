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
        className="fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full bg-[#1D1D1F] grid place-items-center shadow-[0_18px_40px_-10px_rgba(0,0,0,0.4)] hover:scale-105 transition-transform"
        aria-label="Toggle support"
      >
        {open ? <X className="w-5 h-5 text-white" /> : <MessageCircle className="w-5 h-5 text-white" />}
      </button>
      {open && (
        <div
          data-testid={SUPPORT.widget}
          className="fixed bottom-24 right-6 z-40 w-[320px] glass-card rounded-2xl p-5"
        >
          <div className="overline">Concierge</div>
          <p className="display text-lg mt-1 ink">How can we help?</p>
          <p className="text-xs ink-mute mt-1">Our team replies in &lt; 2 minutes.</p>
          <div className="mt-4 space-y-2">
            {["Order status", "AR Try-On help", "Sizing & fit", "Returns"].map((q) => (
              <button key={q} className="w-full text-left text-sm px-3 py-2 rounded-lg bg-[#F5F5F7] hover:bg-[#EDEDF0] transition-colors text-[#1D1D1F]">
                {q}
              </button>
            ))}
          </div>
          <div className="mt-4 flex gap-2">
            <input placeholder="Type a message…" className="flex-1 bg-white border border-[#E5E5EA] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#1D1D1F]" />
            <button className="w-10 h-10 grid place-items-center rounded-lg bg-[#1D1D1F] text-white"><Send className="w-4 h-4"/></button>
          </div>
        </div>
      )}
    </>
  );
}
