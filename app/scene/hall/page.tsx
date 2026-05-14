'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'
import {
  getActiveTasks,
  getCompletedTasks,
  getCompletedCount,
  completeTask,
  updateDimensions,
  type Task,
} from '@/app/lib/tasks'

import ProgressBar from '@/app/components/ProgressBar'
import LiukanshanMessage from '@/app/components/LiukanshanMessage'
import { checkAchievements, Achievement } from '@/app/lib/achievements'
import AchievementPopup from '@/app/components/AchievementPopup'
import AchievementWall from '@/app/components/AchievementWall'
import { loadChapters } from '@/app/lib/chapterGen'
import { generateGrowthLetter, saveLetter, shouldShowLetter, GrowthLetter } from '@/app/lib/letterGen'

interface TaskItem {
  type: 'main' | 'side'
  title: string
  desc: string
}

interface UserSkill {
  id: string
  name: string
  subtype: string
  current: string
  target: string
  progress: number
  metrics: { label: string; value: string }[]
}

interface CompletedTask {
  title: string
  date: string
  type: string
  note?: string
  skillName?: string
  changes?: Record<string, number>
}

const defaultSideQuests = [
  '给三年前的自己写一句话',
  '看完那篇你收藏了两年的文章',
  '去给一个迷茫的陌生人说一句"我懂"',
]

// 世界树果实位置 — 对应背景图树冠上的发光果实
const defaultFruitPositions = [
  { x: 18.2, y: 10.8 },
  { x: 30.1, y: 12.3 },
  { x: 37.3, y: 16.3 },
  { x: 46.1, y: 11.2 },
  { x: 59.6, y: 7.3 },
  { x: 70.5, y: 5.1 },
  { x: 71.9, y: 13.3 },
  { x: 80.4, y: 18.0 },
  { x: 83.9, y: 14.4 },
  { x: 23.1, y: 25.6 },
  { x: 25.6, y: 31.3 },
  { x: 29.0, y: 28.7 },
  { x: 36.3, y: 26.7 },
  { x: 41.1, y: 32.1 },
  { x: 34.8, y: 45.3 },
  { x: 38.0, y: 38.6 },
  { x: 64.5, y: 19.4 },
  { x: 65.2, y: 42.9 },
  { x: 68.1, y: 38.3 },
  { x: 71.5, y: 33.0 },
  { x: 74.6, y: 31.7 },
  { x: 78.6, y: 27.4 },
  { x: 78.0, y: 2.8 },
  { x: 85.5, y: 3.9 },
  { x: 62.3, y: 30.7 },
]

function getFruitBrightness(dateStr: string) {
  const date = new Date(dateStr)
  const now = new Date()
  const hoursAgo = (now.getTime() - date.getTime()) / (1000 * 60 * 60)

  if (hoursAgo < 24) {
    return {
      shadow: '0 0 12px 3px rgba(160,220,255,0.7), 0 0 24px 6px rgba(120,200,255,0.4)',
      pulse: true,
    }
  } else if (hoursAgo < 168) {
    return {
      shadow: '0 0 8px 2px rgba(160,220,255,0.5), 0 0 16px 4px rgba(120,200,255,0.25)',
      pulse: false,
    }
  } else {
    return {
      shadow: '0 0 6px 2px rgba(140,200,240,0.35), 0 0 12px 3px rgba(100,180,230,0.15)',
      pulse: false,
    }
  }
}

