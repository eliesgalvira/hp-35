"use client"

import { useState } from "react"
import HP35 from "@/components/hp-35"
import { RetroCommandStack } from "@/components/retro-command-stack"
import { applyKey, createCommandStackState } from "@/lib/command-stack"

export function HP35Experience() {
  const [commandStack, setCommandStack] = useState(createCommandStackState)

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
        <HP35 onKeyPress={(key) => setCommandStack((prev) => applyKey(prev, key))} />
      </div>

      <RetroCommandStack entriesNewestFirst={commandStack.entriesNewestFirst} />
    </div>
  )
}
