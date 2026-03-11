"use client"

export type ChallengePhase = "start" | "active" | "failed" | "success"
export type ChallengeFlash = "idle" | "success" | "error"

export interface ChallengeMachineState {
  hasStarted: boolean
  phase: ChallengePhase
  attemptIndex: number
  completedCards: Record<string, boolean>
  lastHandledNonce: number
  flash: ChallengeFlash
  flashNonce: number
}

export type ChallengeMachineAction =
  | { type: "start"; challengeId: string; currentInputNonce?: number }
  | { type: "repeat"; challengeId: string; currentInputNonce?: number }
  | { type: "end"; currentInputNonce?: number }
  | { type: "input"; challengeId: string; steps: string[]; token: string; nonce: number }
  | { type: "select"; challengeId: string }
  | { type: "clear_flash" }

const getChallengePhase = (hasStarted: boolean, completed: boolean): ChallengePhase =>
  completed ? "success" : hasStarted ? "active" : "start"

const getLastHandledNonce = (state: ChallengeMachineState, currentInputNonce?: number) =>
  Math.max(state.lastHandledNonce, currentInputNonce ?? state.lastHandledNonce)

export const createInitialChallengeMachineState = (): ChallengeMachineState => ({
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
      return {
        ...state,
        hasStarted: true,
        phase: getChallengePhase(true, Boolean(state.completedCards[action.challengeId])),
        attemptIndex: 0,
        lastHandledNonce: getLastHandledNonce(state, action.currentInputNonce),
        flash: "idle",
      }
    }

    case "end":
      return {
        ...state,
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

      const expectedToken = action.steps[state.attemptIndex]

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

      if (nextAttemptIndex >= action.steps.length) {
        return {
          ...state,
          phase: "success",
          attemptIndex: nextAttemptIndex,
          completedCards: {
            ...state.completedCards,
            [action.challengeId]: true,
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

    case "select":
      return {
        ...state,
        attemptIndex: 0,
        phase: getChallengePhase(state.hasStarted, Boolean(state.completedCards[action.challengeId])),
        flash: "idle",
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
