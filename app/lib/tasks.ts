// ========== 统一任务数据层 ==========
// 所有任务相关读写都通过此文件，不再直接操作 localStorage

export type TaskType = 'main' | 'side' | 'skill'
export type TaskStatus = 'active' | 'completed' | 'paused'

export interface Task {
  id: string
  type: TaskType
  title: string
  desc: string
  status: TaskStatus
  totalDays?: number
  currentDay?: number
  skillId?: string        // 技能任务的关联技能ID
  skillName?: string      // 技能名称（方便显示）
  createdAt: string
  completedAt?: string
  note?: string           // 用户执行后的反思/记录
  changes?: Record<string, number>  // 维度变化
  reflection?: string     // 反思文案
}

const ACTIVE_KEY = 'lks-tasks-v2'
const COMPLETED_KEY = 'lks-completed-v2'

/** 生成唯一ID */
function genId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

/** 读取活跃任务 */
export function getActiveTasks(): Task[] {
  if (typeof window === 'undefined') return []
  const raw = localStorage.getItem(ACTIVE_KEY)
  if (!raw) {
    // 首次使用：尝试从旧数据迁移
    return migrateFromLegacy()
  }
  try {
    return JSON.parse(raw) as Task[]
  } catch {
    return []
  }
}

/** 写入活跃任务 */
function setActiveTasks(tasks: Task[]) {
  localStorage.setItem(ACTIVE_KEY, JSON.stringify(tasks))
}

/** 读取已完成任务 */
export function getCompletedTasks(): Task[] {
  if (typeof window === 'undefined') return []
  const raw = localStorage.getItem(COMPLETED_KEY)
  if (!raw) {
    // 尝试从旧 completedTasks 迁移
    return migrateCompletedFromLegacy()
  }
  try {
    return JSON.parse(raw) as Task[]
  } catch {
    return []
  }
}

/** 写入已完成任务 */
function setCompletedTasks(tasks: Task[]) {
  localStorage.setItem(COMPLETED_KEY, JSON.stringify(tasks))
}

/** 从旧版数据迁移（lifeTasks → lks-tasks-v2） */
function migrateFromLegacy(): Task[] {
  const legacy = localStorage.getItem('lifeTasks')
  if (!legacy) return []
  try {
    const old = JSON.parse(legacy) as Array<{
      type: string
      title: string
      desc: string
      totalDays?: number
      currentDay?: number
      skillName?: string
    }>
    const migrated: Task[] = old.map((t) => ({
      id: genId(),
      type: (t.type as TaskType) || 'side',
      title: t.title,
      desc: t.desc || '',
      status: 'active',
      totalDays: t.totalDays,
      currentDay: t.currentDay,
      skillName: t.skillName,
      createdAt: new Date().toISOString(),
    }))
    setActiveTasks(migrated)
    return migrated
  } catch {
    return []
  }
}

/** 从旧版 completedTasks 迁移 */
function migrateCompletedFromLegacy(): Task[] {
  const legacy = localStorage.getItem('completedTasks')
  if (!legacy) return []
  try {
    const old = JSON.parse(legacy) as Array<{
      title: string
      date: string
      type: string
      note?: string
      skillName?: string
      changes?: Record<string, number>
      reflection?: string
    }>
    const migrated: Task[] = old.map((t) => ({
      id: genId(),
      type: (t.type as TaskType) || 'side',
      title: t.title,
      desc: '',
      status: 'completed',
      skillName: t.skillName,
      createdAt: t.date,
      completedAt: t.date,
      note: t.note,
      changes: t.changes,
      reflection: t.reflection,
    }))
    setCompletedTasks(migrated)
    return migrated
  } catch {
    return []
  }
}

// ========== CRUD API ==========

/** 创建任务 */
export function createTask(partial: Omit<Task, 'id' | 'createdAt' | 'status'>): Task {
  const task: Task = {
    ...partial,
    id: genId(),
    status: 'active',
    createdAt: new Date().toISOString(),
  }
  const tasks = getActiveTasks()
  // 主线任务放最前面
  if (task.type === 'main') {
    setActiveTasks([task, ...tasks.filter((t) => t.type !== 'main'), ...tasks.filter((t) => t.type === 'main')])
  } else {
    setActiveTasks([...tasks, task])
  }
  return task
}

