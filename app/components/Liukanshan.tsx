'use client'

import { motion } from 'framer-motion'
import Image from 'next/image'

interface LiukanshanProps {
  className?: string
  width?: number
  animate?: boolean
  variant?: 'standing' | 'floating' | 'sitting'
}

export default function Liukanshan({
  className = '',
  width = 200,
  animate = true,
  variant = 'floating',
}: LiukanshanProps) {
  const animations = {
    floating: {
      y: [0, -8, 0],
      transition: {
        duration: 4,
        repeat: Infinity,
        ease: 'easeInOut',
      },
    },
    standing: {
      y: 0,
    },
    sitting: {
      y: [0, -4, 0],
      transition: {
        duration: 5,
        repeat: Infinity,
        ease: 'easeInOut',
      },
    },
  }

  return (
    <motion.div
      className={`relative ${className}`}
      style={{ width, height: width * 1.2 }}
      animate={animate ? animations[variant] : undefined}
    >
      <Image
        src="/images/liukanshan.png"
        alt="刘看山"
        fill
        className="object-contain"
        priority
      />
    </motion.div>
  )
}
