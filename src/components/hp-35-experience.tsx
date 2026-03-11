"use client"

import { useCallback, useEffect, useReducer, useRef, useState } from "react"
import { challengeDeck } from "@/components/challenge-data"
import { ChallengeMode } from "@/components/challenge-mode"
import {
  challengeModeReducer,
  createInitialChallengeMachineState,
} from "@/components/challenge-mode-machine"
import HP35 from "@/components/hp-35"
import { RetroCommandStack, type StackRegisterRow } from "@/components/retro-command-stack"

const emptyRows: StackRegisterRow[] = [
  { label: "X", display: { sign: "", mantissa: "0.", showExponent: false, exponentSign: " ", exponent: "" }, empty: true },
  { label: "Y", display: { sign: "", mantissa: "0.", showExponent: false, exponentSign: " ", exponent: "" }, empty: true },
  { label: "Z", display: { sign: "", mantissa: "0.", showExponent: false, exponentSign: " ", exponent: "" }, empty: true },
  { label: "T", display: { sign: "", mantissa: "0.", showExponent: false, exponentSign: " ", exponent: "" }, empty: true },
]

export function HP35Experience() {
  const [rows, setRows] = useState<StackRegisterRow[]>(emptyRows)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [calculatorResetNonce, setCalculatorResetNonce] = useState(0)
  const [challengeState, dispatch] = useReducer(challengeModeReducer, undefined, createInitialChallengeMachineState)
  const inputNonceRef = useRef(0)

  const activeChallengeIndex = Number.isFinite(selectedIndex)
    ? Math.max(0, Math.min(selectedIndex, challengeDeck.length - 1))
    : 0
  const selectedChallenge = challengeDeck[activeChallengeIndex] ?? challengeDeck[0]

  useEffect(() => {
    if (challengeState.flash === "idle") return

    const timeout = window.setTimeout(() => {
      dispatch({ type: "clear_flash" })
    }, 650)

    return () => window.clearTimeout(timeout)
  }, [challengeState.flash, challengeState.flashNonce])

  const resetCalculator = () => {
    setRows(emptyRows)
    setCalculatorResetNonce((current) => current + 1)
  }

  const handleButtonPress = (token: string) => {
    inputNonceRef.current += 1
    dispatch({
      type: "input",
      token,
      nonce: inputNonceRef.current,
      challengeId: selectedChallenge.id,
      steps: selectedChallenge.steps,
    })
  }

  const handleSelectIndex = useCallback((index: number) => {
    if (!Number.isFinite(index)) return

    const nextIndex = Math.max(0, Math.min(index, challengeDeck.length - 1))
    if (nextIndex === activeChallengeIndex) return

    const nextChallenge = challengeDeck[nextIndex] ?? challengeDeck[0]

    setSelectedIndex(nextIndex)
    dispatch({ type: "select", challengeId: nextChallenge.id })
  }, [activeChallengeIndex])

  const handleChallengeStart = () => {
    resetCalculator()
    dispatch({
      type: "start",
      challengeId: selectedChallenge.id,
      currentInputNonce: inputNonceRef.current,
    })
  }

  const handleChallengeRepeat = () => {
    resetCalculator()
    dispatch({
      type: "repeat",
      challengeId: selectedChallenge.id,
      currentInputNonce: inputNonceRef.current,
    })
  }

  const handleChallengeEnd = () => {
    resetCalculator()
    setSelectedIndex(0)
    dispatch({ type: "end", currentInputNonce: inputNonceRef.current })
  }

  return (
    <div className="grid w-full max-w-[1320px] grid-cols-1 justify-items-center gap-6 md:gap-8 lg:grid-cols-[minmax(0,1fr)_320px_minmax(0,1fr)] lg:items-start">
      <ChallengeMode
        className="lg:w-[360px] lg:justify-self-end"
        selectedIndex={activeChallengeIndex}
        state={challengeState}
        onSelectIndex={handleSelectIndex}
        onStart={handleChallengeStart}
        onRepeat={handleChallengeRepeat}
        onEnd={handleChallengeEnd}
      />

      <div className="relative lg:justify-self-center">
        <div
          className="absolute left-[8%] right-[8%] h-6"
          style={{
            bottom: "-14px",
            background: "radial-gradient(ellipse at center, rgba(0,0,0,0.5) 0%, transparent 70%)",
            filter: "blur(10px)",
            zIndex: 0,
          }}
        />
        <HP35
          resetNonce={calculatorResetNonce}
          onStackChange={setRows}
          onButtonPress={handleButtonPress}
        />
      </div>

      <div className="w-full lg:w-[380px] lg:justify-self-start">
        <RetroCommandStack rows={rows} />
      </div>
    </div>
  )
}
