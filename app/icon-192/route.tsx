import { ImageResponse } from "next/og";

// Dedicated PWA manifest icon sizes — the existing app/icon.tsx (64px) and
// apple-icon.tsx (180px) cover browser tabs/iOS but Chrome's install
// criteria want a 192 and a 512 explicitly declared in manifest.ts.
export async function GET() {
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
            width: 138,
            height: 138,
            background: "#FFC800",
            color: "#0B0B0D",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 92,
            fontWeight: 800,
            fontFamily: "sans-serif",
          }}
        >
          S
        </div>
      </div>
    ),
    { width: 192, height: 192 }
  );
}
