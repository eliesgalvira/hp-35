import { describe, expect, it } from "vitest"
import { buildDisplay, initialCalculatorState, pressSequence } from "@/features/calculator"

describe("calculator engine", () => {
  it("models divide by zero as a typed expected failure at the controller boundary", () => {
    const state = pressSequence(initialCalculatorState, ["3", "ENTER", "0", "÷"])

    expect(state.latchedError?._tag).toBe("DivideByZeroError")
    expect(buildDisplay(state)).toEqual({
      sign: "",
      mantissa: "0.",
      showExponent: false,
      exponentSign: " ",
      exponent: "",
    })
  })

  it("clears a latched expected failure with CLx", () => {
    const failed = pressSequence(initialCalculatorState, ["0", "1/x"])
    const recovered = pressSequence(failed, ["CLx", "7"])

    expect(failed.latchedError?._tag).toBe("ReciprocalOfZeroError")
    expect(recovered.latchedError).toBeNull()
    expect(buildDisplay(recovered).mantissa).toBe("7.")
  })

  it("keeps x^y domain rules explicit", () => {
    const state = pressSequence(initialCalculatorState, ["0", "ENTER", "2", "x^y"])

    expect(state.latchedError?._tag).toBe("NonPositivePowerBaseError")
  })

  it("uses Y as the base and X as the exponent for x^y", () => {
    const state = pressSequence(initialCalculatorState, ["2", "ENTER", "3", "x^y"])

    expect(state.stack.x).toBe(8)
    expect(state.latchedError).toBeNull()
  })

  it("preserves stack behavior for a representative command sequence", () => {
    const state = pressSequence(initialCalculatorState, ["7", "ENTER", "8", "x⮂y"])

    expect(state.stack.x).toBe(7)
    expect(state.stack.y).toBe(8)
    expect(state.stackDepth).toBe(2)
  })
})
