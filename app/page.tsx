'use client'

import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Liukanshan from '@/app/components/Liukanshan'

function getCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'))
  return match ? decodeURIComponent(match[2]) : null
}

export default function Home() {
  const router = useRouter()
  const [zhihuUser, setZhihuUser] = useState<{ name?: string; avatar?: string } | null>(null)

  useEffect(() => {
    const raw = getCookie('zhihu_user')
    if (raw) {
      try {
        setZhihuUser(JSON.parse(raw))
      } catch {
        // ignore
      }
    }
  }, [])

  return (
    <motion.main
      className="relative w-screen h-screen overflow-hidden bg-[#1a1816]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 1.5 }}
    >
      {/* 背景网格 */}
      <div
        className="absolute inset-0 pointer-events-none opacity-15"
        style={{
          backgroundImage: `
            linear-gradient(rgba(230, 184, 156, 0.08) 1px, transparent 1px),
            linear-gradient(90deg, rgba(230, 184, 156, 0.08) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px',
        }}
      />

      {/* 中央暖光 */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at center 55%, rgba(230, 184, 156, 0.12) 0%, transparent 55%)',
        }}
      />

      {/* 散落光点 - 使用确定性seed避免hydration mismatch */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {Array.from({ length: 20 }).map((_, i) => {
          const seed = (n: number) => {
            const x = Math.sin(n * 127.1 + i * 311.7) * 43758.5453
            return x - Math.floor(x)
          }
          return (
            <motion.div
              key={i}
              className="absolute rounded-full"
              style={{
                left: `${10 + seed(1) * 80}%`,
                top: `${10 + seed(2) * 80}%`,
                width: `${2 + seed(3) * 3}px`,
                height: `${2 + seed(4) * 3}px`,
                background: 'radial-gradient(circle, rgba(230, 184, 156, 0.6), transparent)',
              }}
              animate={{
                opacity: [0.2, 0.8, 0.2],
                scale: [1, 1.5, 1],
              }}
              transition={{
                duration: 3 + seed(5) * 3,
                repeat: Infinity,
                delay: seed(6) * 3,
                ease: 'easeInOut',
              }}
            />
          )
        })}
      </div>

      {/* 刘看山 */}
      <motion.div
        className="absolute left-1/2 bottom-[32%] md:bottom-[30%]"
        style={{ x: '-50%' }}
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.2, delay: 0.3 }}
      >
        <Liukanshan width={200} variant="floating" animate />
      </motion.div>

      {/* 标题与文案 */}
      <motion.div
        className="absolute bottom-[14%] md:bottom-[12%] left-1/2 text-center"
        style={{ x: '-50%' }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, delay: 0.8 }}
      >
        <div className="flex items-center justify-center gap-2 mb-3">
          <div className="w-8 h-px bg-warm-gold/40" />
          <span className="text-warm-gold/60 text-[10px] tracking-[0.3em] uppercase">
            知乎 × 刘看山
          </span>
          <div className="w-8 h-px bg-warm-gold/40" />
        </div>

        <h1
          className="text-white font-serif text-2xl md:text-3xl tracking-widest mb-2"
          style={{ textShadow: '0 2px 20px rgba(0,0,0,0.5)' }}
        >
          人生指南针
        </h1>

        <p
          className="text-white/50 text-sm md:text-base tracking-wide mb-8"
          style={{ textShadow: '0 1px 10px rgba(0,0,0,0.5)' }}
        >
          读懂你的知乎足迹，找到人生的第二幕
        </p>

        {zhihuUser ? (
          <motion.button
            onClick={() => router.push('/scene/tunnel')}
            className="px-10 py-3 rounded-full text-sm tracking-widest text-white border border-warm-gold/40 bg-warm-gold/10 backdrop-blur-sm hover:bg-warm-gold/20 transition-all duration-300"
            style={{
              boxShadow: '0 0 24px rgba(230, 184, 156, 0.15)',
            }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            开始探索
          </motion.button>
        ) : (
          <a
            href="/api/auth/zhihu"
            className="inline-flex items-center gap-2 px-8 py-3 rounded-full text-sm tracking-widest text-white border border-white/20 bg-white/5 backdrop-blur-sm hover:bg-white/10 transition-all duration-300"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4" />
              <polyline points="10 17 15 12 10 7" />
              <line x1="15" y1="12" x2="3" y2="12" />
            </svg>
            知乎登录
          </a>
        )}
      </motion.div>

      {/* 底部小字 */}
      <motion.p
        className="absolute bottom-4 left-1/2 text-white/20 text-[10px] tracking-wider"
        style={{ x: '-50%' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5 }}
      >
        基于知乎行为分析 · 深度人格洞察 · 定制化人生规划
      </motion.p>
    </motion.main>
  )
}
