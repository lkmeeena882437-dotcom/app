import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Play, ShieldCheck, Sparkles, Brain, Eye } from "lucide-react";
import { motion } from "framer-motion";
import TechTeardown from "@/components/TechTeardown";
import SocialReels from "@/components/SocialReels";
import { HERO, TIERS } from "@/constants/testIds";

const TIER_CARDS = [
  {
    key: "kids", title: "For Kids", sub: "Safety & curiosity",
    desc: "Live location, AR storytime, blue-light protection — engineered for the smallest explorers.",
    img: "https://images.unsplash.com/photo-1702284970879-4a0f0b76cee5?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA1OTN8MHwxfHNlYXJjaHwxfHxjaGlsZCUyMHdlYXJpbmclMjBzdW5nbGFzc2VzJTIwY2luZW1hdGljfGVufDB8fHx8MTc4MTQ5MzE0Mnww&ixlib=rb-4.1.0&q=85",
    href: "/shop?tier=kids",
  },
  {
    key: "pro", title: "For Professionals", sub: "Productivity & style",
    desc: "Hands-free filmmaking, AI assistants, calls and translations — wear your office.",
    img: "https://images.unsplash.com/photo-1634457000710-8ab0e71b2b87?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA3MDR8MHwxfHNlYXJjaHwyfHx5b3VuZyUyMHByb2Zlc3Npb25hbCUyMHdlYXJpbmclMjBzbWFydCUyMGdsYXNzZXMlMjBkYXJrJTIwYmFja2dyb3VuZHxlbnwwfHx8fDE3ODE0OTMxNDJ8MA&ixlib=rb-4.1.0&q=85",
    href: "/shop?tier=pro",
  },
  {
    key: "senior", title: "For Seniors", sub: "Vision & vitals",
    desc: "Continuous health monitoring, voice navigation, vision augmentation — independence, restored.",
    img: "https://images.unsplash.com/photo-1716236086408-feca5a7c682c?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA2MTJ8MHwxfHNlYXJjaHwyfHxzZW5pb3IlMjB3ZWFyaW5nJTIwc3VuZ2xhc3NlcyUyMGNpbmVtYXRpY3xlbnwwfHx8fDE3ODE0OTMxNDJ8MA&ixlib=rb-4.1.0&q=85",
    href: "/shop?tier=senior",
  },
];

const PRESS = ["WIRED", "VOGUE", "TECHCRUNCH", "GQ", "MONOCLE", "BLOOMBERG", "DEZEEN"];

