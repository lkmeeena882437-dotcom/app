import React, { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { Cpu, Camera, Headphones, BatteryCharging } from "lucide-react";
import { TEARDOWN } from "@/constants/testIds";

const HOTSPOTS = [
  { key: "chip", icon: Cpu, title: "Oculux N2 NPU", desc: "8-core neural engine running 12 TOPS on-device — zero cloud latency.", x: "30%", y: "30%" },
  { key: "camera", icon: Camera, title: "12MP Cinema Sensor", desc: "4K60 capture with depth-mapped stabilization for hands-free filmmaking.", x: "62%", y: "42%" },
  { key: "audio", icon: Headphones, title: "Open-Ear Acoustics", desc: "Directional bone-conduction drivers tuned by Grammy-winning engineers.", x: "20%", y: "60%" },
  { key: "battery", icon: BatteryCharging, title: "All-Day Power", desc: "14h of cinematic intelligence, recharged in 25 minutes.", x: "72%", y: "70%" },
];

export default function TechTeardown() {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const left = useTransform(scrollYProgress, [0.1, 0.6], ["0%", "-12%"]);
  const right = useTransform(scrollYProgress, [0.1, 0.6], ["0%", "12%"]);
  const opacity = useTransform(scrollYProgress, [0.2, 0.5], [0, 1]);

  return (
    <section
      ref={ref}
      data-testid={TEARDOWN.section}
      className="relative py-32 sm:py-40 overflow-hidden bg-[#040404]"
    >
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
        <div className="max-w-2xl">
          <div className="overline">Inside Oculux</div>
          <h2 className="display text-4xl sm:text-5xl lg:text-6xl mt-3">
            Cinematic intelligence,<br/>
            <span className="text-[#00F0FF]">engineered atom by atom.</span>
          </h2>
          <p className="text-white/60 mt-6 text-lg leading-relaxed">
            Scroll to disassemble the flagship. Every component is designed to
            disappear on your face and amplify your perception.
          </p>
        </div>

        <div className="relative mt-16 h-[520px] sm:h-[640px]">
          <motion.div
            style={{ x: left }}
            className="absolute inset-0 flex items-center justify-center"
          >
            <img
              src="https://images.unsplash.com/photo-1762314908505-24bccd998715?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjAxODF8MHwxfHNlYXJjaHwzfHxsdXh1cnklMjBzdW5nbGFzc2VzJTIwZGFyayUyMGJhY2tncm91bmR8ZW58MHx8fHwxNzgxNDkzMTQyfDA&ixlib=rb-4.1.0&q=85"
              alt="Glasses left frame"
              className="h-full w-auto object-contain opacity-90"
              style={{ clipPath: "inset(0 50% 0 0)" }}
            />
          </motion.div>
          <motion.div
            style={{ x: right }}
            className="absolute inset-0 flex items-center justify-center"
          >
            <img
              src="https://images.unsplash.com/photo-1762314908505-24bccd998715?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjAxODF8MHwxfHNlYXJjaHwzfHxsdXh1cnklMjBzdW5nbGFzc2VzJTIwZGFyayUyMGJhY2tncm91bmR8ZW58MHx8fHwxNzgxNDkzMTQyfDA&ixlib=rb-4.1.0&q=85"
              alt="Glasses right frame"
              className="h-full w-auto object-contain opacity-90"
              style={{ clipPath: "inset(0 0 0 50%)" }}
            />
          </motion.div>

          {HOTSPOTS.map((h) => (
            <motion.div
              key={h.key}
              style={{ opacity, left: h.x, top: h.y }}
              className="absolute -translate-x-1/2 -translate-y-1/2"
              data-testid={TEARDOWN.hotspot(h.key)}
            >
              <div className="relative">
                <div className="w-3 h-3 rounded-full bg-[#00F0FF] pulse-dot" />
                <div className="absolute left-6 top-1/2 -translate-y-1/2 w-56 glass rounded-xl p-3 hidden sm:block">
                  <div className="flex items-center gap-2">
                    <h.icon className="w-4 h-4 text-[#00F0FF]" />
                    <div className="text-sm font-medium">{h.title}</div>
                  </div>
                  <p className="text-xs text-white/60 mt-1">{h.desc}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:hidden">
          {HOTSPOTS.map((h) => (
            <div key={h.key} className="glass rounded-xl p-4">
              <h.icon className="w-5 h-5 text-[#00F0FF]" />
              <div className="text-sm font-medium mt-2">{h.title}</div>
              <p className="text-xs text-white/60 mt-1">{h.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
