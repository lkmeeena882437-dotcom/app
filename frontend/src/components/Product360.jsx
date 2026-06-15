import React, { useEffect, useRef, useState } from "react";
import { RotateCw } from "lucide-react";

// Lightweight 360° viewer: rotates a single product image via CSS transform on drag.
export default function Product360({ image, alt = "Product 360" }) {
  const wrap = useRef(null);
  const [angle, setAngle] = useState(-10);
  const drag = useRef({ active: false, startX: 0, startAngle: 0 });

  useEffect(() => {
    let raf;
    const idle = () => {
      raf = requestAnimationFrame(idle);
      setAngle((a) => (drag.current.active ? a : a + 0.15));
    };
    raf = requestAnimationFrame(idle);
    return () => cancelAnimationFrame(raf);
  }, []);

  const onDown = (e) => {
    drag.current = { active: true, startX: e.clientX || e.touches?.[0]?.clientX || 0, startAngle: angle };
  };
  const onMove = (e) => {
    if (!drag.current.active) return;
    const x = e.clientX || e.touches?.[0]?.clientX || 0;
    const dx = x - drag.current.startX;
    setAngle(drag.current.startAngle + dx * 0.6);
  };
  const onUp = () => { drag.current.active = false; };

  return (
    <div
      ref={wrap}
      onMouseDown={onDown} onMouseMove={onMove} onMouseUp={onUp} onMouseLeave={onUp}
      onTouchStart={onDown} onTouchMove={onMove} onTouchEnd={onUp}
      className="relative aspect-square w-full rounded-3xl overflow-hidden bg-gradient-to-br from-[#F5F5F7] to-white border border-[#E5E5EA] select-none cursor-grab active:cursor-grabbing"
      style={{ perspective: "1200px" }}
    >
      <div className="absolute inset-0 grid place-items-center">
        <img
          src={image}
          alt={alt}
          draggable={false}
          className="max-h-[80%] max-w-[85%] object-contain transition-transform"
          style={{ transform: `rotateY(${angle}deg)` }}
        />
      </div>
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 px-3 py-2 rounded-full bg-white border border-[#E5E5EA] text-xs shadow-sm">
        <RotateCw className="w-3 h-3 text-[#1D1D1F]" />
        <span className="mono ink-mute">Drag to rotate · 360°</span>
      </div>
    </div>
  );
}
