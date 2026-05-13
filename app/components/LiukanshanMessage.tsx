'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'

interface ChatMessage {
  id: string
  sender: 'user' | 'lks' | 'tool'
  text: string
  tool?: {
    label: string
    url: string
    icon: string
  }
}

interface ReplyCategory {
  keywords: string[]
  replies: string[]
}

const replyCategories: ReplyCategory[] = [
  {
    keywords: ['难过', '想哭', '痛苦', '糟糕', '失败', '累', '崩溃', '绝望', '伤心', '难受'],
    replies: [
      '我在这里，不急，慢慢说。',
      '没关系，想哭就哭，我陪着你。',
      '你已经很努力了，别对自己太苛刻。',
      '这只是今天的感觉，不是永远的。',
      '把眼泪流完，然后我们一起深呼吸。',
    ],
  },
  {
    keywords: ['想放弃', '做不到', '不行', '害怕', '担心', '犹豫', '迷茫', '不知道', '无力', '软'],
    replies: [
      '你不需要一步到位，只要今天比昨天好一点点。',
      '害怕是正常的，但别让害怕替你做决定。',
      '你已经走了这么远，再坚持一下。',
      '不是你不可以，只是还没找到对的方式。',
      '迷茫的时候，先照顾好当下的自己。',
    ],
  },
  {
    keywords: ['怎么办', '怎么做', '该做', '选择', '方向', '目标', '计划', '建议', '帮'],
    replies: [
      '先别急着找答案，告诉我，你现在最想要什么？',
      '大事拆小，小事做了。今天能做的一件小事是什么？',
      '如果三年后的你坐在这里，他会建议你做什么？',
      '跟着感觉走，不是冲动，是你内心知道答案。',
      '不需要完美的计划，只需要开始。',
    ],
  },
  {
    keywords: ['孤单', '孤独', '没人', '一个人', '寂寞', '没人懂', '无人'],
    replies: [
      '我懂。至少现在，你不是一个人。',
      '孤单是信号，说明你需要被看见。我看见你了。',
      '有时候，一个人待着也是一种力量。',
      '虽然隔着屏幕，但我在听，真的在听。',
    ],
  },
  {
    keywords: ['睡不着', '失眠', '晚安', '睡觉', '困', '熬夜'],
    replies: [
      '放下手机，闭上眼睛，想象我在旁边。',
      '睡不着也没关系，安静躺着也是一种休息。',
      '晚安，明天见。不管今天怎样，明天是新的。',
      '别逼自己睡着，越逼越清醒。放松。',
    ],
  },
  {
    keywords: ['开心', '高兴', '棒', '好', '顺利', '成功', '做到了', '完成'],
    replies: [
      '太好了，我为你高兴！',
      '你看，你比自己想象的更厉害。',
      '这一刻值得记住，以后难过的时候拿出来看看。',
      '继续保持，但不要有压力，你已经很好了。',
    ],
  },
]

const defaultReplies = [
  '我在听，继续说。',
  '嗯，我懂你的意思。',
  '这确实不容易，但你还在往前走，就很厉害了。',
  '有时候不需要答案，只需要有人陪着。我就是那个人。',
  '你说，我在。',
  '不管发生什么，我都在这儿。',
]

const greetingReplies = [
  '嗨，我在呢。今天想聊点什么？',
  '你来了，我刚好在。最近怎么样？',
  '好久不见，有什么想跟我说的吗？',
  '我在这儿呢，不走了。说吧。',
]

interface ToolScene {
  keywords: string[]
  reply: string
  toolLabel: string
  toolUrl: string
  icon: string
}

