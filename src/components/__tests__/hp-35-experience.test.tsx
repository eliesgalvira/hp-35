import { describe, expect, it } from "vitest"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"

import { challengeDeck } from "../challenge-data"
import { HP35Experience } from "../hp-35-experience"

const getDisplayParts = (prefix: string) => {
  const sign = screen.getByTestId(`${prefix}-sign`).textContent ?? ""
  const mantissa = screen.getByTestId(`${prefix}-mantissa`).textContent ?? ""
  const exponent = screen.getByTestId(`${prefix}-exponent`).textContent ?? ""

  return { sign, mantissa, exponent }
}

const toButtonName = (token: string) => {
  switch (token) {
    case "ENTER":
      return "ENTER🡪"
    default:
      return token
  }
}

describe("HP35Experience integration", () => {
  it("keeps the stack X register exactly in sync with the calculator display before challenge mode starts", async () => {
    const user = userEvent.setup()
    render(<HP35Experience />)

    expect(screen.getByTestId("challenge-start")).toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "5" }))
    await user.click(screen.getByRole("button", { name: "5" }))
    await user.click(screen.getByRole("button", { name: "7" }))

    await waitFor(() =>
      expect(getDisplayParts("stack-display-x")).toEqual(getDisplayParts("hp35-display"))
    )
  })

  it("clears the calculator and stack when challenge mode starts", async () => {
    const user = userEvent.setup()
    render(<HP35Experience />)

    await user.click(screen.getByRole("button", { name: "5" }))
    await user.click(screen.getByRole("button", { name: "5" }))
    await user.click(screen.getByRole("button", { name: "7" }))
    await user.click(screen.getByTestId("challenge-start"))

    await waitFor(() => {
      expect(getDisplayParts("hp35-display")).toEqual({ sign: " ", mantissa: "0.         ", exponent: "   " })
      expect(getDisplayParts("stack-display-x")).toEqual({ sign: " ", mantissa: ".          ", exponent: "   " })
    })
  })

  it("clears the calculator and stack when repeating a failed challenge", async () => {
    const user = userEvent.setup()
    render(<HP35Experience />)

    await user.click(screen.getByTestId("challenge-start"))
    await user.click(screen.getByRole("button", { name: "5" }))
    await user.click(screen.getByRole("button", { name: "5" }))
    await user.click(screen.getByRole("button", { name: "7" }))
    await user.click(screen.getByRole("button", { name: "0" }))
    await user.click(screen.getByTestId("challenge-repeat"))

    await waitFor(() => {
      expect(getDisplayParts("hp35-display")).toEqual({ sign: " ", mantissa: "0.         ", exponent: "   " })
      expect(getDisplayParts("stack-display-x")).toEqual({ sign: " ", mantissa: ".          ", exponent: "   " })
    })
  })

  it("returns to the first challenge when ending a failed run", async () => {
    const user = userEvent.setup()
    render(<HP35Experience />)

    await user.click(screen.getByTestId("challenge-start"))
    await user.click(screen.getByRole("button", { name: "3" }))
    await user.click(screen.getByRole("button", { name: "ENTER🡪" }))
    await user.click(screen.getByRole("button", { name: "4" }))

    for (const token of challengeDeck[0].steps.slice(3)) {
      await user.click(screen.getByRole("button", { name: toButtonName(token) }))
    }

    await user.click(screen.getByRole("button", { name: "Next slide" }))
    await waitFor(() => expect(screen.getByText("02 / 06")).toBeInTheDocument())

    await user.click(screen.getByRole("button", { name: "0" }))
    await waitFor(() => expect(screen.getByTestId("challenge-end")).toBeInTheDocument())
    await user.click(screen.getByTestId("challenge-end"))

    await waitFor(() => {
      expect(screen.getByText("01 / 06")).toBeInTheDocument()
      expect(screen.getByTestId("challenge-start")).toBeInTheDocument()
    })
  })

  it("registers the first calculator click immediately after starting a challenge", async () => {
    const user = userEvent.setup()
    render(<HP35Experience />)

    await user.click(screen.getByTestId("challenge-start"))
    await user.click(screen.getByRole("button", { name: "3" }))

    await waitFor(() => {
      expect(getDisplayParts("hp35-display")).toEqual({ sign: " ", mantissa: "3.         ", exponent: "   " })
      expect(screen.queryByTestId("challenge-repeat")).not.toBeInTheDocument()
      expect(screen.getByText("1 / 14")).toBeInTheDocument()
    })
  })

  it("registers the first calculator click immediately after repeating a failed challenge", async () => {
    const user = userEvent.setup()
    render(<HP35Experience />)

    await user.click(screen.getByTestId("challenge-start"))
    await user.click(screen.getByRole("button", { name: "0" }))
    await waitFor(() => expect(screen.getByTestId("challenge-repeat")).toBeInTheDocument())
    await user.click(screen.getByTestId("challenge-repeat"))
    await user.click(screen.getByRole("button", { name: "3" }))

    await waitFor(() => {
      expect(getDisplayParts("hp35-display")).toEqual({ sign: " ", mantissa: "3.         ", exponent: "   " })
      expect(screen.queryByTestId("challenge-repeat")).not.toBeInTheDocument()
      expect(screen.getByText("1 / 14")).toBeInTheDocument()
    })
  })
})
