import { beforeAll, describe, expect, it, vi } from "vitest"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"

import { challengeDeck } from "../challenge-data"
import { ChallengeMode, type ChallengeInputEvent } from "../challenge-mode"

class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}

class IntersectionObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords() {
    return []
  }
}

beforeAll(() => {
  if (!window.matchMedia) {
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    })
  }

  if (!globalThis.ResizeObserver) {
    vi.stubGlobal("ResizeObserver", ResizeObserverMock)
  }

  if (!globalThis.IntersectionObserver) {
    vi.stubGlobal("IntersectionObserver", IntersectionObserverMock)
  }

  if (!HTMLElement.prototype.scrollTo) {
    Object.defineProperty(HTMLElement.prototype, "scrollTo", {
      configurable: true,
      value: vi.fn(),
    })
  }

  vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(
    () =>
      ({
        x: 0,
        y: 0,
        top: 0,
        left: 0,
        bottom: 420,
        right: 320,
        width: 320,
        height: 420,
        toJSON: () => "",
      }) as DOMRect
  )
  vi.spyOn(HTMLElement.prototype, "offsetWidth", "get").mockReturnValue(320)
  vi.spyOn(HTMLElement.prototype, "offsetHeight", "get").mockReturnValue(420)
  vi.spyOn(HTMLElement.prototype, "clientWidth", "get").mockReturnValue(320)
  vi.spyOn(HTMLElement.prototype, "clientHeight", "get").mockReturnValue(420)
})

describe("Challenge mode", () => {
  it("renders in start mode with navigation locked", () => {
    render(<ChallengeMode />)

    expect(screen.getByText("Challenge Mode")).toBeInTheDocument()
    expect(screen.getByText(challengeDeck[0].expression)).toBeInTheDocument()
    expect(screen.getByTestId("challenge-start")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Previous slide" })).toBeDisabled()
    expect(screen.getByRole("button", { name: "Next slide" })).toBeDisabled()
  })

  it("shows repeat and end controls after a wrong keypress", async () => {
    const user = userEvent.setup()
    let input: ChallengeInputEvent | null = null
    const { rerender } = render(<ChallengeMode calculatorInput={input} />)

    const send = (token: string) => {
      input = { token, nonce: (input?.nonce ?? 0) + 1 }
      rerender(<ChallengeMode calculatorInput={input} />)
    }

    await user.click(screen.getByTestId("challenge-start"))
    send("0")

    expect(screen.getByTestId("challenge-repeat")).toBeInTheDocument()
    expect(screen.getByTestId("challenge-end")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Next slide" })).toBeDisabled()

    await user.click(screen.getByTestId("challenge-end"))
    expect(screen.getByTestId("challenge-start")).toBeInTheDocument()
    expect(screen.getByText("01 / 06")).toBeInTheDocument()

    await user.click(screen.getByTestId("challenge-start"))
    send("0")
    await user.click(screen.getByTestId("challenge-repeat"))
    await waitFor(() => expect(screen.queryByTestId("challenge-repeat")).not.toBeInTheDocument())
  })

  it("flips the solved card and unlocks the next slide", async () => {
    const user = userEvent.setup()
    let input: ChallengeInputEvent | null = null
    const { rerender } = render(<ChallengeMode calculatorInput={input} />)

    const send = (token: string) => {
      input = { token, nonce: (input?.nonce ?? 0) + 1 }
      rerender(<ChallengeMode calculatorInput={input} />)
    }

    await user.click(screen.getByTestId("challenge-start"))

    for (const token of challengeDeck[0].steps) {
      send(token)
    }

    await waitFor(() =>
      expect(screen.getByTestId(`challenge-card-${challengeDeck[0].id}`)).toHaveAttribute("data-flipped", "true")
    )
    expect(screen.getByRole("button", { name: "Next slide" })).toBeEnabled()

    await user.click(screen.getByRole("button", { name: "Next slide" }))
    await waitFor(() => expect(screen.getByText("02 / 06")).toBeInTheDocument())
    expect(screen.queryByTestId("challenge-start")).not.toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Next slide" })).toBeDisabled()
  })
})
