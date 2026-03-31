import React from 'react'
import { format } from 'date-fns'
import { useAuth } from '../../context/AuthContext'

/**
 * Unified page header — indigo gradient hero card matching the intern dashboard style.
 * Props:
 *   title        – main heading (required)
 *   description  – small subtitle under the title (optional)
 *   greeting     – if true, show "Hey, [firstName] 👋" above the title
 *   badge        – small pill text shown top-right (optional)
 *   children     – CTA / action buttons rendered bottom-left
 */
export default function PageHeader({ title, description, greeting = false, badge, children }) {
  const { user } = useAuth()
  const firstName = user?.user_metadata?.full_name?.split(' ')[0] || 'there'
  const todayFormatted = format(new Date(), 'EEEE, MMMM d')

  return (
    <div className="bg-gradient-to-r from-indigo-600 to-indigo-500 rounded-2xl p-5 sm:p-6 text-white mb-5 sm:mb-6">
      {/* Top row: date + optional badge */}
      <div className="flex items-center justify-between mb-1">
        <p className="text-indigo-200 text-[11px] font-semibold uppercase tracking-widest">
          {todayFormatted}
        </p>
        {badge && (
          <span className="px-2.5 py-1 bg-white/20 text-white text-[10px] font-black uppercase tracking-wider rounded-lg">
            {badge}
          </span>
        )}
      </div>

      {/* Greeting line */}
      {greeting && (
        <p className="text-indigo-200 text-sm font-medium mb-0.5">
          Hey, {firstName} 👋
        </p>
      )}

      {/* Main title */}
      <h1 className="text-2xl sm:text-3xl font-black tracking-tight mb-3">
        {title}
      </h1>

      {/* Description */}
      {description && (
        <p className="text-indigo-200 text-sm mb-3">{description}</p>
      )}

      {/* CTA slot */}
      {children && (
        <div className="mt-1">{children}</div>
      )}
    </div>
  )
}
