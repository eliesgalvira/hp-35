import { describe, expect, it, vi } from "vitest"
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { challengeDeck } from "../challenge-data"
import HP35 from "../hp-35"
import type { StackRegisterRow } from "../retro-command-stack"

const getDisplayParts = () => {
  const sign = screen.getByTestId("hp35-display-sign").textContent ?? ""
  const mantissa = screen.getByTestId("hp35-display-mantissa").textContent ?? ""
  const exponent = screen.getByTestId("hp35-display-exponent").textContent ?? ""
  return { sign, mantissa, exponent }
}

const displayNumber = () => {
  const { sign, mantissa, exponent } = getDisplayParts()
  const signValue = sign.includes("-") ? -1 : 1
  const mantissaValue = Number.parseFloat(mantissa)
  if (Number.isNaN(mantissaValue)) return NaN
  if (exponent.trim() === "") return signValue * mantissaValue
  const expDigitsMatch = exponent.match(/\d{2}/)
  const expDigits = expDigitsMatch ? Number(expDigitsMatch[0]) : 0
  const expSign = exponent.includes("-") ? -1 : 1
  return signValue * mantissaValue * Math.pow(10, expSign * expDigits)
}

const expectDisplay = (expected: { sign?: string; mantissa?: string; exponent?: string }) => {
  const parts = getDisplayParts()
  if (expected.sign !== undefined) expect(parts.sign).toBe(expected.sign)
  if (expected.mantissa !== undefined) expect(parts.mantissa.trimEnd()).toBe(expected.mantissa)
  if (expected.exponent !== undefined) expect(parts.exponent.trimEnd()).toBe(expected.exponent)
}

const expectFixedDisplay = () => {
  const { sign, mantissa, exponent } = getDisplayParts()
  expect(sign.length).toBe(1)
  expect([" ", "-"]).toContain(sign)
  expect(mantissa.length).toBe(11)
  expect((mantissa.match(/\./g) ?? []).length).toBe(1)
  expect(exponent.length).toBe(3)
  expect(sign.length + mantissa.length + exponent.length).toBe(15)
}

const expectImproperOperationDisplay = () => expectDisplay({ sign: " ", mantissa: "0.", exponent: "" })

const expectImproperOperationBlinking = (expected: boolean) => {
  expect(screen.getByTestId("hp35-display")).toHaveAttribute("data-improper-operation", expected ? "true" : "false")
}

const expectImproperOperationVisible = (expected: boolean) => {
  expect(screen.getByTestId("hp35-display")).toHaveAttribute("data-improper-operation-visible", expected ? "true" : "false")
}
const press = async (user: ReturnType<typeof userEvent.setup>, label: string) => {
  await user.click(screen.getByRole("button", { name: label }))
}

const pressSequence = async (user: ReturnType<typeof userEvent.setup>, labels: string[]) => {
  for (const label of labels) {
    await press(user, label)
  }
}

const labelForChallengeToken = (token: string) => {
  if (token === "ENTER") return "ENTER🡪"
  return token
}

const precisionForChallengeAnswer = (challengeId: string) => {
  if (challengeId === "celestial-fix") return 5
  return 8
}

const latestRows = (calls: StackRegisterRow[][]) => calls.at(-1) ?? []

const makeRow = (
  label: StackRegisterRow["label"],
  mantissa: string,
  empty: boolean,
  sign = "",
  showExponent = false,
  exponentSign = " ",
  exponent = "",
): StackRegisterRow => ({
  label,
  display: { sign, mantissa, showExponent, exponentSign, exponent },
  empty,
})

