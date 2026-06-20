"use client"

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react"
import { buildDisplay, buildStackRows, initialCalculatorState, type CalculatorStackRow, type CalculatorToken } from "@/features/calculator/model"
import { clearXRegister, pressToken, resetCalculator } from "@/features/calculator/engine"

interface UseCalculatorOptions {
  readonly resetNonce?: number
  readonly clearXNonce?: number
  readonly onStackChange?: ((rows: CalculatorStackRow[]) => void) | undefined
}

export const useCalculatorModel = ({
  resetNonce = 0,
  clearXNonce = 0,
  onStackChange,
}: UseCalculatorOptions = {}) => {
  const [state, setState] = useState(initialCalculatorState)
  const [improperOperationVisible, setImproperOperationVisible] = useState(true)
  const lastResetNonceRef = useRef(resetNonce)
  const lastClearXNonceRef = useRef(clearXNonce)

  const display = buildDisplay(state)
  const improperOperation = state.latchedError !== null

  useEffect(() => {
    onStackChange?.([...buildStackRows(state)])
  }, [onStackChange, state])

  useEffect(() => {
    if (!improperOperation) {
      setImproperOperationVisible(true)
      return
    }

    setImproperOperationVisible(true)
    const interval = window.setInterval(() => {
      setImproperOperationVisible((visible) => !visible)
    }, 500)

    return () => window.clearInterval(interval)
  }, [improperOperation])

  const dispatchToken = useCallback((token: CalculatorToken) => {
    setState((current) => pressToken(current, token))
  }, [])

  const dispatchReset = useCallback(() => {
    setState(resetCalculator())
  }, [])

  const dispatchClearX = useCallback(() => {
    setState((current) => clearXRegister(current))
  }, [])

  useLayoutEffect(() => {
    if (resetNonce === lastResetNonceRef.current) {
      return
    }
    dispatchReset()
    lastResetNonceRef.current = resetNonce
  }, [dispatchReset, resetNonce])

  useLayoutEffect(() => {
    if (clearXNonce === lastClearXNonceRef.current) {
      return
    }
    dispatchClearX()
    lastClearXNonceRef.current = clearXNonce
  }, [clearXNonce, dispatchClearX])

  return {
    display,
    improperOperation,
    improperOperationVisible,
    pressToken: dispatchToken,
  }
}
