"use client"

import type { CSSProperties } from "react"
import type { StackRegisterRow } from "./retro-command-stack"
import { SevenSegmentDisplay } from "./seven-segment-display"
import { useCalculatorModel, type CalculatorToken } from "@/features/calculator"

interface HP35Props {
  resetNonce?: number
  clearXNonce?: number
  onStackChange?: (rows: StackRegisterRow[]) => void
  onButtonPress?: (token: string) => void
}

function HP35({ resetNonce = 0, clearXNonce = 0, onStackChange, onButtonPress }: HP35Props = {}) {
  const { display, improperOperation, improperOperationVisible, pressToken } = useCalculatorModel({
    resetNonce,
    clearXNonce,
    onStackChange,
  })

  /* --- Button factories --- */

  const runButtonAction = (token: CalculatorToken) => () => {
    onButtonPress?.(token)
    pressToken(token)
  }

  const funcBtn = (label: string | React.ReactNode, token: CalculatorToken, ariaLabel?: string) => (
    <button onMouseDown={runButtonAction(token)} className="hp-key-func flex items-center justify-center" aria-label={ariaLabel}>
      {label}
    </button>
  )

  const blueBtn = (label: string | React.ReactNode, token: CalculatorToken, ariaLabel?: string) => (
    <button onMouseDown={runButtonAction(token)} className="hp-key-blue flex items-center justify-center" aria-label={ariaLabel}>
      {label}
    </button>
  )

  const numBtn = (label: string | React.ReactNode, token: CalculatorToken, ariaLabel?: string) => (
    <button onMouseDown={runButtonAction(token)} className="hp-key-num flex items-center justify-center" aria-label={ariaLabel}>
      {label}
    </button>
  )

  const opBtn = (label: string, token: CalculatorToken) => (
    <button onMouseDown={runButtonAction(token)} className="hp-key-op flex items-center justify-center">
      {label}
    </button>
  )

  /* --- Math label components --- */

  const m = "font-['STIXTwoMath','Times_New_Roman',serif] text-[1.45em] leading-none"
  // Lowercase function labels (log, ln, sin, cos, tan, arc) sized so x-height ≈ cap-height at 11px
  const lc = "text-[16px]"

  const sqrtLabel = (
    <span className={`${m} inline-flex items-end whitespace-nowrap`} aria-hidden="true">
      <span className="relative -top-[0.40em] text-[10px] leading-[0.82] -mr-[0.04em]">{"\u221A"}</span>
      <span
        className="relative pr-[0.2em] after:content-[''] after:absolute after:left-0 after:right-0 after:top-0 after:translate-y-[var(--sqrt-bar-offset)] after:h-px after:bg-current after:origin-top after:scale-y-[1]"
        style={{ "--sqrt-bar-offset": "0.055em" } as CSSProperties}
      >
        <span className="relative z-[1]">{"\uD835\uDC65"}</span>
      </span>
    </span>
  )

  const expLabel = (
    <span className={m} aria-hidden="true">
      {"\uD835\uDC52"}<sup className="text-[0.58em] relative -top-[0.7em] ml-[0.02em]">{"\uD835\uDC65"}</sup>
    </span>
  )

  const xyLabel = (
    <span className={m} aria-hidden="true">
      {"\uD835\uDC65"}<sup className="text-[0.58em] relative -top-[0.7em] ml-[0.02em]">{"\uD835\uDC66"}</sup>
    </span>
  )

  const oneOverXLabel = (
    <span aria-hidden="true">1/<span className={m}>{"\uD835\uDC65"}</span></span>
  )

  const swapLabel = (
    <span aria-hidden="true">
      <span className={m}>{"\uD835\uDC65"}</span><span className="hp-symbol-arrow">{"\u2B82"}</span><span className={m}>{"\uD835\uDC66"}</span>
    </span>
  )

  const enterLabel = (
    <span className="inline-flex items-center gap-1">
      ENTER<span className="hp-arrow-up hp-symbol-arrow">{"\uD83E\uDC6A"}</span>
    </span>
  )

  const piLabel = (
    <span className={m}>{"\uD835\uDF0B"}</span>
  )

  const clxLabel = (
    <span>CL<span className={m}>{"\uD835\uDC65"}</span></span>
  )

  /* --- Render --- */

  const displayState = display

  return (
    <div
      style={{
        fontFamily: "'TexGyreHeros', 'Helvetica Neue', Helvetica, Arial, sans-serif",
      }}
    >
      {/* Outer calculator body */}
      <div style={{ position: "relative", width: "320px" }}>
        {/* Main body shell */}
        <div
          className="hp-body-texture"
          style={{
            position: "relative",
            background:
              "linear-gradient(180deg, #6b6360 0%, #5a5552 15%, #504b48 50%, #484442 85%, #504b48 100%)",
            borderRadius: "12px 12px 6px 6px",
            padding: "0",
            boxShadow:
              "0 8px 24px rgba(0,0,0,0.5), 0 2px 8px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.08), inset -2px 0 0 rgba(255,255,255,0.03), inset 2px 0 0 rgba(255,255,255,0.03)",
            clipPath: "polygon(3% 0%, 97% 0%, 100% 100%, 0% 100%)",
            overflow: "hidden",
          }}
        >
          {/* Inner bezel padding */}
          <div style={{ padding: "16px 18px 20px" }}>

            {/* --- LED Display --- */}
            <div
              style={{
                background:
                  "linear-gradient(180deg, #1a0800 0%, #0d0400 50%, #1a0800 100%)",
                borderRadius: "6px",
                padding: "3px",
                marginBottom: "10px",
                border: "2px solid #2a2018",
                boxShadow:
                  "inset 0 2px 8px rgba(0,0,0,0.8), inset 0 -1px 4px rgba(0,0,0,0.4), 0 1px 0 rgba(255,255,255,0.04)",
              }}
            >
              <div
                className="hp-scanlines"
                style={{
                  position: "relative",
                  background: "linear-gradient(180deg, #1a0500 0%, #0a0200 100%)",
                  borderRadius: "4px",
                  padding: "10px 16px",
                  overflow: "hidden",
                }}
              >
                <div
                  data-testid="hp35-display"
                  data-improper-operation={improperOperation ? "true" : "false"}
                  data-improper-operation-visible={improperOperationVisible ? "true" : "false"}
                >
                  <SevenSegmentDisplay
                    display={displayState}
                    testIdPrefix="hp35-display"
                    className="min-h-[30px]"
                    sharedClassName="flex items-center justify-start"
                    sharedStyle={{
                      fontFamily: "'DSEG7', 'Courier New', monospace",
                      fontSize: "19px",
                      fontWeight: "bold",
                      letterSpacing: "1px",
                      lineHeight: 1,
                      minHeight: "30px",
                      paddingLeft: "2px",
                      textAlign: "left",
                      overflow: "visible",
                    }}
                    ghostClassName="hp-led-ghost absolute inset-0"
                    ghostStyle={{
                      color: "rgba(200, 30, 0, 0.08)",
                      pointerEvents: "none",
                    }}
                    activeClassName={improperOperationVisible ? "relative z-[1] opacity-100" : "relative z-[1] opacity-0"}
                    activeStyle={{
                      color: "#ff2800",
                      textShadow: "0 0 8px #ff2800, 0 0 20px rgba(255,40,0,0.5), 0 0 40px rgba(255,40,0,0.15)",
                      transition: "none",
                    }}
                  />
                </div>
              </div>
            </div>

            {/* --- OFF/ON switch (below display, left-aligned) --- */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                marginBottom: "12px",
                fontSize: "7px",
                fontWeight: 700,
                letterSpacing: "1.5px",
                color: "#d0c8bc",
                textTransform: "uppercase",
              }}
            >
              <span>OFF</span>
              {/* Toggle track */}
              <div
                style={{
                  width: "32px",
                  height: "9px",
                  background: "linear-gradient(180deg, #333 0%, #444 100%)",
                  borderRadius: "4px",
                  position: "relative",
                  boxShadow: "inset 0 1px 3px rgba(0,0,0,0.5), 0 1px 0 rgba(255,255,255,0.05)",
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    right: "0",
                    top: "-2px",
                    width: "16px",
                    height: "13px",
                    background: "linear-gradient(180deg, #e8e0d4 0%, #ccc4b4 100%)",
                    borderRadius: "3px",
                    boxShadow:
                      "0 1px 3px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.6)",
                  }}
                />
              </div>
              <span>ON</span>
              {/* Red power LED */}
              <div
                style={{
                  width: "5px",
                  height: "5px",
                  borderRadius: "50%",
                  background:
                    "radial-gradient(circle at 40% 35%, #ff3300 0%, #cc0000 60%, #800000 100%)",
                  boxShadow: "0 0 4px #ff3300, 0 0 8px rgba(255,51,0,0.4)",
                  marginLeft: "1px",
                }}
              />
            </div>

            {/* --- Function Keys Row 1: x^y  log  ln  e^x  CLR --- */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(5, 1fr)",
                gap: "5px",
                marginBottom: "5px",
              }}
            >
              {funcBtn(xyLabel, "x^y", "x^y")}
              {funcBtn(<span className={lc}>log</span>, "log", "log")}
              {funcBtn(<span className={lc}>ln</span>, "ln", "ln")}
              {funcBtn(expLabel, "e^x", "e^x")}
              {blueBtn("CLR", "CLR")}
            </div>

            {/* --- Function Keys Row 2: sqrt(x)  arc  sin  cos  tan --- */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(5, 1fr)",
                gap: "5px",
                marginBottom: "5px",
              }}
            >
              {funcBtn(sqrtLabel, "√x", "\u221Ax")}
              {funcBtn(<span className={lc}>arc</span>, "arc", "arc")}
              {funcBtn(<span className={lc}>sin</span>, "sin", "sin")}
              {funcBtn(<span className={lc}>cos</span>, "cos", "cos")}
              {funcBtn(<span className={lc}>tan</span>, "tan", "tan")}
            </div>

            {/* --- Function Keys Row 3: 1/x  x⮂y  R🠟  STO  RCL --- */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(5, 1fr)",
                gap: "5px",
                marginBottom: "5px",
              }}
            >
              {funcBtn(oneOverXLabel, "1/x", "1/x")}
              {funcBtn(swapLabel, "x⮂y", "x\u2B82y")}
              {funcBtn(<span>R<span className="hp-symbol-arrow">{"\uD83E\uDC1F"}</span></span>, "R🠟", "R\uD83E\uDC1F")}
              {funcBtn("STO", "STO")}
              {funcBtn("RCL", "RCL")}
            </div>

            {/* --- Action row: ENTER  CHS  EEX  CLx --- */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "2fr 1fr 1fr 1fr",
                gap: "5px",
                marginBottom: "14px",
              }}
            >
              {blueBtn(enterLabel, "ENTER", "ENTER\uD83E\uDC6A")}
              {blueBtn(<span>CH{"\u2009"}S</span>, "CHS", "CHS")}
              {blueBtn(<span>E{"\u2009"}EX</span>, "EEX", "EEX")}
              {blueBtn(clxLabel, "CLx", "CLx")}
            </div>

            {/* --- Engraved separator line --- */}
            <div
              style={{
                height: "1px",
                background:
                  "linear-gradient(90deg, transparent, rgba(255,255,255,0.06) 10%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.06) 90%, transparent)",
                marginBottom: "2px",
              }}
            />
            <div
              style={{
                height: "1px",
                background:
                  "linear-gradient(90deg, transparent, rgba(0,0,0,0.3) 10%, rgba(0,0,0,0.4) 50%, rgba(0,0,0,0.3) 90%, transparent)",
                marginBottom: "14px",
              }}
            />

            {/* --- Number Pad --- */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(4, 1fr)",
                gap: "5px",
              }}
            >
              {opBtn("\u2212", "-")}
              {numBtn("7", "7")}
              {numBtn("8", "8")}
              {numBtn("9", "9")}

              {opBtn("+", "+")}
              {numBtn("4", "4")}
              {numBtn("5", "5")}
              {numBtn("6", "6")}

              {opBtn("\u00D7", "×")}
              {numBtn("1", "1")}
              {numBtn("2", "2")}
              {numBtn("3", "3")}

              {opBtn("\u00F7", "÷")}
              {numBtn("0", "0")}
              {numBtn(".", ".")}
              {numBtn(piLabel, "π", "\u03C0")}
            </div>
          </div>

          {/* --- Bottom chin: silver bar with HP logo --- */}
          <div
            style={{
              background:
                "linear-gradient(180deg, #c8c0b4 0%, #b8b0a4 30%, #a8a094 100%)",
              padding: "6px 20px 8px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              borderTop: "1px solid rgba(255,255,255,0.1)",
              boxShadow: "inset 0 1px 0 rgba(255,255,255,0.15)",
            }}
          >
            {/* HP logo */}
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <div
                style={{
                  width: "18px",
                  height: "18px",
                  background: "linear-gradient(135deg, #1a56a8 0%, #0e3d7a 100%)",
                  borderRadius: "2px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 1px 2px rgba(0,0,0,0.3)",
                }}
              >
                <span
                  style={{
                    color: "#fff",
                    fontSize: "10px",
                    fontWeight: 700,
                    fontStyle: "italic",
                    lineHeight: 1,
                    fontFamily: "'TexGyreHeros', Helvetica, Arial, sans-serif",
                  }}
                >
                  hp
                </span>
              </div>
            </div>
            {/* HEWLETT • PACKARD wordmark — each character spread evenly */}
            <div
              className="flex-1 ml-3 flex justify-between items-center"
              style={{
                fontSize: "8px",
                fontWeight: 400,
                color: "#3a3632",
                fontFamily: "'TexGyreHeros', Helvetica, Arial, sans-serif",
              }}
            >
              {"HEWLETT \u2022 PACKARD".split("").map((ch, i) => (
                <span key={i}>{ch === " " ? "\u00A0" : ch}</span>
              ))}
            </div>
          </div>
        </div>

        {/* Trapezoidal shadow underneath */}
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            bottom: "-8px",
            left: "5%",
            right: "5%",
            height: "8px",
            background:
              "radial-gradient(ellipse at center, rgba(0,0,0,0.25) 0%, transparent 70%)",
            filter: "blur(4px)",
            zIndex: -1,
          }}
        />
      </div>
    </div>
  )
}

export default HP35
