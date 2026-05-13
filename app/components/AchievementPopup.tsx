'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Achievement, getRarityColor, getRarityLabel } from '@/app/lib/achievements'

interface Props {
  achievements: Achievement[]
}

export default function AchievementPopup({ achievements }: Props) {
  const [queue, setQueue] = useState<Achievement[]>([])
  const [current, setCurrent] = useState<Achievement | null>(null)
  const [show, setShow] = useState(false)

  useEffect(() => {
    if (achievements.length > 0) {
      setQueue((prev) => [...prev, ...achievements])
    }
  }, [achievements])

  useEffect(() => {
    if (!show && queue.length > 0 && !current) {
      const next = queue[0]
      setCurrent(next)
      setQueue((prev) => prev.slice(1))
      setShow(true)

      const timer = setTimeout(() => {
        setShow(false)
        setTimeout(() => setCurrent(null), 500)
      }, 3500)

      return () => clearTimeout(timer)
    }
  }, [queue, show, current])

  return (
    <AnimatePresence>
      {show && current && (
        <motion.div
          className="fixed top-6 left-1/2 z-[100]"
          style={{ x: '-50%' }}
          initial={{ opacity: 0, y: -30, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        >
          <div className="relative px-5 py-4 rounded-2xl bg-white/95 backdrop-blur-md border border-warm-gold/30 shadow-2xl shadow-warm-gold/10 min-w-[280px]">
            {/* 光效边框 */}
            <div className="absolute inset-0 rounded-2xl border-2 border-warm-gold/20 animate-pulse pointer-events-none" />

            <div className="flex items-center gap-3">
              {/* 图标 */}
              <motion.div
                className="w-12 h-12 rounded-xl bg-warm-gold/10 flex items-center justify-center text-2xl"
                animate={{ rotate: [0, -10, 10, -5, 5, 0], scale: [1, 1.2, 1] }}
                transition={{ duration: 0.8, delay: 0.2 }}
              >
                {current.icon}
              </motion.div>

              <div className="flex-1">
                <p className="text-[10px] text-warm-gold tracking-wider mb-0.5">
                  成就解锁 · {getRarityLabel(current.rarity)}
                </p>
                <h4 className="text-sm font-medium text-deep-brown">
                  {current.title}
                </h4>
                <p className="text-[11px] text-deep-brown/50 mt-0.5">
                  {current.description}
                </p>
              </div>

              {/* 稀有度标签 */}
              <span
                className={`text-[9px] px-2 py-0.5 rounded-full border ${getRarityColor(current.rarity)}`}
              >
                {getRarityLabel(current.rarity)}
              </span>
            </div>

            {/* 进度提示 */}
            {queue.length > 0 && (
              <p className="text-[9px] text-deep-brown/30 mt-2 text-center">
                还有 {queue.length} 个成就...
              </p>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