const toolScenes: ToolScene[] = [
  // ===== 情感关系 =====
  {
    keywords: ['找朋友', '找相似', '找伴', '伴侣', '对象', '脱单', '社交', '认识人', '交友', '相亲', '恋爱', '谈恋爱', '想恋爱', '感情', '心动', '暗恋', '追', '暧昧', '单身', '想脱单', '分手', '复合', '前任', '约会', 'crush'],
    reply: '想找同频的人？知乎上有很多有趣的灵魂。',
    toolLabel: '搜恋爱话题',
    toolUrl: 'https://www.zhihu.com/search?type=content&q=%E6%81%8B%E7%88%B1%E6%83%85%E6%84%9F',
    icon: '👥',
  },
  // ===== 学习成长 =====
  {
    keywords: ['学习', '想学', '课程', '知识', '读书', '提升', '充电', '进阶', '考研', '考证', '考试', '备考', '复习', '英语', '外语', '留学', '雅思', '托福'],
    reply: '学习是最好的投资，知乎上有很多优质内容。',
    toolLabel: '搜学习方法',
    toolUrl: 'https://www.zhihu.com/search?type=content&q=%E5%AD%A6%E4%B9%A0%E6%96%B9%E6%B3%95',
    icon: '📚',
  },
  // ===== 职场工作 =====
  {
    keywords: ['工作', '职场', '求职', '面试', '简历', '跳槽', '职业', '薪资', 'offer', '加班', '老板', '同事', '行业', '转行', '副业', '赚钱', '收入', '加薪'],
    reply: '职场路上不孤单，知乎上有很多过来人的经验分享。',
    toolLabel: '搜职场经验',
    toolUrl: 'https://www.zhihu.com/search?type=content&q=%E8%81%8C%E5%9C%BA%E7%BB%8F%E9%AA%8C',
    icon: '💼',
  },
  {
    keywords: ['创业', '开公司', '做生意', '项目', '投资', '融资', '合伙人', '商业模式'],
    reply: '创业需要勇气和准备，知乎上有很多创业者的真实故事。',
    toolLabel: '搜创业故事',
    toolUrl: 'https://www.zhihu.com/search?type=content&q=%E5%88%9B%E4%B8%9A',
    icon: '🚀',
  },
  // ===== 心理健康 =====
  {
    keywords: ['心理', '焦虑', '抑郁', '压力', '情绪不好', '心理咨询', '心理医生', '内耗', '失眠', '睡不着', '恐惧', '强迫', '自卑', '敏感'],
    reply: '照顾好自己的心理状态很重要，如果需要专业帮助...',
    toolLabel: '搜心理科普',
    toolUrl: 'https://www.zhihu.com/search?type=content&q=%E5%BF%83%E7%90%86%E5%81%A5%E5%BA%B7',
    icon: '🧠',
  },
  // ===== 创作表达 =====
  {
    keywords: ['写作', '创作', '写东西', '自媒体', '公众号', '知乎回答', '写文章', '拍视频', '做up', '内容', '文案', '编剧', '小说'],
    reply: '创作是一种自我表达，知乎欢迎你的声音。',
    toolLabel: '开始创作',
    toolUrl: 'https://www.zhihu.com/creator',
    icon: '✍️',
  },
  // ===== 健康生活 =====
  {
    keywords: ['健康', '健身', '减肥', '饮食', '养生', '运动', '瑜伽', '跑步', '健身房', '塑形', '减脂', '增肌', '体态', '睡眠', '熬夜', '作息'],
    reply: '身体是革命的本钱，知乎上有科学靠谱的健康知识。',
    toolLabel: '搜健身减肥',
    toolUrl: 'https://www.zhihu.com/search?type=content&q=%E5%81%A5%E8%BA%AB%E5%87%8F%E8%82%A5',
    icon: '💪',
  },
  {
    keywords: ['生病', '病', '医院', '医生', '症状', '药', '治疗', '体检', '疫苗', '牙齿', '眼睛', '颈椎', '腰椎', '过敏'],
    reply: '健康问题上知乎搜一搜，很多医生的专业科普值得关注。',
    toolLabel: '搜医学科普',
    toolUrl: 'https://www.zhihu.com/search?type=content&q=%E5%8C%BB%E5%AD%A6%E7%A7%91%E6%99%AE',
    icon: '🏥',
  },
  // ===== 旅行探索 =====
  {
    keywords: ['旅行', '旅游', '出去玩', '看世界', '目的地', '攻略', '酒店', '机票', '自驾游', '徒步', '露营', '潜水', '滑雪', '海边', '古镇'],
    reply: '身体和灵魂总要有一个在路上。',
    toolLabel: '搜旅行攻略',
    toolUrl: 'https://www.zhihu.com/search?type=content&q=%E6%97%85%E8%A1%8C%E6%94%BB%E7%95%A5',
    icon: '✈️',
  },
  // ===== 兴趣技能 =====
  {
    keywords: ['摄影', '拍照', '相机', '修图', 'ps', '剪辑', '视频', 'vlog', '无人机', '构图', '光影'],
    reply: '记录美好瞬间，知乎上有很多摄影干货和器材评测。',
    toolLabel: '搜摄影技巧',
    toolUrl: 'https://www.zhihu.com/search?type=content&q=%E6%91%84%E5%BD%B1%E6%8A%80%E5%B7%A7',
    icon: '📷',
  },
  {
    keywords: ['音乐', '唱歌', '乐器', '吉他', '钢琴', '乐队', '听歌', '作曲', '编曲', '音乐制作'],
    reply: '音乐是灵魂的避难所。知乎上有很多音乐人和乐理知识分享。',
    toolLabel: '搜音乐学习',
    toolUrl: 'https://www.zhihu.com/search?type=content&q=%E9%9F%B3%E4%B9%90%E5%AD%A6%E4%B9%A0',
    icon: '🎵',
  },
  {
    keywords: ['电影', '剧', '追剧', '影评', '导演', '演员', '剧本', '动漫', '番剧', '纪录片'],
    reply: '好电影改变人生，知乎上有很多深度影评和推荐。',
    toolLabel: '搜高分电影',
    toolUrl: 'https://www.zhihu.com/search?type=content&q=%E9%AB%98%E5%88%86%E7%94%B5%E5%BD%B1',
    icon: '🎬',
  },
  {
    keywords: ['游戏', '打游戏', '手游', 'steam', 'switch', 'ps5', '电竞', '单机', '联机', '组队'],
    reply: '适度游戏放松心情，知乎上有很多游戏评测和攻略。',
    toolLabel: '搜游戏推荐',
    toolUrl: 'https://www.zhihu.com/search?type=content&q=%E6%B8%B8%E6%88%8F%E6%8E%A8%E8%8D%90',
    icon: '🎮',
  },
  {
    keywords: ['美食', '吃', '做饭', '菜谱', '餐厅', '探店', '烘焙', '咖啡', '茶', '酒', '零食', '减脂餐'],
    reply: '人间烟火气，最抚凡人心。知乎上有很多美食探店和食谱。',
    toolLabel: '搜美食食谱',
    toolUrl: 'https://www.zhihu.com/search?type=content&q=%E7%BE%8E%E9%A3%9F%E9%A3%9F%E8%B0%B1',
    icon: '🍜',
  },
  {
    keywords: ['穿搭', '衣服', '时尚', '搭配', '穿衣', '风格', '护肤', '化妆', '美妆', '发型', '香水'],
    reply: '找到自己的风格，知乎上有很多穿搭和护肤干货。',
    toolLabel: '搜穿搭护肤',
    toolUrl: 'https://www.zhihu.com/search?type=content&q=%E7%A9%BF%E6%90%AD%E6%8A%A4%E8%82%A4',
    icon: '👔',
  },
  // ===== 理财经济 =====
  {
    keywords: ['理财', '存钱', '省钱', '投资', '基金', '股票', '买房', '租房', '房贷', '保险', '经济', '通货膨胀', '通货膨胀', '记账', '预算'],
    reply: '理财就是理生活，知乎上有很多实用的理财科普。',
    toolLabel: '搜理财入门',
    toolUrl: 'https://www.zhihu.com/search?type=content&q=%E7%90%86%E8%B4%A2%E5%85%A5%E9%97%A8',
    icon: '💰',
  },
  // ===== 科技数码 =====
  {
    keywords: ['手机', '电脑', '数码', '科技', 'app', '软件', '硬件', '编程', '代码', '开发', 'ai', '人工智能', 'chatgpt', '大模型', '算法'],
    reply: '科技改变生活，知乎上有很多数码评测和编程干货。',
    toolLabel: '搜数码评测',
    toolUrl: 'https://www.zhihu.com/search?type=content&q=%E6%95%B0%E7%A0%81%E8%AF%84%E6%B5%8B',
    icon: '💻',
  },
  // ===== 家居生活 =====
  {
    keywords: ['装修', '家具', '家居', '收纳', '整理', '搬家', '租房', '买房', '户型', '设计', '软装', '硬装', '家电'],
    reply: '打造一个舒服的家，知乎上有很多装修和收纳攻略。',
    toolLabel: '搜装修攻略',
    toolUrl: 'https://www.zhihu.com/search?type=content&q=%E8%A3%85%E4%BF%AE%E6%94%BB%E7%95%A5',
    icon: '🏠',
  },
  // ===== 汽车交通 =====
  {
    keywords: ['车', '汽车', '买车', '开车', '驾照', '驾校', '新能源', '电动车', '油车', '保养', '二手车', '交通', '地铁', '通勤'],
    reply: '选车用车不踩坑，知乎上有很多车主的真实经验。',
    toolLabel: '搜买车建议',
    toolUrl: 'https://www.zhihu.com/search?type=content&q=%E4%B9%B0%E8%BD%A6%E5%BB%BA%E8%AE%AE',
    icon: '🚗',
  },
  // ===== 法律维权 =====
  {
    keywords: ['法律', '律师', '合同', '维权', '劳动法', '消费者权益', '纠纷', '起诉', '赔偿', '劳动法', '离职', '被裁', '仲裁'],
    reply: '法律问题别慌，知乎上有很多律师的专业解答。',
    toolLabel: '搜法律知识',
    toolUrl: 'https://www.zhihu.com/search?type=content&q=%E6%B3%95%E5%BE%8B%E5%B8%B8%E8%AF%86',
    icon: '⚖️',
  },
  // ===== 育儿家庭 =====
  {
    keywords: ['孩子', '育儿', '教育', '早教', '幼儿园', '小学', '亲子', '怀孕', '备孕', '带娃', '父母', '原生家庭', '家庭关系'],
    reply: '育儿是一场修行，知乎上有很多过来人的经验分享。',
    toolLabel: '搜育儿经验',
    toolUrl: 'https://www.zhihu.com/search?type=content&q=%E8%82%B2%E5%84%BF%E7%BB%8F%E9%AA%8C',
    icon: '👶',
  },
  // ===== 内部导航 =====
  {
    keywords: ['我的任务', '当前任务', '去做任务', '主线任务', '任务在哪'],
    reply: '你的任务正在等你，去完成它吧。',
    toolLabel: '去做任务',
    toolUrl: '/scene/quest',
    icon: '📜',
  },
  {
    keywords: ['我的技能', '技能进度', '去学技能', '练技能'],
    reply: '看看你的技能成长得怎么样了。',
    toolLabel: '查看技能',
    toolUrl: '/scene/skills',
    icon: '⚡',
  },
  {
    keywords: ['我的成就', '成就墙', '获得了什么', '勋章'],
    reply: '来看看你解锁了哪些成就。',
    toolLabel: '查看成就',
    toolUrl: '/scene/hall?wall=1',
    icon: '🏆',
  },
  {
    keywords: ['人生图谱', '六维图', '我的分数', '维度'],
    reply: '你的人生图谱记录着你的成长。',
    toolLabel: '查看图谱',
    toolUrl: '/scene/profile',
    icon: '🔯',
  },
  {
    keywords: ['大厅', '人生大厅', '回家', '回大厅'],
    reply: '欢迎回来，大树在等你。',
    toolLabel: '回大厅',
    toolUrl: '/scene/hall',
    icon: '🌳',
  },
]

