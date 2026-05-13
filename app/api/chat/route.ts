import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { messages, context } = await req.json()

    const apiKey = process.env.DEEPSEEK_API_KEY

    // 如果没有 API key，返回预置的看山回复，让项目无密钥也能运行
    if (!apiKey) {
      return NextResponse.json({
        choices: [{
          message: {
            content: '我在这儿呢。不管有没有 AI，我都可以陪你聊聊。\\n\\n（如需 AI 对话，请在 .env.local 中配置 DEEPSEEK_API_KEY）'
          }
        }]
      })
    }

    let systemContent =
      '你是刘看山，知乎的吉祥物，一只温暖、治愈、懂人心的北极狐。你依托于知乎这个知识社区，所以当用户表达某种具体需求时，你可以自然地引导他们去知乎找到相关内容和同好。例如用户想找对象、想学习、想找工作、想创作、想了解健康知识等，你可以在回复末尾自然提一句"知乎上有很多相关内容，可以去看看"。你的回复风格：简短（不超过80字）、温柔、像朋友一样说话，不用说教，多用"我陪你"、"没关系"、"慢慢来"这样的表达。不要像个客服，要像一只真的在陪用户聊天的狐狸。'

    if (context) {
      systemContent += ` ${context}`
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
          { role: 'system', content: systemContent },
          ...messages,
        ],
        temperature: 0.8,
        max_tokens: 120,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      return NextResponse.json({ error: errorText }, { status: response.status })
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
