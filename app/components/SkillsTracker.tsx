'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { checkAchievements, Achievement } from '@/app/lib/achievements'
import AchievementPopup from '@/app/components/AchievementPopup'
import { getActiveTasks, createTask, completeTask } from '@/app/lib/tasks'

interface SkillMetric {
  label: string
  value: string
}

interface UserSkill {
  id: string
  name: string
  subtype: string
  current: string
  target: string
  progress: number
  metrics: SkillMetric[]
}

const skillTemplates: Record<string, { subtype: string; metrics: SkillMetric[] }> = {
  跑步: {
    subtype: '中长跑',
    metrics: [
      { label: '最佳成绩', value: '' },
      { label: '目标成绩', value: '' },
      { label: '每周跑量', value: '' },
    ],
  },
  吉他: {
    subtype: '民谣吉他',
    metrics: [
      { label: '已掌握和弦', value: '' },
      { label: '目标曲目', value: '' },
      { label: '练习时长', value: '' },
    ],
  },
  游泳: {
    subtype: '自由泳',
    metrics: [
      { label: '最佳配速', value: '' },
      { label: '目标距离', value: '' },
      { label: '每周次数', value: '' },
    ],
  },
  英语: {
    subtype: '口语',
    metrics: [
      { label: '当前词汇量', value: '' },
      { label: '目标考试', value: '' },
      { label: '每日时长', value: '' },
    ],
  },
  绘画: {
    subtype: '素描',
    metrics: [
      { label: '完成作品数', value: '' },
      { label: '目标风格', value: '' },
      { label: '每周练习', value: '' },
    ],
  },
}

// ==================== 技能 → 任务映射 ====================

interface SkillTaskStage {
  title: string
  desc: string
}

interface SkillTaskTemplate {
  base: SkillTaskStage    // 0-30%
  advanced: SkillTaskStage // 30-60%
  mastery: SkillTaskStage  // 60%+
}

const skillTaskMap: Record<string, SkillTaskTemplate> = {
  跑步: {
    base: { title: '第一周：建立跑步习惯', desc: '每周跑3次，每次20分钟，不追求速度，只追求规律。' },
    advanced: { title: '第二周：增加距离和配速', desc: '每次增加5分钟，记录心率变化，找到舒适区。' },
    mastery: { title: '第三周：挑战个人最佳', desc: '选一天全力跑，打破自己的记录，无论多少。' },
  },
  吉他: {
    base: { title: '第一周：每天15分钟基本功', desc: '和弦转换+C大调音阶，不求快，只求手指记住位置。' },
    advanced: { title: '第二周：完整弹唱目标曲目', desc: '选一首喜欢的歌，从副歌开始，每天练30分钟。' },
    mastery: { title: '第三周：录制自己的作品', desc: '用手机录一段弹唱，不完美也没关系，先完成。' },
  },
  游泳: {
    base: { title: '第一周：熟悉水感和呼吸', desc: '每次30分钟，重点练习换气，不追求速度。' },
    advanced: { title: '第二周：提升连续游距离', desc: '每次增加50米，找到最省力的节奏。' },
    mastery: { title: '第三周：挑战目标配速', desc: '记录每次的配速，争取比上周快5秒。' },
  },
  英语: {
    base: { title: '第一周：每天朗读15分钟', desc: '选一段简单的材料，大声读出来，不怕犯错。' },
    advanced: { title: '第二周：尝试完整对话', desc: '对着镜子或录音，模拟一段3分钟自我介绍。' },
    mastery: { title: '第三周：看一集无字幕视频', desc: '选喜欢的剧，第一遍盲听，第二遍看字幕核对。' },
  },
  绘画: {
    base: { title: '第一周：每天画30分钟线条', desc: '直线、曲线、椭圆，练手感和控制力。' },
    advanced: { title: '第二周：完成一幅完整作品', desc: '从草稿到成品，哪怕简单，也要画完。' },
    mastery: { title: '第三周：尝试新风格', desc: '模仿一位喜欢的画家，画一幅"致敬"作品。' },
  },
}

