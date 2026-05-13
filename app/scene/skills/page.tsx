'use client'

import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import SkillsTracker from '@/app/components/SkillsTracker'
import Liukanshan from '@/app/components/Liukanshan'

export default function SkillsPage() {
  const router = useRouter()

  return (
    <motion.main
      className="relative w-screen min-h-screen overflow-y-auto bg-cream"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 1.2, ease: 'easeInOut' }}
    >
      {/* 背景 */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse at 70% 20%, rgba(230, 184, 156, 0.08) 0%, transparent 50%)',
        }}
      />

      <div className="relative z-10 max-w-lg mx-auto px-6 py-12 md:py-16">
        {/* 头部 */}
        <motion.div
          className="flex items-start justify-between mb-8"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div>
            <h1 className="text-deep-brown font-serif text-2xl tracking-widest">
              技能掌握度
            </h1>
            <p className="text-deep-brown/40 text-xs mt-2 tracking-wider">
              记录你热爱的每件事，见证成长轨迹
            </p>
          </div>
          <Liukanshan width={60} variant="sitting" animate />
        </motion.div>

        {/* 技能追踪器 */}
        <motion.div
          className="glass-card p-6 md:p-8 rounded-3xl"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <SkillsTracker />
        </motion.div>

        {/* 底部导航 */}
        <motion.div
          className="mt-8 flex items-center justify-center gap-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
        >
          <motion.button
            onClick={() => router.push('/scene/hall')}
            className="px-6 py-2.5 rounded-full text-xs tracking-wider text-deep-brown border border-deep-brown/10 bg-white/40 hover:bg-white/60 transition-all"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            ← 返回大厅
          </motion.button>
          <motion.button
            onClick={() => router.push('/scene/profile')}
            className="px-6 py-2.5 rounded-full text-xs tracking-wider text-deep-brown border border-deep-brown/10 bg-white/40 hover:bg-white/60 transition-all"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            查看图谱
          </motion.button>
        </motion.div>
      </div>
    </motion.main>
  )
}
