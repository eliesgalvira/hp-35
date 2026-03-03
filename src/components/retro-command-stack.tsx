"use client"

import { AnimatePresence, motion, useReducedMotion } from "motion/react"
import { SevenSegmentDisplay } from "./seven-segment-display"
import type { LedDisplayParts } from "../lib/hp-led-display"

export interface StackRegisterRow {
  label: "X" | "Y" | "Z" | "T"
  display: LedDisplayParts
  empty: boolean
}

interface RetroCommandStackProps {
  rows: StackRegisterRow[]
}

const rowDepthClasses = [
  "opacity-100 blur-none",
  "opacity-75 blur-[0.15px]",
  "opacity-55 blur-[0.25px]",
  "opacity-40 blur-[0.35px]",
]

export function RetroCommandStack({ rows }: RetroCommandStackProps) {
  const shouldReduceMotion = useReducedMotion()

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
          <div className="mb-2">
            <span className="text-[10px] uppercase tracking-[0.42em] text-[#a15d51]/80">STACK</span>
          </div>

          <div className="relative grid grid-rows-4 gap-2">
            {rows.map((row, index) => (
              <div
                key={row.label}
                className="relative flex h-10 items-center gap-3 rounded-[8px] border border-[#2d0e09]/80 bg-[#170504]/75 px-3 shadow-[inset_0_1px_2px_rgba(255,140,100,0.03),inset_0_-2px_4px_rgba(0,0,0,0.55)]"
              >
                <span className="w-5 text-[12px] font-semibold tracking-[0.28em] text-[#7d3b30]/85">{row.label}</span>
                <div className="relative min-w-0 flex-1">
                  <AnimatePresence mode="wait" initial={false}>
                    <motion.div
                      key={`${row.label}:${row.empty ? "empty" : `${row.display.sign}${row.display.mantissa}${row.display.exponentSign}${row.display.exponent}`}`}
                      initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: -6, filter: "brightness(0.78)" }}
                      animate={
                        row.empty
                          ? { opacity: 0 }
                          : shouldReduceMotion
                            ? { opacity: 1, y: 0 }
                            : {
                                opacity: [0.25, 1, 0.62, 1],
                                y: 0,
                                filter: ["brightness(0.82)", "brightness(1.18)", "brightness(0.94)", "brightness(1)"],
                            }
                      }
                      exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 6, filter: "brightness(0.75)" }}
                      transition={
                        shouldReduceMotion
                          ? { duration: 0.14 }
                          : {
                              opacity: { duration: 0.22, times: [0, 0.33, 0.66, 1] },
                              y: { type: "spring", stiffness: 260, damping: 24, mass: 0.7 },
                              filter: { duration: 0.22, times: [0, 0.33, 0.66, 1] },
                            }
                      }
                      className="absolute inset-0"
                    >
                      <SevenSegmentDisplay
                        display={row.empty ? { sign: "", mantissa: "", showExponent: false, exponentSign: " ", exponent: "" } : row.display}
                        className="relative"
                        ghostClassName={`hp-led-ghost absolute inset-0 flex items-center justify-start ${rowDepthClasses[index]}`}
                        ghostStyle={{
                          fontSize: "1.05rem",
                          fontWeight: 700,
                          letterSpacing: "1px",
                          fontFamily: "'DSEG7', 'SFMono-Regular', Consolas, monospace",
                        }}
                        activeClassName={`flex items-center justify-start ${rowDepthClasses[index]}`}
                        activeStyle={{
                          fontSize: "1.05rem",
                          fontWeight: 700,
                          color: "#ff4b2b",
                          letterSpacing: "1px",
                          fontFamily: "'DSEG7', 'SFMono-Regular', Consolas, monospace",
                          textShadow:
                            index === 0
                              ? "0 0 5px rgba(255,59,31,0.9), 0 0 16px rgba(255,59,31,0.36)"
                              : "0 0 4px rgba(255,59,31,0.55), 0 0 10px rgba(255,59,31,0.18)",
                        }}
                      />
                    </motion.div>
                  </AnimatePresence>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </aside>
  )
}
