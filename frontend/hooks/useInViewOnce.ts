import { useEffect, useRef, useState, type RefObject } from "react"

interface UseInViewOnceResult<T extends HTMLElement> {
  ref: RefObject<T>
  inView: boolean
}

/**
 * Observa el elemento y marca `inView` en true la primera vez que entra al viewport.
 * Prefetch anticipado con rootMargin y desconecta el observer luego de activarse.
 */
export function useInViewOnce<T extends HTMLElement>(): UseInViewOnceResult<T> {
  const ref = useRef<T | null>(null)
  const [inView, setInView] = useState(false)

  useEffect(() => {
    const node = ref.current
    if (!node || inView) return

    if (typeof IntersectionObserver === "undefined") {
      // Entornos sin IO (SSR/hydration fallback)
      setInView(true)
      return
    }

    const observer = new IntersectionObserver(
      (entries, obs) => {
        const entry = entries[0]
        if (entry?.isIntersecting) {
          setInView(true)
          obs.disconnect()
        }
      },
      { rootMargin: "200px" }
    )

    observer.observe(node)
    return () => observer.disconnect()
  }, [inView])

  return { ref, inView }
}