export default function Home() {
  return (
    <main className="bg-white">
      {/* HERO — light cinematic, asymmetric */}
      <section className="relative min-h-[100svh] overflow-hidden bg-[#F5F5F7]">
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1508179522353-11ba468c4a1c?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDQ2NDF8MHwxfHNlYXJjaHwyfHxjaW5lbWF0aWMlMjBzbWFydCUyMGdsYXNzZXMlMjBwb3J0cmFpdCUyMG5lb24lMjBnbG93fGVufDB8fHx8MTc4MTQ5MzE0Mnww&ixlib=rb-4.1.0&q=85"
            alt="Cinematic Oculux hero"
            className="absolute right-0 top-0 h-full w-[68%] object-cover"
          />
          {/* Light wash for legibility on the left side */}
          <div className="absolute inset-0 bg-gradient-to-r from-white via-white/85 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-white/40" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 pt-40 pb-24">
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} className="max-w-3xl">
            <div className="overline">Oculux Series N2 · 2026</div>
            <h1 className="display text-balance text-5xl sm:text-7xl lg:text-8xl mt-4 leading-[0.95]">
              See what you've<br/>
              been <span className="italic ink-soft">missing.</span>
            </h1>
            <p className="mt-8 ink-soft text-lg sm:text-xl max-w-2xl">
              Flagship AI eyewear for kids, creators and elders. Cinema-grade
              optics. Whisper-quiet acoustics. Always-on intelligence.
            </p>
            <div className="mt-10 flex flex-wrap items-center gap-4">
              <Link to="/shop" data-testid={HERO.shopNow} className="btn-ink inline-flex items-center gap-2">
                Shop the collection <ArrowRight className="w-4 h-4" />
              </Link>
              <Link to="/ar-try-on" data-testid={HERO.watchFilm} className="btn-ghost inline-flex items-center gap-2">
                <Play className="w-4 h-4" /> Try in AR
              </Link>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }} className="mt-16 hidden md:grid grid-cols-3 gap-4 max-w-xl">
            {[
              { icon: Brain, label: "12 TOPS NPU" },
              { icon: Eye, label: "12MP 4K60" },
              { icon: ShieldCheck, label: "14h battery" },
            ].map(({icon:Icon,label}) => (
              <div key={label} className="glass-card rounded-xl px-4 py-3 flex items-center gap-3">
                <Icon className="w-4 h-4 text-[#1D1D1F]" />
                <span className="mono text-xs ink">{label}</span>
              </div>
            ))}
          </motion.div>
        </div>

        <div data-testid={HERO.scrollHint} className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-2">
          <span className="overline">Scroll</span>
          <div className="w-px h-10 bg-gradient-to-b from-[#1D1D1F] to-transparent" />
        </div>
      </section>

      {/* PRESS */}
      <section className="border-y border-[#E5E5EA] py-6 overflow-hidden bg-white">
        <div className="flex marquee whitespace-nowrap gap-16">
          {[...PRESS, ...PRESS, ...PRESS].map((p, i) => (
            <span key={i} className="mono text-xs tracking-[0.3em] ink-faint">{p}</span>
          ))}
        </div>
      </section>

      {/* TIERS */}
      <section className="py-24 sm:py-32 bg-white">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-14">
            <div>
              <div className="overline">Three generations. One vision.</div>
              <h2 className="display text-4xl sm:text-5xl lg:text-6xl mt-3 max-w-xl">A frame for every face of your family.</h2>
            </div>
            <Link to="/shop" className="text-sm ink-soft hover:text-[#0A0A0B] inline-flex items-center gap-2">
              View all collections <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {TIER_CARDS.map((t, i) => (
              <Link
                key={t.key}
                to={t.href}
                data-testid={TIERS.card(t.key)}
                className="group relative rounded-2xl overflow-hidden bg-[#F5F5F7] border border-[#E5E5EA] hover:border-[#1D1D1F] transition-colors aspect-[4/5]"
              >
                <img src={t.img} alt={t.title} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/15 to-transparent" />
                <div className="absolute top-5 left-5">
                  <div className="chip">0{i+1} · {t.sub}</div>
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                  <h3 className="display text-3xl text-white">{t.title}</h3>
                  <p className="text-sm opacity-85 mt-2 max-w-xs">{t.desc}</p>
                  <div className="mt-4 inline-flex items-center gap-2 text-sm">
                    Explore <ArrowRight className="w-4 h-4" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* TEARDOWN */}
      <TechTeardown />

      {/* AR CTA */}
      <section className="relative py-24 sm:py-32 overflow-hidden bg-white">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
          <div className="relative rounded-3xl overflow-hidden border border-[#E5E5EA] bg-[#F5F5F7]">
            <img src="https://images.unsplash.com/photo-1764179627974-25d96c2a1e97?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjAxODF8MHwxfHNlYXJjaHwyfHxsdXh1cnklMjBzdW5nbGFzc2VzJTIwZGFyayUyMGJhY2tncm91bmR8ZW58MHx8fHwxNzgxNDkzMTQyfDA&ixlib=rb-4.1.0&q=85" alt="AR Try On" className="absolute right-0 top-0 h-full w-[55%] object-cover" />
            <div className="absolute inset-0 bg-gradient-to-r from-white via-white/85 to-transparent" />
            <div className="relative grid grid-cols-1 lg:grid-cols-2 gap-8 p-10 sm:p-16 lg:p-20">
              <div>
                <div className="overline">AR Mirror</div>
                <h2 className="display text-4xl sm:text-5xl lg:text-6xl mt-3">Try them on.<br/>Right now.</h2>
                <p className="mt-6 ink-soft max-w-md">
                  Open your camera. Choose a frame. Our face-tracking AI locks
                  the glasses precisely to your bridge — in under five seconds,
                  no app required.
                </p>
                <Link to="/ar-try-on" className="btn-ink mt-8 inline-flex items-center gap-2">
                  Launch AR Try-On <Sparkles className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SOCIAL REELS */}
      <SocialReels />
    </main>
  );
}
