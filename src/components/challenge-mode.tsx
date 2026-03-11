"use client"

import { LiquidGlass } from "@creativoma/liquid-glass"
import { motion } from "framer-motion"
import { useEffect, useState } from "react"
import { Check, Telescope, X } from "lucide-react"

import { challengeDeck } from "@/components/challenge-data"
import type { ChallengeMachineState } from "@/components/challenge-mode-machine"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@/components/ui/carousel"
import { cn } from "@/lib/utils"

export interface ChallengeFailureFeedback {
  challengeId: string
  pressed: string
  expected: string
}

interface ChallengeModeProps {
  className?: string
  selectedIndex: number
  state: ChallengeMachineState
  failureFeedback?: ChallengeFailureFeedback | null
  onSelectIndex: (index: number) => void
  onStart: () => void
  onRepeat: () => void
  onEnd: () => void
  onDisable: () => void
}

const cardPaperBackground = [
  "linear-gradient(180deg, rgba(248,238,214,0.98) 0%, rgba(231,216,186,0.96) 100%)",
  "radial-gradient(circle at 20% 10%, rgba(255,255,255,0.35), transparent 32%)",
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160' viewBox='0 0 160 160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='160' height='160' filter='url(%23n)' opacity='0.07'/%3E%3C/svg%3E\")",
].join(",")

const panelButtonClass =
  "inline-flex min-w-[140px] items-center justify-center rounded-[8px] border border-[#5b2617] bg-[#2a100c] px-5 py-3 text-[12px] leading-[1.15] font-normal uppercase tracking-[0.22em] text-[#d8a08f] transition-colors duration-150 hover:bg-[#381510] hover:text-[#e2b1a2] disabled:cursor-not-allowed disabled:opacity-35"
const feedbackPillClass =
  "flex min-w-0 items-center gap-2 rounded-[8px] border px-3 py-2 text-[12px] font-medium shadow-[0_1px_3px_rgba(0,0,0,0.12)]"

const lockedCarouselOptions = { align: "start" as const, loop: false, watchDrag: false }
const unlockedCarouselOptions = { align: "start" as const, loop: false, watchDrag: true }

function ChallengeGlassOverlay({
  children,
  className,
  contentClassName,
  tintColor = "rgba(244, 235, 220, 0.12)",
  veilClassName,
}: {
  children: React.ReactNode
  className?: string
  contentClassName?: string
  tintColor?: string
  veilClassName?: string
}) {
  return (
    <div className={cn("absolute inset-0 z-20 overflow-hidden rounded-[18px] backdrop-blur-[8px]", className)}>
      <LiquidGlass
        backdropBlur={16}
        tintColor={tintColor}
        displacementScale={110}
        turbulenceBaseFrequency="0.008 0.012"
        turbulenceSeed={4}
        className="pointer-events-none absolute inset-0 rounded-[18px] border border-[rgba(255,233,205,0.18)]"
        style={{
          background:
            "linear-gradient(180deg, rgba(255,250,244,0.06) 0%, rgba(255,250,244,0.1) 100%)",
        }}
      />
      <div
        className={cn(
          "pointer-events-none absolute inset-0 rounded-[18px] bg-[linear-gradient(180deg,rgba(255,248,236,0.08),rgba(32,10,7,0.16))]",
          veilClassName
        )}
      />
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div
          className={cn(
            "pointer-events-auto mx-5 flex w-[calc(100%-2.5rem)] max-w-[280px] flex-col gap-3",
            contentClassName
          )}
        >
          {children}
        </div>
      </div>
    </div>
  )
}

function formatChallengeKeyLabel(token: string) {
  if (token === "ENTER") return "ENTER"
  return token
}