describe("HP-35 behavior", () => {
  it("starts with a zeroed display", () => {
    render(<HP35 />)
    expectDisplay({ sign: " ", mantissa: "0.", exponent: "" })
    expectFixedDisplay()
  })

  it("publishes live X/Y/Z/T register values instead of command history", async () => {
    const user = userEvent.setup()
    const onStackChangeCalls: StackRegisterRow[][] = []
    render(<HP35 onStackChange={(rows) => onStackChangeCalls.push(rows)} />)

    await press(user, "7")
    expect(latestRows(onStackChangeCalls)).toEqual([
      makeRow("X", "7.", false),
      makeRow("Y", "0.", true),
      makeRow("Z", "0.", true),
      makeRow("T", "0.", true),
    ])

    await press(user, "ENTER🡪")
    expect(latestRows(onStackChangeCalls)).toEqual([
      makeRow("X", "7.", false),
      makeRow("Y", "7.", false),
      makeRow("Z", "0.", true),
      makeRow("T", "0.", true),
    ])

    await press(user, "8")
    expect(latestRows(onStackChangeCalls)).toEqual([
      makeRow("X", "8.", false),
      makeRow("Y", "7.", false),
      makeRow("Z", "0.", true),
      makeRow("T", "0.", true),
    ])
  })

  it("updates the published stack registers for stack control operations", async () => {
    const user = userEvent.setup()
    const onStackChangeCalls: StackRegisterRow[][] = []
    render(<HP35 onStackChange={(rows) => onStackChangeCalls.push(rows)} />)

    await pressSequence(user, ["7", "ENTER🡪", "8", "x⮂y"])
    expect(latestRows(onStackChangeCalls)).toEqual([
      makeRow("X", "7.", false),
      makeRow("Y", "8.", false),
      makeRow("Z", "0.", true),
      makeRow("T", "0.", true),
    ])
  })

  it("publishes stack updates on mouse down", async () => {
    const onStackChangeCalls: StackRegisterRow[][] = []
    render(<HP35 onStackChange={(rows) => onStackChangeCalls.push(rows)} />)

    fireEvent.mouseDown(screen.getByRole("button", { name: "7" }))

    await waitFor(() =>
      expect(latestRows(onStackChangeCalls)).toEqual([
        makeRow("X", "7.", false),
        makeRow("Y", "0.", true),
        makeRow("Z", "0.", true),
        makeRow("T", "0.", true),
      ])
    )
  })

  it("enters digits left-justified with a trailing decimal", async () => {
    const user = userEvent.setup()
    render(<HP35 />)

    await pressSequence(user, ["1", "2"])
    expectDisplay({ sign: " ", mantissa: "12." })
    expectFixedDisplay()
  })

  it("keeps decimal placement during entry", async () => {
    const user = userEvent.setup()
    render(<HP35 />)

    await pressSequence(user, ["1", "2", ".", "3"])
    expectDisplay({ sign: " ", mantissa: "12.3" })
    expectFixedDisplay()
  })

  it("displays pi with 10 digits", async () => {
    const user = userEvent.setup()
    render(<HP35 />)

    await pressSequence(user, ["\u03C0"])
    expectDisplay({ sign: " ", mantissa: "3.141592654" })
    expectFixedDisplay()
  })

  it.each(challengeDeck)("executes the $title challenge to the documented answer", async (challenge) => {
    const user = userEvent.setup()
    render(<HP35 />)

    await pressSequence(user, challenge.steps.map(labelForChallengeToken))
    expect(displayNumber()).toBeCloseTo(Number(challenge.answer), precisionForChallengeAnswer(challenge.id))
  })

  it("uses X as base for x^y", async () => {
    const user = userEvent.setup()
    render(<HP35 />)

    await pressSequence(user, ["2", "ENTER\uD83E\uDC6A", "3", "x^y"])
    expect(displayNumber()).toBeCloseTo(9, 6)
  })

  it("uses degrees for trig functions", async () => {
    const user = userEvent.setup()
    render(<HP35 />)

    await pressSequence(user, ["3", "0", "sin"])
    expect(displayNumber()).toBeCloseTo(0.5, 6)
  })

  it("applies arc as a one-shot prefix returning degrees", async () => {
    const user = userEvent.setup()
    render(<HP35 />)

    await pressSequence(user, [".", "7", "arc", "sin"])
    expect(displayNumber()).toBeCloseTo((Math.asin(0.7) * 180) / Math.PI, 6)
  })

  it("shows exponent field on EEX and accepts two digits", async () => {
    const user = userEvent.setup()
    render(<HP35 />)

    await pressSequence(user, ["1", "EEX"])
    expect(getDisplayParts().exponent).toBe(" 00")
    await pressSequence(user, ["2"])
    expect(getDisplayParts().exponent).toBe(" 02")
    expect(displayNumber()).toBeCloseTo(100, 6)
    expectFixedDisplay()
  })

  it("renders exponent sign only when negative", async () => {
    const user = userEvent.setup()
    render(<HP35 />)

    await pressSequence(user, ["1", "EEX"])
    expect(getDisplayParts().exponent).toBe(" 00")
    await press(user, "CHS")
    expect(getDisplayParts().exponent).toBe("-00")
    expectFixedDisplay()
  })

  it("latches sign for the next entry after CHS", async () => {
    const user = userEvent.setup()
    render(<HP35 />)

    await pressSequence(user, ["5", "CHS", "1", "0"])
    expectDisplay({ sign: "-", mantissa: "10." })
    expectFixedDisplay()
  })

  it("clears all registers with CLR", async () => {
    const user = userEvent.setup()
    render(<HP35 />)

    await pressSequence(user, ["2", "ENTER\uD83E\uDC6A", "3", "CLR"])
    expectDisplay({ sign: " ", mantissa: "0.", exponent: "" })
    expectFixedDisplay()
  })

  it("swaps X and Y and always shows X", async () => {
    const user = userEvent.setup()
    render(<HP35 />)

    await pressSequence(user, ["2", "ENTER\uD83E\uDC6A", "3", "x\u2B82y"])
    expectDisplay({ sign: " ", mantissa: "2." })
    expectFixedDisplay()
  })

  it("rolls the stack down and shows new X", async () => {
    const user = userEvent.setup()
    render(<HP35 />)

    await pressSequence(user, ["1", "ENTER\uD83E\uDC6A", "2", "ENTER\uD83E\uDC6A", "3", "R\uD83E\uDC1F"])
    expectDisplay({ sign: " ", mantissa: "2." })
    expectFixedDisplay()
  })

  it("does not append digits after STO", async () => {
    const user = userEvent.setup()
    render(<HP35 />)

    await pressSequence(user, ["5", "STO", "0"])
    expectDisplay({ sign: " ", mantissa: "0." })
  })

  it("rolls down through populated stack registers", async () => {
    const user = userEvent.setup()
    render(<HP35 />)

    await pressSequence(user, [
      "1",
      "1",
      "0",
      "√x",
      "4",
      "5",
      "sin",
      ".",
      "7",
      "arc",
      "sin",
      "1",
      "0",
      "1/x",
    ])

    const sqrt110 = Math.sqrt(110)
    const sin45 = Math.sin((45 * Math.PI) / 180)
    const arcsin07 = (Math.asin(0.7) * 180) / Math.PI

    expect(displayNumber()).toBeCloseTo(0.1, 6)

    await press(user, "R🠟")
    expect(displayNumber()).toBeCloseTo(arcsin07, 6)

    await press(user, "R🠟")
    expect(displayNumber()).toBeCloseTo(sin45, 6)

    await press(user, "R🠟")
    expect(displayNumber()).toBeCloseTo(sqrt110, 6)

    await press(user, "R🠟")
    expect(displayNumber()).toBeCloseTo(0.1, 6)
  })

  it("latches improper operation on divide by zero until CLx", async () => {
    const user = userEvent.setup()
    render(<HP35 />)

    await pressSequence(user, ["3", "ENTER🡪", "0", "÷"])
    expectImproperOperationDisplay()
    expectImproperOperationBlinking(true)
    expectImproperOperationVisible(true)

    await press(user, "7")
    expectImproperOperationDisplay()
    expectImproperOperationBlinking(true)

    await pressSequence(user, ["CLx", "7"])
    expectDisplay({ sign: " ", mantissa: "7." })
    expectImproperOperationBlinking(false)
    expectImproperOperationVisible(true)
  })

  it("toggles the display visibility while improper operation is latched", async () => {
    vi.useFakeTimers()
    try {
      render(<HP35 />)

      fireEvent.mouseDown(screen.getByRole("button", { name: "3" }))
      fireEvent.mouseDown(screen.getByRole("button", { name: "ENTER🡪" }))
      fireEvent.mouseDown(screen.getByRole("button", { name: "0" }))
      fireEvent.mouseDown(screen.getByRole("button", { name: "÷" }))
      expectImproperOperationVisible(true)

      act(() => {
        vi.advanceTimersByTime(500)
      })
      expectImproperOperationVisible(false)

      act(() => {
        vi.advanceTimersByTime(500)
      })
      expectImproperOperationVisible(true)
    } finally {
      vi.useRealTimers()
    }
  })

  it("latches improper operation for 0 divided by 0", async () => {
    const user = userEvent.setup()
    render(<HP35 />)

    await pressSequence(user, ["0", "ENTER🡪", "0", "÷"])
    expectImproperOperationDisplay()
  })

  it("latches improper operation for reciprocal of zero and clears with CLx", async () => {
    const user = userEvent.setup()
    render(<HP35 />)

    await pressSequence(user, ["0", "1/x"])
    expectImproperOperationDisplay()

    await press(user, "CLx")
    expectDisplay({ sign: " ", mantissa: "0.", exponent: "" })
  })

  it("latches improper operation for square root of a negative number", async () => {
    const user = userEvent.setup()
    render(<HP35 />)

    await pressSequence(user, ["9", "CHS", "√x"])
    expectImproperOperationDisplay()
  })

  it("latches improper operation for log of zero", async () => {
    const user = userEvent.setup()
    render(<HP35 />)

    await pressSequence(user, ["0", "log"])
    expectImproperOperationDisplay()
  })

  it("latches improper operation for natural log of a negative number", async () => {
    const user = userEvent.setup()
    render(<HP35 />)

    await pressSequence(user, ["2", "CHS", "ln"])
    expectImproperOperationDisplay()
  })

  it("returns inverse sine in decimal degrees for valid ratios", async () => {
    const user = userEvent.setup()
    render(<HP35 />)

    await pressSequence(user, [".", "2", "arc", "sin"])
    expect(displayNumber()).toBeCloseTo((Math.asin(0.2) * 180) / Math.PI, 6)
  })

  it("returns inverse sine boundary values in decimal degrees", async () => {
    const user = userEvent.setup()
    render(<HP35 />)

    await pressSequence(user, ["1", "arc", "sin"])
    expect(displayNumber()).toBeCloseTo(90, 6)
  })

  it("returns inverse cosine boundary values in decimal degrees", async () => {
    const user = userEvent.setup()
    render(<HP35 />)

    await pressSequence(user, ["1", "CHS", "arc", "cos"])
    expect(displayNumber()).toBeCloseTo(180, 6)
  })

  it("latches improper operation for arc-sine outside the ratio interval", async () => {
    const user = userEvent.setup()
    render(<HP35 />)

    await pressSequence(user, ["9", "1", "arc", "sin"])
    expectImproperOperationDisplay()
  })

  it("latches improper operation for arc-cosine outside the ratio interval", async () => {
    const user = userEvent.setup()
    render(<HP35 />)

    await pressSequence(user, ["2", "CHS", "arc", "cos"])
    expectImproperOperationDisplay()
  })

  it("saturates e^x overflow to the maximum display value", async () => {
    const user = userEvent.setup()
    render(<HP35 />)

    await pressSequence(user, ["1", "EEX", "9", "9", "e^x"])
    expect(displayNumber()).toBeCloseTo(9.999999999e99, 90)
  })

  it("saturates x^y overflow to the maximum display value", async () => {
    const user = userEvent.setup()
    render(<HP35 />)

    await pressSequence(user, ["9", "ENTER🡪", "9", "EEX", "9", "9", "x^y"])
    expect(displayNumber()).toBeCloseTo(9.999999999e99, 90)
  })

  it("underflows tiny positive results to zero", async () => {
    const user = userEvent.setup()
    render(<HP35 />)

    await pressSequence(user, ["1", "EEX", "CHS", "9", "9", "ENTER🡪", "1", "0", "÷"])
    expectDisplay({ sign: " ", mantissa: "0.", exponent: "" })
  })

  it("latches improper operation for x^y with a nonpositive base", async () => {
    const user = userEvent.setup()
    render(<HP35 />)

    await pressSequence(user, ["2", "ENTER🡪", "0", "x^y"])
    expectImproperOperationDisplay()
  })

  it("keeps finite but large trig results representable instead of erroring", async () => {
    const user = userEvent.setup()
    render(<HP35 />)

    await pressSequence(user, ["9", "0", "tan"])
    expect(displayNumber()).toBeGreaterThan(1e10)
    expect(getDisplayParts().mantissa.trimEnd()).not.toBe("Error")
  })
})
