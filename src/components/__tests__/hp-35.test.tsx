import { describe, expect, it } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import HP35 from "../hp-35"

const getDisplay = () => screen.getByTestId("hp35-display")
const displayNumber = () => Number(getDisplay().textContent ?? "NaN")

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
    expect(getDisplay()).toHaveTextContent("0")
  })

  it("enters digits and decimals in entry mode", async () => {
    const user = userEvent.setup()
    render(<HP35 />)

    await pressSequence(user, ["1", "2", "3", ".", "4"])
    expect(getDisplay()).toHaveTextContent("123.4")
  })

  it("uses RPN entry: 3 ENTER 4 + -> 7", async () => {
    const user = userEvent.setup()
    render(<HP35 />)

    await pressSequence(user, ["3", "ENTER ↑", "4", "+"])
    expect(displayNumber()).toBeCloseTo(7, 6)
  })

  it("shifts the stack after binary operations", async () => {
    const user = userEvent.setup()
    render(<HP35 />)

    await pressSequence(user, ["3", "ENTER ↑", "4", "ENTER ↑", "5", "+", "+"])
    expect(displayNumber()).toBeCloseTo(12, 6)
  })

  it("keeps Y intact for unary operations", async () => {
    const user = userEvent.setup()
    render(<HP35 />)

    await pressSequence(user, ["9", "ENTER ↑", "2", "√x", "+"])
    expect(displayNumber()).toBeCloseTo(9 + Math.sqrt(2), 6)
  })

  it("swaps X and Y with x↔y", async () => {
    const user = userEvent.setup()
    render(<HP35 />)

    await pressSequence(user, ["3", "ENTER ↑", "4", "x↔y", "+"])
    expect(displayNumber()).toBeCloseTo(7, 6)
  })

  it("clears only X with CLx", async () => {
    const user = userEvent.setup()
    render(<HP35 />)

    await pressSequence(user, ["3", "ENTER ↑", "4", "CLx", "+"])
    expect(displayNumber()).toBeCloseTo(3, 6)
  })

  it("clears all registers with CLR", async () => {
    const user = userEvent.setup()
    render(<HP35 />)

    await pressSequence(user, ["2", "ENTER ↑", "3", "CLR"])
    expect(getDisplay()).toHaveTextContent("0")
  })

  it("stores and recalls memory", async () => {
    const user = userEvent.setup()
    render(<HP35 />)

    await pressSequence(user, ["8", "STO", "CLR", "RCL"])
    expect(displayNumber()).toBeCloseTo(8, 6)
  })

  it("toggles sign with CHS", async () => {
    const user = userEvent.setup()
    render(<HP35 />)

    await pressSequence(user, ["5", "CHS"])
    expect(getDisplay()).toHaveTextContent("-5")
  })

  it("builds scientific notation with EEX", async () => {
    const user = userEvent.setup()
    render(<HP35 />)

    await pressSequence(user, ["1", "EEX", "2"])
    expect(getDisplay()).toHaveTextContent("e2")
    expect(displayNumber()).toBeCloseTo(100, 6)
  })

  it("applies arc only to the next trig function", async () => {
    const user = userEvent.setup()
    render(<HP35 />)

    await pressSequence(user, ["1", "arc", "sin"])
    const first = displayNumber()
    await pressSequence(user, ["sin"])
    const second = displayNumber()

    expect(first).toBeCloseTo(Math.asin(1), 6)
    expect(second).toBeCloseTo(Math.sin(Math.asin(1)), 6)
  })

  it("rolls the stack down with R↓", async () => {
    const user = userEvent.setup()
    render(<HP35 />)

    await pressSequence(user, ["1", "ENTER ↑", "2", "ENTER ↑", "3", "R↓", "+"])
    expect(displayNumber()).toBeCloseTo(3, 6)
  })
})
