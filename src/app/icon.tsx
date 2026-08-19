import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

// A plain monogram, not a logo: the site has no brand mark to lean on, so
// this stays as quiet as the favicon itself should be.
export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0d1219",
          color: "#4a95a8",
          fontSize: 20,
          fontWeight: 700,
          fontFamily: "serif",
        }}
      >
        B
      </div>
    ),
    { ...size },
  );
}
