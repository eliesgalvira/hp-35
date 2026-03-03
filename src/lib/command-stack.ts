"use client"

export interface CommandEntry {
  id: number
  text: string
}

export interface CommandStackState {
  buffer: string
  entriesNewestFirst: CommandEntry[]
  nextId: number
}

export const MAX_COMMAND_HISTORY = 50

export const createCommandStackState = (): CommandStackState => ({
  buffer: "",
  entriesNewestFirst: [],
  nextId: 1,
})

const DIGIT_KEYS = new Set(["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"])

const isDigitKey = (key: string) => DIGIT_KEYS.has(key)

const pushEntry = (state: CommandStackState, text: string): CommandStackState => ({
  ...state,
  entriesNewestFirst: [{ id: state.nextId, text }, ...state.entriesNewestFirst].slice(0, MAX_COMMAND_HISTORY),
  nextId: state.nextId + 1,
})

const commitBuffer = (state: CommandStackState): CommandStackState => {
  if (state.buffer === "") return state
  return {
    ...pushEntry(state, state.buffer),
    buffer: "",
  }
}

const toggleBufferSign = (buffer: string) => {
  if (buffer === "") return buffer
  if (buffer.startsWith("-")) return buffer.slice(1)
  return `-${buffer}`
}

export const applyKey = (state: CommandStackState, key: string): CommandStackState => {
  if (isDigitKey(key)) {
    if (state.buffer === "0") return { ...state, buffer: key }
    if (state.buffer === "-0") return { ...state, buffer: `-${key}` }
    return { ...state, buffer: `${state.buffer}${key}` }
  }

  if (key === ".") {
    if (state.buffer.includes(".")) return state
    if (state.buffer === "") return { ...state, buffer: "0." }
    if (state.buffer === "-") return { ...state, buffer: "-0." }
    return { ...state, buffer: `${state.buffer}.` }
  }

  if (key === "CHS") {
    if (state.buffer !== "") {
      return { ...state, buffer: toggleBufferSign(state.buffer) }
    }
    return pushEntry(state, "CHS")
  }

  const withCommittedBuffer = commitBuffer(state)
  return pushEntry(withCommittedBuffer, key)
}
