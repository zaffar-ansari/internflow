import React from 'react'

export default function ScoreBar({ score, max = 10.0 }) {
  const percentage = Math.min(100, Math.max(0, (score / max) * 100))
  
  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-1">
        <span className="text-sm font-medium text-gray-700">Productivity Score</span>
        <span className="text-sm font-bold text-primary-600">{score} / {max}</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2.5">
        <div 
          className="bg-primary-600 h-2.5 rounded-full transition-all duration-500" 
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
    </div>
  )
}
