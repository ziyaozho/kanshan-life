'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import Liukanshan from '@/app/components/Liukanshan'

// ==================== 数据定义 ====================

type DimensionKey = 'skill' | 'passion' | 'social' | 'emotion' | 'family' | 'clarity'

interface Option {
  text: string
  effects: Partial<Record<DimensionKey, number>>
}

interface Question {
  id: number
  category: string
  question: string
  options: Option[]
}

// MBTI 基础分值映射（16型）
const mbtiScores: Record<string, Partial<Record<DimensionKey, number>>> = {
  INTJ: { skill: +10, social: -10, clarity: +10 },
  INTP: { skill: +10, social: -10, passion: +5 },
  ENTJ: { skill: +10, social: +5, clarity: +10 },
  ENTP: { skill: +5, social: +10, clarity: +5 },
  INFJ: { emotion: +10, social: +5, clarity: +5 },
  INFP: { passion: +10, emotion: +10, clarity: -5 },
  ENFJ: { social: +10, emotion: +10, skill: +5 },
  ENFP: { passion: +10, social: +10, clarity: -5 },
  ISTJ: { skill: +10, clarity: +5, passion: -5 },
  ISFJ: { emotion: +10, family: +5, social: +5 },
  ESTJ: { skill: +10, clarity: +10, emotion: -5 },
  ESFJ: { social: +10, family: +5, skill: +5 },
  ISTP: { skill: +10, passion: +5, social: -10 },
  ISFP: { passion: +10, emotion: +10, social: -5 },
  ESTP: { social: +10, skill: +5, clarity: -5 },
  ESFP: { social: +10, passion: +10, clarity: -5 },
}

// 爱好关键词映射
const hobbyKeywords: Record<string, Partial<Record<DimensionKey, number>>> = {
  '编程': { skill: +10 }, '代码': { skill: +10 }, '开发': { skill: +10 },
  '写作': { skill: +5, passion: +5 }, '写': { skill: +5, passion: +5 },
  '读书': { skill: +5, emotion: +5 }, '阅读': { skill: +5, emotion: +5 },
  '画': { passion: +10 }, '美术': { passion: +10 },
  '音乐': { passion: +10 }, '吉他': { passion: +10 }, '钢琴': { passion: +10 },
  '摄影': { passion: +5, skill: +5 }, '拍照': { passion: +5, skill: +5 },
  '运动': { emotion: +10, social: +5 }, '健身': { emotion: +10 },
  '游戏': { passion: +5 }, '电竞': { passion: +5, skill: +5 },
  '旅行': { passion: +5, social: +5 }, '旅游': { passion: +5, social: +5 },
  '社交': { social: +10 }, '聚会': { social: +10 }, '派对': { social: +10 },
  '做饭': { passion: +5, family: +5 }, '烹饪': { passion: +5, family: +5 },
  '手工': { passion: +5, skill: +5 }, 'DIY': { passion: +5, skill: +5 },
  '电影': { passion: +5 }, '剧': { passion: +5 },
  '设计': { skill: +5, passion: +5 }, '艺术': { passion: +10 },
  '瑜伽': { emotion: +10 }, '冥想': { emotion: +10 },
  '跑步': { emotion: +5 }, '爬山': { emotion: +5, passion: +5 },
  '跳舞': { passion: +10, social: +5 }, '舞蹈': { passion: +10, social: +5 },
  '露营': { passion: +5, social: +5 }, '徒步': { passion: +5, emotion: +5 },
  '学习': { skill: +10 }, '研究': { skill: +10 },
  '创作': { passion: +10 }, '美食': { passion: +5, family: +5 },
}

