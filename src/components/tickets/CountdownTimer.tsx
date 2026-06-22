'use client'
import { useState, useEffect, useRef } from 'react'

interface CountdownTimerProps {
  expiresAt: Date | string
  onExpire?: () => void
  className?: string
}

function getTimeLeft(target: Date) {
  const diff = target.getTime() - Date.now()
  if (diff <= 0) return { h: 0, m: 0, s: 0, expired: true }
  return {
    h: Math.floor(diff / 3_600_000),
    m: Math.floor((diff % 3_600_000) / 60_000),
    s: Math.floor((diff % 60_000) / 1_000),
    expired: false,
  }
}

export default function CountdownTimer({ expiresAt, onExpire, className = '' }: CountdownTimerProps) {
  const target = expiresAt instanceof Date ? expiresAt : new Date(expiresAt)
  const [time, setTime] = useState(() => getTimeLeft(target))
  const calledExpire = useRef(false)

  useEffect(() => {
    if (time.expired) return
    const id = setInterval(() => {
      const next = getTimeLeft(target)
      setTime(next)
      if (next.expired && !calledExpire.current) {
        calledExpire.current = true
        onExpire?.()
      }
    }, 1000)
    return () => clearInterval(id)
  }, [target, onExpire, time.expired])

  const isUrgent = !time.expired && time.h === 0 && time.m < 30
  const pad = (n: number) => String(n).padStart(2, '0')

  if (time.expired) {
    return (
      <span className={`text-label text-fg-muted ${className}`} role="status" aria-live="polite">
        EXPIRADO
      </span>
    )
  }

  return (
    <span
      role="timer"
      aria-label={`Expira en ${time.h}h ${time.m}m ${time.s}s`}
      aria-live="off"
      className={`font-mono tabular-nums font-600 text-sm ${isUrgent ? 'text-accent animate-pulse-urgent' : 'text-yellow'} ${className}`}
    >
      {time.h > 0 && <>{pad(time.h)}<span className="text-fg-subtle">h</span> </>}
      {pad(time.m)}<span className="text-fg-subtle">m</span> {pad(time.s)}<span className="text-fg-subtle">s</span>
    </span>
  )
}
