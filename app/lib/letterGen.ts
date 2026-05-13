export interface GrowthLetter {
  id: string
  chaptersCovered: number[]
  date: string
  title: string
  content: string[]
}

export function generateGrowthLetter(chapters: { chapterNum: number; title: string; dimChanges: Record<string, number>; completedAt: string }[]): GrowthLetter | null {
  if (chapters.length === 0) return null

  const sorted = [...chapters].sort((a, b) => a.chapterNum - b.chapterNum)
  const first = sorted[0]
  const last = sorted[sorted.length - 1]

  // 统计维度变化
  const totalChanges: Record<string, number> = {}
  sorted.forEach((ch) => {
    Object.entries(ch.dimChanges).forEach(([dim, delta]) => {
      totalChanges[dim] = (totalChanges[dim] || 0) + delta
    })
  })

  const maxDim = Object.entries(totalChanges).sort((a, b) => b[1] - a[1])[0]
  const maxDimLabel = maxDim ? {
    clarity: '人生清晰度',
    skill: '技能掌控感',
    passion: '热情驱动力',
    social: '社交连接度',
    emotion: '情绪稳定性',
    family: '家庭和解度',
  }[maxDim[0]] : '勇气'

  const content: string[] = []

  // 开头
  content.push(`嘿，还记得第 ${first.chapterNum} 章吗？`)
  content.push(`那时候你站在一个选择的岔路口，手还在抖。系统说你在「${first.title}」前犹豫了很久。`)

  // 中段
  if (sorted.length >= 2) {
    content.push(`后来你完成了第一个任务。`)
    content.push(`你又连着完成了 ${sorted.length - 1} 个任务。`)
  }

  // 具体章节回顾
  const notableChapters = sorted.slice(-3)
  if (notableChapters.length > 0) {
    content.push(`你经历了：`)
    notableChapters.forEach((ch) => {
      content.push(`  · 第 ${ch.chapterNum} 章「${ch.title}」`)
    })
  }

  // 维度变化
  const changedDims = Object.entries(totalChanges).filter(([, v]) => v > 0)
  if (changedDims.length > 0) {
    content.push(`本章节的成长：`)
    changedDims.forEach(([dim, val]) => {
      const label = {
        clarity: '人生清晰度',
        skill: '技能掌控感',
        passion: '热情驱动力',
        social: '社交连接度',
        emotion: '情绪稳定性',
        family: '家庭和解度',
      }[dim] || dim
      content.push(`  · ${label} +${val}`)
    })
  }

  // 结尾
  content.push(`你不再是那个觉得自己一事无成的人了。`)
  content.push(`你在路上了。`)
  content.push(`——你的伙伴，看山。`)

  return {
    id: `letter-${Date.now()}`,
    chaptersCovered: sorted.map((c) => c.chapterNum),
    date: new Date().toISOString(),
    title: `第 ${first.chapterNum} ~ ${last.chapterNum} 章回顾`,
    content,
  }
}

export function loadLetters(): GrowthLetter[] {
  if (typeof window === 'undefined') return []
  const raw = localStorage.getItem('growthLetters')
  if (raw) {
    try {
      return JSON.parse(raw) as GrowthLetter[]
    } catch {}
  }
  return []
}

export function saveLetter(letter: GrowthLetter) {
  const existing = loadLetters()
  const updated = [...existing, letter]
  localStorage.setItem('growthLetters', JSON.stringify(updated))
}

export function shouldShowLetter(chapterCount: number): boolean {
  const letters = loadLetters()
  const lastLetterChapter = letters.length > 0
    ? letters[letters.length - 1].chaptersCovered[letters[letters.length - 1].chaptersCovered.length - 1]
    : 0
  return chapterCount > 0 && chapterCount % 5 === 0 && chapterCount > lastLetterChapter
}
