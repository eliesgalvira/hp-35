"use client"

export type Challenge = {
  id: string
  title: string
  category: string
  expression: string
  answer: string
  steps: string[]
}

export const challengeDeck: Challenge[] = [
  {
    id: "warm-start",
    title: "Warm Start",
    category: "RPN drill",
    expression: "(3 × 4) + (5 × 6) + (7 × 8)",
    answer: "98",
    steps: ["3", "ENTER", "4", "×", "5", "ENTER", "6", "×", "+", "7", "ENTER", "8", "×", "+"],
  },
  {
    id: "chain-builder",
    title: "Chain Builder",
    category: "stack rhythm",
    expression: "(3 + 4)(5 + 6)(7 + 8)",
    answer: "1155",
    steps: ["3", "ENTER", "4", "+", "5", "ENTER", "6", "+", "×", "7", "ENTER", "8", "+", "×"],
  },
  {
    id: "fraction-weave",
    title: "Fraction Weave",
    category: "scientific mix",
    expression: "((4 × 5)/7 + 29/(3 × 11))(19/(2 + 4) + (13 + π)/4)",
    answer: "26.90641536",
    steps: ["4", "ENTER", "5", "×", "7", "÷", "2", "9", "ENTER", "3", "ENTER", "1", "1", "×", "÷", "+", "1", "9", "2", "ENTER", "4", "+", "÷", "1", "3", "π", "+", "4", "÷", "+", "×"],
  },
  {
    id: "harmonic-pair",
    title: "Harmonic Pair",
    category: "one-key trick",
    expression: "1 / (1/3 + 1/6)",
    answer: "2",
    steps: ["3", "1/x", "6", "1/x", "+", "1/x"],
  },
  {
    id: "pi-ladder",
    title: "Pi Ladder",
    category: "nested reciprocal",
    expression: "3 + 1/(7 + 1/(15 + 1/(1 + 1/292)))",
    answer: "3.141592653",
    steps: ["2", "9", "2", "1/x", "1", "+", "1/x", "1", "5", "+", "1/x", "7", "+", "1/x", "3", "+"],
  },
  {
    id: "celestial-fix",
    title: "Celestial Fix",
    category: "trig navigation",
    expression: "60 arc cos (cos 45° cos 150° + sin 45° sin 150° cos 60°)",
    answer: "6949.392474",
    steps: ["4", "5", "cos", "1", "5", "0", "cos", "×", "4", "5", "sin", "1", "5", "0", "sin", "×", "6", "0", "cos", "×", "+", "arc", "cos", "6", "0", "×"],
  },
]
