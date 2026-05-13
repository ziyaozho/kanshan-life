'use client'

import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import Liukanshan from '@/app/components/Liukanshan'

// ==================== 动态词云生成 ====================

function generateKeywords(mbti: string, hobbies: string) {
  const baseKeywords = [
    { text: '职业转型', weight: 8 },
    { text: '焦虑', weight: 7 },
    { text: '迷茫', weight: 9 },
    { text: '成长', weight: 6 },
    { text: '深夜', weight: 5 },
    { text: '选择', weight: 6 },
  ]

  const mbtiMap: Record<string, string[]> = {
    INTJ: ['知识管理', '独立研究', '长期主义', '效率'],
    INTP: ['理论构建', '逻辑推演', '好奇心', '系统'],
    ENTJ: ['领导力', '战略', '执行力', '目标导向'],
    ENTP: ['辩论', '新机会', '跨界', '创新'],
    INFJ: ['意义感', '内心世界', '治愈', '文学'],
    INFP: ['理想主义', '创作', '情感', '价值观'],
    ENFJ: ['影响力', '人脉', '团队', '激励'],
    ENFP: ['可能性', '热情', '探索', '灵感'],
    ISTJ: ['稳定', '责任', '细节', '可靠'],
    ISFJ: ['关怀', '传统', '安全感', '付出'],
    ESTJ: ['规则', '管理', '效率', '结果'],
    ESFJ: ['服务', '和谐', '社交', '支持'],
    ISTP: ['动手', '体验', '自由', '实用'],
    ISFP: ['审美', '当下', '艺术', '感受'],
    ESTP: ['冒险', '行动', '刺激', '现实'],
    ESFP: ['娱乐', '表演', '社交', '享乐'],
  }

  const hobbyMap: Record<string, string[]> = {
    '编程': ['技术转型', '开源', '远程工作', '算法'],
    '代码': ['技术转型', '开源', '远程工作'],
    '开发': ['技术转型', '开源', '远程工作'],
    '画画': ['创作瓶颈', '艺术市场', '灵感', '展览'],
    '美术': ['创作瓶颈', '艺术市场', '灵感'],
    '音乐': ['独立音乐', '乐队', '音乐节', '创作'],
    '吉他': ['独立音乐', '乐队', '创作'],
    '钢琴': ['独立音乐', '创作'],
    '摄影': ['器材', '约拍', '视觉中国', '审美'],
    '拍照': ['器材', '约拍', '审美'],
    '写作': ['内容创业', '自媒体', '稿费', '出书'],
    '写': ['内容创业', '自媒体', '出书'],
    '运动': ['健身', '马拉松', '自律', '身体管理'],
    '健身': ['健身', '自律', '身体管理'],
    '游戏': ['电竞', '独立游戏', 'Steam', '直播'],
    '电竞': ['电竞', '直播'],
    '旅行': ['数字游民', '旅居', '签证', '背包客'],
    '旅游': ['数字游民', '旅居', '背包客'],
    '社交': ['人脉', '圈子', '社交焦虑', '连接'],
    '聚会': ['人脉', '圈子', '社交焦虑'],
    '做饭': ['美食博主', '探店', '烘焙', '治愈'],
    '烹饪': ['美食博主', '烘焙', '治愈'],
    '手工': ['手作', 'DIY', 'Etsy', '匠心'],
    'DIY': ['手作', '匠心'],
    '电影': ['影评', '独立电影', '电影节', '导演'],
    '剧': ['影评', '追剧', '流媒体'],
    '设计': ['UI设计', '品牌', '作品集', '创意'],
    '艺术': ['艺术市场', '创作', '审美', '展览'],
    '瑜伽': ['身心', '冥想', '自律', '疗愈'],
    '冥想': ['身心', '疗愈'],
    '跑步': ['马拉松', '自律', '身体管理'],
    '爬山': ['户外', '自然', '徒步'],
    '跳舞': ['街舞', '练舞房', '演出', '身体'],
    '舞蹈': ['街舞', '练舞房', '演出'],
    '露营': ['户外', '自然', '生活方式'],
    '徒步': ['户外', '自然', '徒步'],
    '读书': ['知识焦虑', '囤积', '书单', '深度阅读'],
    '阅读': ['知识焦虑', '书单', '深度阅读'],
    '学习': ['知识焦虑', '自学', '终身学习'],
    '研究': ['学术', '深度', '论文'],
    '创作': ['创作者经济', '内容', 'IP'],
    '美食': ['探店', '美食博主', '治愈'],
  }

  const result = [...baseKeywords]

  const seededWeight = (text: string, base: number) => {
    let hash = 0
    for (let j = 0; j < text.length; j++) hash = (hash * 31 + text.charCodeAt(j)) % 997
    return base + (hash % 3)
  }

  const mbtiType = mbti.toUpperCase().trim()
  if (mbtiMap[mbtiType]) {
    mbtiMap[mbtiType].forEach((text) => {
      result.push({ text, weight: seededWeight(text, 6) })
    })
  }

  const hobbyList = hobbies.split(/[,，、\s]+/).filter(Boolean)
  hobbyList.forEach((hobby) => {
    Object.entries(hobbyMap).forEach(([keyword, texts]) => {
      if (hobby.includes(keyword)) {
        texts.forEach((text) => {
          result.push({ text, weight: seededWeight(text, 5) })
        })
      }
    })
  })

  // 去重
  const seen = new Set<string>()
  const unique = result.filter((k) => {
    if (seen.has(k.text)) return false
    seen.add(k.text)
    return true
  })

  // 分配位置和 delay - 确定性seed避免hydration mismatch
  return unique.slice(0, 14).map((k, i) => {
    const seed = (n: number) => {
      const x = Math.sin(n * 127.1 + i * 311.7 + k.text.length * 73.3) * 43758.5453
      return x - Math.floor(x)
    }
    return {
      ...k,
      x: 8 + ((i * 7) % 80) + seed(1) * 8,
      y: 8 + ((i * 11) % 65) + seed(2) * 8,
      delay: 0.3 + i * 0.2,
    }
  })
}

