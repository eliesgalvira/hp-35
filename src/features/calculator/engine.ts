import {
  buildDisplay,
  countEntryDigits,
  type CalculatorMathError,
  type CalculatorState,
  type CalculatorToken,
  type Sign,
  DivideByZeroError,
  InvalidMathResultError,
  InverseTrigDomainError,
  MAX_DISPLAY_VALUE,
  MAX_MAGNITUDE,
  MAX_MANTISSA_DIGITS,
  MIN_MAGNITUDE,
  NegativeSquareRootError,
  NonPositiveLogarithmError,
  NonPositivePowerBaseError,
  ReciprocalOfZeroError,
  initialCalculatorState,
} from "@/features/calculator/model"

type CalculationResult<A, E extends CalculatorMathError = CalculatorMathError> =
  | { readonly ok: true; readonly value: A }
  | { readonly ok: false; readonly error: E }

type Transition<E extends CalculatorMathError = CalculatorMathError> = CalculationResult<CalculatorState, E>

const succeed = <A>(value: A): CalculationResult<A, never> => ({ ok: true, value })

const fail = <E extends CalculatorMathError>(error: E): CalculationResult<never, E> => ({ ok: false, error })

const mapSuccess = <A, B, E extends CalculatorMathError>(
  result: CalculationResult<A, E>,
  f: (value: A) => B,
): CalculationResult<B, E> => (result.ok ? succeed(f(result.value)) : result)

const pushStack = (state: CalculatorState, newX: number): CalculatorState => ({
  ...state,
  stack: {
    x: newX,
    y: state.stack.x,
    z: state.stack.y,
    t: state.stack.z,
  },
})

const clearTransientModes = (state: CalculatorState): CalculatorState => ({
  ...state,
  entering: false,
  entryBuffer: "",
  entryDecimalExplicit: false,
  entrySign: 1,
  pendingSign: null,
  eexActive: false,
  eexExponentDigits: "",
  eexMantissaText: "",
  arcActive: false,
  stackLift: false,
})

const finishOperation = (state: CalculatorState): CalculatorState => ({
  ...clearTransientModes(state),
  stackLift: true,
})

const latchImproperOperation = (state: CalculatorState, error: CalculatorMathError): CalculatorState => ({
  ...clearTransientModes(state),
  latchedError: error,
})

const normalizeResult = (operation: string, value: number): CalculationResult<number, InvalidMathResultError> => {
  if (Number.isNaN(value)) {
    return fail(new InvalidMathResultError({ operation }))
  }
  if (!Number.isFinite(value) || Math.abs(value) >= MAX_MAGNITUDE) {
    return succeed(value < 0 ? -MAX_DISPLAY_VALUE : MAX_DISPLAY_VALUE)
  }
  if (value !== 0 && Math.abs(value) < MIN_MAGNITUDE) {
    return succeed(0)
  }
  return succeed(value)
}

const applyBinaryResult = (state: CalculatorState, value: number): CalculatorState =>
  finishOperation({
    ...state,
    stack: {
      x: value,
      y: state.stack.z,
      z: state.stack.t,
      t: 0,
    },
    stackDepth: state.stackDepth === 0 ? 0 : Math.max(state.stackDepth - 1, 1),
    latchedError: null,
  })

const applyUnaryResult = (state: CalculatorState, value: number, preserveT = false): CalculatorState =>
  finishOperation({
    ...state,
    stack: {
      ...state.stack,
      x: value,
      ...(preserveT ? { t: state.stack.z } : {}),
    },
    stackDepth: Math.max(state.stackDepth, 1),
    latchedError: null,
  })

const prepareEntry = (state: CalculatorState): CalculatorState => {
  if (!state.entering && state.stackLift) {
    return {
      ...pushStack(state, state.stack.x),
      stackLift: false,
      stackDepth: Math.min(Math.max(state.stackDepth, 1) + 1, 4),
    }
  }
  return state
}

