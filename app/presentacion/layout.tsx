export default function PresentationLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      className="min-h-screen antialiased text-white selection:bg-fuchsia-500/40 selection:text-white"
      style={
        {
          // tokens (seguimos usando inline CSS vars acá, no styled-jsx)
          ["--brand" as any]: "#9D00FF",
          ["--accent" as any]: "#FF00E5",
          ["--deep" as any]: "#2D0845",
          ["--mid" as any]: "#4A0E6B",
          ["--bg" as any]:
            "linear-gradient(135deg, #1A0329 0%, #2D0845 52%, #1A0329 100%)",
          ["--fg" as any]: "#FFFFFF",
        } as React.CSSProperties
      }
    >
      <div
        className="relative min-h-screen"
        style={{ background: "var(--bg)" }}
      >
        <div
          aria-hidden
          className="absolute inset-0 pointer-events-none opacity-40 blur-3xl"
          style={{
            background:
              "radial-gradient(600px 400px at 15% 10%, rgba(157,0,255,0.30), transparent 60%),\
               radial-gradient(600px 400px at 85% 90%, rgba(255,0,229,0.25), transparent 60%)",
          }}
        />
        <main className="relative z-10 min-h-screen">{children}</main>
      </div>
    </div>
  );
}
