"use client"

import { LiquidGlass } from "@creativoma/liquid-glass"
import { useEffect, useMemo, useReducer, useRef, useState } from "react"
import { Telescope } from "lucide-react"

import { challengeDeck } from "@/components/challenge-data"
import {
  challengeModeReducer,
  createInitialChallengeMachineState,
} from "@/components/challenge-mode-machine"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@/components/ui/carousel"
import { cn } from "@/lib/utils"

export interface ChallengeInputEvent {
  token: string
  nonce: number
}

interface ChallengeModeProps {
  className?: string
  calculatorInput?: ChallengeInputEvent | null
  onChallengeReset?: () => void
}

const cardPaperBackground = [
  "linear-gradient(180deg, rgba(248,238,214,0.98) 0%, rgba(231,216,186,0.96) 100%)",
  "radial-gradient(circle at 20% 10%, rgba(255,255,255,0.35), transparent 32%)",
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160' viewBox='0 0 160 160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='160' height='160' filter='url(%23n)' opacity='0.07'/%3E%3C/svg%3E\")",
].join(",")

const panelButtonClass =
  "inline-flex items-center justify-center rounded-[10px] border border-[#60281b] bg-[linear-gradient(180deg,#3f120d_0%,#240806_100%)] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-[#e4c4aa] shadow-[0_0_18px_rgba(255,58,20,0.08),inset_0_1px_0_rgba(255,180,140,0.05),inset_0_-2px_6px_rgba(0,0,0,0.55)] transition-colors hover:bg-[linear-gradient(180deg,#5a1b13_0%,#2d0907_100%)] disabled:cursor-not-allowed disabled:opacity-35"

function ChallengeGlassOverlay({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn("absolute inset-0 z-20 overflow-hidden rounded-[18px] backdrop-blur-[8px]", className)}>
      <LiquidGlass
        backdropBlur={16}
        tintColor="rgba(244, 235, 220, 0.12)"
        displacementScale={110}
        turbulenceBaseFrequency="0.008 0.012"
        turbulenceSeed={4}
        className="absolute inset-0 rounded-[18px] border border-[rgba(255,233,205,0.18)]"
        style={{
          background:
            "linear-gradient(180deg, rgba(255,250,244,0.06) 0%, rgba(255,250,244,0.1) 100%)",
        }}
      />
      <div className="pointer-events-none absolute inset-0 rounded-[18px] bg-[linear-gradient(180deg,rgba(255,248,236,0.08),rgba(32,10,7,0.16))]" />
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="mx-6 flex min-w-[200px] max-w-[230px] flex-col items-center gap-3 rounded-[24px] border border-[rgba(201,181,152,0.6)] bg-[rgba(236,224,202,0.72)] px-6 py-5 shadow-[0_24px_54px_rgba(25,7,5,0.28),inset_0_1px_0_rgba(255,255,255,0.45)] backdrop-blur-[1px]">
        {children}
        </div>
      </div>
    </div>
  )
}

