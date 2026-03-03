"use client"

import { AnimatePresence, motion, useReducedMotion } from "motion/react"
import type { CommandEntry } from "@/lib/command-stack"

interface RetroCommandStackProps {
  entriesNewestFirst: CommandEntry[]
}

const ROW_COUNT = 4
const rowDepthClasses = [
  "opacity-100 blur-none",
  "opacity-75 blur-[0.15px]",
  "opacity-55 blur-[0.25px]",
  "opacity-40 blur-[0.35px]",
]

export function RetroCommandStack({ entriesNewestFirst }: RetroCommandStackProps) {
  const shouldReduceMotion = useReducedMotion()
  const visibleEntries = entriesNewestFirst.slice(0, ROW_COUNT)

  return (
    <aside className="w-full max-w-[380px] shrink-0">
      <div
        className="relative overflow-hidden rounded-[14px] border border-[#3a160f] bg-[#120403] p-3 shadow-[0_0_18px_rgba(255,58,20,0.08),inset_0_2px_10px_rgba(0,0,0,0.85),inset_0_-2px_8px_rgba(50,6,4,0.75)]"
        style={{
          backgroundImage: [
            "radial-gradient(circle at 50% 45%, rgba(71,14,9,0.22), transparent 70%)",
            "linear-gradient(180deg, rgba(32,6,4,0.98) 0%, rgba(12,2,2,0.98) 100%)",
          ].join(","),
        }}
      >
        <div
          className="pointer-events-none absolute inset-0 opacity-30"
          style={{
            backgroundImage:
              "repeating-linear-gradient(180deg, rgba(255,130,90,0.08) 0px, rgba(255,130,90,0.08) 1px, transparent 1px, transparent 7px)",
          }}
        />
        <div className="pointer-events-none absolute inset-[1px] rounded-[12px] shadow-[inset_0_0_42px_rgba(0,0,0,0.55)]" />

        <div className="relative">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-[0.42em] text-[#a15d51]/80">STACK</span>
            <span className="text-[9px] tracking-[0.35em] text-[#6c342b]/70">01 02 03 04</span>
          </div>

          <div className="relative grid grid-rows-4 gap-2">
            {Array.from({ length: ROW_COUNT }).map((_, index) => (
              <div
                key={index}
                className="h-10 rounded-[8px] border border-[#2d0e09]/80 bg-[#170504]/75 shadow-[inset_0_1px_2px_rgba(255,140,100,0.03),inset_0_-2px_4px_rgba(0,0,0,0.55)]"
              />
            ))}

            <div className="pointer-events-none absolute inset-0 flex flex-col gap-2">
              <AnimatePresence initial={false}>
                {visibleEntries.map((entry, index) => {
                  const baseClass = rowDepthClasses[index] ?? rowDepthClasses[rowDepthClasses.length - 1]
                  const entryGlow =
                    index === 0
                      ? "0 0 5px rgba(255,59,31,0.9), 0 0 16px rgba(255,59,31,0.36)"
                      : "0 0 4px rgba(255,59,31,0.55), 0 0 10px rgba(255,59,31,0.18)"

                  return (
                    <motion.div
                      key={entry.id}
                      layout
                      initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: -10, filter: "brightness(0.8)" }}
                      animate={
                        index === 0
                          ? shouldReduceMotion
                            ? { opacity: 1, y: 0 }
                            : {
                                opacity: [0.35, 1, 0.62, 1],
                                y: 0,
                                filter: ["brightness(0.78)", "brightness(1.15)", "brightness(0.92)", "brightness(1)"],
                              }
                          : { opacity: 1, y: 0, filter: "brightness(1)" }
                      }
                      exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 10, filter: "brightness(0.75)" }}
                      transition={
                        shouldReduceMotion
                          ? { duration: 0.16 }
                          : {
                              layout: { type: "spring", stiffness: 280, damping: 28, mass: 0.8 },
                              opacity: { duration: 0.22, times: [0, 0.33, 0.66, 1] },
                              y: { type: "spring", stiffness: 260, damping: 26, mass: 0.8 },
                              filter: { duration: 0.22, times: [0, 0.33, 0.66, 1] },
                            }
                      }
                      className={`flex h-10 items-center rounded-[8px] px-3 text-[1.05rem] font-bold uppercase tracking-[0.16em] text-[#ff4b2b] ${baseClass}`}
                      style={{
                        fontFamily: "'DSEG7', 'SFMono-Regular', Consolas, monospace",
                        textShadow: entryGlow,
                      }}
                    >
                      <span className="truncate">{entry.text}</span>
                    </motion.div>
                  )
                })}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </aside>
  )
}
