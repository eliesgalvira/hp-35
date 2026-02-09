# HP-35 Scientific Calculator

A web-based simulation of the HP-35, the world's first scientific pocket calculator, originally introduced by Hewlett-Packard in 1972.

This project faithfully recreates the HP-35's Reverse Polish Notation (RPN) interface, including its four-level stack, trigonometric, logarithmic, and exponential functions — all 35 original keys.

## Features

- **RPN (Reverse Polish Notation)** — no equals key; operands are entered first, then the operator
- **Four-level stack** (X, Y, Z, T) with stack manipulation (swap, roll down)
- **Scientific functions** — sin, cos, tan (and their inverses), log, ln, eˣ, √x, 1/x, xʸ
- **Memory** — store and recall
- **EEX** — scientific notation entry
- **CHS** — change sign
- **π** constant

## Getting Started

```bash
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Tech Stack

- [Next.js](https://nextjs.org) (App Router)
- [React](https://react.dev)
- [TypeScript](https://www.typescriptlang.org)
- [Tailwind CSS](https://tailwindcss.com)

## Legal Disclaimer

This website is an independent fan project and is **not** affiliated with, endorsed by, or in any way associated with Hewlett-Packard Company, HP Inc., or Hewlett Packard Enterprise. The HP-35 name and all related trademarks belong to their respective owners. This project is provided for educational and nostalgic purposes only.
