import React, { useEffect, useRef, useState } from "react";
import { Camera, Power, Sparkles } from "lucide-react";
import { AR } from "@/constants/testIds";
import { toast } from "sonner";

// Lightweight AR try-on: live webcam + glasses overlay you can position/scale.
// (No heavy ML library — keeps the experience fast and reliable.)
const GLASSES_SVG = (
  <svg viewBox="0 0 600 200" xmlns="http://www.w3.org/2000/svg" className="w-full h-full drop-shadow-[0_0_20px_rgba(0,240,255,0.35)]">
    <defs>
      <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#1a1a1a"/>
        <stop offset="100%" stopColor="#000"/>
      </linearGradient>
    </defs>
    <g fill="none" stroke="url(#g)" strokeWidth="14">
      <circle cx="160" cy="100" r="80" fill="rgba(0,240,255,0.08)"/>
      <circle cx="440" cy="100" r="80" fill="rgba(0,240,255,0.08)"/>
      <path d="M240 100 Q300 70 360 100" />
      <path d="M80 70 L20 50" />
      <path d="M520 70 L580 50" />
    </g>
  </svg>
);

export default function ARTryOn() {
  const videoRef = useRef(null);
  const containerRef = useRef(null);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState("");
  const [scale, setScale] = useState(1);
  const [yOffset, setYOffset] = useState(0);

  const start = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user", width: 1280, height: 720 }, audio: false });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setRunning(true);
      setError("");
      toast.success("AR Mirror activated");
    } catch (e) {
      setError("Camera permission denied or unavailable. Allow camera access and retry.");
      toast.error("Camera permission needed");
    }
  };

  const stop = () => {
    const stream = videoRef.current?.srcObject;
    if (stream) stream.getTracks().forEach((t) => t.stop());
    if (videoRef.current) videoRef.current.srcObject = null;
    setRunning(false);
  };

  useEffect(() => () => stop(), []);

  return (
    <main className="bg-[#050505] pt-28 pb-24 min-h-screen">
      <div className="max-w-6xl mx-auto px-6 sm:px-8 lg:px-12">
        <div className="overline">AR Mirror</div>
        <h1 className="display text-5xl sm:text-6xl mt-3">Wear Oculux. Anywhere.</h1>
        <p className="text-white/60 mt-3 max-w-xl">Granting camera permission opens a private, on-device preview. Nothing is uploaded.</p>

        <div className="mt-10 grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
          <div
            ref={containerRef}
            data-testid={AR.canvas}
            className="relative aspect-[4/3] rounded-3xl overflow-hidden border border-white/10 bg-[#080808]"
          >
            <video
              ref={videoRef}
              playsInline
              muted
              className={`absolute inset-0 w-full h-full object-cover scale-x-[-1] ${running ? "opacity-100" : "opacity-0"}`}
            />
            {!running && (
              <div className="absolute inset-0 grid place-items-center">
                <div className="text-center">
                  <div className="w-16 h-16 mx-auto rounded-full border border-[#00F0FF]/40 grid place-items-center pulse-dot">
                    <Camera className="w-6 h-6 text-[#00F0FF]" />
                  </div>
                  <p className="mt-6 text-white/70">Activate the AR Mirror</p>
                  {error && <p className="mt-2 text-xs text-red-400 max-w-xs mx-auto">{error}</p>}
                </div>
              </div>
            )}
            {running && (
              <div
                className="absolute left-1/2 top-1/2 pointer-events-none"
                style={{
                  width: `${44 * scale}%`,
                  transform: `translate(-50%, calc(-50% + ${yOffset}px))`,
                }}
              >
                {GLASSES_SVG}
              </div>
            )}
            {running && (
              <div className="absolute top-4 left-4 flex items-center gap-2 px-3 py-1.5 rounded-full glass">
                <span className="w-1.5 h-1.5 rounded-full bg-[#00F0FF] pulse-dot" />
                <span className="mono text-[10px] tracking-widest uppercase">Live</span>
              </div>
            )}
          </div>

          <aside className="glass rounded-3xl p-6 space-y-6">
            <div>
              <div className="overline mb-2">Controls</div>
              <div className="flex gap-2">
                {!running ? (
                  <button data-testid={AR.startButton} onClick={start} className="btn-glow flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-full bg-[#00F0FF] text-black font-medium">
                    <Power className="w-4 h-4"/> Start
                  </button>
                ) : (
                  <button data-testid={AR.stopButton} onClick={stop} className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-full border border-white/15">
                    <Power className="w-4 h-4"/> Stop
                  </button>
                )}
              </div>
            </div>

            <div>
              <label className="overline">Frame size</label>
              <input
                data-testid={AR.sizeSlider}
                type="range" min="0.6" max="1.5" step="0.01"
                value={scale}
                onChange={(e) => setScale(parseFloat(e.target.value))}
                className="w-full mt-3 accent-[#00F0FF]"
              />
              <div className="mono text-[10px] text-white/50 mt-1">{(scale*100).toFixed(0)}%</div>
            </div>
            <div>
              <label className="overline">Vertical position</label>
              <input
                data-testid={AR.yOffsetSlider}
                type="range" min="-120" max="120" step="1"
                value={yOffset}
                onChange={(e) => setYOffset(parseInt(e.target.value))}
                className="w-full mt-3 accent-[#00F0FF]"
              />
              <div className="mono text-[10px] text-white/50 mt-1">{yOffset}px</div>
            </div>

            <div className="border-t border-white/10 pt-4">
              <p className="text-xs text-white/60">
                <Sparkles className="inline w-3 h-3 text-[#00F0FF] mr-1"/>
                Adjust the slider until the frame sits naturally on your bridge.
                A real face-tracking version with mesh-locked physics ships in Oculux App.
              </p>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
