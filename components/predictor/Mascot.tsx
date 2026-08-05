"use client";

// Hand-drawn SVG mascot (no AI image generation involved — see chat).
// Wild fan of "hair" strands + a thumbs-up football fan, built entirely from
// shapes so it's free to animate and never needs a generated asset to ship.
const HAIR_STRANDS = [
  { base: [118, 98], mid: [95, 55], tip: [108, 20], delay: "0s" },
  { base: [133, 90], mid: [118, 35], tip: [140, 5], delay: "0.3s" },
  { base: [148, 85], mid: [148, 25], tip: [165, -5], delay: "0.1s" },
  { base: [163, 83], mid: [178, 20], tip: [195, -2], delay: "0.4s" },
  { base: [178, 87], mid: [205, 30], tip: [222, 8], delay: "0.15s" },
  { base: [192, 93], mid: [222, 50], tip: [245, 25], delay: "0.35s" },
  { base: [203, 102], mid: [235, 72], tip: [255, 55], delay: "0.5s" },
];

function HairStrand({ base, mid, tip, delay }: { base: number[]; mid: number[]; tip: number[]; delay: string }) {
  const d = `M ${base[0]} ${base[1]} Q ${mid[0]} ${mid[1]} ${tip[0]} ${tip[1]}`;
  return (
    <g style={{ transformOrigin: `${base[0]}px ${base[1]}px`, animationDelay: delay }} className="animate-hair-sway">
      <path d={d} stroke="#0B0B0D" strokeWidth={15} strokeLinecap="round" fill="none" />
      <path d={d} stroke="#B98A54" strokeWidth={10} strokeLinecap="round" fill="none" />
    </g>
  );
}

export function Mascot({ className = "" }: { className?: string }) {
  return (
    <div className={`select-none pointer-events-none ${className}`}>
      <div className="relative w-full h-full animate-mascot-bob">
        <svg viewBox="-20 -30 340 420" className="w-full h-full overflow-visible">
          {HAIR_STRANDS.map((s, i) => (
            <HairStrand key={i} {...s} />
          ))}

          {/* head */}
          <circle cx="160" cy="140" r="55" fill="#F2C79E" stroke="#0B0B0D" strokeWidth="5" />
          <circle cx="126" cy="150" r="10" fill="#F2C79E" stroke="#0B0B0D" strokeWidth="5" />
          <circle cx="194" cy="150" r="10" fill="#F2C79E" stroke="#0B0B0D" strokeWidth="5" />
          <circle cx="140" cy="138" r="6" fill="#0B0B0D" />
          <circle cx="180" cy="138" r="6" fill="#0B0B0D" />
          <circle cx="142" cy="135" r="1.6" fill="#fff" />
          <circle cx="182" cy="135" r="1.6" fill="#fff" />
          <path d="M 138 165 Q 160 178 182 165" stroke="#0B0B0D" strokeWidth="4" strokeLinecap="round" fill="none" />

          {/* neck */}
          <rect x="148" y="188" width="24" height="16" fill="#F2C79E" stroke="#0B0B0D" strokeWidth="4" />

          {/* right arm (their left, viewer's left) thumbs-up */}
          <path d="M 108 220 Q 70 210 60 165" stroke="#0B0B0D" strokeWidth="26" strokeLinecap="round" fill="none" />
          <path d="M 108 220 Q 70 210 60 165" stroke="#FFC800" strokeWidth="18" strokeLinecap="round" fill="none" />
          <circle cx="58" cy="158" r="15" fill="#F2C79E" stroke="#0B0B0D" strokeWidth="5" />
          <rect x="52" y="135" width="10" height="20" rx="4" fill="#F2C79E" stroke="#0B0B0D" strokeWidth="4" />

          {/* hoodie body */}
          <path
            d="M 118 210 Q 160 195 202 210 L 214 320 Q 160 336 106 320 Z"
            fill="#FFC800"
            stroke="#0B0B0D"
            strokeWidth="5"
          />
          <path d="M 132 208 Q 160 224 188 208" stroke="#0B0B0D" strokeWidth="4" fill="none" opacity="0.5" />
          <rect x="136" y="270" width="48" height="30" rx="8" fill="#E0AE00" stroke="#0B0B0D" strokeWidth="4" />
          <line x1="152" y1="215" x2="148" y2="240" stroke="#0B0B0D" strokeWidth="3" strokeLinecap="round" />
          <line x1="168" y1="215" x2="172" y2="240" stroke="#0B0B0D" strokeWidth="3" strokeLinecap="round" />

          {/* left arm hanging */}
          <path d="M 212 215 Q 232 250 222 290" stroke="#0B0B0D" strokeWidth="26" strokeLinecap="round" fill="none" />
          <path d="M 212 215 Q 232 250 222 290" stroke="#FFC800" strokeWidth="18" strokeLinecap="round" fill="none" />
          <circle cx="222" cy="292" r="14" fill="#F2C79E" stroke="#0B0B0D" strokeWidth="5" />

          {/* shorts */}
          <path d="M 112 318 L 208 318 L 202 356 L 160 350 L 118 356 Z" fill="#14213D" stroke="#0B0B0D" strokeWidth="5" />

          {/* legs */}
          <rect x="122" y="352" width="22" height="26" fill="#F2C79E" stroke="#0B0B0D" strokeWidth="4" />
          <rect x="176" y="352" width="22" height="26" fill="#F2C79E" stroke="#0B0B0D" strokeWidth="4" />

          {/* shoes */}
          <path d="M 112 376 L 156 376 L 156 392 Q 156 400 144 400 L 106 400 Q 100 400 102 392 Z" fill="#E23D3D" stroke="#0B0B0D" strokeWidth="4" />
          <rect x="100" y="396" width="58" height="8" rx="3" fill="#fff" stroke="#0B0B0D" strokeWidth="3" />
          <path d="M 164 376 L 208 376 L 210 392 Q 211 400 199 400 L 161 400 Q 155 400 156 392 Z" fill="#E23D3D" stroke="#0B0B0D" strokeWidth="4" />
          <rect x="154" y="396" width="58" height="8" rx="3" fill="#fff" stroke="#0B0B0D" strokeWidth="3" />
        </svg>
      </div>

      <div className="absolute left-[8%] bottom-[3%] w-[22%] animate-ball-bounce">
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <ellipse cx="50" cy="94" rx="26" ry="6" fill="#000" opacity="0.35" className="animate-ball-shadow" />
          <circle cx="50" cy="50" r="42" fill="#FAFAFA" stroke="#0B0B0D" strokeWidth="5" />
          <path
            d="M50 18 L64 30 L58 48 L42 48 L36 30 Z M50 18 L50 8 M64 30 L82 26 M58 48 L70 62 M42 48 L30 62 M36 30 L18 26"
            stroke="#0B0B0D"
            strokeWidth="4"
            fill="#0B0B0D"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    </div>
  );
}