const inputDigit = (state: CalculatorState, digit: string): Transition =>
  succeed(
    (() => {
      const prepared = prepareEntry(state)

      if (digit === "π") {
        return {
          ...clearTransientModes(prepared),
          stack: { ...prepared.stack, x: Math.PI },
          stackDepth: Math.max(prepared.stackDepth, 1),
          latchedError: null,
        }
      }

      if (prepared.eexActive) {
        if (prepared.eexExponentDigits.length >= 2) {
          return prepared
        }
        const nextDigits = `${prepared.eexExponentDigits}${digit}`
        const exponent = Number(nextDigits) * prepared.eexSign
        const newValue = prepared.eexMantissaSign * prepared.eexMantissa * Math.pow(10, exponent)
        return {
          ...prepared,
          eexExponentDigits: nextDigits,
          stack: { ...prepared.stack, x: newValue },
        }
      }

      if (!prepared.entering) {
        const nextSign = prepared.pendingSign ?? 1
        const newBuffer = `${digit}.`
        return {
          ...prepared,
          entering: true,
          entryBuffer: newBuffer,
          entrySign: nextSign,
          pendingSign: null,
          entryDecimalExplicit: false,
          stackLift: false,
          stackDepth: Math.max(prepared.stackDepth, 1),
          latchedError: null,
          stack: { ...prepared.stack, x: nextSign * Number.parseFloat(newBuffer) },
        }
      }

      if (countEntryDigits(prepared.entryBuffer) >= MAX_MANTISSA_DIGITS) {
        return prepared
      }

      const newBuffer =
        !prepared.entryDecimalExplicit && prepared.entryBuffer.endsWith(".")
          ? `${prepared.entryBuffer.slice(0, -1)}${digit}.`
          : `${prepared.entryBuffer}${digit}`

      return {
        ...prepared,
        entryBuffer: newBuffer,
        stack: { ...prepared.stack, x: prepared.entrySign * Number.parseFloat(newBuffer) },
      }
    })(),
  )

const inputDecimal = (state: CalculatorState): Transition =>
  succeed(
    (() => {
      if (state.eexActive) {
        return state
      }

      if (!state.entering) {
        const prepared = prepareEntry(state)
        const nextSign = prepared.pendingSign ?? 1
        return {
          ...prepared,
          entering: true,
          entryBuffer: ".",
          entryDecimalExplicit: true,
          entrySign: nextSign,
          pendingSign: null,
          stackLift: false,
          stackDepth: Math.max(prepared.stackDepth, 1),
          latchedError: null,
          stack: { ...prepared.stack, x: nextSign * 0 },
        }
      }

      if (!state.entryDecimalExplicit) {
        return { ...state, entryDecimalExplicit: true }
      }

      return state
    })(),
  )

const enter = (state: CalculatorState): Transition =>
  succeed({
    ...clearTransientModes(pushStack(state, state.stack.x)),
    stackDepth: Math.min(Math.max(state.stackDepth, 1) + 1, 4),
    latchedError: null,
  })

const add = (state: CalculatorState): Transition<InvalidMathResultError> =>
  mapSuccess(normalizeResult("add", state.stack.y + state.stack.x), (value) => applyBinaryResult(state, value))

const subtract = (state: CalculatorState): Transition<InvalidMathResultError> =>
  mapSuccess(normalizeResult("subtract", state.stack.y - state.stack.x), (value) => applyBinaryResult(state, value))

const multiply = (state: CalculatorState): Transition<InvalidMathResultError> =>
  mapSuccess(normalizeResult("multiply", state.stack.y * state.stack.x), (value) => applyBinaryResult(state, value))

const divide = (state: CalculatorState): Transition<DivideByZeroError | InvalidMathResultError> =>
  state.stack.x === 0
    ? fail(new DivideByZeroError({ dividend: state.stack.y }))
    : mapSuccess(normalizeResult("divide", state.stack.y / state.stack.x), (value) => applyBinaryResult(state, value))

const raiseToPower = (state: CalculatorState): Transition<NonPositivePowerBaseError | InvalidMathResultError> =>
  state.stack.y <= 0
    ? fail(new NonPositivePowerBaseError({ base: state.stack.y, exponent: state.stack.x }))
    : mapSuccess(normalizeResult("x^y", Math.pow(state.stack.y, state.stack.x)), (value) =>
        applyBinaryResult(state, value),
      )

const squareRoot = (state: CalculatorState): Transition<NegativeSquareRootError | InvalidMathResultError> =>
  state.stack.x < 0
    ? fail(new NegativeSquareRootError({ value: state.stack.x }))
    : mapSuccess(normalizeResult("sqrt", Math.sqrt(state.stack.x)), (value) => applyUnaryResult(state, value))

