'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import Liukanshan from '@/app/components/Liukanshan'
import { checkAchievements, Achievement } from '@/app/lib/achievements'
import AchievementPopup from '@/app/components/AchievementPopup'
import {
  getActiveTasks,
  getCompletedTasks,
  completeTask,
  createTask,
  updateDimensions,
  updateSkillProgress,
  getDimensions,
  getMainTask,
  type Task,
} from '@/app/lib/tasks'
import { generateChapter, saveChapter, ChapterData, generateNextPreview } from '@/app/lib/chapterGen'

interface TaskTemplate {
  keywords: string[]
  steps: string[]
  reflectionPrompt: string
  reflectionPlaceholder: string
}

const taskTemplates: TaskTemplate[] = [
  {
    keywords: ['跑', '马拉松', '健身', '运动', '锻炼', '自律', '身体'],
    steps: [
      '换上运动装备，做 3 分钟热身',
      '完成今日运动目标，听从身体的节奏',
      '运动后做放松拉伸，照顾身体',
      '记录一个今天运动时冒出的念头',
    ],
    reflectionPrompt: '今天运动的时候，身体告诉你什么？',
    reflectionPlaceholder:
      '比如：跑到第15分钟突然很爽，原来我不是讨厌运动，只是讨厌开始的那5分钟...',
  },
  {
    keywords: ['吉他', '音乐', '弹琴', '钢琴', '练琴', '乐器'],
    steps: [
      '调音，找到最舒适的坐姿或站姿',
      '15 分钟基本功练习，不赶进度',
      '完整弹唱一遍目标曲目',
      '记录今天最顺畅和最卡顿的地方',
    ],
    reflectionPrompt: '今天练琴的时候，手指和心情有什么变化？',
    reflectionPlaceholder:
      '比如：F和弦终于按响了，虽然转换还慢，但那种"通了"的感觉很真实...',
  },
  {
    keywords: ['学', '考试', '考证', '英语', '读书', '阅读', '知识', '备考'],
    steps: [
      '清理桌面，把手机放到另一个房间',
      '设定番茄钟，完成一个 25 分钟专注时段',
      '用一句话总结今天学到的核心概念',
      '标记一个还没懂的地方，作为明天的入口',
    ],
    reflectionPrompt: '今天学习的时候，哪个瞬间让你感觉"学到了"？',
    reflectionPlaceholder:
      '比如：原来那个公式不是背下来的，是画了三遍图之后自己冒出来的...',
  },
  {
    keywords: ['写', '写作', '创作', '自媒体', '内容', '文案'],
    steps: [
      '打开文档，先写 50 字废话热身',
      '不停顿地写 15 分钟，允许写得烂',
      '圈出今天写得最顺的一句',
      '给明天的自己留一个开头',
    ],
    reflectionPrompt: '今天写字的时候，有没有一句话是意外流出来的？',
    reflectionPlaceholder:
      '比如：本来要写职场焦虑，结果写成了我和我爸的关系，原来这两件事是连着的...',
  },
  {
    keywords: ['朋友', '社交', '恋爱', '脱单', '人脉', '沟通', '关系'],
    steps: [
      '想一个这周想联系的人，打开对话框',
      '发一条不带目的的消息，只是问候',
      '如果对方回复了，认真读两遍再回',
      '记录这次互动中你身体的感觉（紧绷？放松？）',
    ],
    reflectionPrompt: '这次连接之后，你内心的声音是什么？',
    reflectionPlaceholder:
      '比如：发出去的时候手在抖，但对方回了一个表情包，我突然觉得世界没那么可怕...',
  },
  {
    keywords: ['焦虑', '情绪', '平静', '治愈', '心理', '接纳', '冥想'],
    steps: [
      '找一个不会被打扰的 10 分钟',
      '闭上眼睛，只注意呼吸的进出',
      '如果念头跑了，温柔地把它带回来',
      '写下此刻身体最紧绷的部位',
    ],
    reflectionPrompt: '这 10 分钟里，内心发生了什么？',
    reflectionPlaceholder:
      '比如：前 3 分钟脑子里全是工作，第 5 分钟突然想哭，哭完之后肩膀松了...',
  },
]

const defaultTemplate: TaskTemplate = {
  keywords: [],
  steps: [
    '找到一个安静的地方，深呼吸三次',
    '写下那个问题，不评判自己',
    '想象三年后的自己会给现在什么建议',
    '把答案写下来，哪怕只有一句话',
  ],
  reflectionPrompt: '完成这件事，你是什么感受？',
  reflectionPlaceholder:
    '比如：我突然明白了，原来我一直在逃避的不是问题本身，而是害怕面对失败的自己……',
}

function matchTemplate(taskTitle: string, taskDesc: string): TaskTemplate {
  const text = (taskTitle + ' ' + taskDesc).toLowerCase()
  for (const t of taskTemplates) {
    if (t.keywords.some((kw) => text.includes(kw))) {
      return t
    }
  }
  return defaultTemplate
}

const nextChapterMap: Record<string, { title: string; desc: string }> = {
  clarity: { title: '第二章：走出迷雾', desc: '本周每天记录一件让你忘记时间的事，找到你的北极星。' },
  skill: { title: '第二章：打造利器', desc: '选择一项可迁移技能，每天投入1小时，持续21天。' },
  passion: { title: '第二章：重新点燃', desc: '列出10件童年让你兴奋的事，选一件本周重启。' },
  social: { title: '第二章：走出孤岛', desc: '参加一次线下活动，认识一位同频的新朋友。' },
  emotion: { title: '第二章：建立锚点', desc: '每天写3行情绪日记，连续14天，观察自己的情绪模式。' },
  family: { title: '第二章：与过去和解', desc: '给原生家庭写一封不寄出的信，然后烧掉，让过去成为养分。' },
}

