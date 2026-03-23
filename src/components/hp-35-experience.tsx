"use client"

import { AnimatePresence, LayoutGroup, motion } from "framer-motion"
import { useCallback, useEffect, useReducer, useRef, useState } from "react"
import { Telescope } from "lucide-react"
import { challengeDeck } from "@/components/challenge-data"
import { ChallengeMode, type ChallengeFailureFeedback } from "@/components/challenge-mode"
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
  const [challengeModeEnabled, setChallengeModeEnabled] = useState(false)
  const [calculatorResetNonce, setCalculatorResetNonce] = useState(0)
  const [clearXNonce, setClearXNonce] = useState(0)
  const [failureFeedback, setFailureFeedback] = useState<ChallengeFailureFeedback | null>(null)
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
    if (challengeState.phase === "active") {
      const expected = selectedChallenge.steps[challengeState.attemptIndex]
      if (expected && token !== expected) {
        setFailureFeedback({
          challengeId: selectedChallenge.id,
          pressed: token,
          expected,
        })
      }
    }

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

    setFailureFeedback(null)
    setClearXNonce((current) => current + 1)
    setSelectedIndex(nextIndex)
    dispatch({ type: "select", challengeId: nextChallenge.id })
  }, [activeChallengeIndex])

  const handleChallengeStart = () => {
    resetCalculator()
    setFailureFeedback(null)
    dispatch({
      type: "start",
      challengeId: selectedChallenge.id,
      currentInputNonce: inputNonceRef.current,
    })
  }

  const handleChallengeRepeat = () => {
    resetCalculator()
    setFailureFeedback(null)
    dispatch({
      type: "repeat",
      challengeId: selectedChallenge.id,
      currentInputNonce: inputNonceRef.current,
    })
  }

  const handleChallengeEnd = () => {
    resetCalculator()
    setFailureFeedback(null)
    setSelectedIndex(0)
    dispatch({ type: "end", currentInputNonce: inputNonceRef.current })
  }

  const handleChallengeDisable = () => {
    handleChallengeEnd()
    setChallengeModeEnabled(false)
  }

  const challengeShellTransition = {
    duration: 0.58,
    ease: [0.22, 1, 0.36, 1] as const,
  }

  const challengeShellEnterTransition = {
    duration: 0.45,
    ease: [0.22, 1, 0.36, 1] as const,
  }

  const mobileReflowTransition = {
    duration: 0.58,
    ease: [0.22, 1, 0.36, 1] as const,
  }

  return (
    <LayoutGroup>
      <motion.div
        layout
        transition={mobileReflowTransition}
        className="grid w-full max-w-[1320px] grid-cols-1 justify-items-center gap-6 md:gap-8 lg:grid-cols-[minmax(0,1fr)_320px_minmax(0,1fr)] lg:items-start"
      >
        <motion.div layout transition={mobileReflowTransition} className="w-full max-w-[360px] shrink-0 lg:justify-self-end">
          <motion.div layout transition={challengeShellTransition} className="relative w-full">
            <AnimatePresence initial={false} mode="wait">
            {challengeModeEnabled ? (
              <motion.div
                key="challenge-mode-expanded"
                layout
                initial={{ opacity: 0, y: -18, scale: 0.98, filter: "blur(12px)" }}
                animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
                exit={{ opacity: 0, y: -18, scale: 0.98, filter: "blur(12px)" }}
                transition={{
                  layout: challengeShellTransition,
                  opacity: challengeShellEnterTransition,
                  y: challengeShellEnterTransition,
                  scale: challengeShellEnterTransition,
                  filter: challengeShellEnterTransition,
                }}
                className="w-full"
              >
                <ChallengeMode
                  className="w-full"
                  selectedIndex={activeChallengeIndex}
                  state={challengeState}
                  failureFeedback={failureFeedback}
                  onSelectIndex={handleSelectIndex}
                  onStart={handleChallengeStart}
                  onRepeat={handleChallengeRepeat}
                  onEnd={handleChallengeEnd}
                  onDisable={handleChallengeDisable}
                />
              </motion.div>
            ) : (
              <motion.button
                key="challenge-mode-collapsed"
                layout
                type="button"
                data-testid="challenge-enable"
                initial={{ opacity: 0, y: -10, scale: 0.96, filter: "blur(10px)" }}
                animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
                exit={{ opacity: 0, y: -10, scale: 0.96, filter: "blur(10px)" }}
                transition={{
                  layout: challengeShellTransition,
                  opacity: challengeShellEnterTransition,
                  y: challengeShellEnterTransition,
                  scale: challengeShellEnterTransition,
                  filter: challengeShellEnterTransition,
                }}
                whileTap={{ scale: 0.985 }}
                onClick={() => setChallengeModeEnabled(true)}
                className="group relative flex w-full items-center justify-between gap-4 overflow-hidden rounded-[18px] border border-[#5b2617] bg-[#140807] px-5 py-4 text-left shadow-[0_0_20px_rgba(255,80,30,0.08),inset_0_1px_0_rgba(255,212,160,0.08),inset_0_-12px_20px_rgba(0,0,0,0.45)] transition-colors duration-200 hover:border-[#7a3926] hover:bg-[#190908]"
                style={{
                  backgroundImage: [
                    "radial-gradient(circle at 18% 0%, rgba(145,58,31,0.35), transparent 35%)",
                    "linear-gradient(180deg, rgba(35,11,8,0.98) 0%, rgba(15,5,4,0.98) 100%)",
                  ].join(","),
                }}
              >
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 opacity-35"
                  style={{
                    backgroundImage:
                      "repeating-linear-gradient(180deg, rgba(255,147,96,0.08) 0px, rgba(255,147,96,0.08) 1px, transparent 1px, transparent 8px)",
                  }}
                />
                <div className="pointer-events-none absolute inset-[1px] rounded-[17px] shadow-[inset_0_0_42px_rgba(0,0,0,0.48)]" />
                <div className="relative flex min-w-0 flex-col">
                  <span className="flex items-center gap-2 text-[10px] uppercase tracking-[0.38em] text-[#c9a78c]/78">
                    <Telescope className="size-3.5" />
                    Challenge Mode
                  </span>
                  <span className="mt-2 text-[1rem] font-medium tracking-[0.04em] text-[#f0d3b6]">
                    Enable challenge mode
                  </span>
                </div>
                <motion.span
                  aria-hidden="true"
                  className="relative inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[#6d3624]/90 bg-[#26100c]/80 text-[1.1rem] text-[#d5ae8b]"
                  initial={false}
                  animate={{ x: 0 }}
                  whileHover={{ x: 3 }}
                  transition={{ duration: 0.24, ease: "easeOut" }}
                >
                  +
                </motion.span>
              </motion.button>
            )}
            </AnimatePresence>
          </motion.div>
        </motion.div>

        <motion.div layout="position" transition={mobileReflowTransition} className="relative lg:justify-self-center">
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
            clearXNonce={clearXNonce}
            onStackChange={setRows}
            onButtonPress={handleButtonPress}
          />
        </motion.div>

        <motion.div
          layout="position"
          transition={mobileReflowTransition}
          className="w-full max-w-[380px] justify-self-center lg:w-[380px] lg:max-w-none lg:justify-self-start"
        >
          <RetroCommandStack rows={rows} />
        </motion.div>
      </motion.div>
    </LayoutGroup>
  )
}
