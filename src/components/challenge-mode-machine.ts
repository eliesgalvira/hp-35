"use client"

import { challengeDeck } from "@/components/challenge-data"

export type ChallengePhase = "start" | "active" | "failed" | "success"
export type ChallengeFlash = "idle" | "success" | "error"

export interface ChallengeMachineState {
  selectedIndex: number
  hasStarted: boolean
  phase: ChallengePhase
  attemptIndex: number
  completedCards: Record<string, boolean>
  lastHandledNonce: number
  flash: ChallengeFlash
  flashNonce: number
}

export type ChallengeMachineAction =
  | { type: "start"; currentInputNonce?: number }
  | { type: "repeat"; currentInputNonce?: number }
  | { type: "end"; currentInputNonce?: number }
  | { type: "input"; token: string; nonce: number }
  | { type: "scroll_to"; index: number }
  | { type: "sync_index"; index: number }
  | { type: "clear_flash" }

const getChallengeAtIndex = (index: number) => challengeDeck[Math.max(0, Math.min(index, challengeDeck.length - 1))] ?? challengeDeck[0]

const getSelectedChallenge = (state: ChallengeMachineState) => getChallengeAtIndex(state.selectedIndex)

const getChallengePhase = (hasStarted: boolean, completed: boolean): ChallengePhase =>
  completed ? "success" : hasStarted ? "active" : "start"

const getLastHandledNonce = (state: ChallengeMachineState, currentInputNonce?: number) =>
  Math.max(state.lastHandledNonce, currentInputNonce ?? state.lastHandledNonce)

export const createInitialChallengeMachineState = (): ChallengeMachineState => ({
  selectedIndex: 0,
  hasStarted: false,
  phase: "start",
  attemptIndex: 0,
  completedCards: {},
  lastHandledNonce: 0,
  flash: "idle",
  flashNonce: 0,
})

export function challengeModeReducer(
  state: ChallengeMachineState,
  action: ChallengeMachineAction,
): ChallengeMachineState {
  switch (action.type) {
    case "start":
    case "repeat": {
      const selectedChallenge = getSelectedChallenge(state)

      return {
        ...state,
        hasStarted: true,
        phase: getChallengePhase(true, Boolean(state.completedCards[selectedChallenge.id])),
        attemptIndex: 0,
        lastHandledNonce: getLastHandledNonce(state, action.currentInputNonce),
        flash: "idle",
      }
    }

    case "end":
      return {
        ...state,
        selectedIndex: 0,
        hasStarted: false,
        phase: "start",
        attemptIndex: 0,
        completedCards: {},
        lastHandledNonce: getLastHandledNonce(state, action.currentInputNonce),
        flash: "idle",
      }

    case "input": {
      if (state.phase !== "active" || action.nonce <= state.lastHandledNonce) {
        return state
      }

      const selectedChallenge = getSelectedChallenge(state)
      const expectedToken = selectedChallenge.steps[state.attemptIndex]

      if (!expectedToken) {
        return {
          ...state,
          lastHandledNonce: action.nonce,
        }
      }

      if (action.token !== expectedToken) {
        return {
          ...state,
          phase: "failed",
          lastHandledNonce: action.nonce,
          flash: "error",
          flashNonce: state.flashNonce + 1,
        }
      }

      const nextAttemptIndex = state.attemptIndex + 1

      if (nextAttemptIndex >= selectedChallenge.steps.length) {
        return {
          ...state,
          phase: "success",
          attemptIndex: nextAttemptIndex,
          completedCards: {
            ...state.completedCards,
            [selectedChallenge.id]: true,
          },
          lastHandledNonce: action.nonce,
          flash: "success",
          flashNonce: state.flashNonce + 1,
        }
      }

      return {
        ...state,
        attemptIndex: nextAttemptIndex,
        lastHandledNonce: action.nonce,
      }
    }

    case "scroll_to":
    case "sync_index": {
      if (state.phase !== "success") {
        return state
      }

      const nextIndex = Math.max(0, Math.min(action.index, challengeDeck.length - 1))
      const nextChallenge = getChallengeAtIndex(nextIndex)

      return {
        ...state,
        selectedIndex: nextIndex,
        attemptIndex: 0,
        phase: getChallengePhase(state.hasStarted, Boolean(state.completedCards[nextChallenge.id])),
        flash: "idle",
      }
    }

    case "clear_flash":
      if (state.flash === "idle") return state
      return {
        ...state,
        flash: "idle",
      }

    default:
      return state
  }
}
