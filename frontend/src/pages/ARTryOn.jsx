import React, { useEffect, useRef, useState } from "react";
import { Camera, Power, Sparkles, Loader2 } from "lucide-react";
import { AR } from "@/constants/testIds";
import { toast } from "sonner";

// MediaPipe Face Landmarker (Tasks Vision) loaded via CDN ESM at runtime.
const TASKS_VISION_URL = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/vision_bundle.mjs";
const WASM_BASE = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm";
const MODEL_URL = "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task";

// Key landmark indices for face_landmarker
const LEFT_EYE = 33;       // outer corner of left eye (image-left ≈ user-right)
const RIGHT_EYE = 263;     // outer corner of right eye
const NOSE_TIP = 1;

// Premium glasses SVG (matte black / silver accents)
const GlassesSVG = ({ width, angle, opacity = 1 }) => (
  <svg
    viewBox="0 0 600 200"
    xmlns="http://www.w3.org/2000/svg"
    width={width}
    style={{ transform: `rotate(${angle}deg)`, opacity, pointerEvents: "none", filter: "drop-shadow(0 6px 16px rgba(0,0,0,0.45))" }}
  >
    <defs>
      <linearGradient id="lens" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="rgba(20,20,22,0.55)"/>
        <stop offset="100%" stopColor="rgba(40,40,46,0.85)"/>
      </linearGradient>
      <linearGradient id="frame" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#1a1a1c"/>
        <stop offset="50%" stopColor="#3a3a40"/>
        <stop offset="100%" stopColor="#0a0a0b"/>
      </linearGradient>
    </defs>
    <g fill="url(#lens)" stroke="url(#frame)" strokeWidth="10">
      <ellipse cx="160" cy="100" rx="92" ry="68"/>
      <ellipse cx="440" cy="100" rx="92" ry="68"/>
    </g>
    <path d="M252 100 Q300 76 348 100" stroke="url(#frame)" strokeWidth="9" fill="none"/>
    <path d="M68 78 L18 56" stroke="url(#frame)" strokeWidth="9" fill="none"/>
    <path d="M532 78 L582 56" stroke="url(#frame)" strokeWidth="9" fill="none"/>
  </svg>
);

