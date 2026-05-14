'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'
import { getCompletedTasks, type Task } from '@/app/lib/tasks'

interface CompletedTask {
  title: string
  date: string
  type: string
  note?: string
  skillName?: string
  changes?: Record<string, number>
}

// 书架上的书槽位 — 对应背景图中每本书的位置（基于图片百分比坐标）
// 已完成的任务按时间顺序映射
const bookSlots = [
  { x: 21.3, y: 58.3, w: 4, h: 14 },
  { x: 23.8, y: 58.4, w: 3.5, h: 14 },
  { x: 25.9, y: 59.6, w: 3.5, h: 14 },
  { x: 28.2, y: 60.2, w: 4, h: 14 },
  { x: 36.7, y: 60.2, w: 3.5, h: 14 },
  { x: 38.8, y: 60.2, w: 3, h: 14 },
  { x: 40.8, y: 59.9, w: 3.5, h: 14 },
  { x: 42.5, y: 60.4, w: 3.5, h: 14 },
  { x: 66.7, y: 59.6, w: 3.5, h: 14 },
  { x: 68.8, y: 59.9, w: 3.5, h: 14 },
  { x: 70.7, y: 60.3, w: 3.5, h: 14 },
  { x: 73.1, y: 58.9, w: 4, h: 14 },
  { x: 82.4, y: 61.1, w: 3.5, h: 14 },
  { x: 84.3, y: 60.2, w: 3.5, h: 14 },
  { x: 86.0, y: 58.8, w: 4, h: 14 },
  { x: 87.9, y: 60.2, w: 3.5, h: 14 },
  { x: 21.3, y: 79.2, w: 3, h: 14 },
  { x: 22.9, y: 79.1, w: 3.5, h: 14 },
  { x: 24.8, y: 79.6, w: 3.5, h: 14 },
  { x: 26.5, y: 80.0, w: 3.5, h: 14 },
  { x: 28.9, y: 79.4, w: 3.5, h: 14 },
  { x: 34.3, y: 79.6, w: 3.5, h: 14 },
  { x: 36.0, y: 80.3, w: 4, h: 14 },
  { x: 38.1, y: 79.1, w: 3.5, h: 14 },
  { x: 40.1, y: 79.4, w: 3.5, h: 14 },
  { x: 42.0, y: 78.7, w: 4, h: 14 },
  { x: 66.7, y: 79.1, w: 3.5, h: 14 },
  { x: 68.7, y: 79.6, w: 3, h: 14 },
  { x: 68.5, y: 36.0, w: 3.5, h: 14 },
  { x: 72.5, y: 36.0, w: 3.5, h: 14 },
  { x: 76.5, y: 36.0, w: 3.5, h: 14 },
  { x: 80.5, y: 36.0, w: 3.5, h: 14 },
  { x: 84.5, y: 36.0, w: 3.5, h: 14 },
]

const dimLabels: Record<string, string> = {
  clarity: '人生清晰度',
  skill: '技能掌控感',
  passion: '热情驱动力',
  social: '社交连接度',
  emotion: '情绪稳定性',
  family: '家庭和解度',
}

