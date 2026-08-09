import { ImageResponse } from "next/og";

/**
 * Browser-tab icon, generated rather than shipped as a binary.
 *
 * The app was still serving Next's stock `favicon.ico`. The brand logo is a
 * 791x315 wordmark, which letterboxes to something illegible at 32px, so this
 * renders a square monogram in the brand navy instead.
 */
export const size = { width: 32, height: 32 };
export const contentType = "image/png";

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
          background: "#00234E",
          color: "#ffffff",
          fontSize: 22,
          fontWeight: 700,
          // Optically centred: the cap sits slightly high without this.
          lineHeight: 1,
          letterSpacing: -1,
          borderRadius: 6,
        }}
      >
        C
      </div>
    ),
    size,
  );
}