const dimLabels: Record<string, string> = {
  clarity: '人生清晰度',
  skill: '技能掌控感',
  passion: '热情驱动力',
  social: '社交连接度',
  emotion: '情绪稳定性',
  family: '家庭和解度',
}

function getLowestDimension(): string {
  const saved = localStorage.getItem('lifeDimensions')
  if (saved) {
    try {
      const scores = JSON.parse(saved) as Record<string, number>
      let lowest = 'clarity'
      let min = 100
      Object.entries(scores).forEach(([key, val]) => {
        if (val < min) {
          min = val
          lowest = key
        }
      })
      return lowest
    } catch {}
  }
  return 'clarity'
}

function analyzeReflection(text: string): Record<string, number> {
  const changes: Record<string, number> = {}
  const lower = text.toLowerCase()

  const keywordMap: Record<string, string[]> = {
    clarity: ['清楚', '明白', '知道', '方向', '目标', '清晰', '想通', '懂了'],
    skill: ['学会', '掌握', '技能', '进步', '成长', '提升', '能力', '练习'],
    passion: ['喜欢', '热爱', '兴奋', '开心', '快乐', '兴趣', '动力', '想去做'],
    social: ['朋友', '社交', '认识', '聊天', '沟通', '连接', '关系', '见面'],
    emotion: ['平静', '情绪', '稳定', '安心', '放松', '舒服', '治愈', '接纳'],
    family: ['家人', '父母', '理解', '原谅', '和解', '原生', '亲情', '温暖'],
  }

  Object.entries(keywordMap).forEach(([dim, keywords]) => {
    let count = 0
    keywords.forEach((kw) => {
      const matches = lower.split(kw).length - 1
      count += matches
    })
    if (count > 0) {
      changes[dim] = Math.min(count * 4 + 2, 12)
    }
  })

  if (Object.keys(changes).length === 0) {
    const lowest = getLowestDimension()
    changes[lowest] = 3
  }

  return changes
}

// ===== 任务列表卡片 =====
function TaskListItem({
  task,
  selected,
  onClick,
  index,
}: {
  task: Task
  selected: boolean
  onClick: () => void
  index: number
}) {
  const typeLabel = { main: '主线', side: '支线', skill: '技能' }[task.type]
  const typeColor = {
    main: 'bg-warm-gold/15 text-warm-gold border-warm-gold/20',
    side: 'bg-deep-brown/10 text-deep-brown/60 border-deep-brown/10',
    skill: 'bg-blue-50 text-blue-400 border-blue-100',
  }[task.type]

  return (
    <motion.button
      onClick={onClick}
      className={`w-full text-left p-3 rounded-2xl border transition-all ${
        selected
          ? 'bg-white/80 border-warm-gold/40 shadow-md'
          : 'bg-white/30 border-transparent hover:bg-white/50 hover:border-deep-brown/10'
      }`}
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.98 }}
    >
      <div className="flex items-center gap-2 mb-1">
        <span className={`text-[10px] px-2 py-0.5 rounded-full border ${typeColor}`}>
          {typeLabel}
        </span>
        {task.totalDays && task.totalDays > 1 && (
          <span className="text-[10px] text-deep-brown/40">
            Day {task.currentDay || 1}/{task.totalDays}
          </span>
        )}
      </div>
      <p className="text-xs text-deep-brown font-medium leading-snug line-clamp-2">
        {task.title}
      </p>
    </motion.button>
  )
}