export default function BookshelfPage() {
  const router = useRouter()
  const [completedTasks, setCompletedTasks] = useState<CompletedTask[]>([])
  const [selectedTask, setSelectedTask] = useState<CompletedTask | null>(null)
  const [showDetail, setShowDetail] = useState(false)
  const [hoveredSlot, setHoveredSlot] = useState<number | null>(null)
  const slots = bookSlots

  useEffect(() => {
    // 使用统一任务API读取已完成任务
    const tasks = getCompletedTasks()
    const list: CompletedTask[] = tasks
      .filter((t) => t.status === 'completed')
      .sort((a, b) => new Date(b.completedAt || b.createdAt).getTime() - new Date(a.completedAt || a.createdAt).getTime())
      .map((t) => ({
        title: t.title,
        date: t.completedAt || t.createdAt,
        type: t.type,
        note: t.note,
        skillName: t.skillName,
        changes: t.changes,
      }))
    setCompletedTasks(list)
  }, [])

  const getFruitBrightness = (dateStr: string) => {
    const date = new Date(dateStr)
    const now = new Date()
    const hoursAgo = (now.getTime() - date.getTime()) / (1000 * 60 * 60)

    if (hoursAgo < 24) {
      return {
        shadow: '0 0 12px 3px rgba(230, 184, 156, 0.7), 0 0 24px 6px rgba(230, 184, 156, 0.4)',
        pulse: true,
      }
    } else if (hoursAgo < 168) {
      return {
        shadow: '0 0 8px 2px rgba(230, 184, 156, 0.5), 0 0 16px 4px rgba(230, 184, 156, 0.25)',
        pulse: false,
      }
    } else {
      return {
        shadow: '0 0 6px 2px rgba(200, 160, 110, 0.35), 0 0 12px 3px rgba(200, 160, 110, 0.15)',
        pulse: false,
      }
    }
  }

  return (
    <motion.main
      className="relative w-screen h-screen overflow-hidden bg-cream"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 1.2, ease: 'easeInOut' }}
    >
      {/* 顶部导航 */}
      <motion.div
        className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-6 py-4"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <button
          onClick={() => router.push('/scene/hall')}
          className="text-xs text-deep-brown/40 hover:text-deep-brown/70 transition-colors flex items-center gap-1"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M10 3L5 8L10 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          回大厅
        </button>
        <div className="absolute left-1/2 -translate-x-1/2"></div>
        <div className="flex items-center gap-4">
          <div className="relative" style={{ width: 420, height: 120 }}>
            <Image
              src="/images/shufang-title.png"
              alt="看山的书房"
              fill
              className="object-contain"
              priority
            />
          </div>
          <span className="text-[10px] text-deep-brown/30">
            {completedTasks.length} 本
          </span>
        </div>
      </motion.div>

      {/* 书架背景 + 书层 */}
      <div className="absolute inset-0 flex items-center justify-center bg-cream">
        <div
          className="relative"
          style={{
            width: '100%',
            height: '100%',
            maxWidth: '177.78vh',
            maxHeight: '56.25vw',
          }}
        >
          {/* 背景图 — object-cover 填满同比例容器，无黑边 */}
          <Image
            src="/images/bookshelf-bg.png"
            alt="刘看山的书架"
            fill
            className="object-cover"
            priority
          />

          {/* 书槽位 — 每本书中心点的亮点 */}
          <div className="absolute inset-0">
            {/* 已点亮书之间的连线 */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 2 }}>
              <defs>
                <linearGradient id="lightLine" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="rgba(255,200,120,0.6)" />
                  <stop offset="50%" stopColor="rgba(255,220,160,0.9)" />
                  <stop offset="100%" stopColor="rgba(255,200,120,0.6)" />
                </linearGradient>
                <filter id="lineGlow">
                  <feGaussianBlur stdDeviation="2" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>
              {completedTasks.length > 1 &&
                Array.from({ length: completedTasks.length - 1 }, (_, i) => {
                  const from = slots[i]
                  const to = slots[i + 1]
                  if (!from || !to) return null
                  return (
                    <motion.line
                      key={`line-${i}`}
                      x1={`${from.x}%`}
                      y1={`${from.y}%`}
                      x2={`${to.x}%`}
                      y2={`${to.y}%`}
                      stroke="url(#lightLine)"
                      strokeWidth="1.5"
                      filter="url(#lineGlow)"
                      strokeDasharray="4 3"
                      initial={{ pathLength: 0, opacity: 0 }}
                      animate={{ pathLength: 1, opacity: 0.7 }}
                      transition={{ delay: 0.8 + i * 0.1, duration: 0.8 }}
                    />
                  )
                })}
            </svg>

            {slots.map((slot, i) => {
              const task = completedTasks[i]
              const isLit = !!task
              const isHovered = hoveredSlot === i
              const brightness = task ? getFruitBrightness(task.date) : null

              return (
                <motion.div
                  key={i}
                  className="absolute flex items-center justify-center"
                  style={{
                    left: `${slot.x}%`,
                    top: `${slot.y}%`,
                    transform: 'translate(-50%, -50%)',
                    cursor: isLit ? 'pointer' : 'default',
                    zIndex: isHovered ? 10 : 3,
                    width: isLit ? 32 : 0,
                    height: isLit ? 32 : 0,
                  }}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.5 + i * 0.03 }}
                  onMouseEnter={() => isLit && setHoveredSlot(i)}
                  onMouseLeave={() => setHoveredSlot(null)}
                  onClick={() => {
                    if (task) {
                      setSelectedTask(task)
                      setShowDetail(true)
                    }
                  }}
                >
                  {/* 已完成的书：发光亮点 */}
                  {isLit && (
                    <>
                      {/* 外层光晕 */}
                      <motion.div
                        className="absolute w-10 h-10 rounded-full pointer-events-none"
                        style={{
                          background: 'radial-gradient(circle, rgba(255,200,100,0.25) 0%, rgba(255,180,80,0.1) 50%, transparent 70%)',
                        }}
                        animate={
                          brightness?.pulse
                            ? { scale: [1, 1.4, 1], opacity: [0.5, 0.8, 0.5] }
                            : {}
                        }
                        transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
                      />
                      {/* 中层光晕 */}
                      <motion.div
                        className="absolute w-6 h-6 rounded-full pointer-events-none"
                        style={{
                          background: 'radial-gradient(circle, rgba(255,220,150,0.5) 0%, rgba(255,200,120,0.2) 50%, transparent 70%)',
                          boxShadow: brightness?.shadow,
                        }}
                        animate={
                          brightness?.pulse
                            ? { scale: [1, 1.3, 1], opacity: [0.6, 1, 0.6] }
                            : {}
                        }
                        transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
                      />
                      {/* 核心亮点 */}
                      <motion.div
                        className="relative w-3 h-3 rounded-full pointer-events-none"
                        style={{
                          background: 'radial-gradient(circle, #fff8e0 0%, #ffd580 40%, #e6a840 70%)',
                          boxShadow: `0 0 6px 2px rgba(255,200,80,0.8), 0 0 14px 4px rgba(255,180,60,0.5), ${brightness?.shadow || ''}`,
                        }}
                        animate={
                          brightness?.pulse
                            ? { scale: [1, 1.2, 1], opacity: [0.9, 1, 0.9] }
                            : {}
                        }
                        transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
                      />
                    </>
                  )}

                  {/* 悬停光环 */}
                  {isLit && isHovered && (
                    <motion.div
                      className="absolute w-12 h-12 rounded-full border border-warm-gold/40 pointer-events-none"
                      initial={{ opacity: 0, scale: 0.5 }}
                      animate={{ opacity: 1, scale: 1 }}
                      style={{
                        boxShadow: '0 0 16px 4px rgba(255, 200, 100, 0.35), inset 0 0 10px 2px rgba(255, 200, 100, 0.1)',
                      }}
                    />
                  )}
                </motion.div>
              )
            })}
          </div>

          {/* 悬停 tooltip */}
          {hoveredSlot !== null && completedTasks[hoveredSlot] && (
            <motion.div
              className="absolute z-30 pointer-events-none"
              style={{
                left: `${slots[hoveredSlot].x}%`,
                top: `${slots[hoveredSlot].y - 12}%`,
                transform: 'translate(-50%, -100%)',
              }}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              <div className="px-3 py-2 rounded-xl bg-white/90 backdrop-blur-md border border-warm-gold/20 shadow-lg">
                <p className="text-[11px] text-deep-brown font-medium whitespace-nowrap max-w-[200px] truncate">
                  {completedTasks[hoveredSlot].title}
                </p>
                <p className="text-[9px] text-deep-brown/40 mt-0.5">
                  {new Date(completedTasks[hoveredSlot].date).toLocaleDateString('zh-CN')}
                </p>
                <p className="text-[9px] text-warm-gold mt-1">点击回顾这段经历</p>
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* 底部提示 */}
      {completedTasks.length === 0 && (
        <motion.div
          className="absolute bottom-8 left-1/2 -translate-x-1/2 text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
        >
          <p className="text-xs text-deep-brown/30">完成第一个任务，书架上的书就会亮起</p>
        </motion.div>
      )}

      {/* 任务详情弹窗 */}
      <AnimatePresence>
        {showDetail && selectedTask && (
          <motion.div
            className="fixed inset-0 z-[90] flex items-center justify-center bg-black/40 backdrop-blur-sm px-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowDetail(false)}
          >
            <motion.div
              className="w-full max-w-[380px] glass-card p-6 rounded-3xl border border-warm-gold/20 shadow-2xl"
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-warm-gold" />
                  <span className="text-[10px] text-warm-gold tracking-wider">
                    {selectedTask.type === 'main' ? '主线任务' : '支线任务'}
                  </span>
                </div>
                <button
                  onClick={() => setShowDetail(false)}
                  className="w-7 h-7 rounded-full bg-deep-brown/5 text-deep-brown/40 hover:bg-deep-brown/10 flex items-center justify-center text-xs transition-all"
                >
                  ✕
                </button>
              </div>

              <h3 className="text-lg font-serif text-deep-brown mb-2">
                {selectedTask.title}
              </h3>
              <p className="text-[10px] text-deep-brown/40 mb-4">
                完成于 {new Date(selectedTask.date).toLocaleDateString('zh-CN')}{' '}
                {new Date(selectedTask.date).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
              </p>

              {selectedTask.note && (
                <div className="p-3 rounded-xl bg-white/50 border border-deep-brown/5 mb-4">
                  <p className="text-[10px] text-deep-brown/40 mb-1">你的记录</p>
                  <p className="text-sm text-deep-brown/70 leading-relaxed">{selectedTask.note}</p>
                </div>
              )}

              {selectedTask.skillName && (
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-warm-gold/15 text-warm-gold">
                    {selectedTask.skillName}
                  </span>
                </div>
              )}

              {selectedTask.changes && Object.entries(selectedTask.changes).length > 0 && (
                <div className="p-3 rounded-xl bg-white/50 border border-deep-brown/5">
                  <p className="text-[10px] text-deep-brown/40 mb-2">维度变化</p>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(selectedTask.changes).map(([dim, delta]) => (
                      <span
                        key={dim}
                        className="text-[10px] px-2 py-0.5 rounded-full bg-green-50 text-green-600 border border-green-100"
                      >
                        {dimLabels[dim] || dim} +{delta}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-4 flex justify-center">
                <motion.div
                  animate={{ rotate: [0, 5, -5, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <span className="text-2xl">🦊</span>
                </motion.div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.main>
  )
}