export function ChallengeMode({
  className,
  selectedIndex,
  state,
  failureFeedback,
  onSelectIndex,
  onStart,
  onRepeat,
  onEnd,
  onDisable,
}: ChallengeModeProps) {
  const [api, setApi] = useState<CarouselApi>()
  const [surfaceTone, setSurfaceTone] = useState<"base" | "success">("base")
  const activeChallengeIndex = Number.isFinite(selectedIndex)
    ? Math.max(0, Math.min(selectedIndex, challengeDeck.length - 1))
    : 0

  const selectedChallenge = challengeDeck[activeChallengeIndex] ?? challengeDeck[0]
  const canAdvance = state.phase === "success"
  const isFailed = state.phase === "failed"
  const isBlurredPreview = state.phase === "start"
  const carouselOptions = canAdvance ? unlockedCarouselOptions : lockedCarouselOptions
  const selectedFailureFeedback =
    failureFeedback?.challengeId === selectedChallenge.id ? failureFeedback : null

  useEffect(() => {
    if (!api || !canAdvance) return

    const updateSelection = () => {
      const nextIndex = api.selectedScrollSnap()
      if (!Number.isFinite(nextIndex)) return
      if (nextIndex !== activeChallengeIndex) {
        onSelectIndex(nextIndex)
      }
    }

    api.on("select", updateSelection)

    return () => {
      api.off("select", updateSelection)
    }
  }, [activeChallengeIndex, api, canAdvance, onSelectIndex])

  useEffect(() => {
    if (!api) return
    if (api.selectedScrollSnap() !== activeChallengeIndex) {
      api.scrollTo(activeChallengeIndex)
    }
  }, [activeChallengeIndex, api])

  useEffect(() => {
    setSurfaceTone(state.phase === "success" ? "success" : "base")
  }, [activeChallengeIndex, state.phase])

  const scrollToIndex = (index: number) => {
    if (!canAdvance) return

    const nextIndex = Math.max(0, Math.min(index, challengeDeck.length - 1))
    setSurfaceTone("base")
    onSelectIndex(nextIndex)
  }

  const isNumericStep = (step: string) => /^[0-9.]$|^π$/u.test(step)

  return (
    <aside className={cn("w-full max-w-[360px] shrink-0", className)}>
      <motion.div
        className="relative overflow-hidden rounded-[18px] border border-[#5b2617] bg-[#140807] p-4 shadow-[0_0_20px_rgba(255,80,30,0.08),inset_0_1px_0_rgba(255,212,160,0.08),inset_0_-12px_20px_rgba(0,0,0,0.45)] md:p-5"
        style={{
          backgroundImage: [
            "radial-gradient(circle at 18% 0%, rgba(145,58,31,0.35), transparent 35%)",
            "linear-gradient(180deg, rgba(35,11,8,0.98) 0%, rgba(15,5,4,0.98) 100%)",
          ].join(","),
        }}
      >
        <motion.div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          initial={false}
          animate={{ opacity: surfaceTone === "success" ? 1 : 0 }}
          transition={{ duration: 0.24, ease: "easeOut" }}
          style={{
            backgroundImage: [
              "radial-gradient(circle at 16% 0%, rgba(58,108,67,0.28), transparent 34%)",
              "linear-gradient(180deg, rgba(17,39,20,0.98) 0%, rgba(11,22,13,0.98) 100%)",
            ].join(","),
          }}
        />
        <div
          className="pointer-events-none absolute inset-0 opacity-35"
          style={{
            backgroundImage:
              "repeating-linear-gradient(180deg, rgba(255,147,96,0.08) 0px, rgba(255,147,96,0.08) 1px, transparent 1px, transparent 8px)",
          }}
        />
        <div className="pointer-events-none absolute inset-[1px] rounded-[17px] shadow-[inset_0_0_42px_rgba(0,0,0,0.48)]" />

        <div className="relative space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-[#d9b696]">
              <Telescope className="size-3.5" />
              <span className="text-[10px] uppercase tracking-[0.42em] text-[#c9a78c]/80">Challenge Mode</span>
            </div>

            <div className="rounded-full border border-[#6d3624]/90 bg-[#26100c]/80 px-3 py-1 text-[10px] tracking-[0.28em] text-[#d5ae8b]">
              {String(activeChallengeIndex + 1).padStart(2, "0")} / {String(challengeDeck.length).padStart(2, "0")}
            </div>
          </div>

          <div className="relative">
            <Carousel setApi={setApi} opts={carouselOptions} className="w-full">
              <CarouselContent className="-ml-0">
                {challengeDeck.map((challenge, index) => {
                  const isSelected = index === activeChallengeIndex
                  const isFlipped = Boolean(state.completedCards[challenge.id])
                  const showFailureOverlay = isSelected && isFailed
                  const showStartOverlay = isSelected && isBlurredPreview
                  const showSuccessFlash = isSelected && state.flash === "success"
                  const showErrorFlash = isSelected && state.flash === "error"

                  return (
                    <CarouselItem key={challenge.id} className="basis-full pl-0">
                      <div
                        data-testid={`challenge-card-${challenge.id}`}
                        data-flipped={isFlipped ? "true" : "false"}
                        className="block w-full"
                      >
                        <div
                          className="hp-flashcard-scene relative aspect-[4/4.35] w-full"
                          data-flipped={isFlipped ? "true" : "false"}
                        >
                          <div className="hp-flashcard-inner relative h-full w-full">
                            <div
                              className={cn(
                                "hp-flashcard-face absolute inset-0 rounded-[18px] border border-[#d6c39d] p-4 text-[#3b2a1d] shadow-[0_24px_36px_rgba(0,0,0,0.24),inset_0_1px_0_rgba(255,255,255,0.45)] transition-[filter,opacity]",
                                showSuccessFlash && "hp-challenge-flash-success",
                                showErrorFlash && "hp-challenge-flash-error"
                              )}
                              style={{ backgroundImage: cardPaperBackground }}
                            >
                              <div className="flex h-full flex-col">
                                <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.28em] text-[#7a5e46]">
                                  <span>Problem {String(index + 1).padStart(2, "0")}</span>
                                  <span>{challenge.category}</span>
                                </div>

                                <div className="mt-4 rounded-[12px] border border-[#d0b98e] bg-[rgba(255,250,238,0.58)] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.55)]">
                                  <p className="text-[11px] uppercase tracking-[0.24em] text-[#8b6546]">Enter on the HP-35</p>
                                  <p
                                    className="mt-3 text-[1.3rem] leading-[1.35] text-[#2f2218]"
                                    style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
                                  >
                                    {challenge.expression}
                                  </p>
                                </div>

                                <div className="mt-auto pt-4">
                                  <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.24em] text-[#8b6546]">
                                    <span>Sequence progress</span>
                                    <span>
                                      {isSelected
                                        ? `${state.attemptIndex} / ${challenge.steps.length}`
                                        : `${challenge.steps.length} keys`}
                                    </span>
                                  </div>
                                  <div className="mt-3 grid grid-cols-10 gap-1.5">
                                    {challenge.steps.map((step, stepIndex) => (
                                      <span
                                        key={`${challenge.id}:progress:${stepIndex}`}
                                        className={cn(
                                          "h-1.5 rounded-full border transition-colors",
                                          isSelected && stepIndex < state.attemptIndex
                                            ? "border-[#4f8a4d] bg-[#6fa86d]"
                                            : "border-[#cdb792] bg-[#e9dcc0]"
                                        )}
                                      />
                                    ))}
                                  </div>
                                </div>
                              </div>
                            </div>

                            <div
                              className={cn(
                                "hp-flashcard-face hp-flashcard-back absolute inset-0 rounded-[18px] border border-[#d6c39d] p-4 text-[#3b2a1d] shadow-[0_24px_36px_rgba(0,0,0,0.24),inset_0_1px_0_rgba(255,255,255,0.45)]",
                                showSuccessFlash && "hp-challenge-flash-success"
                              )}
                              style={{ backgroundImage: cardPaperBackground }}
                            >
                              <div className="flex h-full flex-col">
                                <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.28em] text-[#7a5e46]">
                                  <span>Verified result</span>
                                  <span>{challenge.category}</span>
                                </div>

                                <div className="mt-4 rounded-[14px] border border-[#d8bb96] bg-[rgba(255,246,228,0.76)] px-4 py-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.65)]">
                                  <p className="text-[11px] uppercase tracking-[0.24em] text-[#8b6546]">Expected answer</p>
                                  <p
                                    className="mt-3 text-[2rem] leading-none text-[#2e5a33]"
                                    style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
                                  >
                                    {challenge.answer}
                                  </p>
                                </div>

                                <div className="mt-5">
                                  <p className="text-[11px] uppercase tracking-[0.24em] text-[#866345]">Key sequence</p>
                                  <div className="mt-3 flex flex-wrap gap-2">
                                    {challenge.steps.map((step, stepIndex) => (
                                      <span
                                        key={`${challenge.id}:${step}:${stepIndex}`}
                                        className={cn(
                                          "rounded-[8px] border px-2.5 py-1 text-[12px] font-semibold shadow-[0_4px_10px_rgba(0,0,0,0.08)]",
                                          isNumericStep(step)
                                            ? "border-[#c7b28d] bg-[#f4ebd8] text-[#3b2a1d]"
                                            : "border-[#6f8a5e] bg-[#dce6d8] text-[#2f5234]"
                                        )}
                                      >
                                        {step}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>

                          {showFailureOverlay ? (
                            <ChallengeGlassOverlay
                              tintColor="rgba(134, 24, 19, 0.22)"
                              veilClassName="bg-[linear-gradient(180deg,rgba(103,23,19,0.18),rgba(42,10,8,0.34))]"
                              contentClassName="items-center"
                            >
                              <div data-testid="challenge-failure-feedback" className="flex w-full flex-col items-center gap-3">
                                {selectedFailureFeedback ? (
                                  <div className="flex w-full items-stretch gap-2">
                                    <div className={cn(feedbackPillClass, "flex-1 border-[#b46a61] bg-[#f0d8d4] text-[#5c1814]")}>
                                      <X className="size-4 shrink-0" />
                                      <span
                                        data-testid="challenge-failure-pressed"
                                        className="truncate text-[13px] font-semibold tracking-[0.03em]"
                                      >
                                        {formatChallengeKeyLabel(selectedFailureFeedback.pressed)}
                                      </span>
                                    </div>

                                    <div className={cn(feedbackPillClass, "flex-1 border-[#7e9a73] bg-[#dce6d8] text-[#2f5234]")}>
                                      <Check className="size-4 shrink-0" />
                                      <span
                                        data-testid="challenge-failure-expected"
                                        className="truncate text-[13px] font-semibold tracking-[0.03em]"
                                      >
                                        {formatChallengeKeyLabel(selectedFailureFeedback.expected)}
                                      </span>
                                    </div>
                                  </div>
                                ) : null}

                                <div data-testid="challenge-failure-actions" className="flex flex-col items-center gap-3">
                                  <button
                                    type="button"
                                    data-testid="challenge-repeat"
                                    className={panelButtonClass}
                                    onClick={onRepeat}
                                  >
                                    Repeat
                                  </button>
                                  <button
                                    type="button"
                                    data-testid="challenge-end"
                                    className={panelButtonClass}
                                    onClick={onEnd}
                                  >
                                    End
                                  </button>
                                  <button
                                    type="button"
                                    data-testid="challenge-disable"
                                    className={cn(
                                      panelButtonClass,
                                      "border-[#6b473a] bg-[rgba(34,14,11,0.82)] text-[#e8c8b4] hover:bg-[rgba(49,20,16,0.9)]"
                                    )}
                                    onClick={onDisable}
                                  >
                                    Disable challenge mode
                                  </button>
                                </div>
                              </div>
                            </ChallengeGlassOverlay>
                          ) : null}

                          {showStartOverlay ? (
                            <ChallengeGlassOverlay contentClassName="items-center">
                              <div className="flex flex-col items-center gap-3 text-center">
                                <button
                                  type="button"
                                  data-testid="challenge-start"
                                  className={panelButtonClass}
                                  onClick={onStart}
                                >
                                  Start
                                </button>
                              </div>
                            </ChallengeGlassOverlay>
                          ) : null}
                        </div>
                      </div>
                    </CarouselItem>
                  )
                })}
              </CarouselContent>

              <div className="flex items-center justify-between gap-3 pt-4">
                <div className="flex items-center gap-2">
                  {challengeDeck.map((challenge, index) => {
                    const isActive = index === activeChallengeIndex

                    return (
                      <button
                        key={challenge.id}
                        type="button"
                        aria-label={`Go to ${challenge.title}`}
                        aria-pressed={isActive}
                        disabled={!canAdvance}
                        onClick={() => scrollToIndex(index)}
                        className={cn(
                          "h-2.5 rounded-full border transition-all disabled:opacity-30",
                          isActive
                            ? "w-8 border-[#d9b696] bg-[#d9b696]"
                            : "w-2.5 border-[#6e3a29] bg-[#2c120d] hover:border-[#9a6149]"
                        )}
                      />
                    )
                  })}
                </div>

                <div className="flex items-center gap-2">
                  <CarouselPrevious
                    variant="ghost"
                    disabled={!canAdvance || activeChallengeIndex === 0}
                    onClick={() => scrollToIndex(activeChallengeIndex - 1)}
                    className="static translate-y-0 border border-[#5c2c1f] bg-[#24100c] text-[#e7c9ab] hover:bg-[#351610] hover:text-[#f1dcc2] disabled:opacity-35"
                  />
                  <CarouselNext
                    variant="ghost"
                    disabled={!canAdvance || activeChallengeIndex === challengeDeck.length - 1}
                    onClick={() => scrollToIndex(activeChallengeIndex + 1)}
                    className="static translate-y-0 border border-[#5c2c1f] bg-[#24100c] text-[#e7c9ab] hover:bg-[#351610] hover:text-[#f1dcc2] disabled:opacity-35"
                  />
                </div>
              </div>
            </Carousel>
          </div>
        </div>
      </motion.div>
    </aside>
  )
}
