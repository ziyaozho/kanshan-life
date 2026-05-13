'use client'

export interface Achievement {
  id: string
  title: string
  description: string
  icon: string
  category: 'task' | 'skill' | 'dimension' | 'explore'
  rarity: 'common' | 'rare' | 'epic' | 'legendary'
  condition: (data: AchievementData) => boolean
}

export interface AchievementData {
  completedTasks: CompletedTask[]
  skills: UserSkill[]
  dimensions: Record<string, number>
  chatCount: number
  treeLights: number
}

interface CompletedTask {
  title: string
  date: string
  type?: string
}

interface UserSkill {
  id: string
  name: string
  progress: number
}

export interface UnlockedAchievement {
  id: string
  unlockedAt: string
}

const achievements: Achievement[] = [
  // ===== 任务类 =====
  {
    id: 'first-main',
    title: '初出茅庐',
    description: '完成人生第一个主线任务',
    icon: '🌱',
    category: 'task',
    rarity: 'common',
    condition: (data) => data.completedTasks.some((t) => t.type === 'main'),
  },
  {
    id: 'first-side',
    title: '支线先锋',
    description: '完成第一个支线任务',
    icon: '🌿',
    category: 'task',
    rarity: 'common',
    condition: (data) => data.completedTasks.some((t) => t.type === 'side'),
  },
  {
    id: 'task-5',
    title: '任务达人',
    description: '累计完成5个任务',
    icon: '📋',
    category: 'task',
    rarity: 'rare',
    condition: (data) => data.completedTasks.length >= 5,
  },
  {
    id: 'task-10',
    title: '使命必达',
    description: '累计完成10个任务',
    icon: '🏆',
    category: 'task',
    rarity: 'epic',
    condition: (data) => data.completedTasks.length >= 10,
  },
  {
    id: 'perfect-run',
    title: '完美执行',
    description: '一次性完成所有4个步骤的任务',
    icon: '✨',
    category: 'task',
    rarity: 'rare',
    condition: () => false,
  },

  // ===== 技能类 =====
  {
    id: 'first-skill',
    title: '技能觉醒',
    description: '添加第一个想要掌握的技能',
    icon: '⚡',
    category: 'skill',
    rarity: 'common',
    condition: (data) => data.skills.length >= 1,
  },
  {
    id: 'skill-25',
    title: '渐入佳境',
    description: '某个技能进度达到25%',
    icon: '📈',
    category: 'skill',
    rarity: 'common',
    condition: (data) => data.skills.some((s) => s.progress >= 25),
  },
  {
    id: 'skill-50',
    title: '技能精通',
    description: '某个技能进度达到50%',
    icon: '🎯',
    category: 'skill',
    rarity: 'rare',
    condition: (data) => data.skills.some((s) => s.progress >= 50),
  },
  {
    id: 'skill-75',
    title: '技能大师',
    description: '某个技能进度达到75%',
    icon: '👑',
    category: 'skill',
    rarity: 'epic',
    condition: (data) => data.skills.some((s) => s.progress >= 75),
  },
  {
    id: 'skill-100',
    title: '十年磨一剑',
    description: '某个技能进度达到100%，彻底掌握',
    icon: '⚔️',
    category: 'skill',
    rarity: 'legendary',
    condition: (data) => data.skills.some((s) => s.progress >= 100),
  },
  {
    id: 'skill-3',
    title: '技多不压身',
    description: '同时追踪3个技能的成长',
    icon: '🔧',
    category: 'skill',
    rarity: 'rare',
    condition: (data) => data.skills.length >= 3,
  },

  // ===== 维度类 =====
  {
    id: 'dim-60',
    title: '初窥门径',
    description: '任一人维度达到60分',
    icon: '🔮',
    category: 'dimension',
    rarity: 'common',
    condition: (data) => Object.values(data.dimensions).some((v) => v >= 60),
  },
  {
    id: 'dim-all-50',
    title: '均衡发展',
    description: '所有人生维度均超过50分',
    icon: '⚖️',
    category: 'dimension',
    rarity: 'rare',
    condition: (data) => Object.values(data.dimensions).every((v) => v >= 50),
  },
  {
    id: 'dim-90',
    title: '登峰造极',
    description: '任一维度达到90分',
    icon: '🏔️',
    category: 'dimension',
    rarity: 'epic',
    condition: (data) => Object.values(data.dimensions).some((v) => v >= 90),
  },
  {
    id: 'dim-all-70',
    title: '六边形战士',
    description: '所有人生维度均超过70分',
    icon: '🔯',
    category: 'dimension',
    rarity: 'legendary',
    condition: (data) => Object.values(data.dimensions).every((v) => v >= 70),
  },

  // ===== 探索类 =====
  {
    id: 'first-chat',
    title: '与狐初遇',
    description: '第一次和刘看山聊天',
    icon: '🦊',
    category: 'explore',
    rarity: 'common',
    condition: (data) => data.chatCount >= 1,
  },
  {
    id: 'chat-10',
    title: '狐朋狗友',
    description: '和刘看山聊天超过10次',
    icon: '💬',
    category: 'explore',
    rarity: 'rare',
    condition: (data) => data.chatCount >= 10,
  },
  {
    id: 'tree-light',
    title: '树开第一花',
    description: '人生之树点亮第一个光点',
    icon: '✨',
    category: 'explore',
    rarity: 'common',
    condition: (data) => data.treeLights >= 1,
  },
  {
    id: 'tree-5',
    title: '枝繁叶茂',
    description: '点亮人生之树5个光点',
    icon: '🌳',
    category: 'explore',
    rarity: 'rare',
    condition: (data) => data.treeLights >= 5,
  },
  {
    id: 'tree-8',
    title: '满树星光',
    description: '点亮人生之树所有光点',
    icon: '🌟',
    category: 'explore',
    rarity: 'epic',
    condition: (data) => data.treeLights >= 8,
  },
]

