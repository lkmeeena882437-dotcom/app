import React from "react";
import { Play, Heart } from "lucide-react";

const REELS = [
  { id: 1, src: "https://images.unsplash.com/photo-1764179627974-25d96c2a1e97?crop=entropy&cs=srgb&fm=jpg&q=80&w=600", user: "@aerial.kim", caption: "Filmed entirely hands-free 📡" },
  { id: 2, src: "https://images.unsplash.com/photo-1702284970879-4a0f0b76cee5?crop=entropy&cs=srgb&fm=jpg&q=80&w=600", user: "@mia.builds", caption: "AR homework is unreal 🤯" },
  { id: 3, src: "https://images.unsplash.com/photo-1634457000710-8ab0e71b2b87?crop=entropy&cs=srgb&fm=jpg&q=80&w=600", user: "@ceo.diaries", caption: "Inbox cleared on the run." },
  { id: 4, src: "https://images.unsplash.com/photo-1716236086408-feca5a7c682c?crop=entropy&cs=srgb&fm=jpg&q=80&w=600", user: "@grandma.sees", caption: "I can read again. Properly." },
  { id: 5, src: "https://images.unsplash.com/photo-1508179522353-11ba468c4a1c?crop=entropy&cs=srgb&fm=jpg&q=80&w=600", user: "@neon.weekend", caption: "Tokyo at 4K. Try it." },
  { id: 6, src: "https://images.unsplash.com/photo-1762314908505-24bccd998715?crop=entropy&cs=srgb&fm=jpg&q=80&w=600", user: "@racing.lines", caption: "Telemetry in my periphery." },
];

export default function SocialReels() {
  return (
    <section className="relative py-24 sm:py-32">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-12">
          <div>
            <div className="overline">#OculuxIRL</div>
            <h2 className="display text-4xl sm:text-5xl mt-3">Lived in. Loved in.</h2>
          </div>
          <p className="text-white/60 max-w-md text-sm">
            Tagged moments from a global community wearing Oculux through their
            mornings, missions and quiet evenings.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
          {REELS.map((r) => (
            <div
              key={r.id}
              className="group relative aspect-[9/16] rounded-xl overflow-hidden bg-[#0a0a0a] cursor-pointer"
            >
              <img src={r.src} alt={r.caption} className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
              <div className="absolute inset-0 grid place-items-center opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="w-12 h-12 rounded-full bg-white/10 backdrop-blur grid place-items-center border border-white/30">
                  <Play className="w-4 h-4 fill-white" />
                </div>
              </div>
              <div className="absolute bottom-0 left-0 right-0 p-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-white/90">{r.user}</span>
                  <span className="flex items-center gap-1 text-white/60"><Heart className="w-3 h-3"/> {Math.floor(Math.random()*9 + 1)}.{Math.floor(Math.random()*9)}k</span>
                </div>
                <p className="mt-1 text-[11px] text-white/70 line-clamp-1">{r.caption}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
