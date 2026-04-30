'use client'

import { ReactNode } from 'react'

interface CardProps {
  title?: string
  value?: string | number
  subtitle?: string
  icon?: ReactNode
  gradient?: string
  className?: string
  children?: ReactNode
}

export default function Card({
  title,
  value,
  subtitle,
  icon,
  gradient,
  className = '',
  children,
}: CardProps) {
  if (children) {
    return (
      <div
        className={`rounded-2xl bg-card-bg border border-card-border p-6 shadow-lg transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${className}`}
      >
        {children}
      </div>
    )
  }

  return (
    <div
      className={`relative overflow-hidden rounded-2xl bg-card-bg border border-card-border p-6 shadow-lg transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${className}`}
    >
      {gradient && (
        <div
          className={`absolute inset-0 opacity-10 ${gradient}`}
          aria-hidden="true"
        />
      )}
      <div className="relative flex items-start justify-between">
        <div>
          {title && (
            <p className="text-sm font-medium text-muted mb-1">{title}</p>
          )}
          {value !== undefined && (
            <p className="text-3xl font-bold text-foreground tracking-tight">
              {value}
            </p>
          )}
          {subtitle && (
            <p className="text-sm text-muted mt-1">{subtitle}</p>
          )}
        </div>
        {icon && (
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary text-xl flex-shrink-0">
            {icon}
          </div>
        )}
      </div>
    </div>
  )
}
