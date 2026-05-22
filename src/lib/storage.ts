// Local-first persistence. All working data stays in the browser —
// no account, no network required. The export bridge is the only thing
// that ever talks to a server, and only when the user asks for a PDF.
import { useCallback, useEffect, useRef, useState } from 'react'

const NS = 'mmc:v1:'

export function loadDoc<T>(toolId: string): T | null {
  try {
    const raw = localStorage.getItem(NS + toolId)
    return raw ? (JSON.parse(raw) as T) : null
  } catch {
    return null
  }
}

export function saveDoc<T>(toolId: string, doc: T): void {
  try {
    localStorage.setItem(NS + toolId, JSON.stringify(doc))
  } catch {
    // Storage full or unavailable — fail quietly, the tool still works.
  }
}

export function clearDoc(toolId: string): void {
  try {
    localStorage.removeItem(NS + toolId)
  } catch {
    /* ignore */
  }
}

export function hasDoc(toolId: string): boolean {
  try {
    return localStorage.getItem(NS + toolId) !== null
  } catch {
    return false
  }
}

const EMAIL_KEY = NS + 'export-email'
export function rememberEmail(email: string): void {
  try {
    localStorage.setItem(EMAIL_KEY, email)
  } catch {
    /* ignore */
  }
}
export function recalledEmail(): string {
  try {
    return localStorage.getItem(EMAIL_KEY) ?? ''
  } catch {
    return ''
  }
}

/**
 * A piece of state that auto-persists to localStorage (debounced).
 * Returns the document, a setter, and a `savedAt` timestamp.
 */
export function usePersistentDoc<T>(
  toolId: string,
  initial: T | (() => T),
): [T, (next: T | ((prev: T) => T)) => void, number | null] {
  const [doc, setDocState] = useState<T>(() => {
    const stored = loadDoc<T>(toolId)
    if (stored !== null) return stored
    return typeof initial === 'function' ? (initial as () => T)() : initial
  })
  const [savedAt, setSavedAt] = useState<number | null>(
    hasDoc(toolId) ? Date.now() : null,
  )
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const setDoc = useCallback(
    (next: T | ((prev: T) => T)) => {
      setDocState((prev) =>
        typeof next === 'function' ? (next as (p: T) => T)(prev) : next,
      )
    },
    [],
  )

  useEffect(() => {
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => {
      saveDoc(toolId, doc)
      setSavedAt(Date.now())
    }, 350)
    return () => {
      if (timer.current) clearTimeout(timer.current)
    }
  }, [toolId, doc])

  return [doc, setDoc, savedAt]
}
