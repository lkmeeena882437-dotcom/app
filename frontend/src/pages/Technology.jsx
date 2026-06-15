import React from "react";
import { motion } from "framer-motion";
import { Cpu, Camera, Headphones, BatteryCharging, Wifi, Shield } from "lucide-react";
import TechTeardown from "@/components/TechTeardown";

const PILLARS = [
  { icon: Cpu, title: "Oculux N2 Neural Engine", desc: "8 cores. 12 TOPS. Real-time vision and language inference, fully on-device." },
  { icon: Camera, title: "12MP Cinema Sensor", desc: "4K60 capture, AI stabilization, dolby vision pipeline — engineered with cinematographers." },
  { icon: Headphones, title: "Open-Ear Acoustics", desc: "Directional bone conduction. Hear the world. Hear yourself. Hear no one else." },
  { icon: BatteryCharging, title: "All-Day Battery", desc: "14 hours of intelligence. 25-minute fast charge. Wireless dock included." },
  { icon: Wifi, title: "Wi-Fi 7 + BT 5.4", desc: "Glass-thin radios deliver gigabit cloud sync without a phone tethered." },
  { icon: Shield, title: "On-Device Privacy", desc: "Zero cloud by default. End-to-end encrypted memories. You own every byte." },
];

export default function Technology() {
  return (
    <main className="bg-white pt-28 pb-24">
      <section className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
        <div className="overline">The Technology</div>
        <h1 className="display text-5xl sm:text-7xl mt-3 leading-none max-w-3xl">A supercomputer<br/><span className="ink-soft italic">on your nose.</span></h1>
        <p className="ink-mute mt-6 max-w-xl text-lg">
          Three years of relentless engineering. Aerospace materials. Six custom
          silicon designs. One unforgettable wearable.
        </p>
      </section>

      <TechTeardown />

      <section className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 bg-white">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {PILLARS.map((p, i) => (
            <motion.div
              key={p.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.07, duration: 0.6 }}
              className="rounded-2xl border border-[#E5E5EA] p-6 bg-[#F5F5F7] hover:border-[#1D1D1F] transition-colors"
            >
              <p.icon className="w-5 h-5 text-[#1D1D1F]" />
              <h3 className="display text-2xl mt-4">{p.title}</h3>
              <p className="text-sm ink-mute mt-2 leading-relaxed">{p.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>
    </main>
  );
}