function detectTool(userText: string): ToolScene | null {
  const lower = userText.toLowerCase()
  for (const scene of toolScenes) {
    if (scene.keywords.some((kw) => lower.includes(kw))) {
      return scene
    }
  }
  return null
}

function generateReply(userText: string): string {
  const lower = userText.toLowerCase()

  for (const cat of replyCategories) {
    if (cat.keywords.some((kw) => lower.includes(kw))) {
      return cat.replies[Math.floor(Math.random() * cat.replies.length)]
    }
  }

  return defaultReplies[Math.floor(Math.random() * defaultReplies.length)]
}

export default function LiukanshanMessage() {
  const router = useRouter()
  const [isChatOpen, setIsChatOpen] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputText, setInputText] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [hasGreeted, setHasGreeted] = useState(false)
  const [deleteCount, setDeleteCount] = useState(0)
  const [showHesitationEgg, setShowHesitationEgg] = useState(false)
  const lastLengthRef = useRef(0)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, isTyping])

  const openChat = () => {
    setIsChatOpen(true)
    if (!hasGreeted && messages.length === 0) {
      setHasGreeted(true)
      setTimeout(() => {
        const greeting = greetingReplies[Math.floor(Math.random() * greetingReplies.length)]
        setMessages([{ id: 'greet', sender: 'lks', text: greeting }])
      }, 400)
    }
  }

  const closeChat = () => {
    setIsChatOpen(false)
  }

  const sendMessage = async () => {
    if (!inputText.trim()) return

    // 记录聊天次数
    const count = parseInt(localStorage.getItem('liukanshanChatCount') || '0', 10)
    localStorage.setItem('liukanshanChatCount', String(count + 1))

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text: inputText.trim(),
    }
    setMessages((prev) => [...prev, userMsg])
    setInputText('')
    setIsTyping(true)

    // 检测用户意图，传给 AI 以便更自然回复
    const detectedTool = detectTool(userMsg.text)

    try {
      const apiMessages = [...messages, userMsg].map((m) => ({
        role: m.sender === 'user' ? ('user' as const) : ('assistant' as const),
        content: m.text,
      }))

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: apiMessages,
          context: detectedTool
            ? `用户似乎在寻找/关注"${detectedTool.keywords[0]}"相关内容，你可以在回复末尾自然提一句知乎上有相关内容和社区。`
            : undefined,
        }),
      })

      if (!res.ok) throw new Error('API error')

      const data = await res.json()
      const replyText = data.choices?.[0]?.message?.content || generateReply(userMsg.text)

      const lksMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'lks',
        text: replyText,
        tool: detectedTool
          ? {
              label: detectedTool.toolLabel,
              url: detectedTool.toolUrl,
              icon: detectedTool.icon,
            }
          : undefined,
      }
      setMessages((prev) => [...prev, lksMsg])
    } catch {
      // API 失败时 fallback 到本地回复
      const reply = generateReply(userMsg.text)
      const lksMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'lks',
        text: reply,
        tool: detectedTool
          ? {
              label: detectedTool.toolLabel,
              url: detectedTool.toolUrl,
              icon: detectedTool.icon,
            }
          : undefined,
      }
      setMessages((prev) => [...prev, lksMsg])
    } finally {
      setIsTyping(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <>
      {/* 刘看山桌宠 + 聊天面板 — 整体可拖拽 */}
      <motion.div
        className="fixed z-50"
        style={{ left: '8%', top: '14%' }}
        drag
        dragMomentum={false}
        whileDrag={{ scale: 1.05, cursor: 'grabbing' }}
      >
        {/* 刘看山头像 - 点击打开聊天 */}
        <motion.div
          className="relative w-[80px] h-[96px] flex-shrink-0 cursor-pointer"
          animate={{ y: [0, -4, 0] }}
          transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.95 }}
          onClick={openChat}
        >
          <Image
            src="/images/liukanshan.png"
            alt="刘看山"
            fill
            className="object-contain pointer-events-none"
            draggable={false}
          />

          {/* 任务本子 */}
          <motion.div
            className="absolute -bottom-1 left-1/2"
            style={{ x: '-50%', marginLeft: 2 }}
            animate={{ rotate: [-3, 3, -3], y: [0, -2, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          >
            <svg width="36" height="26" viewBox="0 0 36 26" fill="none">
              <path d="M2 3 Q9 1 18 3 Q27 1 34 3 L34 22 Q27 20 18 22 Q9 20 2 22 Z" fill="#faf8f5" stroke="#d4c4b0" strokeWidth="0.8"/>
              <path d="M18 3 L18 22" stroke="#d4c4b0" strokeWidth="0.8"/>
              <path d="M6 9 L14 9" stroke="#e8ddd0" strokeWidth="0.8"/>
              <path d="M6 12 L14 12" stroke="#e8ddd0" strokeWidth="0.8"/>
              <path d="M6 15 L12 15" stroke="#e8ddd0" strokeWidth="0.8"/>
              <path d="M22 9 L30 9" stroke="#e8ddd0" strokeWidth="0.8"/>
              <path d="M22 12 L30 12" stroke="#e8ddd0" strokeWidth="0.8"/>
              <path d="M22 15 L28 15" stroke="#e8ddd0" strokeWidth="0.8"/>
            </svg>
          </motion.div>

          {/* 点击提示小气泡 */}
          <AnimatePresence>
            {!isChatOpen && messages.length === 0 && (
              <motion.div
                className="absolute -top-2 -right-2 px-2.5 py-1 rounded-full bg-warm-gold text-white text-[9px] whitespace-nowrap shadow-sm"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ delay: 1 }}
              >
                有什么烦心事吗，可以和我聊聊
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* 聊天面板 — 跟随桌宠一起移动 */}
        <AnimatePresence>
          {isChatOpen && (
            <motion.div
              className="absolute z-[60] top-full mt-3 left-0"
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
              onClick={(e) => e.stopPropagation()}
            >
            <div className="w-[320px] md:w-[360px] h-[480px] glass-card rounded-3xl border border-warm-gold/20 shadow-2xl flex flex-col overflow-hidden">
              {/* 顶部栏 */}
              <div className="flex items-center gap-3 px-4 py-3 border-b border-warm-gold/10 bg-white/30">
                <div className="relative w-9 h-9 rounded-full overflow-hidden bg-warm-gold/10">
                  <Image src="/images/liukanshan.png" alt="刘看山" fill className="object-contain" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-deep-brown font-medium">刘看山</p>
                  <p className="text-[10px] text-deep-brown/40">{isTyping ? '正在输入...' : '在线'}</p>
                </div>
                <button
                  onClick={closeChat}
                  className="w-7 h-7 rounded-full bg-deep-brown/5 text-deep-brown/40 hover:bg-deep-brown/10 hover:text-deep-brown/70 flex items-center justify-center text-xs transition-all"
                >
                  ✕
                </button>
              </div>

              {/* 聊天记录 */}
              <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
                {messages.length === 0 && (
                  <div className="text-center py-8">
                    <p className="text-xs text-deep-brown/30">有什么想说的，都可以告诉我</p>
                  </div>
                )}

                {messages.map((msg) => {
                  // lks 消息带工具入口
                  if (msg.sender === 'lks' && msg.tool) {
                    return (
                      <motion.div
                        key={msg.id}
                        className="flex justify-start"
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        <div className="max-w-[85%]"
                        >
                          {/* 文字回复 */}
                          <div className="px-3.5 py-2.5 rounded-2xl rounded-bl-sm bg-white/60 text-deep-brown text-sm leading-relaxed border border-warm-gold/10"
                          >
                            {msg.text}
                          </div>
                          {/* 入口按钮 */}
                          {(() => {
                            const t = msg.tool!
                            const isInternal = t.url.startsWith('/') && !t.url.startsWith('//')
                            return isInternal ? (
                              <button
                                onClick={() => router.push(t.url)}
                                className="mt-1.5 w-full flex items-center gap-2 px-3 py-2 rounded-xl bg-warm-gold/10 border border-warm-gold/20 hover:bg-warm-gold/20 transition-all text-left"
                              >
                                <span className="text-base">{t.icon}</span>
                                <span className="text-xs text-warm-gold font-medium">{t.label}</span>
                                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="text-warm-gold ml-auto"
                                >
                                  <path d="M3 9L9 3M9 3H4M9 3V8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                              </button>
                            ) : (
                              <a
                                href={t.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="mt-1.5 flex items-center gap-2 px-3 py-2 rounded-xl bg-warm-gold/10 border border-warm-gold/20 hover:bg-warm-gold/20 transition-all"
                              >
                                <span className="text-base">{t.icon}</span>
                                <span className="text-xs text-warm-gold font-medium">{t.label}</span>
                                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="text-warm-gold ml-auto"
                                >
                                  <path d="M3 9L9 3M9 3H4M9 3V8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                              </a>
                            )
                          })()}
                        </div>
                      </motion.div>
                    )
                  }
                  return (
                    <motion.div
                      key={msg.id}
                      className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div
                        className={`max-w-[75%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${
                          msg.sender === 'user'
                            ? 'bg-warm-gold text-white rounded-br-sm'
                            : 'bg-white/60 text-deep-brown rounded-bl-sm border border-warm-gold/10'
                        }`}
                      >
                        {msg.text}
                      </div>
                    </motion.div>
                  )
                })}

                {isTyping && (
                  <motion.div
                    className="flex justify-start"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    <div className="bg-white/60 text-deep-brown/50 px-4 py-2.5 rounded-2xl rounded-bl-sm border border-warm-gold/10 text-sm">
                      <span className="inline-flex gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-deep-brown/30 animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="w-1.5 h-1.5 rounded-full bg-deep-brown/30 animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="w-1.5 h-1.5 rounded-full bg-deep-brown/30 animate-bounce" style={{ animationDelay: '300ms' }} />
                      </span>
                    </div>
                  </motion.div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* 输入框 */}
              <div className="px-3 py-3 border-t border-warm-gold/10 bg-white/30">
                <div className="flex items-end gap-2">
                  <textarea
                    value={inputText}
                    onChange={(e) => {
                      const newVal = e.target.value
                      const oldLen = lastLengthRef.current
                      const newLen = newVal.length
                      if (newLen < oldLen && oldLen > 0) {
                        const nextCount = deleteCount + 1
                        setDeleteCount(nextCount)
                        if (nextCount === 5 && !showHesitationEgg) {
                          setShowHesitationEgg(true)
                          setMessages((prev) => [
                            ...prev,
                            {
                              id: 'egg-hesitation',
                              sender: 'lks',
                              text: '慢慢来，不着急。删了写、写了删，这也是思考的一部分。',
                            },
                          ])
                          // 解锁彩蛋成就
                          const eggs = JSON.parse(localStorage.getItem('unlockedEggs') || '[]')
                          if (!eggs.includes('hesitation')) {
                            eggs.push('hesitation')
                            localStorage.setItem('unlockedEggs', JSON.stringify(eggs))
                          }
                        }
                      }
                      lastLengthRef.current = newLen
                      setInputText(newVal)
                    }}
                    onKeyDown={handleKeyDown}
                    placeholder="说点什么..."
                    rows={1}
                    className="flex-1 px-3 py-2 rounded-xl bg-white/60 border border-warm-gold/20 text-sm text-deep-brown placeholder:text-deep-brown/30 focus:outline-none focus:border-warm-gold/50 resize-none leading-relaxed max-h-[80px]"
                    style={{ minHeight: '36px' }}
                  />
                  <motion.button
                    onClick={sendMessage}
                    className={`px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                      inputText.trim()
                        ? 'bg-warm-gold text-white shadow-md shadow-warm-gold/20'
                        : 'bg-deep-brown/10 text-deep-brown/30 cursor-not-allowed'
                    }`}
                    disabled={!inputText.trim()}
                    whileHover={inputText.trim() ? { scale: 1.05 } : {}}
                    whileTap={inputText.trim() ? { scale: 0.95 } : {}}
                  >
                    发送
                  </motion.button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  </>
  )
}
