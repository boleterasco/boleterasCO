'use client'
import { useEffect, useRef, type ReactNode, type CSSProperties } from 'react'

export default function Reveal({
  children,
  className = '',
  delay = 0,
  style,
}: {
  children: ReactNode
  className?: string
  delay?: number
  style?: CSSProperties
}) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    let timer: ReturnType<typeof setTimeout>
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          timer = setTimeout(() => el.classList.add('is-visible'), delay)
          observer.unobserve(el)
        }
      },
      { threshold: 0.06, rootMargin: '0px 0px -24px 0px' }
    )
    observer.observe(el)
    return () => { observer.disconnect(); clearTimeout(timer) }
  }, [delay])

  return (
    <div ref={ref} className={`reveal ${className}`} style={style}>
      {children}
    </div>
  )
}
