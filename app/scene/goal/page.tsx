'use client'

import { Suspense } from 'react'
import GoalPageContent from './GoalPageContent'

export default function GoalPage() {
  return (
    <Suspense fallback={
      <div className="w-screen h-screen bg-cream flex items-center justify-center">
        <div className="text-sm text-deep-brown/40">加载中...</div>
      </div>
    }>
      <GoalPageContent />
    </Suspense>
  )
}
