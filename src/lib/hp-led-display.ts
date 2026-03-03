export interface LedDisplayParts {
  sign: string
  mantissa: string
  showExponent: boolean
  exponentSign: string
  exponent: string
}

export const DISPLAY_MANTISSA_WIDTH = 11
export const DISPLAY_EXPONENT_WIDTH = 3
const MAX_MANTISSA_DIGITS = 10
const MIN_FIXED = 1e-2
const MAX_FIXED = 1e10

const trimTrailingZeros = (value: string) => {
  if (!value.includes(".")) return `${value}.`
  const [intPart, fracPart = ""] = value.split(".")
  const trimmedFrac = fracPart.replace(/0+$/, "")
  if (trimmedFrac.length === 0) return `${intPart}.`
  return `${intPart}.${trimmedFrac}`
}

const normalizeSign = (value: string) => (value === "-" ? "-" : " ")

const normalizeMantissa = (value: string) => {
  const withDecimal = value.includes(".") ? value : `${value}.`
  const trimmed =
    withDecimal.length > DISPLAY_MANTISSA_WIDTH ? withDecimal.slice(0, DISPLAY_MANTISSA_WIDTH) : withDecimal
  return trimmed.padEnd(DISPLAY_MANTISSA_WIDTH, " ")
}

const normalizeExponentDigits = (value: string) => value.padStart(2, "0").slice(-2)

export const normalizeLedDisplay = (parts: LedDisplayParts) => {
  const base = {
    ...parts,
    sign: normalizeSign(parts.sign),
    mantissa: normalizeMantissa(parts.mantissa),
  }
  if (!parts.showExponent) {
    return { ...base, exponentSign: " ", exponent: "" }
  }
  return {
    ...base,
    exponentSign: normalizeSign(parts.exponentSign),
    exponent: normalizeExponentDigits(parts.exponent),
  }
}

const formatFixed = (value: number) => {
  const abs = Math.abs(value)
  const digitsBefore = abs >= 1 ? Math.floor(Math.log10(abs)) + 1 : 1
  const decimals = Math.max(0, MAX_MANTISSA_DIGITS - digitsBefore)
  const raw = abs.toFixed(decimals)
  const trimmed = trimTrailingZeros(raw)
  if (abs > 0 && abs < 1) return trimmed.replace(/^0/, "")
  return trimmed
}

const formatScientific = (value: number) => {
  const abs = Math.abs(value)
  let exp = Math.floor(Math.log10(abs))
  let mantissa = abs / Math.pow(10, exp)
  let mantissaRounded = Number(mantissa.toFixed(9))
  if (mantissaRounded >= 10) {
    mantissaRounded /= 10
    exp += 1
  }
  const mantissaStr = trimTrailingZeros(mantissaRounded.toFixed(9))
  const exponentSign = exp >= 0 ? " " : "-"
  const exponent = String(Math.abs(exp)).padStart(2, "0")
  return { mantissa: mantissaStr, exponentSign, exponent }
}

export const formatNumberToLedDisplay = (value: number): LedDisplayParts => {
  if (value === 0) {
    return { sign: "", mantissa: "0.", showExponent: false, exponentSign: " ", exponent: "" }
  }
  const sign = value < 0 ? "-" : ""
  const abs = Math.abs(value)
  if (abs >= MIN_FIXED && abs < MAX_FIXED) {
    return { sign, mantissa: formatFixed(value), showExponent: false, exponentSign: " ", exponent: "" }
  }
  const sci = formatScientific(value)
  return { sign, mantissa: sci.mantissa, showExponent: true, exponentSign: sci.exponentSign, exponent: sci.exponent }
}
