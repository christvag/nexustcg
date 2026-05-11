'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { useCallback, useEffect, useRef, useState } from 'react'

type SetOpts = { resetKeys?: string[] }

/**
 * Read + write a single URL search param.
 * Returns [value, setValue] like useState. setValue('') or setValue(null) removes the key.
 *
 * Always uses router.replace with `scroll: false` so:
 *   - changing a filter doesn't pollute browser history
 *   - drilling down doesn't scroll-jump back to the page top
 *
 * `opts.resetKeys` lets a parent change clear deeper params atomically — e.g.
 * picking a different game should drop year/set/card from the URL in the same hop.
 */
export function useUrlParam(key: string, defaultValue = '') {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const value = searchParams.get(key) ?? defaultValue

  const setValue = useCallback(
    (next: string | null, opts?: SetOpts) => {
      const params = new URLSearchParams(searchParams.toString())
      if (next === null || next === '') params.delete(key)
      else params.set(key, next)
      if (opts?.resetKeys) for (const k of opts.resetKeys) params.delete(k)
      const qs = params.toString()
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false })
    },
    [key, pathname, router, searchParams]
  )

  return [value, setValue] as const
}

/**
 * Debounced URL-synced text value. Useful for search inputs:
 *   const [search, displayValue, setDisplay] = useDebouncedUrlParam('q', 300)
 * - `search` is the URL value (changes on debounce, drives data fetches)
 * - `displayValue` is the immediate input value (controlled component)
 * - `setDisplay` updates both immediately-visible text and (after delay) the URL
 *
 * Pagination etc. should reset whenever the URL value changes, not the display value.
 */
export function useDebouncedUrlParam(
  key: string,
  delayMs = 300,
  resetKeys: string[] = []
) {
  const [urlValue, setUrlValue] = useUrlParam(key)
  const [displayValue, setDisplayValue] = useState(urlValue)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastSyncedFromUrl = useRef(urlValue)

  // If something else changes the URL (e.g. clicking a "clear filters" button),
  // mirror it back into the input.
  useEffect(() => {
    if (urlValue !== lastSyncedFromUrl.current) {
      lastSyncedFromUrl.current = urlValue
      setDisplayValue(urlValue)
    }
  }, [urlValue])

  const setDisplay = useCallback(
    (next: string) => {
      setDisplayValue(next)
      if (timer.current) clearTimeout(timer.current)
      timer.current = setTimeout(() => {
        lastSyncedFromUrl.current = next
        setUrlValue(next === '' ? null : next, { resetKeys })
      }, delayMs)
    },
    [delayMs, resetKeys, setUrlValue]
  )

  // Flush pending debounce on unmount.
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current) }, [])

  return [urlValue, displayValue, setDisplay] as const
}