export function ChallengeMode({ className, calculatorInput = null, onChallengeReset }: ChallengeModeProps) {
  const [api, setApi] = useState<CarouselApi>()
  const [state, dispatch] = useReducer(challengeModeReducer, undefined, createInitialChallengeMachineState)
  const optimisticSlideIndex = useRef<number | null>(null)

  useEffect(() => {
    if (!api) return

    const updateSelection = () => {
      const nextIndex = api.selectedScrollSnap()

      if (optimisticSlideIndex.current !== null && nextIndex !== optimisticSlideIndex.current) {
        return
      }

      optimisticSlideIndex.current = null
      dispatch({ type: "sync_index", index: nextIndex })
    }

    updateSelection()
    api.on("select", updateSelection)
    api.on("reInit", updateSelection)

    return () => {
      api.off("select", updateSelection)
      api.off("reInit", updateSelection)
    }
  }, [api])

  useEffect(() => {
    if (optimisticSlideIndex.current === null) return

    const timeout = window.setTimeout(() => {
      optimisticSlideIndex.current = null
    }, 250)

    return () => window.clearTimeout(timeout)
  }, [state.selectedIndex])

  const selectedChallenge = useMemo(
    () => challengeDeck[state.selectedIndex] ?? challengeDeck[0],
    [state.selectedIndex]
  )

  useEffect(() => {
    if (state.flash === "idle") return

    const timeout = window.setTimeout(() => {
      dispatch({ type: "clear_flash" })
    }, 650)

    return () => window.clearTimeout(timeout)
  }, [state.flash, state.flashNonce])

  useEffect(() => {
    if (!calculatorInput) return
    dispatch({ type: "input", token: calculatorInput.token, nonce: calculatorInput.nonce })
  }, [calculatorInput])

  const canAdvance = state.phase === "success"
  const isFailed = state.phase === "failed"
  const isBlurredPreview = state.phase === "start"

  const scrollToIndex = (index: number) => {
    if (!canAdvance) return

    const nextIndex = Math.max(0, Math.min(index, challengeDeck.length - 1))
    optimisticSlideIndex.current = nextIndex
    dispatch({ type: "scroll_to", index: nextIndex })
    api?.scrollTo(nextIndex)
  }

  const startCurrentChallenge = () => {
    onChallengeReset?.()
    dispatch({ type: "start", currentInputNonce: calculatorInput?.nonce })
  }

  const endCurrentChallenge = () => {
    onChallengeReset?.()
    optimisticSlideIndex.current = 0
    api?.scrollTo(0)
    dispatch({ type: "end", currentInputNonce: calculatorInput?.nonce })
  }

  const isNumericStep = (step: string) => /^[0-9.]$|^π$/u.test(step)

  return (
    <aside className={cn("w-full max-w-[360px] shrink-0", className)}>
      <div
        className="relative overflow-hidden rounded-[18px] border border-[#5b2617] bg-[#140807] p-4 shadow-[0_0_20px_rgba(255,80,30,0.08),inset_0_1px_0_rgba(255,212,160,0.08),inset_0_-12px_20px_rgba(0,0,0,0.45)] md:p-5"
        style={{
          backgroundImage: [
            "radial-gradient(circle at 18% 0%, rgba(145,58,31,0.35), transparent 35%)",
            "linear-gradient(180deg, rgba(35,11,8,0.98) 0%, rgba(15,5,4,0.98) 100%)",
          ].join(","),
        }}
      >
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
              {String(state.selectedIndex + 1).padStart(2, "0")} / {String(challengeDeck.length).padStart(2, "0")}
            </div>
          </div>

          <div className="relative">
            <Carousel
              setApi={setApi}
              opts={{ align: "start", loop: false, watchDrag: canAdvance }}
              className="w-full"
            >
              <CarouselContent className="-ml-0">
                {challengeDeck.map((challenge, index) => {
                  const isSelected = index === state.selectedIndex
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
                        <div className="hp-flashcard-scene relative aspect-[4/4.35] w-full" data-flipped={isFlipped ? "true" : "false"}>
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
                                    <span>{isSelected ? `${state.attemptIndex} / ${challenge.steps.length}` : `${challenge.steps.length} keys`}</span>
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
                                    className="mt-3 text-[2rem] leading-none text-[#9d3c2b]"
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
                                            : "border-[#4c93ba] bg-[#58a9d1] text-white"
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
                            <ChallengeGlassOverlay>
                              <div className="flex flex-col items-center gap-3">
                                <button
                                  type="button"
                                  data-testid="challenge-repeat"
                                  className={panelButtonClass}
                                  onClick={startCurrentChallenge}
                                >
                                  Repeat
                                </button>
                                <button
                                  type="button"
                                  data-testid="challenge-end"
                                  className={panelButtonClass}
                                  onClick={endCurrentChallenge}
                                >
                                  End
                                </button>
                              </div>
                            </ChallengeGlassOverlay>
                          ) : null}

                          {showStartOverlay ? (
                            <ChallengeGlassOverlay>
                              <div className="flex flex-col items-center gap-3">
                                <div className="rounded-full border border-[#6d3624]/90 bg-[#26100c]/85 px-3 py-1 text-[10px] tracking-[0.28em] text-[#d5ae8b]">
                                  {selectedChallenge.steps.length} key sequence
                                </div>
                                <button
                                  type="button"
                                  data-testid="challenge-start"
                                  className={panelButtonClass}
                                  onClick={startCurrentChallenge}
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
                    const isActive = index === state.selectedIndex

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
                    disabled={!canAdvance || state.selectedIndex === 0}
                    onClick={() => scrollToIndex(state.selectedIndex - 1)}
                    className="static translate-y-0 border border-[#5c2c1f] bg-[#24100c] text-[#e7c9ab] hover:bg-[#351610] hover:text-[#f1dcc2] disabled:opacity-35"
                  />
                  <CarouselNext
                    variant="ghost"
                    disabled={!canAdvance || state.selectedIndex === challengeDeck.length - 1}
                    onClick={() => scrollToIndex(state.selectedIndex + 1)}
                    className="static translate-y-0 border border-[#5c2c1f] bg-[#24100c] text-[#e7c9ab] hover:bg-[#351610] hover:text-[#f1dcc2] disabled:opacity-35"
                  />
                </div>
              </div>
            </Carousel>
          </div>
        </div>
      </div>
    </aside>
  )
}
