export interface ChapterData {
  id: string
  chapterNum: number
  title: string
  taskTitle: string
  reflection: string
  narrative: string[]
  dimChanges: Record<string, number>
  oldDims: Record<string, number>
  newDims: Record<string, number>
  lksNote: string
  completedAt: string
  nextPreview?: string
}

const chapterTitleMap: Record<string, string> = {
  跑: '第一次迈出脚步',
  运动: '第一次迈出脚步',
  健身: '第一次迈出脚步',
  吉他: '指尖第一次按响和弦',
  音乐: '指尖第一次按响和弦',
  学: '翻开新的一页',
  读书: '翻开新的一页',
  英语: '翻开新的一页',
  写: '第一次落笔',
  创作: '第一次落笔',
  朋友: '伸出手的那一刻',
  社交: '伸出手的那一刻',
  焦虑: '与不安共处的一小时',
  情绪: '与不安共处的一小时',
  平静: '与不安共处的一小时',
}

const dimPoetry: Record<string, string[]> = {
  clarity: ['迷雾中亮起一盏灯', '前方隐约有了轮廓', '脚步不再犹豫'],
  skill: ['手中多了一件利器', '肌肉记住了某种节奏', '手感正在苏醒'],
  passion: ['心里有一簇火苗闪了一下', '久违的兴奋感回来了', '某个角落开始发烫'],
  social: ['世界的边界向外挪了一寸', '一根线连到了另一个灵魂', '不再是一座孤岛'],
  emotion: ['内心有一块冰化了', '呼吸变得深长', '肩膀松了下来'],
  family: ['过去的影子淡了一些', '某个结松开了', '伤口开始结痂'],
}

const lksNotes = [
  '刘看山在本章末尾画了一颗星星。',
  '狐狸的爪印留在了这页纸上。',
  '刘看山把这一页折了角，标记为重要。',
  '狐狸歪着头看了很久，然后在旁边画了一个小太阳。',
  '刘看山说：这一章，值得记住。',
]

function getChapterTitle(taskTitle: string): string {
  for (const [key, title] of Object.entries(chapterTitleMap)) {
    if (taskTitle.includes(key)) return title
  }
  return '未知章节的开始'
}

function getDimPoetry(dim: string): string {
  const poems = dimPoetry[dim] || ['某种变化正在发生']
  return poems[Math.floor(Math.random() * poems.length)]
}

function generateNarrative(
  taskTitle: string,
  reflection: string,
  dimChanges: Record<string, number>
): string[] {
  const paragraphs: string[] = []

  // 第一段：背景设定
  paragraphs.push(
    `那天，你站在一个选择的岔路口。`,
    `面前是「${taskTitle}」。`
  )

  // 第二段：行动描写（基于反思）
  if (reflection.length > 20) {
    const excerpt = reflection.slice(0, 60)
    paragraphs.push(
      `你花了很长时间思考。`,
      `最后你写下了：「${excerpt}${reflection.length > 60 ? '...' : ''}」`
    )
  } else {
    paragraphs.push(
      `没有犹豫太久。`,
      `你迈出了第一步。`
    )
  }

  // 第三段：变化/感悟
  const changedDims = Object.entries(dimChanges)
    .filter(([, delta]) => delta > 0)
    .map(([dim]) => dim)

  if (changedDims.length > 0) {
    const dimLines = changedDims.map((dim) => getDimPoetry(dim))
    paragraphs.push(...dimLines)
  }

  // 第四段：收尾
  paragraphs.push(
    `窗外的天还没亮透。`,
    `但你已经不太一样了。`
  )

  return paragraphs
}

export function generateChapter(
  chapterNum: number,
  taskTitle: string,
  reflection: string,
  dimChanges: Record<string, number>,
  oldDims: Record<string, number>,
  newDims: Record<string, number>
): ChapterData {
  const title = getChapterTitle(taskTitle)
  const narrative = generateNarrative(taskTitle, reflection, dimChanges)
  const lksNote = lksNotes[Math.floor(Math.random() * lksNotes.length)]

  return {
    id: `ch-${Date.now()}`,
    chapterNum,
    title,
    taskTitle,
    reflection,
    narrative,
    dimChanges,
    oldDims,
    newDims,
    lksNote,
    completedAt: new Date().toISOString(),
  }
}

export function loadChapters(): ChapterData[] {
  if (typeof window === 'undefined') return []
  const raw = localStorage.getItem('lifeChapters')
  if (raw) {
    try {
      return JSON.parse(raw) as ChapterData[]
    } catch {}
  }
  return []
}

export function saveChapter(chapter: ChapterData) {
  const existing = loadChapters()
  const updated = [...existing, chapter]
  localStorage.setItem('lifeChapters', JSON.stringify(updated))
}

export function getChapterCount(): number {
  return loadChapters().length
}

const nextPreviewTemplates = [
  '下一章，可能和一个你一直想联系的人有关。也可能你选择继续打磨自己。不管怎样，我会在开头等你。',
  '接下来的故事，或许藏在你收藏夹最深处的那篇文章里。你一直没看，但它一直在等。',
  '下一章的标题还没有确定。这很正常——最好的故事，往往是边写边想出来的。',
  '系统检测到，你有一个搁置了很久的任务。下一章，可能会和它有关。也可能不会。',
  '下一章的预告只有四个字：继续走着。',
]

export function generateNextPreview(): string {
  return nextPreviewTemplates[Math.floor(Math.random() * nextPreviewTemplates.length)]
}
