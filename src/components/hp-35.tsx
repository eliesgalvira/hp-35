"use client"

import { useState } from "react"

interface StackState {
  x: number
  y: number
  z: number
  t: number
}

export default function HP35() {
  const [stack, setStack] = useState<StackState>({ x: 0, y: 0, z: 0, t: 0 })
  const [display, setDisplay] = useState("0")
  const [entering, setEntering] = useState(false)
  const [memory, setMemory] = useState(0)
  const [eexActive, setEexActive] = useState(false)
  const [eexMantissa, setEexMantissa] = useState(0)
  const [eexExponent, setEexExponent] = useState(0)
  const [eexSign, setEexSign] = useState(1)
  const [arcActive, setArcActive] = useState(false)

  /* --- display formatting (HP-35 style: ±M.MMMMMMMMM ±EE) --- */

  const updateDisplay = (value: number) => {
    if (value === 0) return "0."
    const neg = value < 0
    const abs = Math.abs(value)
    // If it fits as a fixed-point number (no exponent needed)
    if (abs >= 0.001 && abs < 1e10) {
      // Try to show as many sig digits as will fit in ~10 chars
      for (let d = 9; d >= 0; d--) {
        const s = (neg ? -abs : abs).toFixed(d)
        const withDot = s.includes(".") ? s : s + "."
        if (withDot.replace("-", "").length <= 11) return withDot
      }
    }
    // Scientific notation: mantissa + exponent
    const exp = Math.floor(Math.log10(abs))
    const mantissa = value / Math.pow(10, exp)
    // Format mantissa to fit, always with decimal point
    const mantissaStr = mantissa.toFixed(8).replace(/0+$/, "")
    const expStr = (exp >= 0 ? " " : "-") + String(Math.abs(exp)).padStart(2, "0")
    return mantissaStr + expStr
  }

  const pushStack = (newX: number) => {
    setStack((prev) => ({ t: prev.z, z: prev.y, y: prev.x, x: newX }))
    setDisplay(updateDisplay(newX))
  }

  const inputDigit = (digit: string) => {
    if (digit === "\u03C0") {
      setDisplay(Math.PI.toString().slice(0, 10))
      setStack((prev) => ({ ...prev, x: Math.PI }))
      setEntering(false)
      setEexActive(false)
      return
    }
    if (eexActive) {
      let newExp = Math.abs(eexExponent) * 10 + Number(digit)
      newExp = eexSign < 0 ? -newExp : newExp
      setEexExponent(newExp)
      setDisplay(`${eexMantissa}e${newExp}`)
      setStack((prev) => ({ ...prev, x: eexMantissa * Math.pow(10, newExp) }))
    } else if (entering) {
      const newDisplay = display === "0" ? digit : display + digit
      if (newDisplay.length <= 10) {
        setDisplay(newDisplay)
        setStack((prev) => ({ ...prev, x: Number.parseFloat(newDisplay) }))
      }
    } else {
      setDisplay(digit)
      setStack((prev) => ({ ...prev, x: Number.parseFloat(digit) }))
      setEntering(true)
    }
  }

  const inputDecimal = () => {
    if (entering) {
      if (!display.includes(".")) setDisplay(display + ".")
    } else {
      setDisplay("0.")
      setEntering(true)
    }
  }

  const enter = () => {
    pushStack(stack.x)
    setEntering(false)
  }

  const operation = (op: string) => {
    let result = stack.x
    switch (op) {
      case "+":
        result = stack.y + stack.x
        setStack((prev) => ({ ...prev, x: result, y: prev.z, z: prev.t, t: 0 }))
        break
      case "-":
        result = stack.y - stack.x
        setStack((prev) => ({ ...prev, x: result, y: prev.z, z: prev.t, t: 0 }))
        break
      case "\u00D7":
        result = stack.y * stack.x
        setStack((prev) => ({ ...prev, x: result, y: prev.z, z: prev.t, t: 0 }))
        break
      case "\u00F7":
        result = stack.y / stack.x
        setStack((prev) => ({ ...prev, x: result, y: prev.z, z: prev.t, t: 0 }))
        break
      case "x^y":
        result = Math.pow(stack.y, stack.x)
        setStack((prev) => ({ ...prev, x: result, y: prev.z, z: prev.t, t: 0 }))
        break
      case "\u221Ax":
        result = Math.sqrt(stack.x)
        setStack((prev) => ({ ...prev, x: result }))
        break
      case "1/x":
        result = 1 / stack.x
        setStack((prev) => ({ ...prev, x: result }))
        break
      case "sin":
        result = arcActive ? Math.asin(stack.x) : Math.sin(stack.x)
        setArcActive(false)
        setStack((prev) => ({ ...prev, x: result }))
        break
      case "cos":
        result = arcActive ? Math.acos(stack.x) : Math.cos(stack.x)
        setArcActive(false)
        setStack((prev) => ({ ...prev, x: result }))
        break
      case "tan":
        result = arcActive ? Math.atan(stack.x) : Math.tan(stack.x)
        setArcActive(false)
        setStack((prev) => ({ ...prev, x: result }))
        break
      case "log":
        result = Math.log10(stack.x)
        setStack((prev) => ({ ...prev, x: result }))
        break
      case "ln":
        result = Math.log(stack.x)
        setStack((prev) => ({ ...prev, x: result }))
        break
      case "e^x":
        result = Math.exp(stack.x)
        setStack((prev) => ({ ...prev, x: result }))
        break
      case "EEX":
        setEexActive(true)
        setEexMantissa(stack.x)
        setEexExponent(0)
        setEexSign(1)
        setDisplay(`${stack.x}e`)
        setEntering(false)
        return
      case "CHS":
        if (eexActive) {
          setEexSign((prev) => -prev)
          setEexExponent((prev) => -prev)
          setDisplay(`${eexMantissa}e${-eexExponent}`)
          return
        }
        result = -stack.x
        setStack((prev) => ({ ...prev, x: result }))
        break
      case "x\u2B82y":
        setStack((prev) => ({ ...prev, x: prev.y, y: prev.x }))
        result = stack.y
        break
      case "arc":
        setArcActive(true)
        return
    }
    setDisplay(updateDisplay(result))
    setEntering(false)
    setEexActive(false)
  }

  const clear = () => {
    setStack({ x: 0, y: 0, z: 0, t: 0 })
    setDisplay("0")
    setEntering(false)
  }

  const store = () => setMemory(stack.x)
  const recall = () => {
    pushStack(memory)
    setEntering(false)
  }

  /* --- Button factories --- */

  const funcBtn = (label: string | React.ReactNode, action: () => void, ariaLabel?: string) => (
    <button onMouseDown={action} className="hp-key-func flex items-center justify-center" aria-label={ariaLabel}>
      {label}
    </button>
  )

  const blueBtn = (label: string | React.ReactNode, action: () => void, ariaLabel?: string) => (
    <button onMouseDown={action} className="hp-key-blue flex items-center justify-center" aria-label={ariaLabel}>
      {label}
    </button>
  )

  const numBtn = (label: string | React.ReactNode, action: () => void, ariaLabel?: string) => (
    <button onMouseDown={action} className="hp-key-num flex items-center justify-center" aria-label={ariaLabel}>
      {label}
    </button>
  )

  const opBtn = (label: string, action: () => void) => (
    <button onMouseDown={action} className="hp-key-op flex items-center justify-center">
      {label}
    </button>
  )

  /* --- Math label components --- */

  const m = "font-['STIXTwoMath','Times_New_Roman',serif] text-[1.45em] leading-none"
  // Lowercase function labels (log, ln, sin, cos, tan, arc) sized so x-height ≈ cap-height at 11px
  const lc = "text-[16px]"

  const sqrtLabel = (
    <span className={`${m} inline-flex items-end whitespace-nowrap`} aria-hidden="true">
      <span className="text-[1.05em] leading-[0.82] -mr-[0.04em]">{"\u221A"}</span>
      <span className="relative pt-[0.08em] border-t-[1.5px] border-current">{"\uD835\uDC65"}</span>
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
      <span className={m}>{"\uD835\uDC65"}</span>{"\u2B82"}<span className={m}>{"\uD835\uDC66"}</span>
    </span>
  )

  const enterLabel = (
    <span className="inline-flex items-center gap-1">
      ENTER<span className="hp-arrow-up">{"\uD83E\uDC6A"}</span>
    </span>
  )

  const piLabel = (
    <span className={m}>{"\uD835\uDF0B"}</span>
  )

  const clxLabel = (
    <span>CL<span className={m}>{"\uD835\uDC65"}</span></span>
  )

  /* --- Render --- */

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
                {/* Ghost segments underneath */}
                <div
                  className="hp-led-ghost"
                  aria-hidden="true"
                  style={{
                    position: "absolute",
                    inset: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "flex-end",
                    padding: "10px 16px",
                    fontSize: "26px",
                    letterSpacing: "2px",
                    pointerEvents: "none",
                  }}
                >
                  8.8.8.8.8.8.8.8.8.8.8.8.8.8.8.
                </div>
                {/* Active display */}
                <div
                  data-testid="hp35-display"
                  style={{
                    fontFamily: "'DSEG7', 'Courier New', monospace",
                    fontSize: "26px",
                    fontWeight: "bold",
                    color: "#ff2800",
                    textShadow:
                      "0 0 8px #ff2800, 0 0 20px rgba(255,40,0,0.5), 0 0 40px rgba(255,40,0,0.15)",
                    textAlign: "right",
                    letterSpacing: "2px",
                    minHeight: "30px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "flex-end",
                    position: "relative",
                    zIndex: 1,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                  }}
                >
                  {display}
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
              {funcBtn(xyLabel, () => operation("x^y"), "x^y")}
              {funcBtn(<span className={lc}>log</span>, () => operation("log"), "log")}
              {funcBtn(<span className={lc}>ln</span>, () => operation("ln"), "ln")}
              {funcBtn(expLabel, () => operation("e^x"), "e^x")}
              {blueBtn("CLR", clear)}
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
              {funcBtn(sqrtLabel, () => operation("\u221Ax"), "\u221Ax")}
              {funcBtn(<span className={lc}>arc</span>, () => operation("arc"), "arc")}
              {funcBtn(<span className={lc}>sin</span>, () => operation("sin"), "sin")}
              {funcBtn(<span className={lc}>cos</span>, () => operation("cos"), "cos")}
              {funcBtn(<span className={lc}>tan</span>, () => operation("tan"), "tan")}
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
              {funcBtn(oneOverXLabel, () => operation("1/x"), "1/x")}
              {funcBtn(swapLabel, () => operation("x\u2B82y"), "x\u2B82y")}
              {funcBtn(<span>R{"\uD83E\uDC1F"}</span>, () => {
                setStack((prev) => ({
                  x: prev.y,
                  y: prev.z,
                  z: prev.t,
                  t: prev.x,
                }))
                setDisplay(updateDisplay(stack.y))
                setEntering(false)
                setEexActive(false)
              }, "R\uD83E\uDC1F")}
              {funcBtn("STO", store)}
              {funcBtn("RCL", recall)}
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
              {blueBtn(enterLabel, enter, "ENTER\uD83E\uDC6A")}
              {blueBtn(<span>CH{"\u2009"}S</span>, () => operation("CHS"), "CHS")}
              {blueBtn(<span>E{"\u2009"}EX</span>, () => operation("EEX"), "EEX")}
              {blueBtn(clxLabel, () => {
                setDisplay("0")
                setStack((prev) => ({ ...prev, x: 0 }))
                setEntering(false)
              }, "CLx")}
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
              {opBtn("\u2212", () => operation("-"))}
              {numBtn("7", () => inputDigit("7"))}
              {numBtn("8", () => inputDigit("8"))}
              {numBtn("9", () => inputDigit("9"))}

              {opBtn("+", () => operation("+"))}
              {numBtn("4", () => inputDigit("4"))}
              {numBtn("5", () => inputDigit("5"))}
              {numBtn("6", () => inputDigit("6"))}

              {opBtn("\u00D7", () => operation("\u00D7"))}
              {numBtn("1", () => inputDigit("1"))}
              {numBtn("2", () => inputDigit("2"))}
              {numBtn("3", () => inputDigit("3"))}

              {opBtn("\u00F7", () => operation("\u00F7"))}
              {numBtn("0", () => inputDigit("0"))}
              {numBtn(".", inputDecimal)}
              {numBtn(piLabel, () => inputDigit("\u03C0"), "\u03C0")}
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
