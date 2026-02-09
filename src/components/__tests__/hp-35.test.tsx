import { describe, expect, it } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import HP35 from "../hp-35"

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
  if (expected.mantissa !== undefined) expect(parts.mantissa).toBe(expected.mantissa)
  if (expected.exponent !== undefined) expect(parts.exponent).toBe(expected.exponent)
}

const press = async (user: ReturnType<typeof userEvent.setup>, label: string) => {
  await user.click(screen.getByRole("button", { name: label }))
}

const pressSequence = async (user: ReturnType<typeof userEvent.setup>, labels: string[]) => {
  for (const label of labels) {
    await press(user, label)
  }
}

describe("HP-35 behavior", () => {
  it("starts with a zeroed display", () => {
    render(<HP35 />)
    expectDisplay({ sign: " ", mantissa: "0.", exponent: "" })
  })

  it("enters digits left-justified with a trailing decimal", async () => {
    const user = userEvent.setup()
    render(<HP35 />)

    await pressSequence(user, ["1", "2"])
    expectDisplay({ sign: " ", mantissa: "12." })
  })

  it("keeps decimal placement during entry", async () => {
    const user = userEvent.setup()
    render(<HP35 />)

    await pressSequence(user, ["1", "2", ".", "3"])
    expectDisplay({ sign: " ", mantissa: "12.3" })
  })

  it("displays pi with 10 digits", async () => {
    const user = userEvent.setup()
    render(<HP35 />)

    await pressSequence(user, ["\u03C0"])
    expectDisplay({ sign: " ", mantissa: "3.141592654" })
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
    expect(getDisplayParts().exponent.trim()).toBe("00")
    await pressSequence(user, ["2"])
    expect(getDisplayParts().exponent.trim()).toBe("02")
    expect(displayNumber()).toBeCloseTo(100, 6)
  })

  it("latches sign for the next entry after CHS", async () => {
    const user = userEvent.setup()
    render(<HP35 />)

    await pressSequence(user, ["5", "CHS", "1", "0"])
    expectDisplay({ sign: "-", mantissa: "10." })
  })

  it("clears all registers with CLR", async () => {
    const user = userEvent.setup()
    render(<HP35 />)

    await pressSequence(user, ["2", "ENTER\uD83E\uDC6A", "3", "CLR"])
    expectDisplay({ sign: " ", mantissa: "0.", exponent: "" })
  })

  it("swaps X and Y and always shows X", async () => {
    const user = userEvent.setup()
    render(<HP35 />)

    await pressSequence(user, ["2", "ENTER\uD83E\uDC6A", "3", "x\u2B82y"])
    expectDisplay({ sign: " ", mantissa: "2." })
  })

  it("rolls the stack down and shows new X", async () => {
    const user = userEvent.setup()
    render(<HP35 />)

    await pressSequence(user, ["1", "ENTER\uD83E\uDC6A", "2", "ENTER\uD83E\uDC6A", "3", "R\uD83E\uDC1F"])
    expectDisplay({ sign: " ", mantissa: "2." })
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
})
