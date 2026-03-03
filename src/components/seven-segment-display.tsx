"use client"

import type { CSSProperties } from "react"
import { DISPLAY_EXPONENT_WIDTH, normalizeLedDisplay, type LedDisplayParts } from "../lib/hp-led-display"

interface SevenSegmentDisplayProps {
  display: LedDisplayParts
  className?: string
  sharedClassName?: string
  sharedStyle?: CSSProperties
  activeClassName?: string
  activeStyle?: CSSProperties
  ghostClassName?: string
  ghostStyle?: CSSProperties
  testIdPrefix?: string
}

const toGhostChar = (char: string) => (char === "." ? "." : "8")

const renderSlots = (value: string) =>
  value.split("").map((char, index) => (
    <span key={`${index}:${char}`} className="inline-block w-[1ch] text-center">
      {char}
    </span>
  ))

export function SevenSegmentDisplay({
  display,
  className,
  sharedClassName,
  sharedStyle,
  activeClassName,
  activeStyle,
  ghostClassName,
  ghostStyle,
  testIdPrefix,
}: SevenSegmentDisplayProps) {
  const normalized = normalizeLedDisplay(display)
  const exponentText = normalized.showExponent
    ? `${normalized.exponentSign}${normalized.exponent}`
    : " ".repeat(DISPLAY_EXPONENT_WIDTH)
  const ghostSign = toGhostChar(normalized.sign)
  const ghostMantissa = normalized.mantissa
    .split("")
    .map((char) => toGhostChar(char))
    .join("")
  const ghostExponent = exponentText
    .split("")
    .map((char) => toGhostChar(char))
    .join("")

  return (
    <div className={className ? `relative w-full ${className}` : "relative w-full"}>
      <div
        className={sharedClassName ? `${sharedClassName} ${ghostClassName ?? ""}`.trim() : ghostClassName}
        aria-hidden="true"
        style={{ width: "100%", whiteSpace: "nowrap", ...sharedStyle, ...ghostStyle }}
      >
        <span className="hp-led-sign">{renderSlots(ghostSign)}</span>
        <span className="hp-led-mantissa">{renderSlots(ghostMantissa)}</span>
        <span className="hp-led-exponent">{renderSlots(ghostExponent)}</span>
      </div>
      <div
        className={sharedClassName ? `${sharedClassName} ${activeClassName ?? ""}`.trim() : activeClassName}
        style={{ width: "100%", whiteSpace: "nowrap", ...sharedStyle, ...activeStyle }}
      >
        <span className="hp-led-sign" data-testid={testIdPrefix ? `${testIdPrefix}-sign` : undefined}>
          {renderSlots(normalized.sign)}
        </span>
        <span className="hp-led-mantissa" data-testid={testIdPrefix ? `${testIdPrefix}-mantissa` : undefined}>
          {renderSlots(normalized.mantissa)}
        </span>
        <span className="hp-led-exponent" data-testid={testIdPrefix ? `${testIdPrefix}-exponent` : undefined}>
          {renderSlots(exponentText)}
        </span>
      </div>
    </div>
  )
}
