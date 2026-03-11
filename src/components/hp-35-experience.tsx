"use client"

import { useRef, useState } from "react"
import { ChallengeMode, type ChallengeInputEvent } from "@/components/challenge-mode"
import HP35, { type HP35Handle } from "@/components/hp-35"
import { RetroCommandStack, type StackRegisterRow } from "@/components/retro-command-stack"

const emptyRows: StackRegisterRow[] = [
  { label: "X", display: { sign: "", mantissa: "0.", showExponent: false, exponentSign: " ", exponent: "" }, empty: true },
  { label: "Y", display: { sign: "", mantissa: "0.", showExponent: false, exponentSign: " ", exponent: "" }, empty: true },
  { label: "Z", display: { sign: "", mantissa: "0.", showExponent: false, exponentSign: " ", exponent: "" }, empty: true },
  { label: "T", display: { sign: "", mantissa: "0.", showExponent: false, exponentSign: " ", exponent: "" }, empty: true },
]

export function HP35Experience() {
  const [rows, setRows] = useState<StackRegisterRow[]>(emptyRows)
  const [calculatorInput, setCalculatorInput] = useState<ChallengeInputEvent | null>(null)
  const calculatorRef = useRef<HP35Handle>(null)

  const handleButtonPress = (token: string) => {
    setCalculatorInput((current) => ({
      token,
      nonce: (current?.nonce ?? 0) + 1,
    }))
  }

  const handleChallengeReset = () => {
    calculatorRef.current?.pressClear()
  }

  return (
    <div className="grid w-full max-w-[1320px] grid-cols-1 justify-items-center gap-6 md:gap-8 lg:grid-cols-[minmax(0,1fr)_320px_minmax(0,1fr)] lg:items-start">
      <ChallengeMode
        className="lg:w-[360px] lg:justify-self-end"
        calculatorInput={calculatorInput}
        onChallengeReset={handleChallengeReset}
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
        <HP35 ref={calculatorRef} onStackChange={setRows} onButtonPress={handleButtonPress} />
      </div>

      <div className="w-full lg:w-[380px] lg:justify-self-start">
        <RetroCommandStack rows={rows} />
      </div>
    </div>
  )
}