export default function HallPage() {
  const router = useRouter()
  const [mainQuest, setMainQuest] = useState('')
  const [sideQuests, setSideQuests] = useState<string[]>([])
  const [completedCount, setCompletedCount] = useState(0)
  const [selectedSides, setSelectedSides] = useState<Set<number>>(new Set())
  const [skills, setSkills] = useState<UserSkill[]>([])
  const [skillTasks, setSkillTasks] = useState<Task[]>([])
  const [activeSideIndex, setActiveSideIndex] = useState<number | null>(null)
  const [sideNote, setSideNote] = useState('')
  const [sideFeedback, setSideFeedback] = useState('')
  const [showSideFeedback, setShowSideFeedback] = useState(false)
  const [newAchievements, setNewAchievements] = useState<Achievement[]>([])
  const [showWall, setShowWall] = useState(false)

  // 成长回顾信
  const [showLetter, setShowLetter] = useState(false)
  const [letterData, setLetterData] = useState<GrowthLetter | null>(null)

  // 情绪日记
  const [showMoodCheck, setShowMoodCheck] = useState(false)
  const [todayMood, setTodayMood] = useState<'happy' | 'neutral' | 'sad' | null>(null)
  const [moodResponded, setMoodResponded] = useState(false)

  // 隐藏彩蛋
  const [showMidnightEgg, setShowMidnightEgg] = useState(false)
  const [showFullMoonEgg, setShowFullMoonEgg] = useState(false)

  // 阶段任务进度
  const [mainTotalDays, setMainTotalDays] = useState(0)
  const [mainCurrentDay, setMainCurrentDay] = useState(0)

  // ====== 树相关状态 ======
  const [completedTasksList, setCompletedTasksList] = useState<Task[]>([])
  const [selectedTaskIndex, setSelectedTaskIndex] = useState<number | null>(null)
  const [showTaskDetail, setShowTaskDetail] = useState(false)
  const [mounted, setMounted] = useState(false)

  // 果实位置
  const fruitPositions = defaultFruitPositions

  useEffect(() => {
    setMounted(true)
    // 使用统一任务API读取
    const activeTasks = getActiveTasks()
    const main = activeTasks.find((t) => t.type === 'main')
    const sides = activeTasks.filter((t) => t.type === 'side')
    const sTasks = activeTasks.filter((t) => t.type === 'skill')
    if (main) {
      setMainQuest(main.title)
      if (main.totalDays) setMainTotalDays(main.totalDays)
      if (main.currentDay) setMainCurrentDay(main.currentDay)
    }
    if (sides.length > 0) setSideQuests(sides.map((s) => s.title))
    setSkillTasks(sTasks)

    const completedList = getCompletedTasks()
    setCompletedCount(getCompletedCount())
    setCompletedTasksList(completedList)
    const sel = localStorage.getItem('selectedSideQuests')
    if (sel) {
      try {
        setSelectedSides(new Set(JSON.parse(sel) as number[]))
      } catch {}
    }
    const sk = localStorage.getItem('userSkills')
    if (sk) {
      try {
        setSkills(JSON.parse(sk) as UserSkill[])
      } catch {}
    }

    // 情绪日记：检查今天是否已记录
    const lastMoodDate = localStorage.getItem('lastMoodDate')
    const today = new Date().toDateString()
    if (lastMoodDate !== today) {
      setTimeout(() => setShowMoodCheck(true), 800)
    } else {
      const savedMood = localStorage.getItem('todayMood') as 'happy' | 'neutral' | 'sad' | null
      if (savedMood) setTodayMood(savedMood)
    }

    // 成长回顾信：检查是否需要显示
    const chapters = loadChapters()
    if (shouldShowLetter(chapters.length)) {
      const letter = generateGrowthLetter(chapters)
      if (letter) {
        saveLetter(letter)
        setLetterData(letter)
        setTimeout(() => setShowLetter(true), 1200)
      }
    }

    // 凌晨彩蛋：0-5点停留超过2分钟
    const hour = new Date().getHours()
    if (hour >= 0 && hour < 5) {
      const eggs = JSON.parse(localStorage.getItem('unlockedEggs') || '[]')
      if (!eggs.includes('midnight')) {
        const timer = setTimeout(() => {
          setShowMidnightEgg(true)
          eggs.push('midnight')
          localStorage.setItem('unlockedEggs', JSON.stringify(eggs))
        }, 120000)
        return () => clearTimeout(timer)
      }
    }

    // 满月彩蛋：登录满30天
    const firstVisit = localStorage.getItem('firstVisitDate')
    if (!firstVisit) {
      localStorage.setItem('firstVisitDate', new Date().toISOString())
    } else {
      const days = Math.floor((Date.now() - new Date(firstVisit).getTime()) / (1000 * 60 * 60 * 24))
      if (days >= 30) {
        const eggs = JSON.parse(localStorage.getItem('unlockedEggs') || '[]')
        if (!eggs.includes('fullmoon')) {
          setTimeout(() => {
            setShowFullMoonEgg(true)
            eggs.push('fullmoon')
            localStorage.setItem('unlockedEggs', JSON.stringify(eggs))
          }, 2000)
        }
      }
    }
  }, [])

  const toggleSide = (index: number) => {
    setSelectedSides((prev) => {
      const next = new Set(prev)
      if (next.has(index)) {
        next.delete(index)
      } else {
        next.add(index)
      }
      localStorage.setItem('selectedSideQuests', JSON.stringify(Array.from(next)))
      return next
    })
  }

  const handleMoodSelect = (mood: 'happy' | 'neutral' | 'sad') => {
    setTodayMood(mood)
    localStorage.setItem('todayMood', mood)
    localStorage.setItem('lastMoodDate', new Date().toDateString())
    setMoodResponded(true)
    setTimeout(() => {
      setShowMoodCheck(false)
      setMoodResponded(false)
    }, 3500)
  }

  const moodConfig = {
    happy: {
      emoji: '😊',
      label: '还不错',
      lksReply: '太好了。今天有什么让你开心的事吗？我想听听。',
      color: 'text-warm-gold',
      bg: 'bg-warm-gold/10 border-warm-gold/30',
    },
    neutral: {
      emoji: '😐',
      label: '就这样',
      lksReply: '平淡的日子也是日子。不用勉强自己，慢慢来。',
      color: 'text-deep-brown/60',
      bg: 'bg-deep-brown/5 border-deep-brown/10',
    },
    sad: {
      emoji: '😞',
      label: '不太好',
      lksReply: '来，把手给我。今天就待一会儿，不用做任何事。',
      color: 'text-stone-500',
      bg: 'bg-stone-100/50 border-stone-200',
    },
  }

  function getSideQuestDim(title: string): string {
    const lower = title.toLowerCase()
    if (lower.includes('跑') || lower.includes('运动') || lower.includes('身体') || lower.includes('拉伸')) return 'passion'
    if (lower.includes('吉他') || lower.includes('音乐') || lower.includes('琴') || lower.includes('弹唱')) return 'skill'
    if (lower.includes('学') || lower.includes('考试') || lower.includes('英语') || lower.includes('读') || lower.includes('知识')) return 'skill'
    if (lower.includes('写') || lower.includes('创作') || lower.includes('自媒体') || lower.includes('内容')) return 'passion'
    if (lower.includes('朋友') || lower.includes('社交') || lower.includes('人脉') || lower.includes('联系') || lower.includes('陌生人') || lower.includes('见面')) return 'social'
    if (lower.includes('情绪') || lower.includes('焦虑') || lower.includes('平静') || lower.includes('治愈') || lower.includes('心理') || lower.includes('接纳')) return 'emotion'
    if (lower.includes('家人') || lower.includes('过去') || lower.includes('信') || lower.includes('原生') || lower.includes('和解')) return 'family'
    if (lower.includes('方向') || lower.includes('目标') || lower.includes(' clarity') || lower.includes('收藏') || lower.includes('明白')) return 'clarity'
    return 'clarity'
  }

  const dimFeedback: Record<string, string> = {
    clarity: '又清楚了一点点。继续走，雾会散。',
    skill: '每一小步，都在磨刀。手感会来的。',
    passion: '火焰还在，别让它灭。你值得热爱。',
    social: '伸出手，世界会接住你。不孤单的。',
    emotion: '照顾好自己的感觉，比什么都重要。',
    family: '和过去和解，不是忘记，是轻轻放下。',
  }

  const submitSideQuest = (index: number) => {
    if (!sideNote.trim()) return
    const quest = sideQuests[index]
    const dim = getSideQuestDim(quest)
    const delta = 3

    const savedDims = localStorage.getItem('lifeDimensions')
    if (savedDims) {
      try {
        const dims = JSON.parse(savedDims)
        dims[dim] = Math.min(100, (dims[dim] || 50) + delta)
        localStorage.setItem('lifeDimensions', JSON.stringify(dims))
      } catch {}
    }

    // 使用统一API完成支线任务
    const activeTasks = getActiveTasks()
    const sideTask = activeTasks.find((t) => t.type === 'side' && t.title === quest)
    if (sideTask) {
      completeTask(sideTask.id, { changes: { [dim]: delta }, note: '' })
    }
    setCompletedCount(getCompletedCount())

    // 支线任务技能联动 +3%
    const savedSkills = localStorage.getItem('userSkills')
    if (savedSkills) {
      try {
        const allSkills = JSON.parse(savedSkills) as UserSkill[]
        const text = quest.toLowerCase()
        const matched = allSkills.find((s) => text.includes(s.name.toLowerCase()))
        if (matched) {
          const updated = allSkills.map((s) =>
            s.id === matched.id ? { ...s, progress: Math.min(100, s.progress + 3) } : s
          )
          localStorage.setItem('userSkills', JSON.stringify(updated))
          setSkills(updated)
        }
      } catch {}
    }

    setSideFeedback(dimFeedback[dim] || '做得不错。')
    setShowSideFeedback(true)

    setSelectedSides((prev) => {
      const next = new Set(prev)
      next.add(index)
      localStorage.setItem('selectedSideQuests', JSON.stringify(Array.from(next)))
      return next
    })

    // 检查成就
    const unlocked = checkAchievements()
    if (unlocked.length > 0) setNewAchievements(unlocked)

    setTimeout(() => {
      setShowSideFeedback(false)
      setActiveSideIndex(null)
      setSideNote('')
    }, 2500)
  }

  const weeklyGoal = 4
  const weeklyProgress = Math.min((completedCount / weeklyGoal) * 100, 100)

  return (
    <motion.main
      className="relative w-screen h-screen overflow-hidden bg-cream"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 1.2, ease: 'easeInOut' }}
    >
      {/* ====== 世界树背景图 ====== */}
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
          <Image
            src="/images/worldtree-bg.png"
            alt="世界树"
            fill
            className="object-cover"
            priority
          />

          {/* 果实连线层 */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none" style={{ zIndex: 2 }}>
            <defs>
              <linearGradient id="fruitLine" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="rgba(140,210,255,0.5)" />
                <stop offset="50%" stopColor="rgba(180,235,255,0.85)" />
                <stop offset="100%" stopColor="rgba(140,210,255,0.5)" />
              </linearGradient>
              <filter id="fruitGlow">
                <feGaussianBlur stdDeviation="2" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>
            {completedTasksList.length > 1 &&
              Array.from({ length: completedTasksList.length - 1 }, (_, i) => {
                const from = fruitPositions[i]
                const to = fruitPositions[i + 1]
                if (!from || !to) return null
                return (
                  <motion.path
                    key={`line-${i}`}
                    d={`M${from.x},${from.y} L${to.x},${to.y}`}
                    stroke="url(#fruitLine)"
                    strokeWidth="0.3"
                    filter="url(#fruitGlow)"
                    strokeDasharray="2 2"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.6 }}
                    transition={{ delay: 0.8 + i * 0.1, duration: 0.8 }}
                  />
                )
              })}
          </svg>

          {/* 果实 - 与完成任务联动 */}
          <div className="absolute inset-0">
            {fruitPositions.map((pos, i) => {
              const task = completedTasksList[i]
              const isLit = !!task
              const brightness = task ? getFruitBrightness(task.completedAt || task.createdAt) : null

              return (
                <motion.div
                  key={i}
                  className="absolute"
                  style={{
                    left: `${pos.x}%`,
                    top: `${pos.y}%`,
                    transform: 'translate(-50%, -50%)',
                    cursor: isLit ? 'pointer' : 'default',
                    zIndex: 3,
                    width: isLit ? 32 : 0,
                    height: isLit ? 32 : 0,
                  }}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.5 + i * 0.03 }}
                  onClick={() => {
                    if (task) {
                      setSelectedTaskIndex(i)
                      setShowTaskDetail(true)
                    }
                  }}
                >
                  {/* 发光亮点 — 只显示已完成的任务 */}
                  {isLit && (
                    <>
                      {/* 外层光晕 */}
                      <motion.div
                        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 rounded-full pointer-events-none"
                        style={{
                          background: 'radial-gradient(circle, rgba(180,230,255,0.3) 0%, rgba(140,210,255,0.12) 50%, transparent 70%)',
                        }}
                        animate={
                          isLit && brightness?.pulse
                            ? { scale: [1, 1.4, 1], opacity: [0.5, 0.8, 0.5] }
                            : {}
                        }
                        transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
                      />
                      {/* 中层光晕 */}
                      <motion.div
                        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 rounded-full pointer-events-none"
                        style={{
                          background: 'radial-gradient(circle, rgba(200,240,255,0.55) 0%, rgba(160,220,255,0.25) 50%, transparent 70%)',
                          boxShadow: isLit ? brightness?.shadow : '0 0 4px 1px rgba(140,200,255,0.35)',
                        }}
                        animate={
                          isLit && brightness?.pulse
                            ? { scale: [1, 1.3, 1], opacity: [0.6, 1, 0.6] }
                            : {}
                        }
                        transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
                      />
                      {/* 核心亮点 */}
                      <motion.div
                        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 rounded-full pointer-events-none"
                        style={{
                          background: isLit
                            ? 'radial-gradient(circle, #ffffff 0%, #a8e0ff 40%, #6ec8ff 70%)'
                            : 'radial-gradient(circle, rgba(255,255,255,0.7) 0%, rgba(168,224,255,0.5) 40%, rgba(110,200,255,0.35) 70%)',
                          boxShadow: isLit
                            ? `0 0 6px 2px rgba(140,210,255,0.85), 0 0 14px 4px rgba(100,190,255,0.55), ${brightness?.shadow || ''}`
                            : '0 0 4px 1px rgba(120,200,255,0.5)',
                        }}
                        animate={
                          isLit && brightness?.pulse
                            ? { scale: [1, 1.2, 1], opacity: [0.9, 1, 0.9] }
                            : {}
                        }
                        transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
                      />
                    </>
                  )}
                </motion.div>
              )
            })}
          </div>
        </div>
      </div>

      {/* ========== 情绪日记（每日开场）========== */}
      <AnimatePresence>
        {showMoodCheck && (
          <motion.div
            className="fixed inset-0 z-[80] flex flex-col items-center justify-center bg-black/50 backdrop-blur-md"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="w-full max-w-[360px] px-6"
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            >
              {!todayMood ? (
                <div className="glass-card p-6 rounded-3xl border border-warm-gold/20 shadow-2xl"
                >
                  <p className="text-xs text-warm-gold tracking-wider mb-1 text-center">
                    第 {completedCount + 1} 章
                  </p>
                  <h3 className="text-lg font-serif text-deep-brown text-center mb-6">
                    今天感觉怎么样？
                  </h3>

                  <div className="flex items-center justify-center gap-4">
                    {(['happy', 'neutral', 'sad'] as const).map((m) => (
                      <motion.button
                        key={m}
                        onClick={() => handleMoodSelect(m)}
                        className={`flex flex-col items-center gap-2 px-5 py-4 rounded-2xl border transition-all ${moodConfig[m].bg}`}
                        whileHover={{ scale: 1.08, y: -4 }}
                        whileTap={{ scale: 0.95 }}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: m === 'happy' ? 0.1 : m === 'neutral' ? 0.2 : 0.3 }}
                      >
                        <span className="text-3xl">{moodConfig[m].emoji}</span>
                        <span className={`text-xs font-medium ${moodConfig[m].color}`}>
                          {moodConfig[m].label}
                        </span>
                      </motion.button>
                    ))}
                  </div>

                  <p className="text-[10px] text-deep-brown/30 text-center mt-5">
                    刘看山会根据你的心情，调整今天的故事走向
                  </p>
                </div>
              ) : (
                <div className="glass-card p-6 rounded-3xl border border-warm-gold/20 shadow-2xl text-center"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                  >
                    <span className="text-4xl">{moodConfig[todayMood].emoji}</span>
                  </motion.div>
                  <motion.p
                    className="mt-4 text-sm text-deep-brown leading-relaxed"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    {moodConfig[todayMood].lksReply}
                  </motion.p>
                  <motion.div
                    className="mt-3 text-lg"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                  >
                    🦊
                  </motion.div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 毛玻璃任务卡片 - 右下角 */}
      <motion.div
        className="absolute bottom-8 right-8 md:bottom-12 md:right-12 w-[340px] md:w-[380px] glass-card p-6 md:p-8"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, delay: 0.5, ease: 'easeOut' }}
      >
        {/* 当前主线 */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs tracking-[0.15em] text-deep-brown/50 font-medium uppercase">
              当前主线
            </h3>
            <span className="text-[10px] text-deep-brown/40 tracking-wider">
              本周 {completedCount}/{weeklyGoal}
            </span>
          </div>

          {/* 阶段任务天数进度 */}
          {mainTotalDays > 1 && (
            <div className="mb-2 flex items-center gap-2">
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-warm-gold/15 text-warm-gold">
                Day {mainCurrentDay} / {mainTotalDays}
              </span>
              <div className="flex-1 h-1 bg-deep-brown/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-warm-gold rounded-full transition-all"
                  style={{
                    width: `${Math.max(5, ((mainCurrentDay - 1) / mainTotalDays) * 100)}%`,
                  }}
                />
              </div>
            </div>
          )}

          <p className="text-base md:text-lg text-deep-brown font-serif leading-relaxed mb-3">
            {mainQuest}
          </p>
          <ProgressBar progress={weeklyProgress} />
          <motion.button
            onClick={() => router.push('/scene/quest')}
            className="mt-4 w-full py-2.5 rounded-xl text-xs tracking-wider text-white bg-warm-gold shadow-lg shadow-warm-gold/20 hover:shadow-warm-gold/40 transition-all"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            去执行当前任务 →
          </motion.button>
        </div>

        {/* 快捷入口 */}
        <motion.div
          className="mb-4 flex items-center gap-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.4 }}
        >
          <button
            onClick={() => router.push('/scene/skills')}
            className="text-[10px] px-3 py-1.5 rounded-full border border-warm-gold/20 text-warm-gold hover:bg-warm-gold/10 transition-all"
          >
            管理技能 →
          </button>
          <button
            onClick={() => router.push('/scene/profile')}
            className="text-[10px] px-3 py-1.5 rounded-full border border-deep-brown/10 text-deep-brown/40 hover:bg-deep-brown/5 transition-all"
          >
            查看图谱
          </button>
          <button
            onClick={() => setShowWall(true)}
            className="text-[10px] px-3 py-1.5 rounded-full border border-amber-400/30 text-amber-600 hover:bg-amber-400/10 transition-all"
          >
            🏆 成就墙
          </button>
          <button
            onClick={() => router.push('/scene/bookshelf')}
            className="text-[10px] px-3 py-1.5 rounded-full border border-deep-brown/10 text-deep-brown/40 hover:bg-deep-brown/5 transition-all"
          >
            📖 人生之书
          </button>
        </motion.div>

        {/* 可选支线 */}
        <div className="mb-6">
          <h3 className="text-xs tracking-[0.15em] text-deep-brown/50 mb-3 font-medium uppercase">
            可选支线
          </h3>
          <ul className="space-y-2">
            {sideQuests.map((quest, index) => {
              const isSelected = selectedSides.has(index)
              const isActive = activeSideIndex === index
              return (
                <motion.li
                  key={index}
                  className={`flex flex-col gap-2 text-sm leading-relaxed transition-all duration-300 ${
                    isSelected
                      ? 'text-deep-brown/40 line-through'
                      : 'text-deep-brown/80 hover:text-deep-brown'
                  } ${isActive ? 'cursor-default' : 'cursor-pointer'}`}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.8 + index * 0.15 }}
                  onClick={() => {
                    if (isSelected || isActive) return
                    setActiveSideIndex(index)
                    setSideNote('')
                    setShowSideFeedback(false)
                  }}
                >
                  <div className="flex items-start gap-2 group">
                    <span
                      className={`mt-1 w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all duration-300 ${
                        isSelected
                          ? 'bg-warm-gold border-warm-gold'
                          : 'border-soft-gray group-hover:border-warm-gold'
                      }`}
                    >
                      {isSelected && (
                        <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                          <path
                            d="M2 6L5 9L10 3"
                            stroke="white"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      )}
                    </span>
                    <span>{quest}</span>
                  </div>

                  <AnimatePresence>
                    {isActive && !isSelected && !showSideFeedback && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="pl-6 overflow-hidden"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <p className="text-[11px] text-deep-brown/40 mb-1.5">
                          简单记录一下完成的过程或感受
                        </p>
                        <textarea
                          value={sideNote}
                          onChange={(e) => setSideNote(e.target.value)}
                          placeholder="写一两句就好..."
                          rows={2}
                          className="w-full px-3 py-2 rounded-xl bg-white/60 border border-warm-gold/20 text-xs text-deep-brown placeholder:text-deep-brown/25 focus:outline-none focus:border-warm-gold/50 resize-none leading-relaxed"
                        />
                        <motion.button
                          onClick={() => submitSideQuest(index)}
                          className={`mt-2 px-4 py-1.5 rounded-xl text-[11px] tracking-wide transition-all ${
                            sideNote.trim()
                              ? 'bg-warm-gold text-white'
                              : 'bg-deep-brown/10 text-deep-brown/40 cursor-not-allowed'
                          }`}
                          disabled={!sideNote.trim()}
                          whileHover={sideNote.trim() ? { scale: 1.02 } : {}}
                          whileTap={sideNote.trim() ? { scale: 0.98 } : {}}
                        >
                          {sideNote.trim() ? '完成' : '写点什么吧'}
                        </motion.button>
                      </motion.div>
                    )}

                    {isActive && showSideFeedback && (
                      <motion.div
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="pl-6 flex items-start gap-2"
                      >
                        <span className="text-lg">🦊</span>
                        <p className="text-xs text-warm-gold leading-relaxed">{sideFeedback}</p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.li>
              )
            })}
          </ul>
        </div>

        {/* 技能任务 —— 与主线/支线分开显示 */}
        {skillTasks.length > 0 && (
          <div className="mb-6">
            <h3 className="text-xs tracking-[0.15em] text-deep-brown/50 mb-3 font-medium uppercase">
              技能任务
            </h3>
            <div className="space-y-2">
              {skillTasks.map((task, i) => (
                <motion.div
                  key={task.id}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/40 border border-warm-gold/10 cursor-pointer hover:bg-white/60 transition-all"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.9 + i * 0.1 }}
                  onClick={() => router.push('/scene/quest')}
                >
                  <span className="text-xs">🎯</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-deep-brown truncate">{task.title}</p>
                    {task.skillName && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-warm-gold/15 text-warm-gold">
                        {task.skillName}
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-deep-brown/30">→</span>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* 技能掌握度 */}
        {skills.length > 0 && (
          <div className="mb-6">
            <h3 className="text-xs tracking-[0.15em] text-deep-brown/50 mb-3 font-medium uppercase">
              技能成长
            </h3>
            <div className="space-y-2">
              {skills.slice(0, 3).map((skill, i) => (
                <motion.div
                  key={skill.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 1 + i * 0.1 }}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-deep-brown/70">{skill.name}</span>
                    <span className="text-[10px] text-warm-gold">{skill.progress}%</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-deep-brown/10 overflow-hidden">
                    <motion.div
                      className="h-full bg-warm-gold rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${skill.progress}%` }}
                      transition={{ duration: 0.8, delay: 1.2 + i * 0.1 }}
                    />
                  </div>
                </motion.div>
              ))}
            </div>
            {skills.length > 3 && (
              <p className="text-[10px] text-deep-brown/30 mt-2">还有 {skills.length - 3} 个技能在成长中…</p>
            )}
          </div>
        )}

        {/* 底部文案 */}
        <motion.div
          className="flex items-center gap-2 pt-4 border-t border-deep-brown/10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 1.2 }}
        >
          {/* 爪印图标 */}
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            className="text-warm-gold flex-shrink-0"
          >
            <ellipse cx="12" cy="16" rx="5" ry="4" fill="currentColor" opacity="0.6" />
            <ellipse cx="6" cy="10" rx="2.5" ry="3" fill="currentColor" opacity="0.6" transform="rotate(-20 6 10)" />
            <ellipse cx="18" cy="10" rx="2.5" ry="3" fill="currentColor" opacity="0.6" transform="rotate(20 18 10)" />
            <ellipse cx="9" cy="6" rx="2" ry="2.5" fill="currentColor" opacity="0.6" transform="rotate(-10 9 6)" />
            <ellipse cx="15" cy="6" rx="2" ry="2.5" fill="currentColor" opacity="0.6" transform="rotate(10 15 6)" />
          </svg>
          <span className="text-xs text-warm-gold tracking-wide">
            每完成一个，树就亮一分。
          </span>
        </motion.div>
      </motion.div>

      {/* 光粒子层 - 只在客户端渲染避免hydration mismatch */}
      {mounted && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {Array.from({ length: 20 }).map((_, i) => {
            const seed = (n: number) => {
              const x = Math.sin(n * 127.1 + i * 311.7) * 43758.5453
              return x - Math.floor(x)
            }
            return (
              <div
                key={i}
                className="particle"
                style={{
                  left: `${seed(1) * 100}%`,
                  animationDelay: `${seed(2) * 15}s`,
                  animationDuration: `${12 + seed(3) * 10}s`,
                  width: `${3 + seed(4) * 4}px`,
                  height: `${3 + seed(5) * 4}px`,
                }}
              />
            )
          })}
        </div>
      )}

      {/* 成就墙面板 */}
      <AnimatePresence>
        {showWall && (
          <motion.div
            className="fixed inset-0 z-[90] flex items-center justify-center bg-black/40 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowWall(false)}
          >
            <motion.div
              className="w-[90vw] max-w-[500px] max-h-[80vh] overflow-y-auto glass-card p-6 rounded-3xl border border-warm-gold/20"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-deep-brown">成就墙</h3>
                <button
                  onClick={() => setShowWall(false)}
                  className="w-7 h-7 rounded-full bg-deep-brown/5 text-deep-brown/40 hover:bg-deep-brown/10 flex items-center justify-center text-xs transition-all"
                >
                  ✕
                </button>
              </div>
              <AchievementWall />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 成长回顾信 */}
      <AnimatePresence>
        {showLetter && letterData && (
          <motion.div
            className="fixed inset-0 z-[95] flex items-center justify-center bg-black/40 backdrop-blur-sm px-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowLetter(false)}
          >
            <motion.div
              className="w-full max-w-[440px] glass-card p-8 rounded-3xl border border-warm-gold/20 shadow-2xl"
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* 信封装饰 */}
              <motion.div
                className="text-center mb-4"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <span className="text-3xl">✉️</span>
              </motion.div>

              <p className="text-[10px] text-warm-gold tracking-wider mb-1 text-center">
                成长回顾信
              </p>
              <h3 className="text-lg font-serif text-deep-brown text-center mb-6">
                {letterData.title}
              </h3>

              <div className="space-y-3 mb-6">
                {letterData.content.map((line, i) => (
                  <motion.p
                    key={i}
                    className={`text-sm leading-relaxed ${
                      line.startsWith('  ·')
                        ? 'text-deep-brown/60 pl-4'
                        : line.startsWith('——')
                        ? 'text-deep-brown/40 italic text-center mt-4'
                        : 'text-deep-brown/80'
                    }`}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + i * 0.1 }}
                  >
                    {line}
                  </motion.p>
                ))}
              </div>

              <motion.div
                className="flex justify-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
              >
                <button
                  onClick={() => setShowLetter(false)}
                  className="px-6 py-2 rounded-full text-xs text-deep-brown/50 border border-deep-brown/10 hover:bg-deep-brown/5 transition-all"
                >
                  收好这封信
                </button>
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 凌晨彩蛋 */}
      <AnimatePresence>
        {showMidnightEgg && (
          <motion.div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/30 backdrop-blur-sm px-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowMidnightEgg(false)}
          >
            <motion.div
              className="glass-card p-8 rounded-3xl border border-warm-gold/20 text-center max-w-[320px]"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <motion.div
                animate={{ rotate: [0, 5, -5, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <span className="text-4xl">🦊</span>
              </motion.div>
              <p className="mt-4 text-sm text-deep-brown leading-relaxed">
                睡不着的话，我陪你。
              </p>
              <p className="mt-2 text-xs text-deep-brown/40">
                不用做任何事，就待着就好。
              </p>
              <motion.p
                className="mt-4 text-[10px] text-warm-gold"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1 }}
              >
                解锁彩蛋：深夜同在
              </motion.p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 满月彩蛋 */}
      <AnimatePresence>
        {showFullMoonEgg && (
          <motion.div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/30 backdrop-blur-sm px-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowFullMoonEgg(false)}
          >
            <motion.div
              className="glass-card p-8 rounded-3xl border border-warm-gold/20 text-center max-w-[320px]"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <span className="text-4xl">🎂</span>
              <p className="mt-4 text-sm text-deep-brown leading-relaxed">
                系统说你满月了。
              </p>
              <p className="mt-2 text-xs text-deep-brown/40">
                刘看山突然捧出一个小蛋糕。
              </p>
              <p className="mt-3 text-xs text-deep-brown/50">
                30天了，你还在写自己的故事。这本身就值得庆祝。
              </p>
              <motion.p
                className="mt-4 text-[10px] text-warm-gold"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1 }}
              >
                解锁彩蛋：满月之礼
              </motion.p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 任务详情弹窗（点击树上的发光节点） */}
      <AnimatePresence>
        {showTaskDetail && selectedTaskIndex !== null && completedTasksList[selectedTaskIndex] && (
          <motion.div
            className="fixed inset-0 z-[85] flex items-center justify-center bg-black/40 backdrop-blur-sm px-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowTaskDetail(false)}
          >
            <motion.div
              className="w-full max-w-[360px] glass-card p-6 rounded-3xl border border-warm-gold/20 shadow-2xl"
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-warm-gold" />
                  <span className="text-[10px] text-warm-gold tracking-wider">已完成的任务</span>
                </div>
                <button
                  onClick={() => setShowTaskDetail(false)}
                  className="w-7 h-7 rounded-full bg-deep-brown/5 text-deep-brown/40 hover:bg-deep-brown/10 flex items-center justify-center text-xs transition-all"
                >
                  ✕
                </button>
              </div>

              {(() => {
                const task = completedTasksList[selectedTaskIndex]
                return (
                  <>
                    <h3 className="text-lg font-serif text-deep-brown mb-2">
                      {task.title}
                    </h3>
                    <p className="text-[10px] text-deep-brown/40 mb-4">
                      完成于 {new Date(task.completedAt || task.createdAt).toLocaleDateString('zh-CN')} {new Date(task.completedAt || task.createdAt).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
                    </p>

                    {task.note && (
                      <div className="p-3 rounded-xl bg-white/50 border border-deep-brown/5 mb-4">
                        <p className="text-[10px] text-deep-brown/40 mb-1">你的记录</p>
                        <p className="text-sm text-deep-brown/70 leading-relaxed">{task.note}</p>
                      </div>
                    )}

                    {task.skillName && (
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-warm-gold/15 text-warm-gold">
                          {task.skillName}
                        </span>
                      </div>
                    )}

                    {task.changes && Object.entries(task.changes).length > 0 && (
                      <div className="p-3 rounded-xl bg-white/50 border border-deep-brown/5">
                        <p className="text-[10px] text-deep-brown/40 mb-2">维度变化</p>
                        <div className="flex flex-wrap gap-2">
                          {Object.entries(task.changes).map(([dim, delta]) => (
                            <span
                              key={dim}
                              className="text-[10px] px-2 py-0.5 rounded-full bg-green-50 text-green-600 border border-green-100"
                            >
                              {dim} +{delta}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )
              })()}

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

      {/* 刘看山主动消息 */}
      <LiukanshanMessage />

      {/* 成就弹出 */}
      <AchievementPopup achievements={newAchievements} />
    </motion.main>
  )
}