const rarityColors: Record<string, string> = {
  common: 'bg-stone-400/20 text-stone-600 border-stone-400/30',
  rare: 'bg-sky-400/20 text-sky-600 border-sky-400/30',
  epic: 'bg-purple-400/20 text-purple-600 border-purple-400/30',
  legendary: 'bg-amber-400/20 text-amber-600 border-amber-400/30',
}

const rarityLabels: Record<string, string> = {
  common: '普通',
  rare: '稀有',
  epic: '史诗',
  legendary: '传说',
}

export function getRarityColor(rarity: string): string {
  return rarityColors[rarity] || rarityColors.common
}

export function getRarityLabel(rarity: string): string {
  return rarityLabels[rarity] || '普通'
}

export function loadUnlockedAchievements(): UnlockedAchievement[] {
  if (typeof window === 'undefined') return []
  const raw = localStorage.getItem('unlockedAchievements')
  if (raw) {
    try {
      return JSON.parse(raw) as UnlockedAchievement[]
    } catch {}
  }
  return []
}

export function saveUnlockedAchievements(list: UnlockedAchievement[]) {
  localStorage.setItem('unlockedAchievements', JSON.stringify(list))
}

export function checkAchievements(): Achievement[] {
  const data = collectAchievementData()
  const unlocked = loadUnlockedAchievements()
  const unlockedIds = new Set(unlocked.map((a) => a.id))

  const newlyUnlocked: Achievement[] = []

  achievements.forEach((ach) => {
    if (!unlockedIds.has(ach.id) && ach.condition(data)) {
      newlyUnlocked.push(ach)
    }
  })

  if (newlyUnlocked.length > 0) {
    const updated = [
      ...unlocked,
      ...newlyUnlocked.map((a) => ({ id: a.id, unlockedAt: new Date().toISOString() })),
    ]
    saveUnlockedAchievements(updated)
  }

  return newlyUnlocked
}

function collectAchievementData(): AchievementData {
  const data: AchievementData = {
    completedTasks: [],
    skills: [],
    dimensions: { clarity: 50, skill: 50, passion: 50, social: 50, emotion: 50, family: 50 },
    chatCount: 0,
    treeLights: 0,
  }

  if (typeof window === 'undefined') return data

  const tasks = localStorage.getItem('completedTasks')
  if (tasks) {
    try {
      data.completedTasks = JSON.parse(tasks)
    } catch {}
  }

  const skills = localStorage.getItem('userSkills')
  if (skills) {
    try {
      data.skills = JSON.parse(skills)
    } catch {}
  }

  const dims = localStorage.getItem('lifeDimensions')
  if (dims) {
    try {
      data.dimensions = JSON.parse(dims)
    } catch {}
  }

  const chat = localStorage.getItem('liukanshanChatCount')
  if (chat) {
    try {
      data.chatCount = parseInt(chat, 10) || 0
    } catch {}
  }

  const comp = localStorage.getItem('completedTasks')
  if (comp) {
    try {
      const list = JSON.parse(comp) as { type?: string }[]
      data.treeLights = list.length
    } catch {}
  }

  return data
}

export function getAllAchievements(): Achievement[] {
  return achievements
}

export function getUnlockedCount(): number {
  return loadUnlockedAchievements().length
}

export function getTotalCount(): number {
  return achievements.length
}
