import { describe, expect, it } from "vitest"

import { challengeDeck } from "../challenge-data"
import {
  challengeModeReducer,
  createInitialChallengeMachineState,
} from "../challenge-mode-machine"

describe("challenge mode state machine", () => {
  it("starts in the gated start state", () => {
    expect(createInitialChallengeMachineState()).toMatchObject({
      selectedIndex: 0,
      hasStarted: false,
      phase: "start",
      attemptIndex: 0,
      flash: "idle",
    })
  })

  it("ignores stale calculator input when a challenge starts", () => {
    const started = challengeModeReducer(createInitialChallengeMachineState(), {
      type: "start",
      currentInputNonce: 8,
    })

    const unchanged = challengeModeReducer(started, {
      type: "input",
      token: "0",
      nonce: 8,
    })

    expect(unchanged).toEqual(started)
  })

  it("fails on a wrong key and resets cleanly on repeat", () => {
    const started = challengeModeReducer(createInitialChallengeMachineState(), {
      type: "start",
      currentInputNonce: 0,
    })

    const failed = challengeModeReducer(started, {
      type: "input",
      token: "0",
      nonce: 1,
    })

    expect(failed.phase).toBe("failed")
    expect(failed.flash).toBe("error")

    const repeated = challengeModeReducer(failed, {
      type: "repeat",
      currentInputNonce: 1,
    })

    expect(repeated.phase).toBe("active")
    expect(repeated.attemptIndex).toBe(0)
    expect(repeated.flash).toBe("idle")
    expect(repeated.lastHandledNonce).toBe(1)
  })

  it("marks a solved card as complete and advances the loop without showing start again", () => {
    let state = challengeModeReducer(createInitialChallengeMachineState(), {
      type: "start",
      currentInputNonce: 0,
    })

    for (const [index, token] of challengeDeck[0].steps.entries()) {
      state = challengeModeReducer(state, {
        type: "input",
        token,
        nonce: index + 1,
      })
    }

    expect(state.phase).toBe("success")
    expect(state.completedCards[challengeDeck[0].id]).toBe(true)
    expect(state.flash).toBe("success")

    const next = challengeModeReducer(state, {
      type: "scroll_to",
      index: 1,
    })

    expect(next.selectedIndex).toBe(1)
    expect(next.phase).toBe("active")
    expect(next.attemptIndex).toBe(0)
  })

  it("returns to the global start gate on end", () => {
    let active = challengeModeReducer(createInitialChallengeMachineState(), {
      type: "start",
      currentInputNonce: 4,
    })

    for (const [index, token] of challengeDeck[0].steps.entries()) {
      active = challengeModeReducer(active, {
        type: "input",
        token,
        nonce: index + 5,
      })
    }

    active = challengeModeReducer(active, {
      type: "scroll_to",
      index: 2,
    })

    const ended = challengeModeReducer(active, {
      type: "end",
      currentInputNonce: 99,
    })

    expect(ended.selectedIndex).toBe(0)
    expect(ended.hasStarted).toBe(false)
    expect(ended.phase).toBe("start")
    expect(ended.attemptIndex).toBe(0)
    expect(ended.completedCards).toEqual({})
  })
})
