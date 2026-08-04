import { ImageResponse } from "next/og";

// Browser tabs don't reliably support animated favicons (Chrome/Safari show
// a single static frame regardless), so this ships a clean static mark
// instead — same "S" lockup as the nav logo, generated at build time.
export const size = { width: 64, height: 64 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: "#0B0B0D",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            width: 46,
            height: 46,
            background: "#FFC800",
            color: "#0B0B0D",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 30,
            fontWeight: 800,
            fontFamily: "sans-serif",
          }}
        >
          S
        </div>
      </div>
    ),
    { ...size }
  );
}
