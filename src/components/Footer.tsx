import { Ghost } from "lucide-react";

const INK = "#14160f";
const MONO = "'IBM Plex Mono', monospace";

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "24px 44px",
        borderTop: `2px solid ${INK}`,
        font: `600 12px ${MONO}`,
        color: "#5c6356",
      }}
    >
      <span>`poll_request © ${year} · merge opinions, not conflicts`</span>
      <Ghost
        color="#1fae0a"
        size={52}
        strokeWidth={2}
        style={{ transform: "scale(.62)", transformOrigin: "right center" }}
      />
    </div>
  );
}
