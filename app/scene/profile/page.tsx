'use client'

import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import Liukanshan from '@/app/components/Liukanshan'
import { createTask, deleteTask, getActiveTasks } from '@/app/lib/tasks'

// ==================== 六维数据 ====================

type DimensionKey = 'skill' | 'passion' | 'social' | 'emotion' | 'family' | 'clarity'

interface Dimension {
  name: string
  key: DimensionKey
  angle: number
  color: string
  description: string
  value?: number
}

const dimensionBase: Dimension[] = [
  { name: '专业技能', key: 'skill', angle: 0, color: '#4a6fa5', description: '硬实力积累' },
  { name: '兴趣浓度', key: 'passion', angle: 60, color: '#e6b89c', description: '热爱程度' },
  { name: '社交能量', key: 'social', angle: 120, color: '#c9a0dc', description: '人脉与表达' },
  { name: '情绪韧度', key: 'emotion', angle: 180, color: '#7db9a8', description: '心理承受力' },
  { name: '家庭底色', key: 'family', angle: 240, color: '#a08060', description: '原生家庭影响' },
  { name: '方向 clarity', key: 'clarity', angle: 300, color: '#f4d03f', description: '迷茫指数倒数' },
]

const defaultScores: Record<DimensionKey, number> = {
  skill: 60,
  passion: 55,
  social: 50,
  emotion: 65,
  family: 45,
  clarity: 40,
}

interface Task {
  type: 'main' | 'side' | 'skill'
  title: string
  desc: string
  totalDays?: number
  currentDay?: number
  skillName?: string
}

// ==================== 雷达图工具函数 ====================

function getPoint(cx: number, cy: number, radius: number, angleDeg: number, value: number) {
  const rad = (angleDeg * Math.PI) / 180
  const r = (value / 100) * radius
  return {
    x: cx + r * Math.sin(rad),
    y: cy - r * Math.cos(rad),
  }
}

function pointsToString(points: { x: number; y: number }[]) {
  return points.map((p) => `${p.x},${p.y}`).join(' ')
}

// ==================== 组件 ====================