// 原生家庭选择题（5题）
const questions: Question[] = [
  {
    id: 1,
    category: '原生家庭',
    question: '小时候，父母最常对你说的一句话是？',
    options: [
      { text: '"你真棒" / "我为你骄傲"', effects: { family: +15, emotion: +10 } },
      { text: '"要听话" / "别惹事" / "安分点"', effects: { family: -5, emotion: -5 } },
      { text: '"别人家的孩子..."', effects: { family: -15, emotion: -10 } },
      { text: '他们很少和我说话', effects: { family: -10, social: -5 } },
    ],
  },
  {
    id: 2,
    category: '原生家庭',
    question: '当你要做重大决定时，第一反应是？',
    options: [
      { text: '考虑父母会不会同意、高不高兴', effects: { family: -5, clarity: -5 } },
      { text: '先问朋友或伴侣的意见', effects: { social: +10 } },
      { text: '自己冷静分析，然后做决定', effects: { clarity: +10, emotion: +5 } },
      { text: '拖延、逃避，希望别人帮我决定', effects: { clarity: -15, emotion: -5 } },
    ],
  },
  {
    id: 3,
    category: '原生家庭',
    question: '用一个词形容你的童年家庭氛围？',
    options: [
      { text: '温暖、安全、有归属感', effects: { family: +15, emotion: +10 } },
      { text: '忙碌、冷漠、各过各的', effects: { family: -10, emotion: -5 } },
      { text: '紧张、压抑、小心翼翼', effects: { family: -15, emotion: -15 } },
      { text: '普通、平淡、没什么特别的', effects: { family: 0 } },
    ],
  },
  {
    id: 4,
    category: '原生家庭',
    question: '你对"成功"的第一印象来自哪里？',
    options: [
      { text: '父母的期望和他们定义的成功', effects: { family: -5, clarity: -5 } },
      { text: '社会标准——赚钱、地位、房子', effects: { clarity: -5, skill: +5 } },
      { text: '我自己内心的标准和价值感', effects: { clarity: +10, emotion: +10 } },
      { text: '我没有想过这个问题', effects: { clarity: -10 } },
    ],
  },
  {
    id: 5,
    category: '原生家庭',
    question: '如果可以回到童年，你最想做什么？',
    options: [
      { text: '告诉父母我真正的感受和需求', effects: { family: +5, emotion: +10 } },
      { text: '给自己更多玩和探索的时间', effects: { passion: +10, family: +5 } },
      { text: '学什么都不会改变什么的', effects: { emotion: -15, family: -10 } },
      { text: '我不想回去，现在的我更好了', effects: { emotion: +10, clarity: +5 } },
    ],
  },
]

// 刘看山陪伴语
const companionMessages: Record<number, string> = {
  1: '原生家庭是底色，不是牢笼。看见它，就是改变的开始。',
  3: '你已经比大多数人更诚实。这很难得。',
}

// ==================== 分值计算 ====================

function calculateScores(mbti: string, hobbies: string, answers: Record<number, number>): Record<DimensionKey, number> {
  const scores: Record<DimensionKey, number> = {
    skill: 50, passion: 50, social: 50, emotion: 50, family: 50, clarity: 50,
  }

  // 1. MBTI 基础偏移
  const mbtiType = mbti.toUpperCase().trim()
  const mbtiEffect = mbtiScores[mbtiType]
  if (mbtiEffect) {
    Object.entries(mbtiEffect).forEach(([key, val]) => {
      scores[key as DimensionKey] += val || 0
    })
  }

  // 2. 爱好关键词加分
  const hobbyList = hobbies.split(/[,，、\s]+/).filter(Boolean)
  hobbyList.forEach((hobby) => {
    Object.entries(hobbyKeywords).forEach(([keyword, effects]) => {
      if (hobby.includes(keyword)) {
        Object.entries(effects).forEach(([key, val]) => {
          scores[key as DimensionKey] += val || 0
        })
      }
    })
  })

  // 3. 原生家庭选择题累加
  Object.entries(answers).forEach(([qId, optIdx]) => {
    const q = questions.find((q2) => q2.id === Number(qId))
    if (q && q.options[optIdx]) {
      Object.entries(q.options[optIdx].effects).forEach(([key, val]) => {
        scores[key as DimensionKey] += val || 0
      })
    }
  })

  // 限制范围
  Object.keys(scores).forEach((key) => {
    scores[key as DimensionKey] = Math.max(0, Math.min(100, scores[key as DimensionKey]))
  })

  return scores
}

