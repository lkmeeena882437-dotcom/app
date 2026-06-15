import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Play, ShieldCheck, Sparkles, Brain, Eye, Truck } from "lucide-react";
import { motion } from "framer-motion";
import api from "@/lib/api";
import TechTeardown from "@/components/TechTeardown";
import SocialReels from "@/components/SocialReels";
import { HERO, TIERS } from "@/constants/testIds";

const TIER_CARDS = [
  {
    key: "kids", title: "For Kids", sub: "Safety & HD memories",
    desc: "Live location, AR storytime, integrated HD camera and Meta-grade shatter-proof lenses — for the smallest explorers.",
    img: "https://images.unsplash.com/photo-1702284970879-4a0f0b76cee5?crop=entropy&cs=srgb&fm=jpg&q=85",
    href: "/shop?tier=kids",
  },
  {
    key: "pro", title: "For Professionals", sub: "HD imaging & style",
    desc: "Hands-free 4K filmmaking, AI assistants, Oakley-grade optics — wear your studio.",
    img: "https://images.unsplash.com/photo-1634457000710-8ab0e71b2b87?crop=entropy&cs=srgb&fm=jpg&q=85",
    href: "/shop?tier=pro",
  },
  {
    key: "senior", title: "For Seniors", sub: "Vision, vitals & memories",
    desc: "Continuous health monitoring, voice navigation, vision augmentation and HD camera — independence, restored.",
    img: "https://images.unsplash.com/photo-1716236086408-feca5a7c682c?crop=entropy&cs=srgb&fm=jpg&q=85",
    href: "/shop?tier=senior",
  },
];

const PRESS = ["WIRED", "VOGUE", "TECHCRUNCH", "GQ", "MONOCLE", "BLOOMBERG", "DEZEEN"];

const DEFAULTS = {
  hero_brand: "OculuxVision",
  hero_overline: "OculuxVision Series N3 · 2026",
  hero_headline_1: "See what you've",
  hero_headline_2: "been",
  hero_headline_emph: "missing.",
  hero_subhead: "Flagship AI eyewear with integrated HD camera and Oakley/Meta-grade lens optics — built for kids, creators and elders.",
  hero_cta_primary: "Shop the collection",
  hero_cta_secondary: "Try in AR",
  hero_image: "https://images.unsplash.com/photo-1508179522353-11ba468c4a1c?crop=entropy&cs=srgb&fm=jpg&q=85",
  section_tier_overline: "Three generations. One vision.",
  section_tier_headline: "A frame for every face of your family.",
  free_delivery_label: "Free Home Delivery across India",
};

