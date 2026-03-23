import { Effect } from "effect"
import { describe, expect, it } from "@effect/vitest"
import { buildDisplay, initialCalculatorState, pressSequence } from "@/features/calculator"

describe("calculator engine", () => {
  it.effect("models divide by zero as a typed expected failure at the controller boundary", () =>
    Effect.gen(function* () {
      const state = yield* pressSequence(initialCalculatorState, ["3", "ENTER", "0", "÷"])

      expect(state.latchedError?._tag).toBe("DivideByZeroError")
      expect(buildDisplay(state)).toEqual({
        sign: "",
        mantissa: "0.",
        showExponent: false,
        exponentSign: " ",
        exponent: "",
      })
    }))

  it.effect("clears a latched expected failure with CLx", () =>
    Effect.gen(function* () {
      const failed = yield* pressSequence(initialCalculatorState, ["0", "1/x"])
      const recovered = yield* pressSequence(failed, ["CLx", "7"])

      expect(failed.latchedError?._tag).toBe("ReciprocalOfZeroError")
      expect(recovered.latchedError).toBeNull()
      expect(buildDisplay(recovered).mantissa).toBe("7.")
    }))

  it.effect("keeps x^y domain rules explicit", () =>
    Effect.gen(function* () {
      const state = yield* pressSequence(initialCalculatorState, ["2", "ENTER", "0", "x^y"])

      expect(state.latchedError?._tag).toBe("NonPositivePowerBaseError")
    }))

  it.effect("preserves stack behavior for a representative command sequence", () =>
    Effect.gen(function* () {
      const state = yield* pressSequence(initialCalculatorState, ["7", "ENTER", "8", "x⮂y"])

      expect(state.stack.x).toBe(7)
      expect(state.stack.y).toBe(8)
      expect(state.stackDepth).toBe(2)
    }))
})
