import { ImageResponse } from "next/og";
import { person } from "@/content/site";

export const alt = "Bhagath Samalla";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Same tokens as the site itself: ink background, mist type, the jacket
// accent as the one line of color. No photography here, this has to render
// fast and consistently wherever it's unfurled.
export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-end",
          padding: "80px",
          background: "#0d1219",
        }}
      >
        <div
          style={{
            width: 56,
            height: 6,
            background: "#4a95a8",
            marginBottom: 36,
          }}
        />
        <div
          style={{
            fontSize: 96,
            fontWeight: 600,
            color: "#e4e0d6",
            lineHeight: 1,
            display: "flex",
          }}
        >
          Bhagath Samalla
        </div>
        <div
          style={{
            marginTop: 28,
            fontSize: 32,
            color: "#8b8478",
            display: "flex",
            maxWidth: 900,
          }}
        >
          {person.tagline}
        </div>
      </div>
    ),
    { ...size },
  );
}
