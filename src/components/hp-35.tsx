"use client"

import { useEffect, useState, type CSSProperties } from "react"
import type { StackRegisterRow } from "./retro-command-stack"
import { SevenSegmentDisplay } from "./seven-segment-display"
import { formatNumberToLedDisplay, type LedDisplayParts } from "../lib/hp-led-display"

interface StackState {
  x: number
  y: number
  z: number
  t: number
}

interface HP35Props {
  onStackChange?: (rows: StackRegisterRow[]) => void
}

export default function HP35({ onStackChange }: HP35Props = {}) {
  const [stack, setStack] = useState<StackState>({ x: 0, y: 0, z: 0, t: 0 })
  const [stackDepth, setStackDepth] = useState(0)
  const [improperOperation, setImproperOperation] = useState(false)
  const [improperOperationVisible, setImproperOperationVisible] = useState(true)
  const [entering, setEntering] = useState(false)
  const [entryBuffer, setEntryBuffer] = useState("")
  const [entryDecimalExplicit, setEntryDecimalExplicit] = useState(false)
  const [entrySign, setEntrySign] = useState<1 | -1>(1)
  const [pendingSign, setPendingSign] = useState<1 | -1 | null>(null)
  const [memory, setMemory] = useState(0)
  const [eexActive, setEexActive] = useState(false)
  const [eexMantissa, setEexMantissa] = useState(0)
  const [eexMantissaText, setEexMantissaText] = useState("")
  const [eexMantissaSign, setEexMantissaSign] = useState<1 | -1>(1)
  const [eexExponentDigits, setEexExponentDigits] = useState("")
  const [eexSign, setEexSign] = useState<1 | -1>(1)
  const [arcActive, setArcActive] = useState(false)
  const [stackLift, setStackLift] = useState(false)

  /* --- display formatting (HP-35 style: sign + mantissa + exponent) --- */

  const MAX_MANTISSA_DIGITS = 10
  const MIN_MAGNITUDE = 1e-99
  const MAX_MAGNITUDE = 1e100
  const MAX_DISPLAY_VALUE = 9.999999999e99

  const countDigits = (value: string) => value.replace(".", "").length

  const buildDisplay = () => {
    if (improperOperation) {
      return { sign: "", mantissa: "0.", showExponent: false, exponentSign: " ", exponent: "" }
    }
    if (eexActive) {
      const mantissa =
        eexMantissaText !== "" ? eexMantissaText : formatNumberToLedDisplay(eexMantissaSign * eexMantissa).mantissa
      const exponent = (eexExponentDigits || "0").padStart(2, "0")
      return {
        sign: eexMantissaSign < 0 ? "-" : "",
        mantissa,
        showExponent: true,
        exponentSign: eexSign < 0 ? "-" : " ",
        exponent,
      }
    }
    if (entering) {
      const mantissa = entryBuffer === "" ? "0." : entryBuffer
      return { sign: entrySign < 0 ? "-" : "", mantissa, showExponent: false, exponentSign: " ", exponent: "" }
    }
    return formatNumberToLedDisplay(stack.x)
  }

  const pushStack = (newX: number) => {
    setStack((prev) => ({ t: prev.z, z: prev.y, y: prev.x, x: newX }))
  }

  useEffect(() => {
    if (!improperOperation) {
      setImproperOperationVisible(true)
      return
    }

    setImproperOperationVisible(true)
    const interval = window.setInterval(() => {
      setImproperOperationVisible((visible) => !visible)
    }, 500)

    return () => window.clearInterval(interval)
  }, [improperOperation])

  useEffect(() => {
    if (!onStackChange) return
    const registerValues = [stack.x, stack.y, stack.z, stack.t]
    const labels: StackRegisterRow["label"][] = ["X", "Y", "Z", "T"]
    onStackChange(
      labels.map((label, index) => ({
        label,
        display: index < stackDepth ? formatNumberToLedDisplay(registerValues[index]) : formatNumberToLedDisplay(0),
        empty: index >= stackDepth,
      })),
    )
  }, [onStackChange, stack, stackDepth])

  const resetEntryModes = () => {
    setEntering(false)
    setEntryBuffer("")
    setEntryDecimalExplicit(false)
    setEntrySign(1)
    setPendingSign(null)
    setStackLift(false)
    setEexActive(false)
    setEexExponentDigits("")
    setEexMantissaText("")
    setArcActive(false)
  }

  const showImproperOperation = () => {
    setImproperOperation(true)
    resetEntryModes()
  }

  const finishOperation = () => {
    resetEntryModes()
    setStackLift(true)
  }

  const normalizeResult = (value: number) => {
    if (Number.isNaN(value)) return { kind: "improper" as const }
    if (!Number.isFinite(value) || Math.abs(value) >= MAX_MAGNITUDE) {
      return { kind: "value" as const, value: value < 0 ? -MAX_DISPLAY_VALUE : MAX_DISPLAY_VALUE }
    }
    if (value !== 0 && Math.abs(value) < MIN_MAGNITUDE) {
      return { kind: "value" as const, value: 0 }
    }
    return { kind: "value" as const, value }
  }

  const inputDigit = (digit: string) => {
    if (improperOperation) return
    if (!entering && stackLift) {
      pushStack(stack.x)
      setStackLift(false)
      setStackDepth((prev) => Math.min(Math.max(prev, 1) + 1, 4))
    }
    if (digit === "\u03C0") {
      setStack((prev) => ({ ...prev, x: Math.PI }))
      setStackDepth((prev) => Math.max(prev, 1))
      setEntering(false)
      setEntryBuffer("")
      setEntryDecimalExplicit(false)
      setEntrySign(1)
      setPendingSign(null)
      setStackLift(false)
      setEexActive(false)
      setEexExponentDigits("")
      setEexMantissaText("")
      return
    }
    if (eexActive) {
      if (eexExponentDigits.length >= 2) return
      const nextDigits = `${eexExponentDigits}${digit}`
      setEexExponentDigits(nextDigits)
      const exp = Number(nextDigits) * eexSign
      const newValue = eexMantissaSign * eexMantissa * Math.pow(10, exp)
      setStack((prev) => ({ ...prev, x: newValue }))
      return
    }
    if (!entering) {
      const nextSign = pendingSign ?? 1
      setEntrySign(nextSign)
      setPendingSign(null)
      setEntryDecimalExplicit(false)
      const newBuffer = `${digit}.`
      setEntryBuffer(newBuffer)
      setStack((prev) => ({ ...prev, x: nextSign * Number.parseFloat(newBuffer) }))
      setEntering(true)
      setStackLift(false)
      setStackDepth((prev) => Math.max(prev, 1))
      return
    }
    const digitsCount = countDigits(entryBuffer)
    if (digitsCount >= MAX_MANTISSA_DIGITS) return
    if (!entryDecimalExplicit && entryBuffer.endsWith(".")) {
      const base = entryBuffer.slice(0, -1)
      const newBuffer = `${base}${digit}.`
      setEntryBuffer(newBuffer)
      setStack((prev) => ({ ...prev, x: entrySign * Number.parseFloat(newBuffer) }))
      return
    }
    const newBuffer = `${entryBuffer}${digit}`
    setEntryBuffer(newBuffer)
    setStack((prev) => ({ ...prev, x: entrySign * Number.parseFloat(newBuffer) }))
  }

  const inputDecimal = () => {
    if (improperOperation) return
    if (eexActive) return
    if (!entering) {
      if (stackLift) {
        pushStack(stack.x)
        setStackLift(false)
        setStackDepth((prev) => Math.min(Math.max(prev, 1) + 1, 4))
      }
      const nextSign = pendingSign ?? 1
      setEntrySign(nextSign)
      setPendingSign(null)
      setEntryBuffer(".")
      setEntryDecimalExplicit(true)
      setEntering(true)
      setStack((prev) => ({ ...prev, x: nextSign * 0 }))
      setStackDepth((prev) => Math.max(prev, 1))
      return
    }
    if (!entryDecimalExplicit) {
      setEntryDecimalExplicit(true)
    }
  }

  const enter = () => {
    if (improperOperation) return
    pushStack(stack.x)
    setStackDepth((prev) => Math.min(Math.max(prev, 1) + 1, 4))
    resetEntryModes()
  }

  const operation = (op: string) => {
    if (improperOperation) return
    let result = stack.x
    switch (op) {
      case "+":
        result = stack.y + stack.x
        {
          const normalized = normalizeResult(result)
          if (normalized.kind === "improper") {
            showImproperOperation()
            return
          }
          setStack((prev) => ({ ...prev, x: normalized.value, y: prev.z, z: prev.t, t: 0 }))
          setStackDepth((prev) => (prev === 0 ? 0 : Math.max(prev - 1, 1)))
        }
        break
      case "-":
        result = stack.y - stack.x
        {
          const normalized = normalizeResult(result)
          if (normalized.kind === "improper") {
            showImproperOperation()
            return
          }
          setStack((prev) => ({ ...prev, x: normalized.value, y: prev.z, z: prev.t, t: 0 }))
          setStackDepth((prev) => (prev === 0 ? 0 : Math.max(prev - 1, 1)))
        }
        break
      case "\u00D7":
        result = stack.y * stack.x
        {
          const normalized = normalizeResult(result)
          if (normalized.kind === "improper") {
            showImproperOperation()
            return
          }
          setStack((prev) => ({ ...prev, x: normalized.value, y: prev.z, z: prev.t, t: 0 }))
          setStackDepth((prev) => (prev === 0 ? 0 : Math.max(prev - 1, 1)))
        }
        break
      case "\u00F7":
        if (stack.x === 0) {
          showImproperOperation()
          return
        }
        result = stack.y / stack.x
        {
          const normalized = normalizeResult(result)
          if (normalized.kind === "improper") {
            showImproperOperation()
            return
          }
          setStack((prev) => ({ ...prev, x: normalized.value, y: prev.z, z: prev.t, t: 0 }))
          setStackDepth((prev) => (prev === 0 ? 0 : Math.max(prev - 1, 1)))
        }
        break
      case "x^y":
        if (stack.x <= 0) {
          showImproperOperation()
          return
        }
        result = Math.pow(stack.x, stack.y)
        {
          const normalized = normalizeResult(result)
          if (normalized.kind === "improper") {
            showImproperOperation()
            return
          }
          setStack((prev) => ({ ...prev, x: normalized.value, y: prev.z, z: prev.t, t: 0 }))
          setStackDepth((prev) => (prev === 0 ? 0 : Math.max(prev - 1, 1)))
        }
        break
      case "\u221Ax":
        if (stack.x < 0) {
          showImproperOperation()
          return
        }
        result = Math.sqrt(stack.x)
        {
          const normalized = normalizeResult(result)
          if (normalized.kind === "improper") {
            showImproperOperation()
            return
          }
          setStack((prev) => ({ ...prev, x: normalized.value }))
          setStackDepth((prev) => Math.max(prev, 1))
        }
        break
      case "1/x":
        if (stack.x === 0) {
          showImproperOperation()
          return
        }
        result = 1 / stack.x
        {
          const normalized = normalizeResult(result)
          if (normalized.kind === "improper") {
            showImproperOperation()
            return
          }
          setStack((prev) => ({ ...prev, x: normalized.value }))
          setStackDepth((prev) => Math.max(prev, 1))
        }
        break
      case "sin":
        if (arcActive) {
          if (stack.x < -1 || stack.x > 1) {
            showImproperOperation()
            return
          }
          result = (Math.asin(stack.x) * 180) / Math.PI
        } else {
          result = Math.sin((stack.x * Math.PI) / 180)
        }
        {
          const normalized = normalizeResult(result)
          if (normalized.kind === "improper") {
            showImproperOperation()
            return
          }
          setArcActive(false)
          setStack((prev) => ({ ...prev, x: normalized.value, t: prev.z }))
          setStackDepth((prev) => Math.max(prev, 1))
        }
        break
      case "cos":
        if (arcActive) {
          if (stack.x < -1 || stack.x > 1) {
            showImproperOperation()
            return
          }
          result = (Math.acos(stack.x) * 180) / Math.PI
        } else {
          result = Math.cos((stack.x * Math.PI) / 180)
        }
        {
          const normalized = normalizeResult(result)
          if (normalized.kind === "improper") {
            showImproperOperation()
            return
          }
          setArcActive(false)
          setStack((prev) => ({ ...prev, x: normalized.value, t: prev.z }))
          setStackDepth((prev) => Math.max(prev, 1))
        }
        break
      case "tan":
        if (arcActive) {
          result = (Math.atan(stack.x) * 180) / Math.PI
        } else {
          result = Math.tan((stack.x * Math.PI) / 180)
        }
        {
          const normalized = normalizeResult(result)
          if (normalized.kind === "improper") {
            showImproperOperation()
            return
          }
          setArcActive(false)
          setStack((prev) => ({ ...prev, x: normalized.value, t: prev.z }))
          setStackDepth((prev) => Math.max(prev, 1))
        }
        break
      case "log":
        if (stack.x <= 0) {
          showImproperOperation()
          return
        }
        result = Math.log10(stack.x)
        {
          const normalized = normalizeResult(result)
          if (normalized.kind === "improper") {
            showImproperOperation()
            return
          }
          setStack((prev) => ({ ...prev, x: normalized.value }))
          setStackDepth((prev) => Math.max(prev, 1))
        }
        break
      case "ln":
        if (stack.x <= 0) {
          showImproperOperation()
          return
        }
        result = Math.log(stack.x)
        {
          const normalized = normalizeResult(result)
          if (normalized.kind === "improper") {
            showImproperOperation()
            return
          }
          setStack((prev) => ({ ...prev, x: normalized.value }))
          setStackDepth((prev) => Math.max(prev, 1))
        }
        break
      case "e^x":
        result = Math.exp(stack.x)
        {
          const normalized = normalizeResult(result)
          if (normalized.kind === "improper") {
            showImproperOperation()
            return
          }
          setStack((prev) => ({ ...prev, x: normalized.value }))
          setStackDepth((prev) => Math.max(prev, 1))
        }
        break
      case "EEX":
        if (eexActive) return
        if (entering && entryBuffer !== "") {
          setEexMantissaSign(entrySign)
          setEexMantissa(Number.parseFloat(entryBuffer))
          setEexMantissaText(entryBuffer)
        } else {
          const baseValue = stack.x === 0 ? 1 : stack.x
          setEexMantissaSign(baseValue < 0 ? -1 : 1)
          setEexMantissa(Math.abs(baseValue))
          setEexMantissaText(formatNumberToLedDisplay(baseValue).mantissa)
        }
        setEexActive(true)
        setEexExponentDigits("")
        setEexSign(1)
        setEntering(false)
        setEntryBuffer("")
        setEntryDecimalExplicit(false)
        return
      case "CHS":
        if (eexActive) {
          if (eexExponentDigits !== "") return
          setEexSign((prev) => (prev === 1 ? -1 : 1))
          return
        }
        if (entering) {
          const nextSign = entrySign === 1 ? -1 : 1
          setEntrySign(nextSign)
          setStack((prev) => ({ ...prev, x: -prev.x }))
          setPendingSign(nextSign)
          setEntering(false)
          setEntryBuffer("")
          setEntryDecimalExplicit(false)
          setStackLift(false)
          return
        }
        setStack((prev) => ({ ...prev, x: -prev.x }))
        setPendingSign(stack.x < 0 ? 1 : -1)
        setEntryBuffer("")
        setEntryDecimalExplicit(false)
        setEntrySign(1)
        setStackLift(false)
        return
      case "x\u2B82y":
        setStack((prev) => ({ ...prev, x: prev.y, y: prev.x }))
        break
      case "arc":
        setArcActive(true)
        setEntering(false)
        setEntryBuffer("")
        setEntryDecimalExplicit(false)
        setPendingSign(null)
        setStackLift(false)
        setEexActive(false)
        setEexExponentDigits("")
        setEexMantissaText("")
        return
    }
    finishOperation()
  }

  const clear = () => {
    setImproperOperation(false)
    setStack({ x: 0, y: 0, z: 0, t: 0 })
    setStackDepth(0)
    setMemory(0)
    resetEntryModes()
  }

  const store = () => {
    if (improperOperation) return
    setMemory(stack.x)
    setEntering(false)
    setEntryBuffer("")
    setEntryDecimalExplicit(false)
    setEntrySign(1)
    setStackLift(false)
  }
  const recall = () => {
    if (improperOperation) return
    pushStack(memory)
    setStackDepth((prev) => Math.min(Math.max(prev, 1) + 1, 4))
    setEntering(false)
    setEntryBuffer("")
    setEntryDecimalExplicit(false)
    setEntrySign(1)
    setPendingSign(null)
    setStackLift(false)
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

  const displayState: LedDisplayParts = buildDisplay()

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
              {funcBtn(<span>R<span className="hp-symbol-arrow">{"\uD83E\uDC1F"}</span></span>, () => {
                if (improperOperation) return
                setStack((prev) => ({
                  x: prev.y,
                  y: prev.z,
                  z: prev.t,
                  t: prev.x,
                }))
                setEntering(false)
                setEntryBuffer("")
                setEntryDecimalExplicit(false)
                setEntrySign(1)
                setStackLift(false)
                setEexActive(false)
                setEexExponentDigits("")
                setEexMantissaText("")
                setPendingSign(null)
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
                setImproperOperation(false)
                setStack((prev) => ({ ...prev, x: 0 }))
                resetEntryModes()
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