function generateSkillTask(skill: UserSkill): { type: 'main'; title: string; desc: string; totalDays: number; currentDay: number } {
  const progress = skill.progress
  let stageKey: 'base' | 'advanced' | 'mastery' = 'base'
  if (progress >= 60) stageKey = 'mastery'
  else if (progress >= 30) stageKey = 'advanced'

  const matched = skillTaskMap[skill.name]
  if (matched) {
    return {
      type: 'main',
      ...matched[stageKey],
      totalDays: 7,
      currentDay: 1,
    }
  }

  // 通用模板
  const stageLabels: Record<string, string> = {
    base: '基础期',
    advanced: '进阶期',
    mastery: '冲刺期',
  }
  return {
    type: 'main',
    title: `${skill.name} · ${stageLabels[stageKey]}`,
    desc: `从「${skill.current}」向「${skill.target}」迈进，每天一小步，不急。`,
    totalDays: 7,
    currentDay: 1,
  }
}

function loadSkills(): UserSkill[] {
  if (typeof window === 'undefined') return []
  const raw = localStorage.getItem('userSkills')
  if (raw) {
    try {
      return JSON.parse(raw) as UserSkill[]
    } catch {}
  }
  return []
}

function saveSkills(skills: UserSkill[]) {
  localStorage.setItem('userSkills', JSON.stringify(skills))
}