/** 更新任务 */
export function updateTask(id: string, patch: Partial<Task>): Task | null {
  const tasks = getActiveTasks()
  const idx = tasks.findIndex((t) => t.id === id)
  if (idx === -1) return null
  tasks[idx] = { ...tasks[idx], ...patch }
  setActiveTasks(tasks)
  return tasks[idx]
}

/** 删除任务 */
export function deleteTask(id: string): boolean {
  const tasks = getActiveTasks()
  const filtered = tasks.filter((t) => t.id !== id)
  if (filtered.length === tasks.length) return false
  setActiveTasks(filtered)
  return true
}

/** 完成任务 — 从活跃移到已完成 */
export function completeTask(id: string, extra?: { note?: string; changes?: Record<string, number>; reflection?: string }): Task | null {
  const tasks = getActiveTasks()
  const idx = tasks.findIndex((t) => t.id === id)
  if (idx === -1) return null

  const task = tasks[idx]
  const completed: Task = {
    ...task,
    status: 'completed',
    completedAt: new Date().toISOString(),
    note: extra?.note || task.note,
    changes: extra?.changes || task.changes,
    reflection: extra?.reflection || task.reflection,
  }

  // 从活跃列表移除
  setActiveTasks(tasks.filter((t) => t.id !== id))

  // 添加到已完成列表
  const completedList = getCompletedTasks()
  completedList.unshift(completed)
  setCompletedTasks(completedList)

  return completed
}

/** 按类型获取活跃任务 */
export function getTasksByType(type: TaskType): Task[] {
  return getActiveTasks().filter((t) => t.type === type)
}

/** 按ID获取任务（先查活跃，再查已完成） */
export function getTaskById(id: string): Task | undefined {
  return getActiveTasks().find((t) => t.id === id) || getCompletedTasks().find((t) => t.id === id)
}

/** 获取主线任务 */
export function getMainTask(): Task | undefined {
  return getActiveTasks().find((t) => t.type === 'main')
}

/** 获取所有支线任务 */
export function getSideTasks(): Task[] {
  return getActiveTasks().filter((t) => t.type === 'side')
}

/** 获取技能关联的任务 */
export function getSkillTasks(skillId?: string): Task[] {
  const active = getActiveTasks().filter((t) => t.type === 'skill' && (!skillId || t.skillId === skillId))
  return active
}

/** 获取已完成任务数量 */
export function getCompletedCount(): number {
  return getCompletedTasks().length
}

/** 获取本周完成数 */
export function getWeeklyCompletedCount(): number {
  const now = new Date()
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  return getCompletedTasks().filter((t) => {
    if (!t.completedAt) return false
    return new Date(t.completedAt) >= weekAgo
  }).length
}

// ========== 兼容旧版 dimension / skill 联动 ==========

/** 读取六维评分 */
export function getDimensions(): Record<string, number> {
  const saved = localStorage.getItem('lifeDimensions')
  if (saved) {
    try {
      return JSON.parse(saved) as Record<string, number>
    } catch {}
  }
  return { clarity: 50, skill: 50, passion: 50, social: 50, emotion: 50, family: 50 }
}

/** 更新六维评分 */
export function updateDimensions(changes: Record<string, number>): Record<string, number> {
  const dims = getDimensions()
  const updated = { ...dims }
  Object.entries(changes).forEach(([dim, delta]) => {
    updated[dim] = Math.min(100, Math.max(0, updated[dim] + delta))
  })
  localStorage.setItem('lifeDimensions', JSON.stringify(updated))
  return updated
}

/** 读取用户技能 */
export function getUserSkills(): Array<{
  id: string
  name: string
  subtype: string
  current: string
  target: string
  progress: number
  metrics: { label: string; value: string }[]
}> {
  const saved = localStorage.getItem('userSkills')
  if (saved) {
    try {
      return JSON.parse(saved)
    } catch {}
  }
  return []
}

/** 更新技能进度 */
export function updateSkillProgress(skillName: string, delta: number): void {
  const saved = localStorage.getItem('userSkills')
  if (!saved) return
  try {
    const skills = JSON.parse(saved) as Array<{
      id: string
      name: string
      progress: number
    }>
    const text = skillName.toLowerCase()
    const matched = skills.find((s) => text.includes(s.name.toLowerCase()))
    if (matched) {
      const updated = skills.map((s) =>
        s.id === matched.id ? { ...s, progress: Math.min(100, s.progress + delta) } : s
      )
      localStorage.setItem('userSkills', JSON.stringify(updated))
    }
  } catch {}
}
