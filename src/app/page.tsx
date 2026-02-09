import HP35 from "@/components/hp-35"

export default function Home() {
  return (
    <div
      className="min-h-screen relative overflow-hidden"
      style={{
        fontFamily: "'TexGyreHeros', 'Helvetica Neue', Helvetica, Arial, sans-serif",
        background: "#1c1816",
      }}
    >
      {/* Warm walnut-wood desk surface */}
      <div
        className="fixed inset-0"
        style={{
          background:
            "radial-gradient(ellipse 130% 100% at 50% 45%, #3a2a20 0%, #261c16 50%, #181210 100%)",
        }}
      />
      {/* Subtle wood grain texture */}
      <div
        className="fixed inset-0"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65 0.05' numOctaves='5' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.05'/%3E%3C/svg%3E")`,
        }}
      />
      {/* Warm brass desk lamp spotlight */}
      <div
        className="fixed inset-0"
        style={{
          background:
            "radial-gradient(ellipse 55% 45% at 35% 20%, rgba(255,200,120,0.07) 0%, transparent 70%)",
        }}
      />

      {/* Page content */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-8 py-6">
        {/* Disclaimer */}
        <p
          className="mb-4 text-center"
          style={{
            fontSize: "11px",
            color: "#8a7a6a",
            letterSpacing: "0.5px",
          }}
        >
          Unofficial fan‑made HP‑35 simulator. Not affiliated with or endorsed by HP.
        </p>

        {/* Centered block: header + calculator + guide */}
        <div className="flex flex-col items-center">
          {/* Header */}
          <header className="text-center mb-3">
            <h1
              className="m-0 leading-none"
              style={{
                fontSize: "clamp(36px, 6vw, 56px)",
                fontWeight: 400,
                color: "#e8dcc8",
                letterSpacing: "-1px",
                fontStyle: "italic",
                fontFamily: "Georgia, 'Times New Roman', serif",
              }}
            >
              HP-35
            </h1>
            <p
              className="mt-2 mb-0"
              style={{
                fontSize: "11px",
                color: "#c4a888",
                letterSpacing: "4px",
                textTransform: "uppercase",
              }}
            >
              35 key high precision portable electronic slide rule
            </p>
            <p
              className="mt-2 mb-0 max-w-sm mx-auto"
              style={{
                fontSize: "12px",
                color: "#a08868",
                lineHeight: 1.6,
                fontStyle: "italic",
                fontFamily: "Georgia, 'Times New Roman', serif",
              }}
            >
              The world&apos;s first scientific pocket calculator,
              designed to fit into a shirt pocket
            </p>
          </header>

          {/* Calculator */}
          <div className="relative">
            {/* Desk shadow under calculator */}
            <div
              className="absolute left-[8%] right-[8%] h-6"
              style={{
                bottom: "-14px",
                background:
                  "radial-gradient(ellipse at center, rgba(0,0,0,0.5) 0%, transparent 70%)",
                filter: "blur(10px)",
                zIndex: 0,
              }}
            />
            <HP35 />
          </div>

          {/* Usage guide — directly below calculator */}
          <div className="text-center mt-3 mb-3">
            <p
              className="m-0 max-w-md mx-auto"
              style={{
                fontSize: "11px",
                color: "#a08868",
                lineHeight: 1.7,
              }}
            >
              <span
                style={{
                  fontSize: "8px",
                  letterSpacing: "4px",
                  textTransform: "uppercase",
                  color: "#8a7258",
                  display: "block",
                  marginBottom: "6px",
                }}
              >
                Reverse Polish Notation
              </span>
              To calculate{" "}
              <span style={{ color: "#c4a888" }}>3 + 4</span>, press in
              sequence:{" "}
              <span style={{ color: "#c4a888", letterSpacing: "0.5px" }}>
                3 &nbsp;ENTER &nbsp;4 &nbsp;+
              </span>
            </p>
          </div>
        </div>

        {/* Footer — pushed to bottom */}
        <footer className="mt-auto pt-3 w-full border-t border-white/[0.08] pb-5 text-center">
          <p
            className="m-0"
            style={{
              fontSize: "10px",
              letterSpacing: "2px",
              color: "#a08868",
              fontStyle: "italic",
              fontFamily: "Georgia, 'Times New Roman', serif",
            }}
          >
            &ldquo;Something only fictional heroes like James Bond
            are supposed to own&rdquo;
          </p>
          <p
            className="mt-1 mb-0"
            style={{
              fontSize: "9px",
              color: "#8a7258",
              letterSpacing: "1.5px",
            }}
          >
            — HP Journal, June 1972
          </p>

          {/* Legal disclaimer */}
          <p
            className="mt-5 mb-0 max-w-lg mx-auto"
            style={{
              fontSize: "8px",
              color: "#5a4a3a",
              lineHeight: 1.7,
              letterSpacing: "0.3px",
            }}
          >
            This is an independent fan project, not affiliated with,
            endorsed by, or associated with Hewlett-Packard Company,
            HP Inc., or Hewlett Packard Enterprise.
            HP and HP-35 are trademarks of their respective owners.
          </p>
        </footer>
      </div>
    </div>
  )
}