const reciprocal = (state: CalculatorState): Transition<ReciprocalOfZeroError | InvalidMathResultError> =>
  state.stack.x === 0
    ? fail(new ReciprocalOfZeroError())
    : mapSuccess(normalizeResult("reciprocal", 1 / state.stack.x), (value) => applyUnaryResult(state, value))

const sine = (state: CalculatorState): Transition<InverseTrigDomainError | InvalidMathResultError> =>
  (() => {
    if (state.arcActive) {
      if (state.stack.x < -1 || state.stack.x > 1) {
        return fail(new InverseTrigDomainError({ operation: "sin", value: state.stack.x }))
      }
      return mapSuccess(normalizeResult("asin", (Math.asin(state.stack.x) * 180) / Math.PI), (value) =>
        applyUnaryResult({ ...state, arcActive: false }, value, true),
      )
    }
    return mapSuccess(normalizeResult("sin", Math.sin((state.stack.x * Math.PI) / 180)), (value) =>
      applyUnaryResult(state, value, true),
    )
  })()

const cosine = (state: CalculatorState): Transition<InverseTrigDomainError | InvalidMathResultError> =>
  (() => {
    if (state.arcActive) {
      if (state.stack.x < -1 || state.stack.x > 1) {
        return fail(new InverseTrigDomainError({ operation: "cos", value: state.stack.x }))
      }
      return mapSuccess(normalizeResult("acos", (Math.acos(state.stack.x) * 180) / Math.PI), (value) =>
        applyUnaryResult({ ...state, arcActive: false }, value, true),
      )
    }
    return mapSuccess(normalizeResult("cos", Math.cos((state.stack.x * Math.PI) / 180)), (value) =>
      applyUnaryResult(state, value, true),
    )
  })()

const tangent = (state: CalculatorState): Transition<InvalidMathResultError> =>
  (() => {
    const value = state.arcActive
      ? (Math.atan(state.stack.x) * 180) / Math.PI
      : Math.tan((state.stack.x * Math.PI) / 180)
    return mapSuccess(normalizeResult(state.arcActive ? "atan" : "tan", value), (normalized) =>
      applyUnaryResult({ ...state, arcActive: false }, normalized, true),
    )
  })()

const logarithm = (state: CalculatorState): Transition<NonPositiveLogarithmError | InvalidMathResultError> =>
  state.stack.x <= 0
    ? fail(new NonPositiveLogarithmError({ operation: "log", value: state.stack.x }))
    : mapSuccess(normalizeResult("log", Math.log10(state.stack.x)), (value) => applyUnaryResult(state, value))

const naturalLogarithm = (state: CalculatorState): Transition<NonPositiveLogarithmError | InvalidMathResultError> =>
  state.stack.x <= 0
    ? fail(new NonPositiveLogarithmError({ operation: "ln", value: state.stack.x }))
    : mapSuccess(normalizeResult("ln", Math.log(state.stack.x)), (value) => applyUnaryResult(state, value))

const exp = (state: CalculatorState): Transition<InvalidMathResultError> =>
  mapSuccess(normalizeResult("e^x", Math.exp(state.stack.x)), (value) => applyUnaryResult(state, value))

const enableExponentEntry = (state: CalculatorState): Transition =>
  succeed(
    (() => {
      if (state.eexActive) {
        return state
      }

      if (state.entering && state.entryBuffer !== "") {
        return {
          ...state,
          entering: false,
          entryBuffer: "",
          entryDecimalExplicit: false,
          eexActive: true,
          eexMantissaSign: state.entrySign,
          eexMantissa: Number.parseFloat(state.entryBuffer),
          eexMantissaText: state.entryBuffer,
          eexExponentDigits: "",
          eexSign: 1,
        }
      }

      const baseValue = state.stack.x === 0 ? 1 : state.stack.x
      return {
        ...state,
        entering: false,
        entryBuffer: "",
        entryDecimalExplicit: false,
        eexActive: true,
        eexMantissaSign: baseValue < 0 ? -1 : 1,
        eexMantissa: Math.abs(baseValue),
        eexMantissaText: buildDisplay({ ...state, stack: { ...state.stack, x: baseValue } }).mantissa,
        eexExponentDigits: "",
        eexSign: 1,
      }
    })(),
  )

