import { describe, expect, it } from "vitest"
import { applyKey, createCommandStackState } from "../command-stack"

const applyKeys = (keys: string[]) => keys.reduce((state, key) => applyKey(state, key), createCommandStackState())

describe("command stack reducer", () => {
  it("groups digits into a single committed number before an operator", () => {
    const state = applyKeys(["1", "2", ".", "3", "+"])

    expect(state.buffer).toBe("")
    expect(state.entriesNewestFirst.map((entry) => entry.text)).toEqual(["+", "12.3"])
  })

  it("commits a buffered number before ENTER", () => {
    const state = applyKeys(["4", "2", "ENTER"])

    expect(state.entriesNewestFirst.map((entry) => entry.text)).toEqual(["ENTER", "42"])
  })

  it("toggles CHS within the buffer instead of emitting a command entry", () => {
    const state = applyKeys(["1", "2", "CHS", "3", "÷"])

    expect(state.entriesNewestFirst.map((entry) => entry.text)).toEqual(["÷", "-123"])
  })

  it("emits CHS as a command when there is no active number buffer", () => {
    const state = applyKeys(["CHS"])

    expect(state.entriesNewestFirst.map((entry) => entry.text)).toEqual(["CHS"])
  })

  it("starts decimals as 0. and prevents duplicate decimal points", () => {
    const state = applyKeys([".", "5", ".", "sin"])

    expect(state.entriesNewestFirst.map((entry) => entry.text)).toEqual(["sin", "0.5"])
  })

  it("commits the buffer before a non-digit command like pi", () => {
    const state = applyKeys(["7", "π"])

    expect(state.entriesNewestFirst.map((entry) => entry.text)).toEqual(["π", "7"])
  })

  it("keeps at most 50 history entries internally", () => {
    let state = createCommandStackState()
    for (let index = 0; index < 60; index += 1) {
      state = applyKey(state, String(index % 10))
      state = applyKey(state, "+")
    }

    expect(state.entriesNewestFirst).toHaveLength(50)
  })
})
