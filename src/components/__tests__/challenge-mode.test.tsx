import { beforeAll, describe, expect, it, vi } from "vitest"
import { fireEvent, render, screen } from "@testing-library/react"

import { challengeDeck } from "../challenge-data"
import { ChallengeMode } from "../challenge-mode"
import { createInitialChallengeMachineState } from "../challenge-mode-machine"

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
    render(
      <ChallengeMode
        selectedIndex={0}
        state={createInitialChallengeMachineState()}
        failureFeedback={null}
        onSelectIndex={vi.fn()}
        onStart={vi.fn()}
        onRepeat={vi.fn()}
        onEnd={vi.fn()}
      />
    )

    expect(screen.getByText("Challenge Mode")).toBeInTheDocument()
    expect(screen.getByText(challengeDeck[0].expression)).toBeInTheDocument()
    expect(screen.getByTestId("challenge-start")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Previous slide" })).toBeDisabled()
    expect(screen.getByRole("button", { name: "Next slide" })).toBeDisabled()
  })

  it("shows the wrong and expected keys in the failure feedback overlay", () => {
    render(
      <ChallengeMode
        selectedIndex={0}
        state={{
          ...createInitialChallengeMachineState(),
          hasStarted: true,
          phase: "failed",
          flash: "error",
          flashNonce: 1,
        }}
        failureFeedback={{
          challengeId: challengeDeck[0].id,
          pressed: "0",
          expected: "3",
        }}
        onSelectIndex={vi.fn()}
        onStart={vi.fn()}
        onRepeat={vi.fn()}
        onEnd={vi.fn()}
      />
    )

    expect(screen.getByTestId("challenge-failure-feedback")).toBeInTheDocument()
    expect(screen.getByTestId("challenge-failure-actions")).toBeInTheDocument()
    expect(screen.getByTestId("challenge-failure-pressed")).toHaveTextContent("0")
    expect(screen.getByTestId("challenge-failure-expected")).toHaveTextContent("3")
    expect(screen.getByRole("button", { name: "Next slide" })).toBeDisabled()
  })

  it("flips the solved card and allows moving to the next slide", async () => {
    const onSelectIndex = vi.fn()

    render(
      <ChallengeMode
        selectedIndex={0}
        state={{
          ...createInitialChallengeMachineState(),
          hasStarted: true,
          phase: "success",
          attemptIndex: challengeDeck[0].steps.length,
          completedCards: { [challengeDeck[0].id]: true },
          flash: "success",
          flashNonce: 1,
        }}
        failureFeedback={null}
        onSelectIndex={onSelectIndex}
        onStart={vi.fn()}
        onRepeat={vi.fn()}
        onEnd={vi.fn()}
      />
    )

    expect(screen.getByTestId(`challenge-card-${challengeDeck[0].id}`)).toHaveAttribute("data-flipped", "true")
    expect(screen.getByRole("button", { name: "Next slide" })).toBeEnabled()

    fireEvent.click(screen.getByRole("button", { name: "Next slide" }))

    expect(onSelectIndex).toHaveBeenCalledWith(1)
  })
})
