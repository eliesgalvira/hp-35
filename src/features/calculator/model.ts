import { formatNumberToLedDisplay, type LedDisplayParts } from "@/lib/hp-led-display"

export type Sign = 1 | -1

export interface StackState {
  readonly x: number
  readonly y: number
  readonly z: number
  readonly t: number
}

export interface CalculatorState {
  readonly stack: StackState
  readonly stackDepth: number
  readonly memory: number
  readonly entering: boolean
  readonly entryBuffer: string
  readonly entryDecimalExplicit: boolean
  readonly entrySign: Sign
  readonly pendingSign: Sign | null
  readonly eexActive: boolean
  readonly eexMantissa: number
  readonly eexMantissaText: string
  readonly eexMantissaSign: Sign
  readonly eexExponentDigits: string
  readonly eexSign: Sign
  readonly arcActive: boolean
  readonly stackLift: boolean
  readonly latchedError: CalculatorMathError | null
}

export interface CalculatorStackRow {
  readonly label: "X" | "Y" | "Z" | "T"
  readonly display: LedDisplayParts
  readonly empty: boolean
}

export type CalculatorToken =
  | "0"
  | "1"
  | "2"
  | "3"
  | "4"
  | "5"
  | "6"
  | "7"
  | "8"
  | "9"
  | "."
  | "π"
  | "ENTER"
  | "CHS"
  | "EEX"
  | "CLx"
  | "CLR"
  | "+"
  | "-"
  | "×"
  | "÷"
  | "x^y"
  | "√x"
  | "log"
  | "ln"
  | "e^x"
  | "sin"
  | "cos"
  | "tan"
  | "arc"
  | "1/x"
  | "x⮂y"
  | "R🠟"
  | "STO"
  | "RCL"

export class DivideByZeroError extends Error {
  readonly _tag = "DivideByZeroError"
  readonly dividend: number

  constructor({ dividend }: { readonly dividend: number }) {
    super("Divide by zero")
    this.name = "DivideByZeroError"
    this.dividend = dividend
  }
}

export class ReciprocalOfZeroError extends Error {
  readonly _tag = "ReciprocalOfZeroError"

  constructor() {
    super("Reciprocal of zero")
    this.name = "ReciprocalOfZeroError"
  }
}

export class NegativeSquareRootError extends Error {
  readonly _tag = "NegativeSquareRootError"
  readonly value: number

  constructor({ value }: { readonly value: number }) {
    super("Square root of a negative number")
    this.name = "NegativeSquareRootError"
    this.value = value
  }
}

export class NonPositiveLogarithmError extends Error {
  readonly _tag = "NonPositiveLogarithmError"
  readonly operation: string
  readonly value: number

  constructor({ operation, value }: { readonly operation: string; readonly value: number }) {
    super(`${operation} of a nonpositive number`)
    this.name = "NonPositiveLogarithmError"
    this.operation = operation
    this.value = value
  }
}

export class InverseTrigDomainError extends Error {
  readonly _tag = "InverseTrigDomainError"
  readonly operation: string
  readonly value: number

  constructor({ operation, value }: { readonly operation: string; readonly value: number }) {
    super(`${operation} outside inverse trigonometric domain`)
    this.name = "InverseTrigDomainError"
    this.operation = operation
    this.value = value
  }
}

export class NonPositivePowerBaseError extends Error {
  readonly _tag = "NonPositivePowerBaseError"
  readonly base: number
  readonly exponent: number

  constructor({ base, exponent }: { readonly base: number; readonly exponent: number }) {
    super("Power base must be positive")
    this.name = "NonPositivePowerBaseError"
    this.base = base
    this.exponent = exponent
  }
}

export class InvalidMathResultError extends Error {
  readonly _tag = "InvalidMathResultError"
  readonly operation: string

  constructor({ operation }: { readonly operation: string }) {
    super(`${operation} returned an invalid result`)
    this.name = "InvalidMathResultError"
    this.operation = operation
  }
}

export type CalculatorMathError =
  | DivideByZeroError
  | ReciprocalOfZeroError
  | NegativeSquareRootError
  | NonPositiveLogarithmError
  | InverseTrigDomainError
  | NonPositivePowerBaseError
  | InvalidMathResultError

export const MAX_MANTISSA_DIGITS = 10
export const MIN_MAGNITUDE = 1e-99
export const MAX_MAGNITUDE = 1e100
export const MAX_DISPLAY_VALUE = 9.999999999e99

export const initialCalculatorState: CalculatorState = {
  stack: { x: 0, y: 0, z: 0, t: 0 },
  stackDepth: 0,
  memory: 0,
  entering: false,
  entryBuffer: "",
  entryDecimalExplicit: false,
  entrySign: 1,
  pendingSign: null,
  eexActive: false,
  eexMantissa: 0,
  eexMantissaText: "",
  eexMantissaSign: 1,
  eexExponentDigits: "",
  eexSign: 1,
  arcActive: false,
  stackLift: false,
  latchedError: null,
}

const countDigits = (value: string) => value.replace(".", "").length

export const buildDisplay = (state: CalculatorState): LedDisplayParts => {
  if (state.latchedError) {
    return { sign: "", mantissa: "0.", showExponent: false, exponentSign: " ", exponent: "" }
  }

  if (state.eexActive) {
    const mantissa =
      state.eexMantissaText !== ""
        ? state.eexMantissaText
        : formatNumberToLedDisplay(state.eexMantissaSign * state.eexMantissa).mantissa
    const exponent = (state.eexExponentDigits || "0").padStart(2, "0")
    return {
      sign: state.eexMantissaSign < 0 ? "-" : "",
      mantissa,
      showExponent: true,
      exponentSign: state.eexSign < 0 ? "-" : " ",
      exponent,
    }
  }

  if (state.entering) {
    return {
      sign: state.entrySign < 0 ? "-" : "",
      mantissa: state.entryBuffer === "" ? "0." : state.entryBuffer,
      showExponent: false,
      exponentSign: " ",
      exponent: "",
    }
  }

  return formatNumberToLedDisplay(state.stack.x)
}

export const buildStackRows = (state: CalculatorState): ReadonlyArray<CalculatorStackRow> => {
  const registerValues = [state.stack.x, state.stack.y, state.stack.z, state.stack.t]
  const labels: ReadonlyArray<CalculatorStackRow["label"]> = ["X", "Y", "Z", "T"]
  return labels.map((label, index) => ({
    label,
    display: index < state.stackDepth ? formatNumberToLedDisplay(registerValues[index] ?? 0) : formatNumberToLedDisplay(0),
    empty: index >= state.stackDepth,
  }))
}

export const countEntryDigits = countDigits