export default function SkillsTracker() {
  const [skills, setSkills] = useState<UserSkill[]>([])
  const [showAdd, setShowAdd] = useState(false)
  const [publishedSkillId, setPublishedSkillId] = useState<string | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)

  // 技能关联的任务
  const [skillTasks, setSkillTasks] = useState<
    Record<string, { title: string; desc: string; currentDay?: number; totalDays?: number }>
  >({})

  // 打卡状态
  const [checkInSkillId, setCheckInSkillId] = useState<string | null>(null)
  const [checkInNote, setCheckInNote] = useState('')
  const [checkInFeedback, setCheckInFeedback] = useState('')
  const [showCheckInFeedback, setShowCheckInFeedback] = useState(false)
  const [newAchievements, setNewAchievements] = useState<Achievement[]>([])

  // 编辑状态
  const [editingSkillId, setEditingSkillId] = useState<string | null>(null)
  const [editCurrent, setEditCurrent] = useState('')
  const [editTarget, setEditTarget] = useState('')
  const [editMetrics, setEditMetrics] = useState<SkillMetric[]>([])

  // 新增表单
  const [selectedTemplate, setSelectedTemplate] = useState('')
  const [customName, setCustomName] = useState('')
  const [subtype, setSubtype] = useState('')
  const [current, setCurrent] = useState('')
  const [target, setTarget] = useState('')
  const [metrics, setMetrics] = useState<SkillMetric[]>([])

  // 读取技能和关联任务
  useEffect(() => {
    setSkills(loadSkills())

    // 使用统一任务API读取
    const tasks = getActiveTasks()
    const map: Record<string, { title: string; desc: string; currentDay?: number; totalDays?: number }> = {}
    tasks.forEach((t) => {
      if (t.type !== 'skill') return
      const skillName = t.skillName || Object.keys(skillTaskMap).find((name) => t.title.includes(name))
      if (skillName) {
        map[skillName] = { title: t.title, desc: t.desc, currentDay: t.currentDay, totalDays: t.totalDays }
      }
    })
    setSkillTasks(map)
  }, [])

  const handleTemplateChange = (name: string) => {
    setSelectedTemplate(name)
    if (skillTemplates[name]) {
      setCustomName(name)
      setSubtype(skillTemplates[name].subtype)
      setMetrics(skillTemplates[name].metrics.map((m) => ({ ...m })))
    } else if (name === 'custom') {
      setCustomName('')
      setSubtype('')
      setMetrics([
        { label: '当前水平', value: '' },
        { label: '目标', value: '' },
      ])
    }
  }

  const handleAddSkill = () => {
    if (!customName.trim() || !current.trim() || !target.trim()) return
    const newSkill: UserSkill = {
      id: Date.now().toString(),
      name: customName.trim(),
      subtype: subtype.trim() || '一般',
      current: current.trim(),
      target: target.trim(),
      progress: 0,
      metrics: metrics.filter((m) => m.label.trim() && m.value.trim()),
    }
    const next = [...skills, newSkill]
    setSkills(next)
    saveSkills(next)
    resetForm()
    setShowAdd(false)
  }

  const resetForm = () => {
    setSelectedTemplate('')
    setCustomName('')
    setSubtype('')
    setCurrent('')
    setTarget('')
    setMetrics([])
  }

  const handleDeleteSkill = (id: string) => {
    const next = skills.filter((s) => s.id !== id)
    setSkills(next)
    saveSkills(next)
  }

  const startEdit = (skill: UserSkill) => {
    setEditingSkillId(skill.id)
    setEditCurrent(skill.current)
    setEditTarget(skill.target)
    setEditMetrics(skill.metrics.map((m) => ({ ...m })))
  }

  const cancelEdit = () => {
    setEditingSkillId(null)
    setEditCurrent('')
    setEditTarget('')
    setEditMetrics([])
  }

  const handleSaveEdit = (skillId: string) => {
    const updated = skills.map((s) =>
      s.id === skillId
        ? {
            ...s,
            current: editCurrent.trim() || s.current,
            target: editTarget.trim() || s.target,
            metrics: editMetrics.filter((m) => m.label.trim() || m.value.trim()),
          }
        : s
    )
    setSkills(updated)
    saveSkills(updated)
    setEditingSkillId(null)
  }

  // 技能打卡
  const handleCheckIn = (skill: UserSkill) => {
    if (!checkInNote.trim()) return

    // 更新技能进度 +5%
    const progressDelta = 5
    const updatedSkills = skills.map((s) =>
      s.id === skill.id ? { ...s, progress: Math.min(100, s.progress + progressDelta) } : s
    )
    setSkills(updatedSkills)
    saveSkills(updatedSkills)

    // 使用统一API更新任务天数
    const activeTasks = getActiveTasks()
    const matchedTask = activeTasks.find((t) =>
      t.type === 'main' && (
        t.skillName === skill.name ||
        (!t.skillName && t.title.includes(skill.name))
      )
    )
    if (matchedTask) {
      const nextDay = (matchedTask.currentDay || 1) + 1
      // 使用 updateTask API 更新天数
      // 注意：updateTask 在 tasks.ts 中定义，但 SkillsTracker 没有导入它
      // 这里直接操作 localStorage 更实际，因为 updateTask 需要 id
      const updatedTasks = activeTasks.map((t) =>
        t.id === matchedTask.id ? { ...t, currentDay: nextDay } : t
      )
      localStorage.setItem('lks-tasks-v2', JSON.stringify(updatedTasks))

      // 刷新 skillTasks
      setSkillTasks((prev) => ({
        ...prev,
        [skill.name]: { title: matchedTask.title, desc: matchedTask.desc, currentDay: nextDay, totalDays: matchedTask.totalDays },
      }))
    } else {
      // 无匹配任务时保留原有状态
    }

    // 记录打卡到已完成列表（不移除活跃任务）
    const completedListRaw = localStorage.getItem('lks-completed-v2')
    const completedList = completedListRaw ? JSON.parse(completedListRaw) : []
    completedList.unshift({
      id: Date.now().toString(),
      type: 'skill',
      title: `${skill.name} 打卡 — Day ${matchedTask?.currentDay || 1}`,
      desc: '',
      status: 'completed',
      skillName: skill.name,
      createdAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
      note: checkInNote.trim(),
    })
    localStorage.setItem('lks-completed-v2', JSON.stringify(completedList))

    // 检查成就
    const unlocked = checkAchievements()
    if (unlocked.length > 0) setNewAchievements(unlocked)

    // 显示反馈
    const feedbacks = [
      '又近了一步，手感会来的。',
      '坚持本身就是意义，你做得很好。',
      '今天的汗水，明天的底气。',
      '不急，一天一天来，你已经很棒了。',
      '狐狸看在眼里，继续加油。',
    ]
    setCheckInFeedback(feedbacks[Math.floor(Math.random() * feedbacks.length)])
    setShowCheckInFeedback(true)
    setCheckInNote('')

    setTimeout(() => {
      setShowCheckInFeedback(false)
      setCheckInSkillId(null)
    }, 2500)
  }

  const handlePublishTask = async (skill: UserSkill) => {
    setIsGenerating(true)

    // 收集用户画像
    const dims = localStorage.getItem('lifeDimensions')
    const dimensions = dims ? JSON.parse(dims) : {}
    const mood = localStorage.getItem('todayMood')
    const goal = localStorage.getItem('userGoal')
    const reflections = localStorage.getItem('completedTasks')
    const allSkills = skills.map((s) => ({ name: s.name, progress: s.progress, current: s.current, target: s.target }))

    // 找到最低维度
    let lowest = 'clarity'
    let minVal = 100
    Object.entries(dimensions).forEach(([k, v]) => {
      if ((v as number) < minVal) {
        minVal = v as number
        lowest = k
      }
    })

    let taskTitle = `${skill.name} · ${skill.progress < 30 ? '基础期' : skill.progress < 60 ? '进阶期' : '冲刺期'}`
    let taskDesc = `从「${skill.current}」向「${skill.target}」迈进，每天一小步，不急。`

    try {
      const res = await fetch('/api/task', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'skill',
          profile: {
            dimensions,
            skills: allSkills,
            mood: mood || undefined,
            goal: goal || undefined,
            lowestDim: lowest,
          },
        }),
      })

      if (res.ok) {
        const data = await res.json()
        if (data.title) taskTitle = data.title
        if (data.desc) taskDesc = data.desc
      }
    } catch {
      // API 失败用回退文案
    } finally {
      setIsGenerating(false)
    }

    const task = {
      type: 'main' as const,
      title: taskTitle,
      desc: taskDesc,
      totalDays: 7,
      currentDay: 1,
      skillName: skill.name,
    }

    // 使用统一API创建技能任务（主线类型）
    // 先删除同技能的旧任务
    const activeTasks = getActiveTasks()
    const toDelete = activeTasks.filter((t) => {
      if (t.type === 'skill' && t.skillName === skill.name) return true
      if (t.type === 'main' && t.skillName === skill.name) return true
      if (t.type === 'main' && t.title.includes(skill.name)) return true
      return false
    })
    // 创建新任务
    createTask({
      type: 'main',
      title: task.title,
      desc: task.desc,
      totalDays: task.totalDays,
      currentDay: task.currentDay,
      skillName: skill.name,
    })

    // 立即刷新 skillTasks 状态 —— 保留已有任务，只更新当前技能
    setSkillTasks((prev) => ({
      ...prev,
      [skill.name]: { title: task.title, desc: task.desc, currentDay: task.currentDay, totalDays: task.totalDays },
    }))

    setPublishedSkillId(skill.id)
    setTimeout(() => setPublishedSkillId(null), 3000)
  }

  return (
    <div className="w-full">
      {/* 头部 */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xs tracking-[0.15em] text-deep-brown/50 font-medium uppercase">
          技能掌握度
        </h3>
        <motion.button
          onClick={() => setShowAdd(!showAdd)}
          className="text-[10px] px-3 py-1.5 rounded-full border border-warm-gold/30 text-warm-gold hover:bg-warm-gold/10 transition-all"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          {showAdd ? '取消' : '+ 添加技能'}
        </motion.button>
      </div>

      <AnimatePresence>
        {showAdd && (
          <motion.div
            className="mb-4 p-4 rounded-2xl bg-white/50 border border-warm-gold/20 space-y-3"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            {/* 选择模板 */}
            <div className="flex flex-wrap gap-2">
              {Object.keys(skillTemplates).map((t) => (
                <button
                  key={t}
                  onClick={() => handleTemplateChange(t)}
                  className={`text-[10px] px-3 py-1.5 rounded-full border transition-all ${
                    selectedTemplate === t
                      ? 'bg-warm-gold text-white border-warm-gold'
                      : 'bg-white/40 border-deep-brown/10 text-deep-brown/60 hover:border-warm-gold/40'
                  }`}
                >
                  {t}
                </button>
              ))}
              <button
                onClick={() => handleTemplateChange('custom')}
                className={`text-[10px] px-3 py-1.5 rounded-full border transition-all ${
                  selectedTemplate === 'custom'
                    ? 'bg-warm-gold text-white border-warm-gold'
                    : 'bg-white/40 border-deep-brown/10 text-deep-brown/60 hover:border-warm-gold/40'
                }`}
              >
                自定义
              </button>
            </div>

            {/* 表单字段 */}
            <input
              type="text"
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              placeholder="技能名称"
              className="w-full px-3 py-2 rounded-xl bg-white/60 border border-deep-brown/10 text-sm text-deep-brown placeholder:text-deep-brown/30 focus:outline-none focus:border-warm-gold/50"
            />
            <input
              type="text"
              value={subtype}
              onChange={(e) => setSubtype(e.target.value)}
              placeholder="细分类型（如：短跑 / 民谣吉他）"
              className="w-full px-3 py-2 rounded-xl bg-white/60 border border-deep-brown/10 text-sm text-deep-brown placeholder:text-deep-brown/30 focus:outline-none focus:border-warm-gold/50"
            />
            <input
              type="text"
              value={current}
              onChange={(e) => setCurrent(e.target.value)}
              placeholder="当前水平（如：5公里/30分钟）"
              className="w-full px-3 py-2 rounded-xl bg-white/60 border border-deep-brown/10 text-sm text-deep-brown placeholder:text-deep-brown/30 focus:outline-none focus:border-warm-gold/50"
            />
            <input
              type="text"
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              placeholder="目标（如：半马/2小时）"
              className="w-full px-3 py-2 rounded-xl bg-white/60 border border-deep-brown/10 text-sm text-deep-brown placeholder:text-deep-brown/30 focus:outline-none focus:border-warm-gold/50"
            />

            {/* 细分指标 */}
            {metrics.map((m, i) => (
              <div key={i} className="flex gap-2">
                <input
                  type="text"
                  value={m.label}
                  onChange={(e) => {
                    const next = [...metrics]
                    next[i].label = e.target.value
                    setMetrics(next)
                  }}
                  placeholder="指标名称"
                  className="flex-1 px-3 py-2 rounded-xl bg-white/60 border border-deep-brown/10 text-sm text-deep-brown placeholder:text-deep-brown/30 focus:outline-none focus:border-warm-gold/50"
                />
                <input
                  type="text"
                  value={m.value}
                  onChange={(e) => {
                    const next = [...metrics]
                    next[i].value = e.target.value
                    setMetrics(next)
                  }}
                  placeholder="数值"
                  className="flex-1 px-3 py-2 rounded-xl bg-white/60 border border-deep-brown/10 text-sm text-deep-brown placeholder:text-deep-brown/30 focus:outline-none focus:border-warm-gold/50"
                />
              </div>
            ))}

            <motion.button
              onClick={handleAddSkill}
              className="w-full py-2.5 rounded-xl text-xs tracking-wider text-white bg-warm-gold shadow-lg shadow-warm-gold/20"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              保存技能
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 技能列表 */}
      <div className="space-y-3">
        {skills.length === 0 && !showAdd && (
          <p className="text-xs text-deep-brown/30 text-center py-4">
            还没有添加技能，点击上方按钮开始追踪
          </p>
        )}

        {skills.map((skill) => {
          const task = skillTasks[skill.name]
          return (
          <motion.div
            key={skill.id}
            className="p-3 rounded-2xl bg-white/40 border border-deep-brown/5 hover:border-warm-gold/20 transition-all"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-deep-brown">{skill.name}</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-deep-brown/5 text-deep-brown/40">
                  {skill.subtype}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-warm-gold font-medium">{skill.progress}%</span>
                <button
                  onClick={() => startEdit(skill)}
                  className="text-deep-brown/20 hover:text-warm-gold text-xs transition-colors"
                  title="编辑"
                >
                  ✎
                </button>
                <button
                  onClick={() => handleDeleteSkill(skill.id)}
                  className="text-deep-brown/20 hover:text-deep-brown/50 text-xs transition-colors"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* 进度条 */}
            <div className="relative h-2 rounded-full bg-deep-brown/10 overflow-hidden mb-2"
            >
              <motion.div
                className="absolute inset-y-0 left-0 bg-warm-gold rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${skill.progress}%` }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
              />
            </div>

            {/* 当前 → 目标 */}
            <div className="flex items-center justify-between text-[10px] text-deep-brown/40 mb-2">
              <span>当前：{skill.current}</span>
              <span>目标：{skill.target}</span>
            </div>

            {/* 编辑表单 */}
            {editingSkillId === skill.id && (
              <motion.div
                className="mt-3 p-4 rounded-2xl bg-white/70 border border-warm-gold/20"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
              >
                <p className="text-[10px] text-warm-gold/80 tracking-wider mb-3">编辑技能信息</p>

                {/* 当前水平 */}
                <div className="mb-3">
                  <label className="block text-[10px] text-deep-brown/50 mb-1 tracking-wider">当前水平</label>
                  <input
                    type="text"
                    value={editCurrent}
                    onChange={(e) => setEditCurrent(e.target.value)}
                    placeholder="例如：5公里/30分钟"
                    className="w-full px-3 py-2 rounded-xl bg-white border border-deep-brown/10 text-xs text-deep-brown placeholder:text-deep-brown/25 focus:outline-none focus:border-warm-gold/50 focus:ring-1 focus:ring-warm-gold/20 transition-all"
                  />
                </div>

                {/* 目标 */}
                <div className="mb-3">
                  <label className="block text-[10px] text-deep-brown/50 mb-1 tracking-wider">目标</label>
                  <input
                    type="text"
                    value={editTarget}
                    onChange={(e) => setEditTarget(e.target.value)}
                    placeholder="例如：半马/2小时"
                    className="w-full px-3 py-2 rounded-xl bg-white border border-deep-brown/10 text-xs text-deep-brown placeholder:text-deep-brown/25 focus:outline-none focus:border-warm-gold/50 focus:ring-1 focus:ring-warm-gold/20 transition-all"
                  />
                </div>

                {/* 细分指标 */}
                {editMetrics.length > 0 && (
                  <div className="mb-3">
                    <p className="text-[10px] text-deep-brown/40 mb-2 tracking-wider">细分指标</p>
                    {editMetrics.map((m, i) => (
                      <div key={i} className="flex gap-2 mb-2">
                        <div className="flex-1">
                          <label className="block text-[9px] text-deep-brown/35 mb-0.5">指标名称</label>
                          <input
                            type="text"
                            value={m.label}
                            onChange={(e) => {
                              const next = [...editMetrics]
                              next[i].label = e.target.value
                              setEditMetrics(next)
                            }}
                            placeholder="如：最佳成绩"
                            className="w-full px-3 py-2 rounded-xl bg-white border border-deep-brown/10 text-xs text-deep-brown placeholder:text-deep-brown/25 focus:outline-none focus:border-warm-gold/50 focus:ring-1 focus:ring-warm-gold/20 transition-all"
                          />
                        </div>
                        <div className="flex-1">
                          <label className="block text-[9px] text-deep-brown/35 mb-0.5">数值</label>
                          <input
                            type="text"
                            value={m.value}
                            onChange={(e) => {
                              const next = [...editMetrics]
                              next[i].value = e.target.value
                              setEditMetrics(next)
                            }}
                            placeholder="如：5'30''"
                            className="w-full px-3 py-2 rounded-xl bg-white border border-deep-brown/10 text-xs text-deep-brown placeholder:text-deep-brown/25 focus:outline-none focus:border-warm-gold/50 focus:ring-1 focus:ring-warm-gold/20 transition-all"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* 按钮 */}
                <div className="flex gap-2 mt-4">
                  <button
                    onClick={cancelEdit}
                    className="flex-1 py-2 rounded-xl text-[11px] text-deep-brown/50 border border-deep-brown/10 hover:bg-deep-brown/5 transition-all"
                  >
                    取消
                  </button>
                  <motion.button
                    onClick={() => handleSaveEdit(skill.id)}
                    className="flex-1 py-2 rounded-xl text-[11px] bg-warm-gold text-white shadow-md shadow-warm-gold/20"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    保存
                  </motion.button>
                </div>
              </motion.div>
            )}

            {/* 细分指标（非编辑模式显示） */}
            {editingSkillId !== skill.id && skill.metrics.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-2">
                {skill.metrics.map((m, i) => (
                  <span
                    key={i}
                    className="text-[10px] px-2 py-1 rounded-lg bg-white/60 text-deep-brown/60"
                  >
                    {m.label}：{m.value}
                  </span>
                ))}
              </div>
            )}

            {/* 关联任务显示 + 打卡 */}
            {task ? (
              <motion.div
                className="mt-3 p-3 rounded-xl bg-warm-gold/5 border border-warm-gold/15"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] text-warm-gold/80 tracking-wider uppercase">当前任务</span>
                  {task!.totalDays && (
                    <span className="text-[10px] text-warm-gold">
                      Day {task!.currentDay || 1} / {task!.totalDays}
                    </span>
                  )}
                </div>
                <p className="text-xs text-deep-brown font-medium mb-0.5">{task!.title}</p>
                <p className="text-[10px] text-deep-brown/50 leading-relaxed">{task!.desc}</p>
                {task!.totalDays && (
                  <div className="mt-2 h-1 bg-deep-brown/10 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-warm-gold rounded-full transition-all"
                      style={{
                        width: `${Math.max(5, (((task!.currentDay || 1) - 1) / task!.totalDays) * 100)}%`,
                      }}
                    />
                  </div>
                )}

                {/* 打卡区域 */}
                <AnimatePresence>
                  {checkInSkillId === skill.id && !showCheckInFeedback && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-3 overflow-hidden"
                    >
                      <p className="text-[10px] text-deep-brown/40 mb-1.5">
                        简单记录一下今天的练习
                      </p>
                      <textarea
                        value={checkInNote}
                        onChange={(e) => setCheckInNote(e.target.value)}
                        placeholder="比如：今天跑了3公里，比昨天多坚持了5分钟..."
                        rows={2}
                        className="w-full px-3 py-2 rounded-xl bg-white/60 border border-warm-gold/20 text-xs text-deep-brown placeholder:text-deep-brown/25 focus:outline-none focus:border-warm-gold/50 resize-none leading-relaxed"
                      />
                      <div className="flex gap-2 mt-2">
                        <button
                          onClick={() => {
                            setCheckInSkillId(null)
                            setCheckInNote('')
                          }}
                          className="flex-1 py-1.5 rounded-xl text-[11px] text-deep-brown/50 border border-deep-brown/10 hover:bg-deep-brown/5 transition-all"
                        >
                          取消
                        </button>
                        <motion.button
                          onClick={() => handleCheckIn(skill)}
                          className={`flex-1 py-1.5 rounded-xl text-[11px] tracking-wide transition-all ${
                            checkInNote.trim()
                              ? 'bg-warm-gold text-white'
                              : 'bg-deep-brown/10 text-deep-brown/40 cursor-not-allowed'
                          }`}
                          disabled={!checkInNote.trim()}
                          whileHover={checkInNote.trim() ? { scale: 1.02 } : {}}
                          whileTap={checkInNote.trim() ? { scale: 0.98 } : {}}
                        >
                          {checkInNote.trim() ? '完成打卡' : '写点什么吧'}
                        </motion.button>
                      </div>
                    </motion.div>
                  )}

                  {checkInSkillId === skill.id && showCheckInFeedback && (
                    <motion.div
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="mt-3 flex items-start gap-2"
                    >
                      <span className="text-lg">🦊</span>
                      <p className="text-xs text-warm-gold leading-relaxed">{checkInFeedback}</p>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* 打卡按钮 */}
                {checkInSkillId !== skill.id && (
                  <motion.button
                    onClick={() => {
                      setCheckInSkillId(skill.id)
                      setCheckInNote('')
                      setShowCheckInFeedback(false)
                    }}
                    className="mt-3 w-full py-1.5 rounded-xl text-[11px] text-warm-gold border border-warm-gold/30 hover:bg-warm-gold/10 transition-all"
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                  >
                    今日打卡 ✓
                  </motion.button>
                )}
              </motion.div>
            ) : (
              <div className="flex items-center justify-between">
                <p className="text-[10px] text-deep-brown/25">进度随任务完成自动更新</p>
                <button
                  onClick={() => handlePublishTask(skill)}
                  disabled={isGenerating}
                  className={`text-[10px] px-2.5 py-1 rounded-full border transition-all ${
                    isGenerating
                      ? 'border-deep-brown/10 text-deep-brown/30 cursor-not-allowed'
                      : 'border-warm-gold/30 text-warm-gold hover:bg-warm-gold/10'
                  }`}
                >
                  {isGenerating ? '看山在构思...' : '发布任务'}
                </button>
              </div>
            )}

            {/* 发布成功提示 */}
            <AnimatePresence>
              {publishedSkillId === skill.id && (
                <motion.div
                  className="mt-2 px-3 py-2 rounded-xl bg-warm-gold/10 border border-warm-gold/20"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  <p className="text-[11px] text-warm-gold leading-relaxed">
                    已为「{skill.name}」生成 7 天任务 🦊
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )})}
      </div>

      {/* 成就弹出 */}
      <AchievementPopup achievements={newAchievements} />
    </div>
  )
}
