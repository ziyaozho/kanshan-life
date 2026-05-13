'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter, useSearchParams } from 'next/navigation'
import Liukanshan from '@/app/components/Liukanshan'

type Step = 'ask' | 'input' | 'analyzing'

export default function GoalPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const isFirstTime = searchParams.get('first') === 'true'
  const [step, setStep] = useState<Step>('ask')
  const [hasGoal, setHasGoal] = useState<boolean | null>(null)
  const [userGoal, setUserGoal] = useState('')
  const [userMbti, setUserMbti] = useState('')
  const [userHobbies, setUserHobbies] = useState('')

  useEffect(() => {
    setUserMbti(localStorage.getItem('userMbti') || '')
    setUserHobbies(localStorage.getItem('userHobbies') || '')
  }, [])

  const nextPath = isFirstTime ? '/scene/profile' : '/scene/hall'

  const handleChoice = (has: boolean) => {
    setHasGoal(has)
    if (has) {
      setStep('input')
    } else {
      localStorage.removeItem('userGoal')
      setStep('analyzing')
      setTimeout(() => {
        router.push(nextPath)
      }, 2000)
    }
  }

  const handleSubmit = () => {
    if (!userGoal.trim()) return
    localStorage.setItem('userGoal', userGoal.trim())
    setStep('analyzing')
    setTimeout(() => {
      router.push(nextPath)
    }, 2500)
  }

  return (
    <motion.main
      className="relative w-screen h-screen overflow-hidden bg-cream flex flex-col items-center justify-center px-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 1.2, ease: 'easeInOut' }}
    >
      <motion.button
        className="fixed top-4 left-4 z-50 px-3 py-1.5 rounded-full bg-white/60 backdrop-blur-sm text-deep-brown/50 text-xs hover:bg-white/80 transition-all flex items-center gap-1 border border-deep-brown/5"
        onClick={() => router.push('/scene/hall')}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M9 2L4 7L9 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
        回大厅
      </motion.button>

      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse at 50% 40%, rgba(230, 184, 156, 0.12) 0%, transparent 60%)',
        }}
      />

      <AnimatePresence mode="wait">
        {step === 'ask' && (
          <motion.div
            key="ask"
            className="relative z-10 flex flex-col items-center max-w-md w-full"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.6 }}
          >
            <Liukanshan width={100} variant="floating" animate />

            <div className="mt-4 flex items-center gap-2 flex-wrap justify-center">
              {userMbti && (
                <span className="px-3 py-1 rounded-full text-[10px] tracking-wider bg-warm-gold/15 text-warm-gold border border-warm-gold/20">
                  {userMbti}
                </span>
              )}
              {userHobbies.split(/[,，、\s]+/).filter(Boolean).slice(0, 3).map((h) => (
                <span
                  key={h}
                  className="px-3 py-1 rounded-full text-[10px] tracking-wider bg-deep-brown/5 text-deep-brown/50 border border-deep-brown/10"
                >
                  {h}
                </span>
              ))}
            </div>

            <h2 className="mt-6 text-deep-brown font-serif text-xl md:text-2xl text-center tracking-wide leading-relaxed">
              你现在有明确的人生目标吗？
            </h2>
            <p className="mt-3 text-deep-brown/40 text-sm text-center leading-relaxed">
              如果有，我会围绕它为你拆解阶段性任务；<br />如果没有，我会根据你的图谱帮你探索。
            </p>

            <div className="mt-8 w-full flex flex-col gap-3">
              <motion.button
                onClick={() => handleChoice(true)}
                className="w-full px-6 py-4 rounded-2xl text-sm tracking-wide text-center transition-all border bg-warm-gold/10 border-warm-gold/30 text-deep-brown hover:bg-warm-gold/20"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
              >
                有，我想围绕一个目标前进
              </motion.button>
              <motion.button
                onClick={() => handleChoice(false)}
                className="w-full px-6 py-4 rounded-2xl text-sm tracking-wide text-center transition-all border bg-white/40 border-deep-brown/10 text-deep-brown/60 hover:bg-white/60"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
              >
                还没有，帮我探索一下
              </motion.button>
            </div>
          </motion.div>
        )}

        {step === 'input' && (
          <motion.div
            key="input"
            className="relative z-10 flex flex-col items-center max-w-md w-full"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.6 }}
          >
            <Liukanshan width={80} variant="floating" animate />

            <h2 className="mt-4 text-deep-brown font-serif text-xl text-center tracking-wide">
              告诉我你的目标
            </h2>
            <p className="mt-2 text-deep-brown/40 text-sm text-center">
              越具体越好，比如时间、数字、可衡量的结果
            </p>

            <textarea
              value={userGoal}
              onChange={(e) => setUserGoal(e.target.value)}
              placeholder="比如：我想在6个月内学会弹吉他，能完整弹唱5首歌..."
              rows={4}
              className="mt-6 w-full px-4 py-3 rounded-2xl bg-white/60 border border-warm-gold/20 text-sm text-deep-brown placeholder:text-deep-brown/30 focus:outline-none focus:border-warm-gold/50 transition-all resize-none leading-relaxed"
            />

            <motion.button
              onClick={handleSubmit}
              className={`mt-4 w-full py-3 rounded-2xl text-center text-sm tracking-wide font-medium transition-all duration-300 ${
                userGoal.trim()
                  ? 'bg-warm-gold text-white shadow-lg shadow-warm-gold/30'
                  : 'bg-deep-brown/10 text-deep-brown/40 cursor-not-allowed'
              }`}
              whileHover={userGoal.trim() ? { scale: 1.02 } : {}}
              whileTap={userGoal.trim() ? { scale: 0.98 } : {}}
            >
              {userGoal.trim() ? '确认目标，进入人生大厅 →' : '请描述你的目标'}
            </motion.button>
          </motion.div>
        )}

        {step === 'analyzing' && (
          <motion.div
            key="analyzing"
            className="relative z-10 flex flex-col items-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <Liukanshan width={100} variant="floating" animate />
            <motion.p
              className="mt-4 text-deep-brown/60 text-sm tracking-wide"
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              {hasGoal
                ? '正在根据你的目标拆解阶段性任务...'
                : '正在根据你的图谱生成探索任务...'}
            </motion.p>
            <div className="mt-6 w-48 h-1 rounded-full bg-deep-brown/10 overflow-hidden">
              <motion.div
                className="h-full bg-warm-gold rounded-full"
                initial={{ width: '0%' }}
                animate={{ width: '100%' }}
                transition={{ duration: 2, ease: 'easeInOut' }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.main>
  )
}
