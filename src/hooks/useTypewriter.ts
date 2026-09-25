import { useEffect, useState } from 'react'

/**
 * Reveals `text` one character per `intervalMs`, calling `onChar` with the 1-based
 * index and the character just revealed. Returns the text typed so far.
 *
 * State is only set from the timer, never synchronously in the effect, so a new
 * `text` (or `enabled` flipping off) reads as empty until its first tick.
 */
export function useTypewriter(
  text: string | null,
  intervalMs: number,
  onChar?: (index: number, char: string) => void,
  enabled = true
): string {
  const [typed, setTyped] = useState({ text: '', count: 0 })

  useEffect(() => {
    if (!text || !enabled) return
    let count = 0
    const id = setInterval(() => {
      count++
      if (count > text.length) {
        clearInterval(id)
        return
      }
      setTyped({ text, count })
      onChar?.(count, text[count - 1])
    }, intervalMs)
    return () => {
      clearInterval(id)
      setTyped({ text: '', count: 0 })
    }
  }, [text, intervalMs, onChar, enabled])

  return text && enabled && typed.text === text ? text.slice(0, typed.count) : ''
}
