"use client"

import { useState } from "react"

interface StackState {
  x: number
  y: number
  z: number
  t: number
}

export default function HP35() {
  const [stack, setStack] = useState<StackState>({ x: 0, y: 0, z: 0, t: 0 })
  const [display, setDisplay] = useState("0")
  const [entering, setEntering] = useState(false)
  const [memory, setMemory] = useState(0)
  const [eexActive, setEexActive] = useState(false)
  const [eexMantissa, setEexMantissa] = useState(0)
  const [eexExponent, setEexExponent] = useState(0)
  const [eexSign, setEexSign] = useState(1)
  const [arcActive, setArcActive] = useState(false)

  const updateDisplay = (value: number) => {
    if (value === 0) return "0"
    if (Math.abs(value) >= 1e10 || (Math.abs(value) < 1e-9 && value !== 0)) {
      return value.toExponential(6)
    }
    return value.toString().slice(0, 10)
  }

  const pushStack = (newX: number) => {
    setStack((prev) => ({ t: prev.z, z: prev.y, y: prev.x, x: newX }))
    setDisplay(updateDisplay(newX))
  }

  const inputDigit = (digit: string) => {
    if (digit === "π") {
      setDisplay(Math.PI.toString().slice(0, 10))
      setStack((prev) => ({ ...prev, x: Math.PI }))
      setEntering(false)
      setEexActive(false)
      return
    }
    if (eexActive) {
      let newExp = Math.abs(eexExponent) * 10 + Number(digit)
      newExp = eexSign < 0 ? -newExp : newExp
      setEexExponent(newExp)
      setDisplay(`${eexMantissa}e${newExp}`)
      setStack((prev) => ({ ...prev, x: eexMantissa * Math.pow(10, newExp) }))
    } else if (entering) {
      const newDisplay = display === "0" ? digit : display + digit
      if (newDisplay.length <= 10) {
        setDisplay(newDisplay)
        setStack((prev) => ({ ...prev, x: Number.parseFloat(newDisplay) }))
      }
    } else {
      setDisplay(digit)
      setStack((prev) => ({ ...prev, x: Number.parseFloat(digit) }))
      setEntering(true)
    }
  }

  const inputDecimal = () => {
    if (entering) {
      if (!display.includes(".")) setDisplay(display + ".")
    } else {
      setDisplay("0.")
      setEntering(true)
    }
  }

  const enter = () => {
    pushStack(stack.x)
    setEntering(false)
  }

  const operation = (op: string) => {
    let result = stack.x
    switch (op) {
      case "+":
        result = stack.y + stack.x
        setStack((prev) => ({ ...prev, x: result, y: prev.z, z: prev.t, t: 0 }))
        break
      case "-":
        result = stack.y - stack.x
        setStack((prev) => ({ ...prev, x: result, y: prev.z, z: prev.t, t: 0 }))
        break
      case "×":
        result = stack.y * stack.x
        setStack((prev) => ({ ...prev, x: result, y: prev.z, z: prev.t, t: 0 }))
        break
      case "÷":
        result = stack.y / stack.x
        setStack((prev) => ({ ...prev, x: result, y: prev.z, z: prev.t, t: 0 }))
        break
      case "x^y":
        result = Math.pow(stack.y, stack.x)
        setStack((prev) => ({ ...prev, x: result, y: prev.z, z: prev.t, t: 0 }))
        break
      case "√x":
        result = Math.sqrt(stack.x)
        setStack((prev) => ({ ...prev, x: result }))
        break
      case "1/x":
        result = 1 / stack.x
        setStack((prev) => ({ ...prev, x: result }))
        break
      case "sin":
        result = arcActive ? Math.asin(stack.x) : Math.sin(stack.x)
        setArcActive(false)
        setStack((prev) => ({ ...prev, x: result }))
        break
      case "cos":
        result = arcActive ? Math.acos(stack.x) : Math.cos(stack.x)
        setArcActive(false)
        setStack((prev) => ({ ...prev, x: result }))
        break
      case "tan":
        result = arcActive ? Math.atan(stack.x) : Math.tan(stack.x)
        setArcActive(false)
        setStack((prev) => ({ ...prev, x: result }))
        break
      case "log":
        result = Math.log10(stack.x)
        setStack((prev) => ({ ...prev, x: result }))
        break
      case "ln":
        result = Math.log(stack.x)
        setStack((prev) => ({ ...prev, x: result }))
        break
      case "e^x":
        result = Math.exp(stack.x)
        setStack((prev) => ({ ...prev, x: result }))
        break
      case "EEX":
        setEexActive(true)
        setEexMantissa(stack.x)
        setEexExponent(0)
        setEexSign(1)
        setDisplay(`${stack.x}e`)
        setEntering(false)
        return
      case "CHS":
        if (eexActive) {
          setEexSign((prev) => -prev)
          setEexExponent((prev) => -prev)
          setDisplay(`${eexMantissa}e${-eexExponent}`)
          return
        }
        result = -stack.x
        setStack((prev) => ({ ...prev, x: result }))
        break
      case "x↔y":
        setStack((prev) => ({ ...prev, x: prev.y, y: prev.x }))
        result = stack.y
        break
      case "arc":
        setArcActive(true)
        return
    }
    setDisplay(updateDisplay(result))
    setEntering(false)
    setEexActive(false)
  }

  const clear = () => {
    setStack({ x: 0, y: 0, z: 0, t: 0 })
    setDisplay("0")
    setEntering(false)
  }

  const store = () => setMemory(stack.x)
  const recall = () => {
    pushStack(memory)
    setEntering(false)
  }

  const funcBtn = (label: string | React.ReactNode, action: () => void) => (
    <button
      onMouseDown={action}
      className="group relative"
      style={{
        background: "linear-gradient(180deg, #5a4a3a 0%, #3e3228 100%)",
        color: "#f0e6d6",
        border: "1px solid #6b5b4b",
        borderRadius: "6px",
        fontSize: "11px",
        fontWeight: 700,
        height: "40px",
        cursor: "pointer",
        letterSpacing: "0.5px",
        transition: "all 0.1s ease",
        boxShadow: "0 2px 4px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.1)",
      }}
      onMouseOver={(e) => {
        e.currentTarget.style.background = "linear-gradient(180deg, #6b5b4b 0%, #4e4238 100%)"
      }}
      onMouseOut={(e) => {
        e.currentTarget.style.background = "linear-gradient(180deg, #5a4a3a 0%, #3e3228 100%)"
      }}
    >
      {label}
    </button>
  )

  const blueBtn = (label: string | React.ReactNode, action: () => void, extra?: React.CSSProperties) => (
    <button
      onMouseDown={action}
      style={{
        background: "linear-gradient(180deg, #c47a32 0%, #9e5a1e 100%)",
        color: "#fff",
        border: "1px solid #d4883a",
        borderRadius: "6px",
        fontSize: "12px",
        fontWeight: 800,
        height: "40px",
        cursor: "pointer",
        letterSpacing: "0.5px",
        transition: "all 0.1s ease",
        boxShadow: "0 2px 4px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.2)",
        ...extra,
      }}
      onMouseOver={(e) => {
        e.currentTarget.style.background = "linear-gradient(180deg, #d48a42 0%, #ae6a2e 100%)"
      }}
      onMouseOut={(e) => {
        e.currentTarget.style.background = "linear-gradient(180deg, #c47a32 0%, #9e5a1e 100%)"
      }}
    >
      {label}
    </button>
  )

  const numBtn = (label: string, action: () => void) => (
    <button
      onMouseDown={action}
      style={{
        background: "linear-gradient(180deg, #f5edd5 0%, #e8dfc5 100%)",
        color: "#2a2218",
        border: "1px solid #d4cbb0",
        borderRadius: "6px",
        fontSize: "18px",
        fontWeight: 700,
        height: "48px",
        cursor: "pointer",
        transition: "all 0.1s ease",
        boxShadow: "0 2px 4px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.8)",
        fontFamily: "'Georgia', serif",
      }}
      onMouseOver={(e) => {
        e.currentTarget.style.background = "linear-gradient(180deg, #fff8e0 0%, #f2e8d0 100%)"
      }}
      onMouseOut={(e) => {
        e.currentTarget.style.background = "linear-gradient(180deg, #f5edd5 0%, #e8dfc5 100%)"
      }}
    >
      {label}
    </button>
  )

  const opBtn = (label: string, action: () => void) => (
    <button
      onMouseDown={action}
      style={{
        background: "linear-gradient(180deg, #c47a32 0%, #9e5a1e 100%)",
        color: "#fff",
        border: "1px solid #d4883a",
        borderRadius: "6px",
        fontSize: "20px",
        fontWeight: 700,
        height: "48px",
        cursor: "pointer",
        transition: "all 0.1s ease",
        boxShadow: "0 2px 4px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.2)",
        fontFamily: "'Georgia', serif",
      }}
      onMouseOver={(e) => {
        e.currentTarget.style.background = "linear-gradient(180deg, #d48a42 0%, #ae6a2e 100%)"
      }}
      onMouseOut={(e) => {
        e.currentTarget.style.background = "linear-gradient(180deg, #c47a32 0%, #9e5a1e 100%)"
      }}
    >
      {label}
    </button>
  )

  return (
    <div style={{
      minHeight: "100vh",
      background: "#f5edd5",
      fontFamily: "'Georgia', 'Times New Roman', serif",
    }}>
      {/* Main Content */}
      <main style={{ maxWidth: "960px", margin: "0 auto", padding: "0 32px" }}>
        {/* Hero Section */}
        <section style={{ padding: "60px 0 40px", textAlign: "center" }}>
          <div style={{
            fontSize: "10px",
            letterSpacing: "6px",
            color: "#9e5a1e",
            textTransform: "uppercase",
            marginBottom: "20px",
            fontWeight: 600,
          }}>PRESENTING THE</div>
          <h1 style={{
            fontSize: "clamp(48px, 8vw, 80px)",
            fontWeight: 400,
            color: "#2a2218",
            margin: "0 0 12px",
            lineHeight: 0.95,
            letterSpacing: "-2px",
            fontStyle: "italic",
          }}>HP-35</h1>
          <p style={{
            fontSize: "14px",
            letterSpacing: "4px",
            color: "#5a4a3a",
            textTransform: "uppercase",
            margin: "0 0 8px",
          }}>The Electronic Slide Rule</p>
          <p style={{
            fontSize: "13px",
            color: "#8a7a6a",
            maxWidth: "480px",
            margin: "0 auto",
            lineHeight: 1.7,
          }}>
            The world&apos;s first scientific pocket calculator. 
            Thirty-five keys. Four-level RPN stack. Born 1972.
          </p>
        </section>

        {/* Decorative divider */}
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "16px",
          margin: "0 0 40px",
        }}>
          <div style={{ flex: 1, height: "1px", background: "#c4b8a0" }} />
          <div style={{
            width: "8px", height: "8px",
            border: "1px solid #c4b8a0",
            transform: "rotate(45deg)",
          }} />
          <div style={{ flex: 1, height: "1px", background: "#c4b8a0" }} />
        </div>

        {/* Calculator Section */}
        <div style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "40px",
          paddingBottom: "60px",
        }}>
          {/* The Calculator */}
          <div style={{
            background: "linear-gradient(180deg, #3e3228 0%, #2a2218 100%)",
            borderRadius: "16px",
            padding: "24px 20px 28px",
            width: "100%",
            maxWidth: "360px",
            boxShadow: `
              0 4px 8px rgba(0,0,0,0.15),
              0 12px 24px rgba(0,0,0,0.1),
              0 24px 48px rgba(42,34,24,0.15)
            `,
            border: "1px solid #5a4a3a",
          }}>
            {/* Display */}
            <div style={{
              background: "#0a0804",
              borderRadius: "8px",
              padding: "4px",
              marginBottom: "20px",
              border: "1px solid #4a3a2a",
            }}>
              <div style={{
                background: "linear-gradient(180deg, #1a0800 0%, #0d0400 100%)",
                borderRadius: "6px",
                padding: "14px 20px",
                position: "relative",
              }}>
                {/* Amber LED display */}
                <div
                  data-testid="hp35-display"
                  style={{
                  fontFamily: "'Courier New', monospace",
                  fontSize: "30px",
                  fontWeight: "bold",
                  color: "#ff8c00",
                  textShadow: "0 0 10px #ff8c00, 0 0 25px rgba(255,140,0,0.4), 0 0 50px rgba(255,140,0,0.15)",
                  textAlign: "right",
                  letterSpacing: "3px",
                  minHeight: "36px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "flex-end",
                }}
                >
                  {display}
                </div>
              </div>
            </div>

            {/* Function Keys */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "5px", marginBottom: "5px" }}>
              {funcBtn(<span>x<sup>y</sup></span>, () => operation("x^y"))}
              {funcBtn("log", () => operation("log"))}
              {funcBtn("ln", () => operation("ln"))}
              {funcBtn(<span>e<sup>x</sup></span>, () => operation("e^x"))}
              {blueBtn("CLR", clear)}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "5px", marginBottom: "5px" }}>
              {funcBtn("√x", () => operation("√x"))}
              {funcBtn("arc", () => operation("arc"))}
              {funcBtn("sin", () => operation("sin"))}
              {funcBtn("cos", () => operation("cos"))}
              {funcBtn("tan", () => operation("tan"))}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "5px", marginBottom: "5px" }}>
              {funcBtn("1/x", () => operation("1/x"))}
              {funcBtn("x↔y", () => operation("x↔y"))}
              {funcBtn("R↓", () => {
                setStack((prev) => ({ x: prev.y, y: prev.z, z: prev.t, t: prev.x }))
                setDisplay(updateDisplay(stack.y))
                setEntering(false)
                setEexActive(false)
              })}
              {funcBtn("STO", store)}
              {funcBtn("RCL", recall)}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", gap: "5px", marginBottom: "12px" }}>
              {blueBtn("ENTER ↑", enter, { fontSize: "12px" })}
              {blueBtn("CHS", () => operation("CHS"))}
              {blueBtn("EEX", () => operation("EEX"))}
              {blueBtn("CLx", () => { setDisplay("0"); setStack(prev => ({...prev, x: 0})); setEntering(false) })}
            </div>

            {/* Separator */}
            <div style={{
              height: "2px",
              background: "linear-gradient(90deg, #5a4a3a, #8a7a6a, #5a4a3a)",
              marginBottom: "12px",
              borderRadius: "1px",
            }} />

            {/* Number Pad */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "5px" }}>
              {opBtn("−", () => operation("-"))}
              {numBtn("7", () => inputDigit("7"))}
              {numBtn("8", () => inputDigit("8"))}
              {numBtn("9", () => inputDigit("9"))}

              {opBtn("+", () => operation("+"))}
              {numBtn("4", () => inputDigit("4"))}
              {numBtn("5", () => inputDigit("5"))}
              {numBtn("6", () => inputDigit("6"))}

              {opBtn("×", () => operation("×"))}
              {numBtn("1", () => inputDigit("1"))}
              {numBtn("2", () => inputDigit("2"))}
              {numBtn("3", () => inputDigit("3"))}

              {opBtn("÷", () => operation("÷"))}
              {numBtn("0", () => inputDigit("0"))}
              {numBtn(".", inputDecimal)}
              {numBtn("π", () => inputDigit("π"))}
            </div>
          </div>

          {/* RPN Example */}
          <div style={{
            textAlign: "center",
            color: "#8a7a6a",
            fontSize: "13px",
            lineHeight: 1.7,
            maxWidth: "400px",
          }}>
            Example: To calculate <span style={{ fontFamily: "monospace", color: "#5a4a3a" }}>3 + 4</span>: press <span style={{ fontFamily: "monospace", color: "#5a4a3a" }}>3 ENTER 4 +</span>
          </div>

          {/* Info cards below */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: "24px",
            width: "100%",
            maxWidth: "640px",
          }}>
            {[
              { title: "RPN Logic", desc: "Four-level stack. No equals key. Think in postfix." },
              { title: "35 Keys", desc: "Trigonometric, logarithmic, and exponential functions at your fingertips." },
              { title: "Since 1972", desc: "The device that replaced the slide rule and changed engineering forever." },
            ].map((card, i) => (
              <div key={i} style={{
                textAlign: "center",
                padding: "20px 12px",
                borderTop: "2px solid #c4b8a0",
              }}>
                <div style={{
                  fontSize: "12px",
                  fontWeight: 700,
                  letterSpacing: "3px",
                  color: "#9e5a1e",
                  textTransform: "uppercase",
                  marginBottom: "8px",
                }}>{card.title}</div>
                <div style={{
                  fontSize: "13px",
                  color: "#5a4a3a",
                  lineHeight: 1.6,
                }}>{card.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer style={{
        borderTop: "2px solid #2a2218",
        padding: "20px 0",
        textAlign: "center",
      }}>
        <div style={{
          fontSize: "10px",
          letterSpacing: "4px",
          color: "#8a7a6a",
          textTransform: "uppercase",
        }}>
          &quot;Something only fictional heroes like James Bond are supposed to own&quot;
        </div>
        <div style={{
          fontSize: "10px",
          color: "#b4a894",
          marginTop: "6px",
          letterSpacing: "2px",
        }}>
          — HP-35 Owner&apos;s Manual, 1972
        </div>
        <div style={{
          fontSize: "9px",
          color: "#b4a894",
          marginTop: "16px",
          letterSpacing: "1px",
          maxWidth: "480px",
          marginLeft: "auto",
          marginRight: "auto",
          lineHeight: 1.6,
        }}>
          This website is an independent fan project and is not affiliated with, endorsed by, or in any way
          associated with Hewlett-Packard Company, HP Inc., or Hewlett Packard Enterprise. All trademarks
          belong to their respective owners.
        </div>
      </footer>
    </div>
  )
}
