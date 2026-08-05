import { ImageResponse } from "next/og";

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
            width: 368,
            height: 368,
            background: "#FFC800",
            color: "#0B0B0D",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 246,
            fontWeight: 800,
            fontFamily: "sans-serif",
          }}
        >
          S
        </div>
      </div>
    ),
    { width: 512, height: 512 }
  );
}