export default function ARTryOn() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const landmarkerRef = useRef(null);
  const rafRef = useRef(0);
  const lastRef = useRef(0);

  const [running, setRunning] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [scale, setScale] = useState(1.1);
  const [yOffset, setYOffset] = useState(0);
  const [overlay, setOverlay] = useState({ x: 0.5, y: 0.42, w: 0, angle: 0, visible: false });

  // ESM dynamic import of MediaPipe Tasks Vision (CDN)
  const loadLandmarker = async () => {
    if (landmarkerRef.current) return landmarkerRef.current;
    const mod = await import(/* webpackIgnore: true */ TASKS_VISION_URL);
    const { FilesetResolver, FaceLandmarker } = mod;
    const filesetResolver = await FilesetResolver.forVisionTasks(WASM_BASE);
    const landmarker = await FaceLandmarker.createFromOptions(filesetResolver, {
      baseOptions: { modelAssetPath: MODEL_URL, delegate: "GPU" },
      runningMode: "VIDEO",
      numFaces: 1,
      outputFacialTransformationMatrixes: false,
    });
    landmarkerRef.current = landmarker;
    return landmarker;
  };

  const start = async () => {
    setError("");
    setLoading(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: 1280, height: 720 },
        audio: false,
      });
      videoRef.current.srcObject = stream;
      await videoRef.current.play();
      await loadLandmarker();
      setRunning(true);
      toast.success("AR Mirror activated");
      tick();
    } catch (e) {
      console.error(e);
      const msg = e?.message?.includes("Permission")
        ? "Camera permission denied. Please allow access and retry."
        : "Camera unavailable or model failed to load. Check connection.";
      setError(msg);
      toast.error("AR Mirror error");
    } finally {
      setLoading(false);
    }
  };

  const stop = () => {
    cancelAnimationFrame(rafRef.current);
    const stream = videoRef.current?.srcObject;
    if (stream) stream.getTracks().forEach((t) => t.stop());
    if (videoRef.current) videoRef.current.srcObject = null;
    setRunning(false);
    setOverlay((o) => ({ ...o, visible: false }));
  };

  const tick = () => {
    const v = videoRef.current;
    const lm = landmarkerRef.current;
    if (!v || !lm || v.readyState < 2) {
      rafRef.current = requestAnimationFrame(tick);
      return;
    }
    const now = performance.now();
    if (now - lastRef.current > 50) { // ~20fps detection
      lastRef.current = now;
      try {
        const res = lm.detectForVideo(v, now);
        if (res?.faceLandmarks?.length) {
          const pts = res.faceLandmarks[0];
          // pts are normalized [0..1]; video is mirrored via CSS so we flip x for display
          const l = pts[LEFT_EYE];
          const r = pts[RIGHT_EYE];
          const n = pts[NOSE_TIP];
          if (l && r && n) {
            const cx = (l.x + r.x) / 2;
            const cy = (l.y + r.y) / 2;
            const dx = r.x - l.x;
            const dy = r.y - l.y;
            const dist = Math.hypot(dx, dy);
            // Because we visually mirror the video (scale-x-[-1]), invert x to match.
            const mirroredCx = 1 - cx;
            // angle in degrees (also mirrored)
            const angleDeg = -Math.atan2(dy, dx) * (180 / Math.PI);
            setOverlay({
              x: mirroredCx,
              y: cy,
              w: dist, // normalized
              angle: angleDeg,
              visible: true,
            });
          }
        }
      } catch (err) { /* ignore frame errors */ }
    }
    rafRef.current = requestAnimationFrame(tick);
  };

  useEffect(() => () => {
    stop();
    landmarkerRef.current?.close?.();
    landmarkerRef.current = null;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Compute pixel width for glasses overlay
  const container = containerRef.current;
  const cw = container?.clientWidth || 0;
  const ch = container?.clientHeight || 0;
  // Glasses width = inter-eye distance × multiplier (frames wider than eyes)
  const glassesPx = Math.max(120, overlay.w * cw * 2.4 * scale);

  return (
    <main className="bg-white pt-28 pb-24 min-h-screen">
      <div className="max-w-6xl mx-auto px-6 sm:px-8 lg:px-12">
        <div className="overline">AR Mirror · Face-Locked</div>
        <h1 className="display text-5xl sm:text-6xl mt-3">Wear Oculux. Anywhere.</h1>
        <p className="ink-mute mt-3 max-w-xl">
          Powered by on-device MediaPipe FaceMesh tracking — the frame locks to
          your bridge in real-time. Nothing is uploaded. Move freely.
        </p>

        <div className="mt-10 grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
          <div
            ref={containerRef}
            data-testid={AR.canvas}
            className="relative aspect-[4/3] rounded-3xl overflow-hidden border border-[#E5E5EA] bg-[#F5F5F7]"
          >
            <video
              ref={videoRef}
              playsInline
              muted
              className={`absolute inset-0 w-full h-full object-cover scale-x-[-1] ${running ? "opacity-100" : "opacity-0"}`}
            />
            <canvas ref={canvasRef} className="hidden"/>

            {!running && !loading && (
              <div className="absolute inset-0 grid place-items-center">
                <div className="text-center">
                  <div className="w-16 h-16 mx-auto rounded-full silver-border bg-white grid place-items-center">
                    <Camera className="w-6 h-6 text-[#1D1D1F]" />
                  </div>
                  <p className="mt-6 ink-soft">Activate the AR Mirror</p>
                  {error && <p className="mt-2 text-xs text-red-600 max-w-xs mx-auto">{error}</p>}
                </div>
              </div>
            )}

            {loading && (
              <div className="absolute inset-0 grid place-items-center bg-white/80">
                <div className="text-center">
                  <Loader2 className="w-7 h-7 text-[#1D1D1F] animate-spin mx-auto" />
                  <p className="mt-3 text-sm ink-soft">Loading face-tracking model…</p>
                </div>
              </div>
            )}

            {running && overlay.visible && (
              <div
                className="absolute pointer-events-none"
                style={{
                  left: `${overlay.x * 100}%`,
                  top: `${overlay.y * 100}%`,
                  transform: `translate(-50%, calc(-50% + ${yOffset}px))`,
                }}
              >
                <GlassesSVG width={glassesPx} angle={overlay.angle} />
              </div>
            )}

            {running && (
              <div className="absolute top-4 left-4 flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/85 backdrop-blur border border-[#E5E5EA]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#1D1D1F] pulse-dot-silver" />
                <span className="mono text-[10px] tracking-widest uppercase ink">Tracking</span>
              </div>
            )}
          </div>

          <aside className="glass-card rounded-3xl p-6 space-y-6">
            <div>
              <div className="overline mb-2">Controls</div>
              <div className="flex gap-2">
                {!running ? (
                  <button data-testid={AR.startButton} onClick={start} disabled={loading} className="btn-ink flex-1 inline-flex items-center justify-center gap-2">
                    <Power className="w-4 h-4"/> {loading ? "Loading…" : "Start"}
                  </button>
                ) : (
                  <button data-testid={AR.stopButton} onClick={stop} className="btn-ghost flex-1 inline-flex items-center justify-center gap-2">
                    <Power className="w-4 h-4"/> Stop
                  </button>
                )}
              </div>
            </div>

            <div>
              <label className="overline">Frame size</label>
              <input
                data-testid={AR.sizeSlider}
                type="range" min="0.7" max="1.6" step="0.01"
                value={scale}
                onChange={(e) => setScale(parseFloat(e.target.value))}
                className="w-full mt-3 accent-[#1D1D1F]"
              />
              <div className="mono text-[10px] ink-mute mt-1">{(scale*100).toFixed(0)}%</div>
            </div>
            <div>
              <label className="overline">Bridge fine-tune</label>
              <input
                data-testid={AR.yOffsetSlider}
                type="range" min="-60" max="60" step="1"
                value={yOffset}
                onChange={(e) => setYOffset(parseInt(e.target.value))}
                className="w-full mt-3 accent-[#1D1D1F]"
              />
              <div className="mono text-[10px] ink-mute mt-1">{yOffset}px</div>
            </div>

            <div className="border-t border-[#E5E5EA] pt-4">
              <p className="text-xs ink-mute">
                <Sparkles className="inline w-3 h-3 mr-1"/>
                The frame anchors automatically to your eye line and rotates
                with your head. Tweak the sliders to perfect the fit.
              </p>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
