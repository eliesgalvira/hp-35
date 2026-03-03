"use client"

import type { CSSProperties } from "react"
import { DISPLAY_EXPONENT_WIDTH, normalizeLedDisplay, type LedDisplayParts } from "../lib/hp-led-display"

interface SevenSegmentDisplayProps {
  display: LedDisplayParts
  className?: string
  activeClassName?: string
  activeStyle?: CSSProperties
  ghostClassName?: string
  ghostStyle?: CSSProperties
  testIdPrefix?: string
}

const ghostDisplay = normalizeLedDisplay({
  sign: "8",
  mantissa: "8.8.8.8.8.8",
  showExponent: true,
  exponentSign: "8",
  exponent: "88",
})

export function SevenSegmentDisplay({
  display,
  className,
  activeClassName,
  activeStyle,
  ghostClassName,
  ghostStyle,
  testIdPrefix,
}: SevenSegmentDisplayProps) {
  const normalized = normalizeLedDisplay(display)

  return (
    <div className={className}>
      <div className={ghostClassName} aria-hidden="true" style={ghostStyle}>
        <span className="hp-led-sign">8</span>
        <span className="hp-led-mantissa">{ghostDisplay.mantissa}</span>
        <span className="hp-led-exponent">{`${ghostDisplay.exponentSign}${ghostDisplay.exponent}`}</span>
      </div>
      <div className={activeClassName} style={activeStyle}>
        <span className="hp-led-sign" data-testid={testIdPrefix ? `${testIdPrefix}-sign` : undefined}>
          {normalized.sign}
        </span>
        <span className="hp-led-mantissa" data-testid={testIdPrefix ? `${testIdPrefix}-mantissa` : undefined}>
          {normalized.mantissa}
        </span>
        <span className="hp-led-exponent" data-testid={testIdPrefix ? `${testIdPrefix}-exponent` : undefined}>
          {normalized.showExponent
            ? `${normalized.exponentSign}${normalized.exponent}`
            : " ".repeat(DISPLAY_EXPONENT_WIDTH)}
        </span>
      </div>
    </div>
  )
}