const changeSign = (state: CalculatorState): Transition =>
  succeed(
    (() => {
      if (state.eexActive) {
        if (state.eexExponentDigits !== "") {
          return state
        }
        return { ...state, eexSign: state.eexSign === 1 ? -1 : 1 }
      }

      if (state.entering) {
        const nextSign: Sign = state.entrySign === 1 ? -1 : 1
        return {
          ...state,
          entering: false,
          entryBuffer: "",
          entryDecimalExplicit: false,
          entrySign: nextSign,
          pendingSign: nextSign,
          stackLift: false,
          stack: { ...state.stack, x: -state.stack.x },
        }
      }

      return {
        ...state,
        pendingSign: state.stack.x < 0 ? 1 : -1,
        entryBuffer: "",
        entryDecimalExplicit: false,
        entrySign: 1,
        stackLift: false,
        stack: { ...state.stack, x: -state.stack.x },
      }
    })(),
  )

const swapXAndY = (state: CalculatorState): Transition =>
  succeed(
    finishOperation({
      ...state,
      stack: {
        ...state.stack,
        x: state.stack.y,
        y: state.stack.x,
      },
      latchedError: null,
    }),
  )

const rollDown = (state: CalculatorState): Transition =>
  succeed({
    ...clearTransientModes({
      ...state,
      stack: {
        x: state.stack.y,
        y: state.stack.z,
        z: state.stack.t,
        t: state.stack.x,
      },
    }),
    latchedError: null,
  })

const store = (state: CalculatorState): Transition =>
  succeed({
    ...state,
    memory: state.stack.x,
    entering: false,
    entryBuffer: "",
    entryDecimalExplicit: false,
    entrySign: 1,
    stackLift: false,
  })

const recall = (state: CalculatorState): Transition =>
  succeed({
    ...pushStack(state, state.memory),
    stackDepth: Math.min(Math.max(state.stackDepth, 1) + 1, 4),
    entering: false,
    entryBuffer: "",
    entryDecimalExplicit: false,
    entrySign: 1,
    pendingSign: null,
    stackLift: false,
    latchedError: null,
  })

export const resetCalculator = (): CalculatorState => initialCalculatorState

export const clearXRegister = (state: CalculatorState): CalculatorState => ({
    ...clearTransientModes(state),
    latchedError: null,
    stack: { ...state.stack, x: 0 },
  })

const dispatchActiveToken = (
  state: CalculatorState,
  token: CalculatorToken,
): Transition<CalculatorMathError> => {
  switch (token) {
    case "0":
    case "1":
    case "2":
    case "3":
    case "4":
    case "5":
    case "6":
    case "7":
    case "8":
    case "9":
      return inputDigit(state, token)
    case ".":
      return inputDecimal(state)
    case "π":
      return inputDigit(state, "π")
    case "ENTER":
      return enter(state)
    case "CHS":
      return changeSign(state)
    case "EEX":
      return enableExponentEntry(state)
    case "CLx":
      return succeed(clearXRegister(state))
    case "CLR":
      return succeed(resetCalculator())
    case "+":
      return add(state)
    case "-":
      return subtract(state)
    case "×":
      return multiply(state)
    case "÷":
      return divide(state)
    case "x^y":
      return raiseToPower(state)
    case "√x":
      return squareRoot(state)
    case "log":
      return logarithm(state)
    case "ln":
      return naturalLogarithm(state)
    case "e^x":
      return exp(state)
    case "sin":
      return sine(state)
    case "cos":
      return cosine(state)
    case "tan":
      return tangent(state)
    case "arc":
      return succeed({
        ...clearTransientModes(state),
        arcActive: true,
        latchedError: null,
      })
    case "1/x":
      return reciprocal(state)
    case "x⮂y":
      return swapXAndY(state)
    case "R🠟":
      return rollDown(state)
    case "STO":
      return store(state)
    case "RCL":
      return recall(state)
  }
}

export const pressToken = (state: CalculatorState, token: CalculatorToken): CalculatorState => {
  if (state.latchedError && token !== "CLR" && token !== "CLx") {
    return state
  }

  const result = dispatchActiveToken(state, token)
  return result.ok ? result.value : latchImproperOperation(state, result.error)
}

export const pressSequence = (state: CalculatorState, tokens: ReadonlyArray<CalculatorToken>): CalculatorState => {
  let currentState = state
  for (const token of tokens) {
    currentState = pressToken(currentState, token)
  }
  return currentState
}
