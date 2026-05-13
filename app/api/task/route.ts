import { NextRequest, NextResponse } from 'next/server'

interface UserProfile {
  dimensions: Record<string, number>
  skills: { name: string; progress: number; current: string; target: string }[]
  mood?: string
  recentReflection?: string
  goal?: string
  lowestDim?: string
}

export async function POST(req: NextRequest) {
  try {
    const { profile, type } = await req.json() as { profile: UserProfile; type: 'main' | 'skill' | 'side' }

    const apiKey = process.env.DEEPSEEK_API_KEY

    // 如果没有 API key，返回预置的任务数据，让项目无密钥也能运行
    if (!apiKey) {
      if (type === 'side') {
        return NextResponse.json({
          title: '给三年前的自己写一句话',
          desc: '打开备忘录，写下你现在想对三年前的自己说的话。不用长，一句就够。',
        })
      }
      return NextResponse.json({
        title: '迈出第一步',
        desc: '不用追求完美，先完成，再完善。',
        totalDays: 7,
        stages: [
          { day: 1, title: '第一天', desc: '花10分钟，只做最简单的开始动作。' },
          { day: 3, title: '第三天', desc: '把前两天的感受写下来，哪怕只有一句话。' },
          { day: 7, title: '第七天', desc: '完成一个小闭环，哪怕不完美。' },
        ],
      })
    }

    const dimLabels: Record<string, string> = {
      clarity: '人生清晰度',
      skill: '技能掌控感',
      passion: '热情驱动力',
      social: '社交连接度',
      emotion: '情绪稳定性',
      family: '家庭和解度',
    }

    // 构建用户画像描述
    let userContext = ''

    // 维度分数
    const dimDesc = Object.entries(profile.dimensions || {})
      .map(([k, v]) => `${dimLabels[k] || k}: ${v}分`)
      .join('，')
    userContext += `用户六维人生图谱：${dimDesc}。`

    // 最低维度
    if (profile.lowestDim) {
      userContext += `最需要提升的是「${dimLabels[profile.lowestDim]}」。`
    }

    // 技能
    if (profile.skills?.length > 0) {
      const skillDesc = profile.skills.map((s) => `${s.name}(${s.progress}%)`).join('、')
      userContext += `正在追踪的技能：${skillDesc}。`
    }

    // 情绪
    if (profile.mood) {
      const moodMap: Record<string, string> = {
        happy: '还不错',
        neutral: '平淡',
        sad: '不太好',
      }
      userContext += `今天心情${moodMap[profile.mood] || profile.mood}。`
    }

    // 目标
    if (profile.goal) {
      userContext += `用户的人生目标是：${profile.goal}。`
    }

    // 最近反思
    if (profile.recentReflection) {
      userContext += `最近一次任务反思：「${profile.recentReflection.slice(0, 100)}」。`
    }

    let systemPrompt = ''
    let userPrompt = ''

    if (type === 'main') {
      systemPrompt = `你是刘看山，知乎的吉祥物，一只温暖治愈的北极狐。你深谙心理学和成长规律，擅长为用户设计直击内心的人生任务。

你的任务设计原则：
1. 任务必须具体、可执行，不要泛泛而谈
2. 任务标题要有画面感，让人一看就想行动
3. 任务描述要温柔但有力，像朋友推你一把
4. 7天阶段任务要有递进感，从易到难
5. 结合用户的真实状态（维度分数、技能、情绪）来设计
6. 不要说教，不要说"你应该"，要说"我们可以"

输出格式（严格JSON）：
{
  "title": "任务标题（有画面感，15字以内）",
  "desc": "任务描述（温暖有力，80字以内）",
  "totalDays": 7,
  "stages": [
    { "day": 1, "title": "阶段标题", "desc": "具体做什么" },
    { "day": 3, "title": "阶段标题", "desc": "具体做什么" },
    { "day": 7, "title": "阶段标题", "desc": "具体做什么" }
  ]
}`
      userPrompt = `请为这位用户设计一个7天主线任务。

${userContext}

要求：
- 任务要直击用户当前最需要成长的方向
- 标题要有画面感和情感共鸣
- 描述要温暖但有力，让人想立刻行动
- 7天要有递进，从微小行动到小突破

只返回JSON，不要其他内容。`
    } else if (type === 'skill') {
      systemPrompt = `你是刘看山，一只懂技能成长的北极狐。你擅长把技能学习拆解成让人上瘾的小任务。

你的任务设计原则：
1. 结合技能的当前水平和目标来设计
2. 任务要有"游戏感"，像打怪升级
3. 每天的练习要具体，不说"练一会儿"，要说"练15分钟， focusing on XX"
4. 7天要有明确的进步里程碑
5. 用温暖的口吻，让用户觉得"我可以做到"

输出格式（严格JSON）：
{
  "title": "技能任务标题",
  "desc": "任务描述",
  "totalDays": 7,
  "stages": [
    { "day": 1, "title": "阶段标题", "desc": "具体练习内容" },
    { "day": 3, "title": "阶段标题", "desc": "具体练习内容" },
    { "day": 7, "title": "阶段标题", "desc": "具体练习内容" }
  ]
}`
      userPrompt = `请为这位用户设计一个技能成长任务。

${userContext}

要求：
- 结合技能的当前水平和目标
- 每天的任务具体到分钟和动作
- 7天要有可见的进步路径
- 标题和描述要有激励性

只返回JSON，不要其他内容。`
    } else {
      systemPrompt = `你是刘看山，一只懂人心的北极狐。你擅长发现用户生活中的小切口，设计出意料之外又在情理之中的支线任务。

你的任务设计原则：
1. 支线任务要"小而美"，15分钟内能完成
2. 任务要有惊喜感，让用户觉得"原来还可以这样"
3. 结合用户的情绪状态和最近的反思内容
4. 任务要有一定的情感重量，不是简单的待办事项
5. 用温柔但带点调皮的方式表达

输出格式（严格JSON）：
{
  "title": "支线任务标题（有画面感）",
  "desc": "任务描述（温暖有共鸣，60字以内）"
}`
      userPrompt = `请为这位用户设计一个支线任务。

${userContext}

要求：
- 小而美，15分钟内能完成
- 有情感共鸣，不是机械的任务
- 让用户觉得"原来还可以这样"
- 结合用户的真实状态

只返回JSON，不要其他内容。`
    }

    const response = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.85,
        max_tokens: 600,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      return NextResponse.json({ error: errorText }, { status: response.status })
    }

    const data = await response.json()
    const content = data.choices?.[0]?.message?.content || ''

    // 提取 JSON
    let jsonStr = content
    const jsonMatch = content.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      jsonStr = jsonMatch[0]
    }

    let taskData: Record<string, unknown>
    try {
      taskData = JSON.parse(jsonStr)
    } catch {
      // 如果解析失败，返回 fallback
      if (type === 'side') {
        taskData = {
          title: '给三年前的自己写一句话',
          desc: '打开备忘录，写下你现在想对三年前的自己说的话。不用长，一句就够。',
        }
      } else {
        taskData = {
          title: '迈出第一步',
          desc: '不用追求完美，先完成，再完善。',
          totalDays: 7,
          stages: [
            { day: 1, title: '第一天', desc: '花10分钟，只做最简单的开始动作。' },
            { day: 3, title: '第三天', desc: '把前两天的感受写下来，哪怕只有一句话。' },
            { day: 7, title: '第七天', desc: '完成一个小闭环，哪怕不完美。' },
          ],
        }
      }
    }

    return NextResponse.json(taskData)
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
