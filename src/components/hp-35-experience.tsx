"use client"

import { useState } from "react"
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

  return (
    <div className="flex w-full flex-col items-center gap-6 md:flex-row md:items-start md:justify-center md:gap-8">
      <div className="relative">
        <div
          className="absolute left-[8%] right-[8%] h-6"
          style={{
            bottom: "-14px",
            background: "radial-gradient(ellipse at center, rgba(0,0,0,0.5) 0%, transparent 70%)",
            filter: "blur(10px)",
            zIndex: 0,
          }}
        />
        <HP35 onStackChange={setRows} />
      </div>

      <RetroCommandStack rows={rows} />
    </div>
  )
}