export default function Home() {
  const [c, setC] = useState(DEFAULTS);
  useEffect(() => {
    api.get("/site/content").then((r) => setC({ ...DEFAULTS, ...r.data })).catch(() => {});
  }, []);

  return (
    <main className="bg-white">
      {/* HERO — center brand + cinematic background */}
      <section className="relative min-h-[100svh] overflow-hidden bg-[#F5F5F7]">
        <div className="absolute inset-0">
          <img
            src={c.hero_image}
            alt={`${c.hero_brand} hero`}
            className="absolute inset-0 w-full h-full object-cover"
          />
          {/* Bottom gradient for legibility & soft floor transition */}
          <div className="absolute inset-0 bg-gradient-to-b from-white/35 via-white/15 to-white" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 pt-32 pb-24 min-h-[100svh] flex flex-col justify-end">
          {/* HUGE centered brand */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9 }}
            data-testid="hero-brand"
            className="display text-center mx-auto leading-[0.9] tracking-[-0.04em] ink"
            style={{ fontSize: "clamp(3.5rem, 13vw, 11rem)" }}
          >
            {c.hero_brand}
          </motion.h1>

          <motion.div
            initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25, duration: 0.8 }}
            className="mt-8 mx-auto text-center max-w-2xl"
          >
            <div className="overline">{c.hero_overline}</div>
            <p className="display text-3xl sm:text-4xl mt-4 leading-tight">
              {c.hero_headline_1} {c.hero_headline_2} <span className="italic ink-soft">{c.hero_headline_emph}</span>
            </p>
            <p className="mt-5 ink-soft text-base sm:text-lg">{c.hero_subhead}</p>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Link to="/shop" data-testid={HERO.shopNow} className="btn-ink inline-flex items-center gap-2">
                {c.hero_cta_primary} <ArrowRight className="w-4 h-4" />
              </Link>
              <Link to="/ar-try-on" data-testid={HERO.watchFilm} className="btn-ghost inline-flex items-center gap-2">
                <Play className="w-4 h-4" /> {c.hero_cta_secondary}
              </Link>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }} className="mt-12 mx-auto grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-3xl">
            {[
              { icon: Brain, label: "12 TOPS NPU" },
              { icon: Eye, label: "Integrated HD camera" },
              { icon: ShieldCheck, label: "Oakley/Meta-grade lens" },
              { icon: Truck, label: c.free_delivery_label },
            ].map(({icon:Icon,label}) => (
              <div key={label} className="glass-card rounded-xl px-3 py-3 flex items-center gap-2">
                <Icon className="w-4 h-4 text-[#1D1D1F] shrink-0" />
                <span className="mono text-[11px] ink leading-tight">{label}</span>
              </div>
            ))}
          </motion.div>
        </div>

        <div data-testid={HERO.scrollHint} className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-2">
          <span className="overline">Scroll</span>
          <div className="w-px h-8 bg-gradient-to-b from-[#1D1D1F] to-transparent" />
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

      {/* HD CAMERA STRIP */}
      <section className="bg-white py-12">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl silver-border bg-white grid place-items-center"><Eye className="w-6 h-6 text-[#1D1D1F]"/></div>
            <div>
              <div className="overline">Standard on every pair</div>
              <h3 className="display text-2xl mt-1">Integrated HD camera + Oakley/Meta-grade lens</h3>
            </div>
          </div>
          <p className="ink-mute text-sm max-w-md">
            Capture 4K60 cinematic memories hands-free — through Plutonite®-class polycarbonate lenses with UV400 protection and 99.9% optical clarity.
          </p>
        </div>
      </section>

      {/* TIERS */}
      <section className="py-24 sm:py-32 bg-white">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-14">
            <div>
              <div className="overline">{c.section_tier_overline}</div>
              <h2 className="display text-4xl sm:text-5xl lg:text-6xl mt-3 max-w-xl">{c.section_tier_headline}</h2>
            </div>
            <Link to="/shop" className="text-sm ink-soft hover:text-[#0A0A0B] inline-flex items-center gap-2">
              View all collections <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {TIER_CARDS.map((t, i) => (
              <Link
                key={t.key} to={t.href} data-testid={TIERS.card(t.key)}
                className="group relative rounded-2xl overflow-hidden bg-[#F5F5F7] border border-[#E5E5EA] hover:border-[#1D1D1F] transition-colors aspect-[4/5]"
              >
                <img src={t.img} alt={t.title} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/15 to-transparent" />
                <div className="absolute top-5 left-5"><div className="chip">0{i+1} · {t.sub}</div></div>
                <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                  <h3 className="display text-3xl text-white">{t.title}</h3>
                  <p className="text-sm opacity-85 mt-2 max-w-xs">{t.desc}</p>
                  <div className="mt-4 inline-flex items-center gap-2 text-sm">Explore <ArrowRight className="w-4 h-4" /></div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <TechTeardown />

      {/* AR CTA */}
      <section className="relative py-24 sm:py-32 overflow-hidden bg-white">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
          <div className="relative rounded-3xl overflow-hidden border border-[#E5E5EA] bg-[#F5F5F7]">
            <img src="https://images.unsplash.com/photo-1764179627974-25d96c2a1e97?crop=entropy&cs=srgb&fm=jpg&q=85" alt="AR Try On" className="absolute right-0 top-0 h-full w-[55%] object-cover" />
            <div className="absolute inset-0 bg-gradient-to-r from-white via-white/85 to-transparent" />
            <div className="relative grid grid-cols-1 lg:grid-cols-2 gap-8 p-10 sm:p-16 lg:p-20">
              <div>
                <div className="overline">AR Mirror</div>
                <h2 className="display text-4xl sm:text-5xl lg:text-6xl mt-3">Try them on.<br/>Right now.</h2>
                <p className="mt-6 ink-soft max-w-md">
                  Our face-tracking AI locks the glasses precisely to your bridge — in under five seconds, no app required.
                </p>
                <Link to="/ar-try-on" className="btn-ink mt-8 inline-flex items-center gap-2">
                  Launch AR Try-On <Sparkles className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <SocialReels />
    </main>
  );
}
