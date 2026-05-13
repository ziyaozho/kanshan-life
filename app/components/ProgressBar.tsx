'use client'

interface ProgressBarProps {
  progress: number
  className?: string
}

export default function ProgressBar({ progress, className = '' }: ProgressBarProps) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className="flex-1 progress-track">
        <div
          className="progress-fill"
          style={{ width: `${progress}%` }}
        />
      </div>
      <span className="text-sm text-deep-brown/70 font-medium min-w-[40px] text-right">
        {progress}%
      </span>
    </div>
  )
}