// ==================== 组件 ====================

type Phase = 'idle' | 'mbti' | 'hobbies' | 'questions' | 'video1' | 'midQuestion' | 'video2' | 'transitioning'

// 读取 cookie
function getCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'))
  return match ? decodeURIComponent(match[2]) : null
}

export default function TunnelPage() {
  const router = useRouter()
  const [phase, setPhase] = useState<Phase>('idle')
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<number, number>>({})
  const [showCompanion, setShowCompanion] = useState(false)
  const [mbtiInput, setMbtiInput] = useState('')
  const [hobbiesInput, setHobbiesInput] = useState('')
  const [showTransition, setShowTransition] = useState(false)
  const [zhihuUser, setZhihuUser] = useState<{ name?: string; avatar?: string } | null>(null)
  const video1Ref = useRef<HTMLVideoElement>(null)

  // 检测知乎登录状态
  useEffect(() => {
    const raw = getCookie('zhihu_user')
    if (raw) {
      try {
        setZhihuUser(JSON.parse(raw))
      } catch {
        // ignore
      }
    }
  }, [])

  const progress = ((currentIndex + 1) / questions.length) * 100
  const currentQuestion = questions[currentIndex]
  const companionMessage = companionMessages[currentIndex]

  const handleMbtiSubmit = useCallback(() => {
    const val = mbtiInput.trim().toUpperCase()
    if (val.length === 4 && /^[A-Z]{4}$/.test(val)) {
      setPhase('hobbies')
    } else {
      // 简单提示，Demo中允许继续
      setPhase('hobbies')
    }
  }, [mbtiInput])

  const handleHobbiesSubmit = useCallback(() => {
    // 把爱好自动同步到技能掌握度
    const hobbyList = hobbiesInput.split(/[,，、\s]+/).filter(Boolean)
    const existingRaw = localStorage.getItem('userSkills')
    const existing = existingRaw ? JSON.parse(existingRaw) : []
    const existingNames = new Set(existing.map((s: { name: string }) => s.name))
    const newSkills = hobbyList
      .filter((h) => !existingNames.has(h))
      .map((h) => ({
        id: Date.now().toString() + Math.random().toString(36).slice(2, 8),
        name: h,
        subtype: '一般',
        current: '刚开始',
        target: '熟练掌握',
        progress: 5,
        metrics: [
          { label: '投入时间', value: '待记录' },
          { label: '阶段目标', value: '待设置' },
        ],
      }))
    if (newSkills.length > 0) {
      localStorage.setItem('userSkills', JSON.stringify([...existing, ...newSkills]))
    }
    setPhase('questions')
  }, [hobbiesInput])

  const finishAndNavigate = useCallback(
    (finalAnswers: Record<number, number>) => {
      setShowTransition(true)
      const scores = calculateScores(mbtiInput, hobbiesInput, finalAnswers)
      localStorage.setItem('lifeQuestionsAnswers', JSON.stringify(finalAnswers))
      localStorage.setItem('lifeDimensions', JSON.stringify(scores))
      localStorage.setItem('userMbti', mbtiInput.trim().toUpperCase())
      localStorage.setItem('userHobbies', hobbiesInput.trim())
      setTimeout(() => {
        router.push('/scene/analysis')
      }, 1800)
    },
    [mbtiInput, hobbiesInput, router]
  )

  const handleOptionSelect = useCallback(
    (optionIndex: number) => {
      const nextAnswers = { ...answers, [currentQuestion.id]: optionIndex }
      setAnswers(nextAnswers)

      setTimeout(() => {
        if (currentIndex < questions.length - 1) {
          const nextIndex = currentIndex + 1
          if (companionMessages[currentIndex]) {
            setShowCompanion(true)
            setTimeout(() => {
              setShowCompanion(false)
              setCurrentIndex(nextIndex)
            }, 2500)
          } else {
            setCurrentIndex(nextIndex)
          }
        } else {
          // 最后一题答完，计算分值并跳转
          finishAndNavigate(nextAnswers)
        }
      }, 400)
    },
    [currentIndex, currentQuestion.id, answers, finishAndNavigate]
  )

  const handleVideo1Ended = useCallback(() => {
    if (video1Ref.current) video1Ref.current.pause()
    setPhase('midQuestion')
  }, [])

  const handleMidQuestionAnswer = useCallback((optionIndex: number) => {
    setAnswers((prev) => {
      const next = { ...prev, mid: optionIndex }
      localStorage.setItem('lifeQuestionsAnswers', JSON.stringify(next))
      return next
    })
    setTimeout(() => {
      setPhase('video2')
    }, 500)
  }, [])

  const handleVideo2Ended = useCallback(() => {
    setPhase('transitioning')
    localStorage.setItem('hasVisited', 'true')
    setTimeout(() => {
      router.push('/scene/analysis')
    }, 1500)
  }, [router])

  const startQuestions = useCallback(() => {
    setPhase('mbti')
    setCurrentIndex(0)
    setAnswers({})
    setShowCompanion(false)
    setMbtiInput('')
    setHobbiesInput('')
  }, [])

  return (
    <motion.main
      className="relative w-screen h-screen overflow-hidden bg-black"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 1.2, ease: 'easeInOut' }}
    >
      {/* 返回按钮 */}
      <motion.button
        className="fixed top-4 left-4 z-50 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-sm text-white/60 text-xs hover:bg-white/20 transition-all flex items-center gap-1"
        onClick={() => router.push('/scene/hall')}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M9 2L4 7L9 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
        回大厅
      </motion.button>

      {/* ========== 背景层：隧道循环视频 ========== */}
      <div className="absolute inset-0">
        <video
          autoPlay
          muted
          loop
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
          style={{
            filter:
              phase === 'questions' ? 'brightness(0.35) blur(2px)' : 'brightness(0.85)',
          }}
        >
          <source src="/videos/tunnel.mp4" type="video/mp4" />
        </video>
      </div>

      {/* 暗色遮罩（questions阶段） */}
      <AnimatePresence>
        {phase === 'questions' && (
          <motion.div
            className="absolute inset-0 bg-black/40 pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1 }}
          />
        )}
      </AnimatePresence>

      {/* 中央暖光（idle阶段） */}
      <AnimatePresence>
        {phase === 'idle' && (
          <motion.div
            className="absolute inset-0 pointer-events-none"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1 }}
            style={{
              background:
                'radial-gradient(ellipse at center 40%, rgba(230, 184, 156, 0.25) 0%, transparent 60%)',
            }}
          />
        )}
      </AnimatePresence>

      {/* ========== 视频1层 ========== */}
      <AnimatePresence>
        {phase === 'video1' && (
          <motion.div
            className="absolute inset-0 z-20"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1 }}
          >
            <video
              ref={video1Ref}
              autoPlay
              muted
              playsInline
              className="absolute inset-0 w-full h-full object-cover"
              onEnded={handleVideo1Ended}
            >
              <source src="/videos/enter1.mp4" type="video/mp4" />
            </video>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ========== 视频1与视频2之间：过渡问题 ========== */}
      <AnimatePresence>
        {phase === 'midQuestion' && (
          <motion.div
            className="absolute inset-0 z-20 flex flex-col items-center justify-center px-6 bg-black/60"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1 }}
          >
            <motion.div
              className="w-full max-w-lg flex flex-col items-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
            >
              <Liukanshan width={120} variant="floating" animate />
              <h2
                className="mt-8 text-white font-serif text-xl md:text-2xl text-center leading-relaxed mb-10 tracking-wide"
                style={{ textShadow: '0 2px 16px rgba(0,0,0,0.6)' }}
              >
                穿过这道门，就是第二幕了。你准备好了吗？
              </h2>
              <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-3">
                {['我准备好了', '请牵着我的手', '让我再看一眼过去', '有点害怕，但我想试试'].map((opt, i) => (
                  <motion.button
                    key={i}
                    onClick={() => handleMidQuestionAnswer(i)}
                    className="w-full px-5 py-3.5 rounded-2xl text-sm text-center tracking-wide transition-all duration-300 border bg-white/10 border-white/20 text-white/80 hover:bg-white/20 hover:border-white/40"
                    style={{ backdropFilter: 'blur(8px)' }}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                  >
                    {opt}
                  </motion.button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ========== 视频2层（transitioning阶段也保持显示，让白屏直接覆盖） ========== */}
      {(phase === 'video2' || phase === 'transitioning') && (
        <motion.div
          className="absolute inset-0 z-20"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1 }}
        >
          <video
            autoPlay
            muted
            playsInline
            className="absolute inset-0 w-full h-full object-cover"
            onEnded={handleVideo2Ended}
          >
            <source src="/videos/enter2.mp4" type="video/mp4" />
          </video>
        </motion.div>
      )}

      {/* ========== IDLE：首页 ========== */}
      <AnimatePresence>
        {phase === 'idle' && (
          <>
            {/* 刘看山 */}
            <motion.div
              className="absolute left-1/2 bottom-[18%] md:bottom-[20%] z-10"
              style={{ x: '-50%' }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -30 }}
              transition={{ duration: 1, delay: 0.3 }}
            >
              <Liukanshan width={180} variant="floating" animate />
            </motion.div>

            {/* 底部文字和按钮 */}
            <motion.div
              className="absolute bottom-[8%] md:bottom-[10%] left-1/2 z-10"
              style={{ x: '-50%' }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.8, delay: 0.6 }}
            >
              <p
                className="text-center text-white/90 font-serif text-base md:text-lg tracking-wide mb-6 whitespace-nowrap"
                style={{ textShadow: '0 2px 12px rgba(62, 39, 35, 0.6)' }}
              >
                来吧。我们一起去看看，你是怎么变成现在的你的。
              </p>

              <div className="flex flex-col items-center gap-3">
                <button
                  onClick={startQuestions}
                  className="btn-warm text-white border-white/60 bg-white/10 hover:bg-white/20"
                  style={{
                    textShadow: '0 1px 6px rgba(62, 39, 35, 0.4)',
                    boxShadow: '0 0 20px rgba(230, 184, 156, 0.2)',
                  }}
                >
                  把手给我
                </button>

                {/* 知乎登录 */}
                {zhihuUser ? (
                  <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/20">
                    {zhihuUser.avatar ? (
                      <img src={zhihuUser.avatar} alt="" className="w-5 h-5 rounded-full" />
                    ) : (
                      <span className="text-xs">👤</span>
                    )}
                    <span className="text-xs text-white/80">{zhihuUser.name || '知乎用户'}</span>
                  </div>
                ) : (
                  <a
                    href="/api/auth/zhihu"
                    className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-white/10 border border-white/20 text-white/70 hover:bg-white/20 hover:text-white transition-all text-xs"
                  >
                    知乎登录
                  </a>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ========== MBTI 输入 ========== */}
      <AnimatePresence>
        {phase === 'mbti' && (
          <motion.div
            className="absolute inset-0 z-10 flex flex-col items-center justify-center px-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1 }}
          >
            <motion.div
              className="w-full max-w-md flex flex-col items-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
            >
              <Liukanshan width={100} variant="floating" animate />
              <h2
                className="mt-6 text-white font-serif text-xl md:text-2xl text-center tracking-wide"
                style={{ textShadow: '0 2px 16px rgba(0,0,0,0.6)' }}
              >
                请输入你的 MBTI 类型
              </h2>
              <p className="mt-2 text-white/40 text-sm text-center">
                不知道？先去 16personalities.com 测一下
              </p>

              <div className="mt-8 w-full flex flex-col items-center gap-4">
                <input
                  type="text"
                  value={mbtiInput}
                  onChange={(e) => setMbtiInput(e.target.value.toUpperCase())}
                  placeholder="例如：INTJ"
                  maxLength={4}
                  className="w-40 text-center px-4 py-3 rounded-2xl bg-white/10 border border-white/20 text-white text-lg tracking-[0.2em] placeholder:text-white/30 focus:outline-none focus:border-warm-gold/60 transition-all"
                  style={{ backdropFilter: 'blur(8px)' }}
                  onKeyDown={(e) => e.key === 'Enter' && handleMbtiSubmit()}
                />
                <motion.button
                  onClick={handleMbtiSubmit}
                  className="px-10 py-3 rounded-full text-sm tracking-widest text-white border border-warm-gold/40 bg-warm-gold/10 hover:bg-warm-gold/20 transition-all duration-300"
                  style={{ boxShadow: '0 0 20px rgba(230, 184, 156, 0.15)' }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  下一步
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ========== 爱好输入 ========== */}
      <AnimatePresence>
        {phase === 'hobbies' && (
          <motion.div
            className="absolute inset-0 z-10 flex flex-col items-center justify-center px-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1 }}
          >
            <motion.div
              className="w-full max-w-md flex flex-col items-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
            >
              <Liukanshan width={100} variant="floating" animate />
              <h2
                className="mt-6 text-white font-serif text-xl md:text-2xl text-center tracking-wide"
                style={{ textShadow: '0 2px 16px rgba(0,0,0,0.6)' }}
              >
                你最热衷的爱好是什么？
              </h2>
              <p className="mt-2 text-white/40 text-sm text-center">
                用逗号分隔，如：编程、画画、徒步
              </p>

              <div className="mt-8 w-full flex flex-col items-center gap-4">
                <textarea
                  value={hobbiesInput}
                  onChange={(e) => setHobbiesInput(e.target.value)}
                  placeholder="写下让你忘记时间的事..."
                  rows={3}
                  className="w-full max-w-sm px-4 py-3 rounded-2xl bg-white/10 border border-white/20 text-white text-sm tracking-wide placeholder:text-white/30 focus:outline-none focus:border-warm-gold/60 transition-all resize-none"
                  style={{ backdropFilter: 'blur(8px)' }}
                />
                <motion.button
                  onClick={handleHobbiesSubmit}
                  className="px-10 py-3 rounded-full text-sm tracking-widest text-white border border-warm-gold/40 bg-warm-gold/10 hover:bg-warm-gold/20 transition-all duration-300"
                  style={{ boxShadow: '0 0 20px rgba(230, 184, 156, 0.15)' }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  进入下一环节
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ========== QUESTIONS：问题流程 ========== */}
      <AnimatePresence>
        {phase === 'questions' && (
          <motion.div
            className="absolute inset-0 z-10 flex flex-col items-center justify-center px-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1 }}
          >
            {/* 顶部：进度条 + 题号 */}
            <motion.div
              className="absolute top-8 left-0 right-0 px-8 md:px-16"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-white/50 text-xs tracking-wider">
                  {currentQuestion.category}
                </span>
                <span className="text-white/50 text-xs tracking-wider">
                  第 {currentIndex + 1} 题 / {questions.length}
                </span>
              </div>
              <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-warm-gold rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.6, ease: 'easeOut' }}
                />
              </div>
            </motion.div>

            {/* 刘看山小头像（右上角） */}
            <motion.div
              className="absolute top-8 right-8 md:right-16"
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.7 }}
              transition={{ delay: 0.5 }}
            >
              <Liukanshan width={48} variant="floating" animate />
            </motion.div>

            {/* 问题与选项区域 */}
            <div className="w-full max-w-lg flex flex-col items-center">
              <AnimatePresence mode="wait">
                {!showCompanion ? (
                  <motion.div
                    key={currentQuestion.id}
                    className="w-full flex flex-col items-center"
                    initial={{ opacity: 0, x: 30 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -30 }}
                    transition={{ duration: 0.5, ease: 'easeInOut' }}
                  >
                    {/* 问题文案 */}
                    <h2
                      className="text-white font-serif text-xl md:text-2xl text-center leading-relaxed mb-10 tracking-wide"
                      style={{ textShadow: '0 2px 16px rgba(0,0,0,0.6)' }}
                    >
                      {currentQuestion.question}
                    </h2>

                    {/* 选项 */}
                    <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-3">
                      {currentQuestion.options.map((opt, i) => {
                        const isSelected = answers[currentQuestion.id] === i
                        return (
                          <motion.button
                            key={i}
                            onClick={() => handleOptionSelect(i)}
                            className={`w-full px-5 py-3.5 rounded-2xl text-sm text-center tracking-wide transition-all duration-300 border ${
                              isSelected
                                ? 'bg-warm-gold/90 border-warm-gold text-white shadow-lg shadow-warm-gold/30'
                                : 'bg-white/10 border-white/20 text-white/80 hover:bg-white/20 hover:border-white/40'
                            }`}
                            style={{
                              backdropFilter: 'blur(8px)',
                            }}
                            whileHover={{ scale: 1.03 }}
                            whileTap={{ scale: 0.97 }}
                          >
                            {opt.text}
                          </motion.button>
                        )
                      })}
                    </div>
                  </motion.div>
                ) : (
                  /* 刘看山陪伴语 */
                  <motion.div
                    key={`companion-${currentIndex}`}
                    className="flex flex-col items-center"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.6 }}
                  >
                    <Liukanshan width={120} variant="floating" animate />
                    <p
                      className="mt-8 text-white/90 font-serif text-lg md:text-xl text-center leading-relaxed max-w-md"
                      style={{ textShadow: '0 2px 12px rgba(0,0,0,0.5)' }}
                    >
                      {companionMessage}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ========== 过渡白屏 ========== */}
      <AnimatePresence>
        {phase === 'transitioning' && (
          <motion.div
            className="absolute inset-0 bg-cream pointer-events-none z-30"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1.5 }}
          />
        )}
      </AnimatePresence>

      {/* ========== 问卷完成后的过渡提示 ========== */}
      <AnimatePresence>
        {showTransition && (
          <motion.div
            className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="text-center"
            >
              <Liukanshan width={100} variant="floating" animate={false} />
              <p className="mt-4 text-white/80 font-serif text-base tracking-wide"
              >
                正在为你构建人生图谱...
              </p>
              <div className="mt-4 w-32 h-1 bg-white/10 rounded-full overflow-hidden mx-auto"
              >
                <motion.div
                  className="h-full bg-warm-gold rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: '100%' }}
                  transition={{ duration: 1.5, ease: 'easeOut' }}
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ========== 光粒子（idle阶段） - 确定性seed避免hydration mismatch ========== */}
      <AnimatePresence>
        {phase === 'idle' && (
          <motion.div
            className="absolute inset-0 pointer-events-none overflow-hidden z-10"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1 }}
          >
            {Array.from({ length: 15 }).map((_, i) => {
              const seed = (n: number) => {
                const x = Math.sin(n * 127.1 + i * 311.7) * 43758.5453
                return x - Math.floor(x)
              }
              return (
                <motion.div
                  key={i}
                  className="absolute rounded-full"
                  style={{
                    left: `${seed(1) * 100}%`,
                    top: `${seed(2) * 100}%`,
                    width: `${2 + seed(3) * 4}px`,
                    height: `${2 + seed(4) * 4}px`,
                    background:
                      'radial-gradient(circle, rgba(230, 184, 156, 0.8), transparent)',
                  }}
                  animate={{
                    y: [0, -30, 0],
                    opacity: [0.3, 0.8, 0.3],
                  }}
                  transition={{
                    duration: 4 + seed(5) * 4,
                    repeat: Infinity,
                    delay: seed(6) * 4,
                  ease: 'easeInOut',
                }}
              />
            )})}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.main>
  )
}
