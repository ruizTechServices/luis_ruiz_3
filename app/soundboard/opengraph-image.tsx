import { ImageResponse } from "next/og";

export const alt = "Gio’s soundboard — Press play. Make a little noise.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function SoundboardImage() {
  return new ImageResponse(
    <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", width: "100%", height: "100%", padding: 60, background: "#f7f7f2", color: "#242820" }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 22, color: "#214e34" }}><span>Luis Ruiz / Small things for the web</span><span>Your next favorite sound</span></div>
      <div style={{ display: "flex", flexDirection: "column" }}><span style={{ fontSize: 70, letterSpacing: -3 }}>Gio’s soundboard.</span><span style={{ fontSize: 27, color: "#596253", marginTop: 12 }}>Press play. Make a little noise.</span></div>
      <div style={{ display: "flex", gap: 22 }}>{[{ label: "VINE BOOM", key: "1", color: "#e9eddf" }, { label: "BRUH", key: "T", color: "#e9eddf" }, { label: "FAHHHH", key: "U", color: "#f0e4bf" }].map((pad) => <div key={pad.key} style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", flex: 1, height: 160, padding: 26, borderRadius: 18, border: "1px solid #cbd2c2", borderBottom: "7px solid #bdc8b4", background: pad.color }}><span style={{ fontSize: 20, color: "#637057" }}>{pad.key}</span><span style={{ fontSize: 31, color: "#214e34" }}>{pad.label}</span></div>)}</div>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 21, color: "#596253" }}><span>Play. Save a favorite. Share a sound.</span><span>luis-ruiz.com/soundboard</span></div>
    </div>,
    size,
  );
}