export default function ProfilePage() {
  const router = useRouter()
  const [progress, setProgress] = useState(0)
  const [showTasks, setShowTasks] = useState(false)
  const [selectedDim, setSelectedDim] = useState<number | null>(null)
  const [showZhihuInsight, setShowZhihuInsight] = useState(false)
  const [dynamicScores, setDynamicScores] = useState<Record<DimensionKey, number>>(defaultScores)
  const [userMbti, setUserMbti] = useState('')
  const [userHobbies, setUserHobbies] = useState('')
  const [showShareCard, setShowShareCard] = useState(false)
  const [tasks, setTasks] = useState<Task[]>([])
  const [isGeneratingTasks, setIsGeneratingTasks] = useState(false)

  // 从 localStorage 读取数据
  useEffect(() => {
    const saved = localStorage.getItem('lifeDimensions')
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as Record<DimensionKey, number>
        setDynamicScores((prev) => ({ ...prev, ...parsed }))
      } catch {
        // 解析失败使用默认
      }
    }
    setUserMbti(localStorage.getItem('userMbti') || '')
    setUserHobbies(localStorage.getItem('userHobbies') || '')
  }, [])

  // 动态构建 dimensions（含分值）
  const dimensions = useMemo(
    () =>
      dimensionBase.map((d) => ({
        ...d,
        value: dynamicScores[d.key] ?? defaultScores[d.key],
      })),
    [dynamicScores]
  )

  // 异步调用 DeepSeek API 生成个性化任务
  useEffect(() => {
    // 构建用户画像
    const buildProfile = () => {
      const dims: Record<string, number> = {}
      dimensions.forEach((d) => { dims[d.key] = d.value ?? 0 })

      const skillsRaw = localStorage.getItem('skillTasks')
      let skills: { name: string; progress: number; current: string; target: string }[] = []
      if (skillsRaw) {
        try {
          const parsed = JSON.parse(skillsRaw)
          if (Array.isArray(parsed)) {
            skills = parsed
              .filter((s: Record<string, unknown>) => s && typeof s === 'object')
              .map((s: Record<string, unknown>) => ({
                name: String(s.name || ''),
                progress: Number(s.progress || 0),
                current: String(s.current || ''),
                target: String(s.target || ''),
              }))
              .filter((s: { name: string }) => s.name)
          }
        } catch {
          // 解析失败，skills 保持为空
        }
      }

      const sorted = [...dimensions].sort((a, b) => (a.value ?? 0) - (b.value ?? 0))

      return {
        dimensions: dims,
        skills,
        mood: localStorage.getItem('todayMood') || undefined,
        recentReflection: localStorage.getItem('lastReflection') || undefined,
        goal: localStorage.getItem('userGoal') || undefined,
        lowestDim: sorted[0]?.key,
      }
    }

    const fetchTasks = async () => {
      setIsGeneratingTasks(true)
      const profile = buildProfile()

      try {
        // 先清除旧的主线和支线任务（避免重复）
        const existing = getActiveTasks()
        existing.filter((t) => t.type === 'main' || t.type === 'side').forEach((t) => deleteTask(t.id))

        // 主线任务
        const res = await fetch('/api/task', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ profile, type: 'main' }),
        })

        if (!res.ok) {
          throw new Error(`API ${res.status}`)
        }

        const data = await res.json()

        // 检查是否是错误响应或缺少必要字段
        if (data.error) {
          throw new Error(data.error)
        }
        if (!data.title || !data.desc) {
          throw new Error('API 返回数据缺少 title 或 desc')
        }

        // 创建主线任务到统一存储
        createTask({
          type: 'main',
          title: data.title,
          desc: data.desc,
          totalDays: data.totalDays || 7,
          currentDay: 1,
        })

        // 同时生成一个支线任务
        try {
          const sideRes = await fetch('/api/task', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ profile, type: 'side' }),
          })
          if (sideRes.ok) {
            const sideData = await sideRes.json()
            if (!sideData.error && sideData.title && sideData.desc) {
              createTask({
                type: 'side',
                title: sideData.title,
                desc: sideData.desc,
              })
            }
          }
        } catch {
          // 支线任务获取失败，仅使用主线
        }

        // 同步本地状态
        setTasks(getActiveTasks().filter((t) => t.type === 'main' || t.type === 'side'))
      } catch (err) {
        console.error('Task generation failed:', err)
      } finally {
        setIsGeneratingTasks(false)
      }
    }

    fetchTasks()
  }, [dimensions])

  useEffect(() => {
    const t1 = setTimeout(() => setProgress(1), 400)
    const t2 = setTimeout(() => setShowTasks(true), 2200)
    const t3 = setTimeout(() => setShowZhihuInsight(true), 1200)
    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
      clearTimeout(t3)
    }
  }, [])

  // 雷达图参数
  const cx = 200
  const cy = 200
  const radius = 140
  const levels = 5

  // 网格多边形
  const gridPolygons = Array.from({ length: levels }, (_, i) => {
    const levelValue = ((i + 1) / levels) * 100
    const points = dimensions.map((d) => getPoint(cx, cy, radius, d.angle, levelValue))
    return pointsToString(points)
  })

  // 数据多边形
  const dataPoints = dimensions.map((d) => getPoint(cx, cy, radius, d.angle, d.value * progress))
  const dataPolygon = pointsToString(dataPoints)

  // 轴线端点
  const axisEndPoints = dimensions.map((d) => getPoint(cx, cy, radius, d.angle, 100))

  return (
    <motion.main
      className="relative w-screen h-screen overflow-hidden bg-cream"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 1.2, ease: 'easeInOut' }}
    >
      {/* 返回按钮 */}
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

      {/* 纸张纹理背景 */}
      <div
        className="absolute inset-0 pointer-events-none opacity-40"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* 顶部标题 */}
      <motion.div
        className="absolute top-6 left-0 right-0 text-center z-10"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.2 }}
      >
        <h1 className="text-deep-brown font-serif text-xl md:text-2xl tracking-widest">
          你的人生图谱
        </h1>
        <p className="text-deep-brown/40 text-xs mt-1 tracking-wider">
          基于问卷 + 知乎行为分析
        </p>
        <div className="mt-3 flex items-center justify-center gap-2 flex-wrap">
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
      </motion.div>

      {/* 左侧：刘看山 + 知乎洞察 */}
      <motion.div
        className="absolute left-[5%] md:left-[8%] top-[15%] z-10 flex flex-col items-center"
        initial={{ opacity: 0, x: -30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8, delay: 0.5 }}
      >
        <Liukanshan width={90} variant="sitting" animate />

        <AnimatePresence>
          {showZhihuInsight && (
            <motion.div
              className="mt-4 w-[180px] md:w-[220px] p-4 rounded-2xl bg-white/60 backdrop-blur-md border border-white/40 shadow-lg"
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.6 }}
            >
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 rounded-full bg-blue-500" />
                <span className="text-[10px] text-deep-brown/50 tracking-wider uppercase">
                  知乎足迹洞察
                </span>
              </div>
              <p className="text-xs text-deep-brown/80 leading-relaxed">
                你在深夜浏览「职业转型」话题127次，凌晨3点的点赞集中在「焦虑」与「治愈」之间。
              </p>
              <p className="text-xs text-deep-brown/80 leading-relaxed mt-2">
                你其实早就知道答案，只是缺一个人告诉你：可以开始了。
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* 中央：雷达图 */}
      <div className="absolute inset-0 flex items-center justify-center">
        <motion.div
          className="relative"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, delay: 0.3 }}
        >
          <svg width="400" height="400" viewBox="0 0 400 400" className="w-[320px] h-[320px] md:w-[400px] md:h-[400px]">
            {/* 定义渐变和滤镜 */}
            <defs>
              <radialGradient id="radarFill" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="rgba(230, 184, 156, 0.4)" />
                <stop offset="100%" stopColor="rgba(230, 184, 156, 0.1)" />
              </radialGradient>
              <filter id="glow">
                <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                <feMerge>
                  <feMergeNode in="coloredBlur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* 网格层级 */}
            {gridPolygons.map((points, i) => (
              <polygon
                key={i}
                points={points}
                fill="none"
                stroke="rgba(200, 180, 160, 0.3)"
                strokeWidth="1"
                strokeDasharray="4 4"
              />
            ))}

            {/* 轴线 */}
            {axisEndPoints.map((end, i) => (
              <line
                key={i}
                x1={cx}
                y1={cy}
                x2={end.x}
                y2={end.y}
                stroke="rgba(200, 180, 160, 0.3)"
                strokeWidth="1"
              />
            ))}

            {/* 数据区域 */}
            <motion.polygon
              points={dataPolygon}
              fill="url(#radarFill)"
              stroke="#e6b89c"
              strokeWidth="2"
              strokeLinejoin="round"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.8 }}
            />

            {/* 数据点 + 标签 */}
            {dimensions.map((dim, i) => {
              const p = dataPoints[i]
              const isSelected = selectedDim === i
              const labelPos = getPoint(cx, cy, radius + 32, dim.angle, 100)
              return (
                <g key={dim.key}>
                  {/* 发光点 */}
                  <motion.circle
                    cx={p.x}
                    cy={p.y}
                    r={isSelected ? 8 : 5}
                    fill={dim.color}
                    filter="url(#glow)"
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.4, delay: 0.8 + i * 0.1 }}
                    style={{ cursor: 'pointer' }}
                    onClick={() => setSelectedDim(isSelected ? null : i)}
                  />
                  {/* 标签 + 分值（两行上下排列，彻底避免重叠） */}
                  <text
                    x={labelPos.x}
                    y={labelPos.y}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fill="#5a4a3a"
                    fontFamily="serif"
                    fontSize={12}
                  >
                    <tspan x={labelPos.x} dy="-0.5em">
                      {dim.name}
                    </tspan>
                    <tspan
                      x={labelPos.x}
                      dy="1.3em"
                      fill={dim.color}
                      fontSize={12}
                      fontWeight={700}
                    >
                      {Math.round(dim.value * progress)}
                    </tspan>
                  </text>
                </g>
              )
            })}

            {/* 中心点 */}
            <circle cx={cx} cy={cy} r="3" fill="#e6b89c" opacity="0.6" />
          </svg>

          {/* 选中的维度详情浮层 */}
          <AnimatePresence>
            {selectedDim !== null && (
              <motion.div
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 p-4 rounded-2xl bg-white/80 backdrop-blur-md border border-white/50 shadow-xl text-center"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.3 }}
              >
                <div
                  className="w-3 h-3 rounded-full mx-auto mb-2"
                  style={{ background: dimensions[selectedDim].color }}
                />
                <h3 className="text-deep-brown font-serif text-sm mb-1">
                  {dimensions[selectedDim].name}
                </h3>
                <p className="text-deep-brown/50 text-xs mb-2">
                  {dimensions[selectedDim].description}
                </p>
                <div className="text-2xl font-serif" style={{ color: dimensions[selectedDim].color }}>
                  {dimensions[selectedDim].value}
                  <span className="text-xs text-deep-brown/30">/100</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>

      {/* 底部：人生任务卡片 */}
      <AnimatePresence>
        {showTasks && (
          <motion.div
            className="absolute bottom-6 left-0 right-0 flex flex-col md:flex-row items-center justify-center gap-3 md:gap-4 px-4 z-10"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            {isGeneratingTasks && tasks.length === 0 && (
              <motion.div
                className="w-full md:w-[280px] p-4 md:p-5 rounded-2xl border border-warm-gold/20 bg-white/40 backdrop-blur-md flex items-center justify-center gap-3"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <motion.div
                  className="w-5 h-5 border-2 border-warm-gold/30 border-t-warm-gold rounded-full"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                />
                <span className="text-sm text-deep-brown/60">看山正在为你构思任务...</span>
              </motion.div>
            )}
            {tasks.map((task, i) => (
              <motion.button
                key={task.title}
                onClick={() => router.push(task.type === 'main' ? '/scene/quest' : '/scene/hall')}
                className={`w-full md:w-[280px] p-4 md:p-5 rounded-2xl border backdrop-blur-md shadow-lg text-left cursor-pointer ${
                  task.type === 'main'
                    ? 'bg-gradient-to-br from-warm-gold/20 to-warm-gold/5 border-warm-gold/30 hover:border-warm-gold/50'
                    : 'bg-white/50 border-white/40 hover:border-warm-gold/30'
                }`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: i * 0.15 }}
                whileHover={{ scale: 1.03, y: -2 }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full tracking-wider ${
                      task.type === 'main'
                        ? 'bg-warm-gold text-white'
                        : 'bg-deep-brown/10 text-deep-brown/60'
                    }`}
                  >
                    {task.type === 'main' ? '主线任务' : '支线任务'}
                  </span>
                  <span className="text-[10px] text-deep-brown/30">点击跳转 →</span>
                </div>
                <h3 className="text-deep-brown font-serif text-sm md:text-base mb-1">
                  {task.title}
                </h3>
                <p className="text-deep-brown/60 text-xs leading-relaxed">
                  {task.desc}
                </p>
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* 右上角：技能管理入口 */}
      <motion.button
        onClick={() => router.push('/scene/skills')}
        className="absolute top-24 right-12 md:top-28 md:right-20 z-20 cursor-pointer group"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.5, duration: 0.5 }}
        whileHover={{ scale: 1.03, y: -2 }}
        whileTap={{ scale: 0.97 }}
      >
        <div className="relative flex flex-col items-center">
          {/* 主卡片 */}
          <div className="w-[120px] md:w-[140px] p-4 md:p-5 rounded-2xl bg-white/60 backdrop-blur-md border border-warm-gold/25 shadow-lg shadow-warm-gold/10 flex flex-col items-center gap-2 group-hover:bg-warm-gold/10 group-hover:border-warm-gold/40 transition-all">
            <div className="text-3xl md:text-4xl">🎯</div>
            <div className="text-[11px] md:text-xs text-warm-gold font-medium tracking-wider">技能管理</div>
          </div>

          {/* 下方气泡 */}
          <div className="mt-2 px-3 py-1.5 rounded-xl bg-white/70 backdrop-blur-sm border border-warm-gold/20 text-deep-brown/60 text-[10px] text-center leading-relaxed relative shadow-sm">
            记录热爱的每件事，见证成长轨迹
            <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-white/70 border-l border-t border-warm-gold/20 rotate-45" />
          </div>
        </div>
      </motion.button>

      {/* 右侧跳转导航栏 */}
      <motion.div
        className="absolute right-6 top-1/2 -translate-y-1/2 z-10 flex flex-col gap-2"
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 2.8 }}
      >
        {[
          { label: '大厅', path: '/scene/hall', highlight: false },
          { label: '任务', path: '/scene/quest', highlight: false },
          { label: '技能', path: '/scene/skills', highlight: true },
          { label: '目标', path: '/scene/goal', highlight: false },
        ].map((item) => (
          <motion.button
            key={item.path}
            onClick={() => router.push(item.path)}
            className={`px-3 py-2 rounded-xl text-[10px] tracking-wider border transition-all whitespace-nowrap ${
              item.highlight
                ? 'text-warm-gold border-warm-gold/40 bg-warm-gold/15 hover:bg-warm-gold/25 shadow-sm shadow-warm-gold/10'
                : 'text-deep-brown/60 border-deep-brown/10 bg-white/40 hover:bg-warm-gold/10 hover:border-warm-gold/30 hover:text-warm-gold'
            }`}
            whileHover={{ scale: 1.05, x: -4 }}
            whileTap={{ scale: 0.95 }}
          >
            {item.label}
          </motion.button>
        ))}
      </motion.div>

      {/* 底部操作按钮 */}
      <motion.div
        className="absolute bottom-6 left-6 md:bottom-8 md:left-8 z-10 flex items-center gap-3"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 3 }}
      >
        <motion.button
          onClick={() => router.push('/scene/hall')}
          className="px-6 py-3 rounded-full text-xs tracking-wider text-white bg-warm-gold shadow-lg shadow-warm-gold/30 hover:shadow-warm-gold/50 transition-all"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          进入人生大厅 →
        </motion.button>
      </motion.div>

      {/* 迷茫指数 */}
      <motion.div
        className="absolute bottom-20 right-6 md:bottom-24 md:right-8 text-right"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2.5 }}
      >
        <p className="text-sm text-deep-brown/40 tracking-wider uppercase mb-1">迷茫指数</p>
        <p className="text-5xl font-serif text-warm-gold" style={{ textShadow: '0 2px 12px rgba(230, 184, 156, 0.35)' }}>
          {Math.round((1 - dimensions.find((d) => d.key === 'clarity')!.value / 100) * 100)}
          <span className="text-2xl">%</span>
        </p>
      </motion.div>

      {/* ========== 分享卡片覆盖层 ========== */}
      <AnimatePresence>
        {showShareCard && (
          <motion.div
            className="absolute inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowShareCard(false)}
          >
            <motion.div
              className="relative w-[340px] bg-[#faf8f5] rounded-3xl shadow-2xl overflow-hidden p-6"
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.85, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* 关闭按钮 */}
              <button
                onClick={() => setShowShareCard(false)}
                className="absolute top-3 right-3 w-8 h-8 rounded-full bg-deep-brown/5 text-deep-brown/40 hover:bg-deep-brown/10 flex items-center justify-center text-sm transition-all z-10"
              >
                ✕
              </button>

              {/* 标题 */}
              <div className="text-center mb-4">
                <p className="text-[10px] text-warm-gold tracking-[0.2em] uppercase mb-1">知乎 × 刘看山</p>
                <h2 className="text-deep-brown font-serif text-lg tracking-wider">人生图谱</h2>
              </div>

              {/* 标签 */}
              <div className="flex items-center justify-center gap-2 flex-wrap mb-4">
                {userMbti && (
                  <span className="px-2.5 py-1 rounded-full text-[10px] bg-warm-gold/15 text-warm-gold border border-warm-gold/20">
                    {userMbti}
                  </span>
                )}
                {userHobbies.split(/[,，、\s]+/).filter(Boolean).slice(0, 3).map((h) => (
                  <span
                    key={h}
                    className="px-2.5 py-1 rounded-full text-[10px] bg-deep-brown/5 text-deep-brown/50 border border-deep-brown/10"
                  >
                    {h}
                  </span>
                ))}
              </div>

              {/* 小型六维图 */}
              <div className="flex justify-center mb-4">
                <MiniRadar dimensions={dimensions} />
              </div>

              {/* 迷茫指数 + 主线任务 */}
              <div className="text-center mb-5">
                <p className="text-[10px] text-deep-brown/30 tracking-wider mb-1">迷茫指数</p>
                <p className="text-xl font-serif text-warm-gold mb-3">
                  {Math.round((1 - dimensions.find((d) => d.key === 'clarity')!.value / 100) * 100)}%
                </p>
                {tasks.find((t) => t.type === 'main') && (
                  <div className="px-4 py-2.5 rounded-xl bg-warm-gold/10 border border-warm-gold/20">
                    <p className="text-[10px] text-warm-gold tracking-wider mb-1">主线任务</p>
                    <p className="text-sm text-deep-brown font-serif">
                      {tasks.find((t) => t.type === 'main')?.title}
                    </p>
                  </div>
                )}
              </div>

              {/* 底部 */}
              <div className="flex items-center justify-center gap-2 pt-3 border-t border-deep-brown/10">
                <div className="w-8 h-8 rounded-full bg-warm-gold/10 flex items-center justify-center text-lg">
                  🦊
                </div>
                <p className="text-[10px] text-deep-brown/40 tracking-wide">
                  无论去哪里，我都会在。
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.main>
  )
}

// ==================== 小型雷达图（分享卡片用）====================

function MiniRadar({ dimensions }: { dimensions: { key: string; name: string; angle: number; value: number; color: string }[] }) {
  const cx = 70
  const cy = 70
  const radius = 45
  const levels = 4

  const getPt = (angleDeg: number, value: number) => {
    const rad = (angleDeg * Math.PI) / 180
    const r = (value / 100) * radius
    return { x: cx + r * Math.sin(rad), y: cy - r * Math.cos(rad) }
  }

  const gridPolys = Array.from({ length: levels }, (_, i) => {
    const v = ((i + 1) / levels) * 100
    return dimensions.map((d) => `${getPt(d.angle, v).x},${getPt(d.angle, v).y}`).join(' ')
  })

  const dataPts = dimensions.map((d) => getPt(d.angle, d.value))
  const dataPoly = dataPts.map((p) => `${p.x},${p.y}`).join(' ')
  const axisEnds = dimensions.map((d) => getPt(d.angle, 100))

  return (
    <svg width="140" height="140" viewBox="0 0 140 140">
      <defs>
        <radialGradient id="miniFill" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="rgba(230, 184, 156, 0.35)" />
          <stop offset="100%" stopColor="rgba(230, 184, 156, 0.08)" />
        </radialGradient>
      </defs>
      {gridPolys.map((pts, i) => (
        <polygon key={i} points={pts} fill="none" stroke="rgba(200,180,160,0.25)" strokeWidth="0.8" />
      ))}
      {axisEnds.map((end, i) => (
        <line key={i} x1={cx} y1={cy} x2={end.x} y2={end.y} stroke="rgba(200,180,160,0.25)" strokeWidth="0.8" />
      ))}
      <polygon points={dataPoly} fill="url(#miniFill)" stroke="#e6b89c" strokeWidth="1.5" strokeLinejoin="round" />
      {dimensions.map((dim, i) => {
        const p = dataPts[i]
        return (
          <g key={dim.key}>
            <circle cx={p.x} cy={p.y} r="3" fill={dim.color} />
            <text
              x={getPt(dim.angle, 100).x}
              y={getPt(dim.angle, 100).y}
              textAnchor="middle"
              dominantBaseline="middle"
              fill="#5a4a3a"
              style={{ fontSize: 7, fontFamily: 'serif' }}
            >
              {dim.name.slice(0, 2)}
            </text>
          </g>
        )
      })}
    </svg>
  )
}
