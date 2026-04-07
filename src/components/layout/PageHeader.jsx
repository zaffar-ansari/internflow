import React from 'react'
import { format } from 'date-fns'
import { useAuth } from '../../context/AuthContext'

/**
 * Unified B&W hero page header.
 * Props:
 *   title       – main heading (required)
 *   description – subtitle line (optional)
 *   greeting    – show "Hey, [firstName] 👋" (optional)
 *   badge       – small pill top-right (optional)
 *   children    – CTA buttons rendered below title
 */
export default function PageHeader({ title, description, greeting = false, badge, children }) {
  const { user } = useAuth()
  const firstName = user?.user_metadata?.full_name?.split(' ')[0] || 'there'
  const todayFormatted = format(new Date(), 'EEEE, MMMM d')

  return (
    <div className="bg-gray-900 rounded-2xl p-5 sm:p-6 text-white mb-5 sm:mb-6">
      {/* Top row: date + optional badge */}
      <div className="flex items-center justify-between mb-1">
        <p className="text-gray-400 text-[11px] font-semibold uppercase tracking-widest">
          {todayFormatted}
        </p>
        {badge && (
          <span className="px-2.5 py-1 bg-white/10 text-white text-[10px] font-black uppercase tracking-wider rounded-lg border border-white/10">
            {badge}
          </span>
        )}
      </div>

      {/* Greeting line */}
      {greeting && (
        <p className="text-gray-400 text-sm font-medium mb-0.5">
          Hey, {firstName} 👋
        </p>
      )}

      {/* Main title */}
      <h1 className="text-2xl sm:text-3xl font-black tracking-tight mb-3 text-white">
        {title}
      </h1>

      {/* Description */}
      {description && (
        <p className="text-gray-400 text-sm mb-3">{description}</p>
      )}

      {/* CTA slot */}
      {children && (
        <div className="mt-1">{children}</div>
      )}
    </div>
  )
}