export default function QuestPage() {
  const router = useRouter()
  const [tasks, setTasks] = useState<Task[]>([])
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null)
  const [phase, setPhase] = useState<'quest' | 'reflection' | 'analyzing' | 'result'>('quest')
  const [reflection, setReflection] = useState('')
  const [dimChanges, setDimChanges] = useState<Record<string, number>>({})
  const [oldDims, setOldDims] = useState<Record<string, number>>({})
  const [newDims, setNewDims] = useState<Record<string, number>>({})
  const [selectedBranch, setSelectedBranch] = useState<string | null>(null)
  const [newAchievements, setNewAchievements] = useState<Achievement[]>([])
  const [chapterData, setChapterData] = useState<ChapterData | null>(null)

  // 步骤状态
  const [steps, setSteps] = useState<{ id: number; text: string; completed: boolean }[]>([])
  const [characterPos, setCharacterPos] = useState(0)

  // 当前选中任务
  const selectedTask = useMemo(
    () => tasks.find((t) => t.id === selectedTaskId) || null,
    [tasks, selectedTaskId]
  )

  // 加载任务列表
  useEffect(() => {
    const list = getActiveTasks()
    setTasks(list)
    // 默认选中第一个主线，或第一个任务
    const main = list.find((t) => t.type === 'main')
    if (main) {
      setSelectedTaskId(main.id)
    } else if (list.length > 0) {
      setSelectedTaskId(list[0].id)
    }
  }, [])

  // 选中任务变化时，重新加载步骤
  useEffect(() => {
    if (!selectedTask) {
      setSteps([])
      setCharacterPos(0)
      return
    }
    const matched = matchTemplate(selectedTask.title, selectedTask.desc)
    const newSteps = matched.steps.map((text, i) => ({ id: i + 1, text, completed: false }))
    setSteps(newSteps)
    setCharacterPos(0)
    setPhase('quest')
    setReflection('')
    setChapterData(null)
    setSelectedBranch(null)
    setNewAchievements([])
  }, [selectedTask])

  const toggleStep = (id: number) => {
    setSteps((prev) => {
      const newSteps = prev.map((s) => (s.id === id ? { ...s, completed: !s.completed } : s))
      const completedCount = newSteps.filter((s) => s.completed).length
      setCharacterPos(completedCount)
      return newSteps
    })
  }

  const allCompleted = steps.every((s) => s.completed)
  const template = selectedTask ? matchTemplate(selectedTask.title, selectedTask.desc) : defaultTemplate

  const handleComplete = useCallback(() => {
    setPhase('reflection')
  }, [])

  const handleSubmitReflection = useCallback(() => {
    if (!reflection.trim() || !selectedTask) return

    setPhase('analyzing')

    const changes = analyzeReflection(reflection)
    const currentDims = getDimensions()
    const updated = updateDimensions(changes)

    // 完成任务归档
    const completed = completeTask(selectedTask.id, {
      reflection: reflection.trim(),
      changes,
      note: reflection.trim(),
    })

    // 技能 +15%
    updateSkillProgress(selectedTask.title, 15)

    setOldDims(currentDims)
    setNewDims(updated)
    setDimChanges(changes)

    setTimeout(() => {
      const unlocked = checkAchievements()
      if (unlocked.length > 0) setNewAchievements(unlocked)

      const completedList = getCompletedTasks()
      const chapterCount = completedList.length
      const chapter = generateChapter(
        chapterCount,
        selectedTask.title,
        reflection,
        changes,
        currentDims,
        updated
      )
      chapter.nextPreview = generateNextPreview()
      saveChapter(chapter)
      setChapterData(chapter)

      // 刷新任务列表（移除已完成的）
      setTasks(getActiveTasks())

      setPhase('result')
    }, 2500)
  }, [reflection, selectedTask])

  const selectBranch = (dim: string) => {
    setSelectedBranch(dim)
  }

  const confirmBranch = () => {
    if (!selectedBranch) return

    const chapter = nextChapterMap[selectedBranch] || nextChapterMap.clarity

    createTask({
      type: 'main',
      title: chapter.title,
      desc: chapter.desc,
      totalDays: 7,
      currentDay: 1,
    })

    // 刷新任务列表
    setTasks(getActiveTasks())
    setPhase('quest')

    // 选中新创建的主线任务
    const newMain = getMainTask()
    if (newMain) {
      setSelectedTaskId(newMain.id)
    }
  }

  const radarCoords = (scores: Record<string, number>, radius: number) => {
    const dims = ['clarity', 'skill', 'passion', 'social', 'emotion', 'family']
    return dims.map((dim, i) => {
      const angle = (Math.PI * 2 * i) / 6 - Math.PI / 2
      const r = (scores[dim] / 100) * radius
      return { x: 100 + r * Math.cos(angle), y: 100 + r * Math.sin(angle), label: dimLabels[dim], value: scores[dim] }
    })
  }

  // 无任务状态
  if (tasks.length === 0 && phase === 'quest') {
    return (
      <motion.main
        className="relative w-screen h-screen overflow-hidden bg-cream flex items-center justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 1.2, ease: 'easeInOut' }}
      >
        <motion.div className="text-center" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
          <Liukanshan width={80} variant="floating" animate />
          <p className="mt-4 text-sm text-deep-brown/50">当前没有进行中的任务</p>
          <button
            onClick={() => router.push('/scene/hall')}
            className="mt-4 px-6 py-2 rounded-full bg-warm-gold text-white text-sm"
          >
            去大厅领取任务
          </button>
        </motion.div>
      </motion.main>
    )
  }

  return (
    <motion.main
      className="relative w-screen h-screen overflow-hidden bg-cream"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 1.2, ease: 'easeInOut' }}
    >
      <AchievementPopup achievements={newAchievements} />

      {/* 返回按钮 */}
      <motion.button
        className="fixed top-4 left-4 z-[55] px-3 py-1.5 rounded-full bg-white/60 backdrop-blur-sm text-deep-brown/50 text-xs hover:bg-white/80 transition-all flex items-center gap-1 border border-deep-brown/5"
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

      {/* 背景 */}
      <div
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse at 30% 80%, rgba(230, 184, 156, 0.1) 0%, transparent 50%)',
        }}
      />

      <div className="relative z-10 w-full h-full flex">
        {/* 左侧：任务列表 */}
        <motion.div
          className="w-[280px] h-full flex flex-col border-r border-deep-brown/5 bg-cream/50 backdrop-blur-sm"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="p-4 pb-2">
            <h2 className="text-sm font-serif text-deep-brown mb-1">任务列表</h2>
            <p className="text-[10px] text-deep-brown/40">
              共 {tasks.length} 个进行中
            </p>
          </div>
          <div className="flex-1 overflow-y-auto px-3 pb-4 space-y-2">
            {tasks.map((task, i) => (
              <TaskListItem
                key={task.id}
                task={task}
                selected={task.id === selectedTaskId}
                onClick={() => {
                  if (phase !== 'quest') {
                    // 如果在执行中切换，先重置
                    setPhase('quest')
                    setReflection('')
                  }
                  setSelectedTaskId(task.id)
                }}
                index={i}
              />
            ))}
            {tasks.length === 0 && (
              <p className="text-xs text-deep-brown/30 text-center py-8">暂无进行中的任务</p>
            )}
          </div>
        </motion.div>

        {/* 右侧：闯关界面 */}
        <div className="flex-1 h-full relative overflow-hidden">
          {selectedTask ? (
            <motion.div
              className="absolute inset-0 flex"
              key={selectedTask.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6 }}
            >
              {/* 左侧：闯关场景 */}
              <div className="relative w-1/2 h-full">
                {/* 背景暗化 */}
                <div
                  className="absolute inset-0"
                  style={{
                    background: 'radial-gradient(ellipse at 50% 70%, rgba(230,184,156,0.08) 0%, transparent 60%)',
                  }}
                />

                {/* SVG 闯关场景 */}
                <svg
                  className="absolute inset-0 w-full h-full"
                  viewBox="0 0 400 600"
                  preserveAspectRatio="xMidYMid meet"
                  style={{ overflow: 'visible' }}
                >
                  <defs>
                    {/* 金色发光滤镜 */}
                    <filter id="goldGlow" x="-50%" y="-50%" width="200%" height="200%">
                      <feGaussianBlur stdDeviation="6" result="blur" />
                      <feMerge>
                        <feMergeNode in="blur" />
                        <feMergeNode in="blur" />
                        <feMergeNode in="SourceGraphic" />
                      </feMerge>
                    </filter>
                    <filter id="softGlow" x="-50%" y="-50%" width="200%" height="200%">
                      <feGaussianBlur stdDeviation="3" result="blur" />
                      <feMerge>
                        <feMergeNode in="blur" />
                        <feMergeNode in="SourceGraphic" />
                      </feMerge>
                    </filter>
                    {/* 金色路径渐变 */}
                    <linearGradient id="goldPath" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="rgba(230,184,156,0.6)" />
                      <stop offset="50%" stopColor="rgba(230,184,156,0.9)" />
                      <stop offset="100%" stopColor="rgba(230,184,156,0.4)" />
                    </linearGradient>
                    {/* 浮岛渐变 - 已点亮 */}
                    <radialGradient id="islandLit" cx="50%" cy="40%">
                      <stop offset="0%" stopColor="#fef3e8" />
                      <stop offset="50%" stopColor="#f5d5b8" />
                      <stop offset="100%" stopColor="#e6b89c" />
                    </radialGradient>
                    {/* 浮岛渐变 - 暗淡 */}
                    <radialGradient id="islandDim" cx="50%" cy="40%">
                      <stop offset="0%" stopColor="#f5f0eb" />
                      <stop offset="100%" stopColor="#ddd5cc" />
                    </radialGradient>
                  </defs>

                  {/* 金色路径 — 从底部向上蜿蜒 */}
                  <motion.path
                    d="M200,520 Q150,480 200,420 Q250,360 200,300 Q150,240 200,180 Q250,120 200,80"
                    fill="none"
                    stroke="url(#goldPath)"
                    strokeWidth="3"
                    strokeLinecap="round"
                    filter="url(#goldGlow)"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 1.5, ease: 'easeOut' }}
                  />
                  {/* 路径内芯 — 更亮 */}
                  <motion.path
                    d="M200,520 Q150,480 200,420 Q250,360 200,300 Q150,240 200,180 Q250,120 200,80"
                    fill="none"
                    stroke="rgba(255,245,235,0.6)"
                    strokeWidth="1"
                    strokeLinecap="round"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 1.5, ease: 'easeOut', delay: 0.2 }}
                  />

                  {/* 4个浮岛节点 */}
                  {steps.map((step, i) => {
                    const positions = [
                      { x: 200, y: 520 },
                      { x: 200, y: 420 },
                      { x: 200, y: 300 },
                      { x: 200, y: 180 },
                    ]
                    const pos = positions[i]
                    const isCompleted = step.completed
                    const isCurrent = characterPos === i && !isCompleted
                    const isNext = characterPos === i - 1 && !isCompleted
                    const isFuture = i > characterPos

                    return (
                      <g key={i}>
                        {/* 浮岛平台 */}
                        <motion.ellipse
                          cx={pos.x}
                          cy={pos.y + 12}
                          rx="28"
                          ry="10"
                          fill={isCompleted || isCurrent ? 'url(#islandLit)' : 'url(#islandDim)'}
                          stroke={isCompleted || isCurrent ? 'rgba(230,184,156,0.6)' : 'rgba(200,190,180,0.3)'}
                          strokeWidth="1"
                          filter={isCompleted || isCurrent ? 'url(#softGlow)' : undefined}
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ delay: 0.3 + i * 0.15, type: 'spring', stiffness: 300, damping: 20 }}
                        />
                        {/* 浮岛厚度 */}
                        <motion.path
                          d={`M${pos.x - 28},${pos.y + 12} Q${pos.x},${pos.y + 24} ${pos.x + 28},${pos.y + 12} L${pos.x + 24},${pos.y + 18} Q${pos.x},${pos.y + 30} ${pos.x - 24},${pos.y + 18} Z`}
                          fill={isCompleted || isCurrent ? 'rgba(230,184,156,0.25)' : 'rgba(200,190,180,0.15)'}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.4 + i * 0.15 }}
                        />

                        {/* 节点光环 — 已完成 */}
                        {isCompleted && (
                          <motion.circle
                            cx={pos.x}
                            cy={pos.y}
                            r="16"
                            fill="none"
                            stroke="rgba(230,184,156,0.4)"
                            strokeWidth="1.5"
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: 0.5 + i * 0.1 }}
                          />
                        )}

                        {/* 节点核心 */}
                        <motion.circle
                          cx={pos.x}
                          cy={pos.y}
                          r={isCompleted ? 8 : isCurrent ? 7 : 6}
                          fill={isCompleted ? '#e6b89c' : isCurrent ? '#f5d5b8' : '#ddd5cc'}
                          stroke={isCompleted ? '#d4a070' : isCurrent ? '#e6b89c' : '#ccc5bc'}
                          strokeWidth="2"
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ delay: 0.3 + i * 0.12, type: 'spring', stiffness: 400, damping: 15 }}
                        />

                        {/* 已完成 ✓ */}
                        {isCompleted && (
                          <motion.text
                            x={pos.x}
                            y={pos.y + 3}
                            textAnchor="middle"
                            fill="white"
                            fontSize="10"
                            fontWeight="bold"
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 0.5 + i * 0.1 }}
                          >
                            ✓
                          </motion.text>
                        )}

                        {/* 脉动效果 — 当前节点 */}
                        {isCurrent && (
                          <motion.circle
                            cx={pos.x}
                            cy={pos.y}
                            r="14"
                            fill="none"
                            stroke="rgba(230,184,156,0.5)"
                            strokeWidth="1.5"
                            animate={{ scale: [1, 1.5, 1], opacity: [0.6, 0, 0.6] }}
                            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                          />
                        )}

                        {/* 步骤序号 */}
                        <motion.text
                          x={pos.x + 40}
                          y={pos.y + 4}
                          fill={isCompleted ? '#e6b89c' : isCurrent ? '#d4a070' : '#bbb5ac'}
                          fontSize="11"
                          fontWeight="500"
                          initial={{ opacity: 0, x: -5 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.4 + i * 0.1 }}
                        >
                          Step {i + 1}
                        </motion.text>
                      </g>
                    )
                  })}

                  {/* Q版小人 — 沿路径移动 */}
                  {characterPos < steps.length && (
                    <motion.g
                      initial={{ x: 200, y: 520 }}
                      animate={{
                        x: [200, 200, 200, 200][characterPos],
                        y: [520, 420, 300, 180][characterPos],
                      }}
                      transition={{ type: 'spring', stiffness: 180, damping: 18 }}
                    >
                      {/* 小人阴影 */}
                      <motion.ellipse
                        cx="0"
                        cy="14"
                        rx="10"
                        ry="4"
                        fill="rgba(200,180,160,0.2)"
                        animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                      />
                      {/* 身体 */}
                      <motion.g
                        animate={{ y: [0, -2, 0] }}
                        transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
                      >
                        {/* 头 */}
                        <circle cx="0" cy="-10" r="7" fill="#f5f0eb" stroke="#e6b89c" strokeWidth="1.2" />
                        {/* 眼睛 */}
                        <circle cx="-2.5" cy="-11" r="1" fill="#8a7a6a" />
                        <circle cx="2.5" cy="-11" r="1" fill="#8a7a6a" />
                        {/* 嘴巴 */}
                        <path d="M-2,-7 Q0,-5 2,-7" stroke="#8a7a6a" strokeWidth="0.8" strokeLinecap="round" fill="none" />
                        {/* 身体 */}
                        <rect x="-5" y="-2" width="10" height="12" rx="3" fill="#f5f0eb" stroke="#e6b89c" strokeWidth="1" />
                        {/* 围巾 */}
                        <path d="M-6,0 L6,0 L5,3 L-5,3 Z" fill="#e6b89c" opacity="0.9" />
                        <path d="M2,3 L4,8 L1,7 Z" fill="#e6b89c" opacity="0.8" />
                        {/* 手臂 */}
                        <motion.g
                          animate={{ rotate: [0, -8, 0] }}
                          transition={{ duration: 1, repeat: Infinity }}
                          style={{ transformOrigin: '-5px 2px' }}
                        >
                          <path d="M-5,2 Q-10,6 -8,10" stroke="#e6b89c" strokeWidth="1.5" strokeLinecap="round" fill="none" />
                        </motion.g>
                        <motion.g
                          animate={{ rotate: [0, 8, 0] }}
                          transition={{ duration: 1, repeat: Infinity, delay: 0.3 }}
                          style={{ transformOrigin: '5px 2px' }}
                        >
                          <path d="M5,2 Q10,6 8,10" stroke="#e6b89c" strokeWidth="1.5" strokeLinecap="round" fill="none" />
                        </motion.g>
                        {/* 腿 */}
                        <motion.g
                          animate={{ rotate: [0, -6, 0] }}
                          transition={{ duration: 0.6, repeat: Infinity }}
                          style={{ transformOrigin: '-3px 10px' }}
                        >
                          <path d="M-3,10 L-4,16" stroke="#e6b89c" strokeWidth="1.5" strokeLinecap="round" />
                        </motion.g>
                        <motion.g
                          animate={{ rotate: [0, 6, 0] }}
                          transition={{ duration: 0.6, repeat: Infinity, delay: 0.3 }}
                          style={{ transformOrigin: '3px 10px' }}
                        >
                          <path d="M3,10 L4,16" stroke="#e6b89c" strokeWidth="1.5" strokeLinecap="round" />
                        </motion.g>
                      </motion.g>
                    </motion.g>
                  )}

                  {/* 全部完成 — 小人跳跃庆祝 */}
                  {allCompleted && (
                    <motion.g
                      initial={{ x: 200, y: 180 }}
                      animate={{ y: 150 }}
                      transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.2 }}
                    >
                      <motion.g
                        animate={{ y: [0, -15, 0], rotate: [0, 5, -5, 0] }}
                        transition={{ duration: 1, repeat: Infinity, ease: 'easeInOut' }}
                      >
                        <circle cx="0" cy="-10" r="7" fill="#f5f0eb" stroke="#e6b89c" strokeWidth="1.2" />
                        <circle cx="-2.5" cy="-11" r="1" fill="#8a7a6a" />
                        <circle cx="2.5" cy="-11" r="1" fill="#8a7a6a" />
                        <path d="M-2,-7 Q0,-5 2,-7" stroke="#8a7a6a" strokeWidth="0.8" strokeLinecap="round" fill="none" />
                        <rect x="-5" y="-2" width="10" height="12" rx="3" fill="#f5f0eb" stroke="#e6b89c" strokeWidth="1" />
                        <path d="M-6,0 L6,0 L5,3 L-5,3 Z" fill="#e6b89c" opacity="0.9" />
                        {/* 欢呼手臂 */}
                        <path d="M-5,2 L-10,-2" stroke="#e6b89c" strokeWidth="1.5" strokeLinecap="round" />
                        <path d="M5,2 L10,-2" stroke="#e6b89c" strokeWidth="1.5" strokeLinecap="round" />
                      </motion.g>
                      {/* 庆祝星星 */}
                      {[0, 72, 144, 216, 288].map((angle, i) => (
                        <motion.path
                          key={i}
                          d="M0,-4 L1,-1 L4,-1 L2,1 L3,4 L0,2 L-3,4 L-2,1 L-4,-1 L-1,-1 Z"
                          fill="#e6b89c"
                          initial={{ scale: 0, opacity: 0, x: 0, y: 0 }}
                          animate={{
                            scale: [0, 1, 0.5],
                            opacity: [0, 1, 0],
                            x: Math.cos((angle * Math.PI) / 180) * 30,
                            y: Math.sin((angle * Math.PI) / 180) * 30 - 10,
                          }}
                          transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.2 }}
                        />
                      ))}
                    </motion.g>
                  )}
                </svg>

                {/* 刘看山悬浮在旁，指向当前节点 */}
                {selectedTask && characterPos < steps.length && (
                  <motion.div
                    className="absolute"
                    style={{
                      left: '65%',
                      top: `${20 + characterPos * 18}%`,
                    }}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 }}
                  >
                    <motion.div
                      animate={{ y: [0, -4, 0] }}
                      transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
                    >
                      <Liukanshan width={50} variant="floating" />
                    </motion.div>
                    {/* 指向当前节点的虚线 */}
                    <motion.svg
                      className="absolute top-1/2 right-full mr-1"
                      width="40"
                      height="20"
                      viewBox="0 0 40 20"
                      style={{ transform: 'translateY(-50%)' }}
                    >
                      <motion.path
                        d="M40,10 Q20,5 0,10"
                        fill="none"
                        stroke="rgba(230,184,156,0.5)"
                        strokeWidth="1.5"
                        strokeDasharray="4 3"
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ delay: 0.8, duration: 0.6 }}
                      />
                      <motion.path
                        d="M8,6 L0,10 L8,14"
                        fill="none"
                        stroke="rgba(230,184,156,0.5)"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 1.2 }}
                      />
                    </motion.svg>
                    {/* 提示气泡 */}
                    <motion.div
                      className="absolute left-full ml-2 top-0 whitespace-nowrap px-2.5 py-1 rounded-full bg-white/80 border border-warm-gold/20 text-[10px] text-deep-brown/60 shadow-sm"
                      initial={{ opacity: 0, x: -5 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 1.0 }}
                    >
                      {characterPos === 0 && '从这里开始'}
                      {characterPos === 1 && '继续加油'}
                      {characterPos === 2 && '快完成了'}
                      {characterPos === 3 && '最后一步'}
                    </motion.div>
                  </motion.div>
                )}

                {/* 终点旗帜 */}
                <motion.div
                  className="absolute left-1/2 -translate-x-1/2"
                  style={{ top: '22%' }}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.0 }}
                >
                  <svg width="24" height="32" viewBox="0 0 24 32">
                    <line x1="12" y1="4" x2="12" y2="28" stroke="#e6b89c" strokeWidth="2" strokeLinecap="round" />
                    <motion.g
                      animate={{ scaleX: [1, 0.92, 1], rotate: [0, 3, 0] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      style={{ transformOrigin: '12px 4px' }}
                    >
                      <path d="M12,4 L22,9 L12,14" fill="#e6b89c" opacity="0.8" />
                    </motion.g>
                  </svg>
                </motion.div>
              </div>

              {/* 右侧：任务详情卡片 */}
              <div className="w-1/2 h-full flex items-center justify-center p-8">
                <motion.div
                  className="w-full max-w-[380px]"
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                >
                  <div className="glass-card p-7 border border-warm-gold/10 shadow-xl" style={{ background: 'rgba(255,252,248,0.8)', backdropFilter: 'blur(16px)' }}>
                    {/* 标签 */}
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-warm-gold/15 text-warm-gold border border-warm-gold/20 tracking-wider">
                        {selectedTask.type === 'main' && selectedTask.totalDays && selectedTask.totalDays > 1
                          ? `Day ${selectedTask.currentDay || 1} / ${selectedTask.totalDays}`
                          : selectedTask.type === 'main'
                          ? '主线'
                          : selectedTask.type === 'side'
                          ? '支线'
                          : '技能'}
                      </span>
                      {selectedTask.skillName && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-400 border border-blue-100">
                          {selectedTask.skillName}
                        </span>
                      )}
                    </div>

                    <h2 className="text-lg font-serif text-deep-brown mb-1.5">{selectedTask.title}</h2>
                    <p className="text-xs text-deep-brown/45 mb-6 leading-relaxed">
                      {selectedTask.desc || '预计用时 15 分钟'}
                    </p>

                    {/* 步骤清单 */}
                    <div className="space-y-2.5 mb-6">
                      {steps.map((step, index) => (
                        <motion.button
                          key={step.id}
                          className="w-full flex items-start gap-3 text-left group p-2.5 rounded-xl transition-all"
                          onClick={() => toggleStep(step.id)}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.3 + index * 0.08 }}
                          whileHover={{ backgroundColor: 'rgba(230,184,156,0.06)' }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <motion.div
                            className={`mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all duration-300 ${
                              step.completed
                                ? 'bg-warm-gold border-warm-gold'
                                : 'border-deep-brown/15 group-hover:border-warm-gold/50'
                            }`}
                            whileTap={{ scale: 0.85 }}
                          >
                            {step.completed && (
                              <motion.svg
                                width="12"
                                height="12"
                                viewBox="0 0 12 12"
                                fill="none"
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                              >
                                <path d="M2 6L5 9L10 3" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                              </motion.svg>
                            )}
                          </motion.div>
                          <div className="flex-1 min-w-0">
                            <span
                              className={`text-sm leading-relaxed transition-all duration-300 block ${
                                step.completed ? 'text-deep-brown/35 line-through' : 'text-deep-brown/75'
                              }`}
                            >
                              {step.text}
                            </span>
                            {/* 当前步骤高亮指示 */}
                            {characterPos === index && !step.completed && (
                              <motion.div
                                className="mt-1 h-0.5 bg-warm-gold/30 rounded-full"
                                initial={{ width: '0%' }}
                                animate={{ width: '100%' }}
                                transition={{ duration: 0.8, delay: 0.3 }}
                              />
                            )}
                          </div>
                        </motion.button>
                      ))}
                    </div>

                    {/* 进度条 */}
                    <div className="mb-5">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[10px] text-deep-brown/35">闯关进度</span>
                        <span className="text-[10px] text-warm-gold font-medium">{characterPos} / {steps.length}</span>
                      </div>
                      <div className="h-1.5 bg-deep-brown/8 rounded-full overflow-hidden">
                        <motion.div
                          className="h-full bg-warm-gold rounded-full"
                          initial={{ width: '0%' }}
                          animate={{ width: `${(characterPos / steps.length) * 100}%` }}
                          transition={{ duration: 0.5, ease: 'easeOut' }}
                        />
                      </div>
                    </div>

                    <motion.button
                      className={`w-full py-3 rounded-2xl text-center font-medium tracking-wide transition-all duration-500 ${
                        allCompleted
                          ? 'bg-warm-gold text-white shadow-lg shadow-warm-gold/30'
                          : 'bg-deep-brown/8 text-deep-brown/35 cursor-not-allowed'
                      }`}
                      disabled={!allCompleted}
                      onClick={handleComplete}
                      whileHover={allCompleted ? { scale: 1.02, boxShadow: '0 8px 25px rgba(230,184,156,0.3)' } : {}}
                      whileTap={allCompleted ? { scale: 0.98 } : {}}
                    >
                      {allCompleted ? '闯关成功 ✨' : '还有未完成的关卡'}
                    </motion.button>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          ) : (
            <motion.div className="absolute inset-0 flex items-center justify-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <div className="text-center">
                <Liukanshan width={60} variant="floating" />
                <p className="mt-4 text-sm text-deep-brown/40">选择一个任务开始闯关</p>
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* ========== 多阶段完成覆盖层 ========== */}
      <AnimatePresence mode="wait">
        {/* Stage 1: 感受输入 */}
        {phase === 'reflection' && selectedTask && (
          <motion.div
            key="reflection"
            className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-cream/95 backdrop-blur-md"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="w-full max-w-[480px] px-6"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <Liukanshan width={80} variant="floating" animate />

              <h3 className="mt-4 text-xl font-serif text-deep-brown">{template.reflectionPrompt}</h3>
              <p className="mt-2 text-sm text-deep-brown/50 leading-relaxed">
                随便写几句，刘看山会根据你的感受，调整你的人生图谱。
              </p>

              <textarea
                value={reflection}
                onChange={(e) => setReflection(e.target.value)}
                placeholder={template.reflectionPlaceholder}
                className="mt-4 w-full h-32 p-4 rounded-2xl bg-white/60 border border-warm-gold/20 text-sm text-deep-brown placeholder:text-deep-brown/30 resize-none focus:outline-none focus:border-warm-gold/50 transition-colors leading-relaxed"
              />

              <motion.button
                className={`mt-4 w-full py-3 rounded-2xl text-center font-medium tracking-wide transition-all duration-300 ${
                  reflection.trim()
                    ? 'bg-warm-gold text-white shadow-lg shadow-warm-gold/30'
                    : 'bg-deep-brown/10 text-deep-brown/40 cursor-not-allowed'
                }`}
                disabled={!reflection.trim()}
                onClick={handleSubmitReflection}
                whileHover={reflection.trim() ? { scale: 1.02 } : {}}
                whileTap={reflection.trim() ? { scale: 0.98 } : {}}
              >
                {reflection.trim() ? '提交感受 →' : '写点什么吧'}
              </motion.button>
            </motion.div>
          </motion.div>
        )}

        {/* Stage 2: AI 分析中 */}
        {phase === 'analyzing' && (
          <motion.div
            key="analyzing"
            className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-cream"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="flex flex-col items-center"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
            >
              <Liukanshan width={100} variant="floating" animate />
              <motion.p
                className="mt-4 text-deep-brown/80 text-sm tracking-wide"
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                刘看山正在分析你的感受……
              </motion.p>

              <div className="mt-6 w-48 h-1 rounded-full bg-deep-brown/10 overflow-hidden">
                <motion.div
                  className="h-full bg-warm-gold rounded-full"
                  initial={{ width: '0%' }}
                  animate={{ width: '100%' }}
                  transition={{ duration: 2.2, ease: 'easeInOut' }}
                />
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* Stage 3: 章节回顾 */}
        {phase === 'result' && chapterData && (
          <motion.div
            key="result"
            className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-cream/95 backdrop-blur-md px-6 overflow-y-auto py-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="flex flex-col items-center max-w-[440px] w-full"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <motion.p
                className="text-[10px] text-warm-gold tracking-wider mb-1"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                第 {chapterData.chapterNum} 章
              </motion.p>
              <motion.h3
                className="text-xl font-serif text-deep-brown mb-1 text-center"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                「{chapterData.title}」
              </motion.h3>
              <motion.div
                className="w-12 h-px bg-warm-gold/30 mb-6"
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ delay: 0.5, duration: 0.6 }}
              />

              <div className="w-full space-y-4 mb-6">
                {chapterData.narrative.map((para, i) => (
                  <motion.p
                    key={i}
                    className="text-sm text-deep-brown/80 leading-relaxed font-serif"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 + i * 0.15 }}
                  >
                    {para}
                  </motion.p>
                ))}
              </div>

              {Object.entries(chapterData.dimChanges).filter(([, d]) => d > 0).length > 0 && (
                <motion.div
                  className="w-full mb-4"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1.0 }}
                >
                  <p className="text-[10px] text-warm-gold tracking-wider mb-2 text-center">本章解锁属性</p>
                  <div className="flex flex-wrap gap-2 justify-center">
                    {Object.entries(chapterData.dimChanges)
                      .filter(([, delta]) => delta > 0)
                      .map(([dim, delta]) => (
                        <motion.span
                          key={dim}
                          className="text-[11px] px-3 py-1 rounded-full bg-warm-gold/10 text-warm-gold border border-warm-gold/20"
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: 1.1 }}
                        >
                          {dimLabels[dim]} +{delta}
                        </motion.span>
                      ))}
                  </div>
                </motion.div>
              )}

              <motion.div
                className="w-full p-4 rounded-2xl bg-white/40 border border-warm-gold/10 mb-6"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.2 }}
              >
                <p className="text-xs text-deep-brown/50 leading-relaxed italic text-center">
                  {chapterData.lksNote}
                </p>
              </motion.div>

              {chapterData.nextPreview && (
                <motion.div
                  className="w-full mb-6"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1.4 }}
                >
                  <p className="text-[10px] text-deep-brown/30 tracking-wider mb-1.5 text-center">下集预告</p>
                  <p className="text-xs text-deep-brown/60 leading-relaxed text-center font-serif">
                    {chapterData.nextPreview}
                  </p>
                </motion.div>
              )}

              <motion.div
                className="w-full mb-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.5 }}
              >
                <p className="text-[10px] text-deep-brown/30 tracking-wider mb-2 text-center">
                  选择一个方向继续
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {Object.entries(dimLabels)
                    .slice(0, 3)
                    .map(([dim, label]) => (
                      <motion.button
                        key={dim}
                        onClick={() => selectBranch(dim)}
                        className={`px-2 py-2 rounded-xl border text-center text-[10px] transition-all ${
                          selectedBranch === dim
                            ? 'bg-warm-gold/15 border-warm-gold/40 text-warm-gold'
                            : 'bg-white/40 border-deep-brown/5 text-deep-brown/50 hover:border-warm-gold/20'
                        }`}
                        whileTap={{ scale: 0.95 }}
                      >
                        {label}
                      </motion.button>
                    ))}
                </div>
                <div className="grid grid-cols-3 gap-2 mt-2">
                  {Object.entries(dimLabels)
                    .slice(3, 6)
                    .map(([dim, label]) => (
                      <motion.button
                        key={dim}
                        onClick={() => selectBranch(dim)}
                        className={`px-2 py-2 rounded-xl border text-center text-[10px] transition-all ${
                          selectedBranch === dim
                            ? 'bg-warm-gold/15 border-warm-gold/40 text-warm-gold'
                            : 'bg-white/40 border-deep-brown/5 text-deep-brown/50 hover:border-warm-gold/20'
                        }`}
                        whileTap={{ scale: 0.95 }}
                      >
                        {label}
                      </motion.button>
                    ))}
                </div>
              </motion.div>

              <motion.div
                className="flex gap-3"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.7 }}
              >
                <motion.button
                  className="px-6 py-2.5 rounded-full text-sm tracking-wide border border-deep-brown/10 text-deep-brown/50 hover:bg-deep-brown/5 transition-all"
                  onClick={() => router.push('/scene/hall')}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                >
                  休息片刻
                </motion.button>
                <motion.button
                  className={`px-6 py-2.5 rounded-full text-sm tracking-wide shadow-lg transition-all ${
                    selectedBranch
                      ? 'bg-warm-gold text-white shadow-warm-gold/20'
                      : 'bg-deep-brown/10 text-deep-brown/40 cursor-not-allowed'
                  }`}
                  onClick={() => selectedBranch && confirmBranch()}
                  disabled={!selectedBranch}
                  whileHover={selectedBranch ? { scale: 1.03 } : {}}
                  whileTap={selectedBranch ? { scale: 0.97 } : {}}
                >
                  下一章 →
                </motion.button>
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.main>
  )
}
