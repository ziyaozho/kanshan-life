import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: '第二幕 - 人生重启计划',
  description: '用系统的方式，重新设计你的人生。',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN">
      <body className="antialiased">
        {/* 全局胶片颗粒 */}
        <div className="film-grain" />

        {/* 全局漏光 */}
        <div className="light-leak" />

        {children}

        {/* SVG 滤镜定义 */}
        <svg className="hidden">
          <defs>
            <filter id="ink-filter">
              <feTurbulence
                type="fractalNoise"
                baseFrequency="0.02"
                numOctaves="3"
                result="noise"
              />
              <feDisplacementMap
                in="SourceGraphic"
                in2="noise"
                scale="0"
                result="displacement"
              >
                <animate
                  attributeName="scale"
                  from="0"
                  to="50"
                  dur="4s"
                  fill="freeze"
                />
              </feDisplacementMap>
            </filter>
          </defs>
        </svg>
      </body>
    </html>
  )
}