const timeline = [
  { time: '22:00', label: '浏览「职场」', y: 80 },
  { time: '01:30', label: '点赞「焦虑」', y: 60 },
  { time: '03:15', label: '收藏「治愈」', y: 40 },
  { time: '04:00', label: '搜索「人生意义」', y: 20 },
]

const analysisSteps = [
  '读取知乎回答与点赞数据...',
  '提取关键词与情绪倾向...',
  '分析深夜行为模式...',
  '交叉比对问卷结果...',
  '生成人生六维图谱...',
]

// ==================== 组件 ====================

export default function AnalysisPage() {
  const router = useRouter()
  const [progress, setProgress] = useState(0)
  const [stepIndex, setStepIndex] = useState(0)
  const [showWords, setShowWords] = useState(false)
  const [showTimeline, setShowTimeline] = useState(false)
  const [showCurve, setShowCurve] = useState(false)
  const [userMbti, setUserMbti] = useState('')
  const [userHobbies, setUserHobbies] = useState('')

  // 读取用户数据
  useEffect(() => {
    setUserMbti(localStorage.getItem('userMbti') || '')
    setUserHobbies(localStorage.getItem('userHobbies') || '')
  }, [])

  // 动态生成词云
  const keywords = useMemo(() => generateKeywords(userMbti, userHobbies), [userMbti, userHobbies])

  useEffect(() => {
    const timers = [
      setTimeout(() => setShowWords(true), 300),
      setTimeout(() => setShowTimeline(true), 800),
      setTimeout(() => setShowCurve(true), 1200),
    ]
    return () => timers.forEach(clearTimeout)
  }, [])

  // 进度条动画
  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval)
          return 100
        }
        return prev + 1.5
      })
    }, 60)
    return () => clearInterval(interval)
  }, [])

  // 步骤文案轮播
  useEffect(() => {
    const interval = setInterval(() => {
      setStepIndex((prev) => (prev + 1) % analysisSteps.length)
    }, 800)
    return () => clearInterval(interval)
  }, [])

  // 完成后跳转（先设置目标，再进入图谱）
  useEffect(() => {
    if (progress >= 100) {
      const timer = setTimeout(() => {
        router.push('/scene/goal?first=true')
      }, 600)
      return () => clearTimeout(timer)
    }
  }, [progress, router])

  // 情绪曲线SVG path
  const curvePath = 'M 0 80 Q 50 20 100 50 T 200 30 T 300 60 T 400 25'

  return (
    <motion.main
      className="relative w-screen h-screen overflow-hidden bg-[#1a1816]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 1 }}
    >
      {/* 背景网格 */}
      <div
        className="absolute inset-0 pointer-events-none opacity-20"
        style={{
          backgroundImage: `
            linear-gradient(rgba(230, 184, 156, 0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(230, 184, 156, 0.1) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
        }}
      />

      {/* 词云 */}
      <AnimatePresence>
        {showWords &&
          keywords.map((kw) => (
            <motion.span
              key={kw.text}
              className="absolute font-serif text-white/80 pointer-events-none select-none"
              style={{
                left: `${kw.x}%`,
                top: `${kw.y}%`,
                fontSize: `${12 + kw.weight * 2}px`,
                textShadow: '0 0 20px rgba(230, 184, 156, 0.3)',
              }}
              initial={{ opacity: 0, scale: 0.5, filter: 'blur(8px)' }}
              animate={{ opacity: 0.7, scale: 1, filter: 'blur(0px)' }}
              exit={{ opacity: 0, filter: 'blur(8px)' }}
              transition={{ duration: 0.8, delay: kw.delay }}
            >
              {kw.text}
            </motion.span>
          ))}
      </AnimatePresence>

      {/* 情绪曲线 */}
      <AnimatePresence>
        {showCurve && (
          <motion.div
            className="absolute bottom-[25%] left-[5%] right-[5%] md:left-[15%] md:right-[15%] h-24 pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1 }}
          >
            <svg
              className="w-full h-full"
              viewBox="0 0 400 100"
              preserveAspectRatio="none"
            >
              <defs>
                <linearGradient id="curveGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="rgba(230, 184, 156, 0.4)" />
                  <stop offset="100%" stopColor="rgba(230, 184, 156, 0.8)" />
                </linearGradient>
              </defs>
              {/* 填充区域 */}
              <motion.path
                d={`${curvePath} L 400 100 L 0 100 Z`}
                fill="rgba(230, 184, 156, 0.1)"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 2 }}
              />
              {/* 曲线 */}
              <motion.path
                d={curvePath}
                fill="none"
                stroke="url(#curveGradient)"
                strokeWidth="2"
                strokeLinecap="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 3, ease: 'easeInOut' }}
              />
              {/* 数据点 */}
              {[
                { x: 0, y: 80 },
                { x: 100, y: 50 },
                { x: 200, y: 30 },
                { x: 300, y: 60 },
                { x: 400, y: 25 },
              ].map((p, i) => (
                <motion.circle
                  key={i}
                  cx={p.x}
                  cy={p.y}
                  r="3"
                  fill="#e6b89c"
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 1.5 + i * 0.3 }}
                />
              ))}
            </svg>
            <p className="absolute -top-4 left-0 text-[10px] text-white/30 tracking-wider">
              情绪波动曲线（基于内容偏好）
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 时间轴 */}
      <AnimatePresence>
        {showTimeline && (
          <motion.div
            className="absolute bottom-[8%] left-[5%] right-[5%] md:left-[15%] md:right-[15%]"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="flex items-center justify-between relative">
              {/* 轴线 */}
              <div className="absolute top-[7px] left-0 right-0 h-px bg-white/10" />
              {timeline.map((item, i) => (
                <motion.div
                  key={item.time}
                  className="relative flex flex-col items-center z-10"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 + i * 0.3 }}
                >
                  <motion.div
                    className="w-3.5 h-3.5 rounded-full border-2 border-warm-gold/60 bg-[#1a1816]"
                    animate={{
                      boxShadow: [
                        '0 0 0px rgba(230, 184, 156, 0)',
                        '0 0 8px rgba(230, 184, 156, 0.4)',
                        '0 0 0px rgba(230, 184, 156, 0)',
                      ],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      delay: i * 0.5,
                    }}
                  />
                  <span className="mt-2 text-[10px] text-white/40 whitespace-nowrap">
                    {item.time}
                  </span>
                  <span className="text-[9px] text-white/25 whitespace-nowrap mt-0.5">
                    {item.label}
                  </span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 中央：刘看山 + 分析状态 */}
      <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <Liukanshan width={120} variant="standing" animate={false} />
        </motion.div>

        {/* 分析文案 */}
        <motion.div
          className="mt-6 text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <AnimatePresence mode="wait">
            <motion.p
              key={stepIndex}
              className="text-white/70 font-serif text-sm md:text-base tracking-wide"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.4 }}
            >
              {analysisSteps[stepIndex]}
            </motion.p>
          </AnimatePresence>
        </motion.div>

        {/* 进度条 */}
        <div className="mt-6 w-48 md:w-64">
          <div className="h-1 bg-white/10 rounded-full overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              style={{
                background: 'linear-gradient(90deg, rgba(230, 184, 156, 0.6), rgba(230, 184, 156, 0.9))',
                boxShadow: '0 0 8px rgba(230, 184, 156, 0.4)',
              }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.1 }}
            />
          </div>
          <p className="text-center text-white/30 text-[10px] mt-2 tracking-wider">
            {Math.round(progress)}%
          </p>
        </div>
      </div>

      {/* 扫描线效果 */}
      <motion.div
        className="absolute inset-0 pointer-events-none z-20"
        style={{
          background: 'linear-gradient(180deg, transparent 0%, rgba(230, 184, 156, 0.03) 50%, transparent 100%)',
          height: '20%',
        }}
        animate={{ top: ['-20%', '120%'] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
      />
    </motion.main>
  )
}
