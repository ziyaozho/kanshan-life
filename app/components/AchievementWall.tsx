'use client'

import { motion } from 'framer-motion'
import {
  getAllAchievements,
  loadUnlockedAchievements,
  getRarityColor,
  getRarityLabel,
} from '@/app/lib/achievements'

export default function AchievementWall() {
  const all = getAllAchievements()
  const unlocked = loadUnlockedAchievements()
  const unlockedIds = new Set(unlocked.map((a) => a.id))

  const categoryLabels: Record<string, string> = {
    task: '任务成就',
    skill: '技能成就',
    dimension: '维度成就',
    explore: '探索成就',
  }

  const categories = ['task', 'skill', 'dimension', 'explore'] as const

  return (
    <div className="w-full space-y-6">
      {/* 总览 */}
      <div className="flex items-center gap-4 p-4 rounded-2xl bg-white/40 border border-deep-brown/5"
      >
        <div className="text-center"
        >
          <p className="text-2xl font-medium text-warm-gold"
          >{unlocked.length}</p>
          <p className="text-[10px] text-deep-brown/40"
          >已解锁</p>
        </div>
        <div className="w-px h-8 bg-deep-brown/10" />
        <div className="text-center"
        >
          <p className="text-2xl font-medium text-deep-brown/30"
          >{all.length}</p>
          <p className="text-[10px] text-deep-brown/40"
          >总成就</p>
        </div>
        <div className="flex-1 h-2 bg-deep-brown/10 rounded-full overflow-hidden"
        >
          <motion.div
            className="h-full bg-warm-gold rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${(unlocked.length / all.length) * 100}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          />
        </div>
        <span className="text-xs text-deep-brown/50">
          {Math.round((unlocked.length / all.length) * 100)}%
        </span>
      </div>

      {/* 分类成就 */}
      {categories.map((cat) => {
        const catAchievements = all.filter((a) => a.category === cat)
        const catUnlocked = catAchievements.filter((a) => unlockedIds.has(a.id))

        return (
          <div key={cat}
          >
            <div className="flex items-center justify-between mb-3"
            >
              <h4 className="text-xs text-deep-brown/60 tracking-wider"
              >
                {categoryLabels[cat]}
              </h4>
              <span className="text-[10px] text-deep-brown/30"
              >
                {catUnlocked.length} / {catAchievements.length}
              </span>
            </div>

            <div className="grid grid-cols-1 gap-2"
            >
              {catAchievements.map((ach, i) => {
                const isUnlocked = unlockedIds.has(ach.id)
                const unlockedAt = unlocked.find((u) => u.id === ach.id)?.unlockedAt

                return (
                  <motion.div
                    key={ach.id}
                    className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                      isUnlocked
                        ? 'bg-white/60 border-warm-gold/20'
                        : 'bg-white/20 border-deep-brown/5 opacity-50'
                    }`}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: isUnlocked ? 1 : 0.5, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <div
                      className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg ${
                        isUnlocked ? 'bg-warm-gold/10' : 'bg-deep-brown/5 grayscale'
                      }`}
                    >
                      {ach.icon}
                    </div>

                    <div className="flex-1"
                    >
                      <div className="flex items-center gap-2"
                      >
                        <p
                          className={`text-xs font-medium ${
                            isUnlocked ? 'text-deep-brown' : 'text-deep-brown/30'
                          }`}
                        >
                          {ach.title}
                        </p>
                        <span
                          className={`text-[8px] px-1.5 py-0.5 rounded-full border ${
                            isUnlocked
                              ? getRarityColor(ach.rarity)
                              : 'bg-deep-brown/5 text-deep-brown/20 border-deep-brown/5'
                          }`}
                        >
                          {getRarityLabel(ach.rarity)}
                        </span>
                      </div>
                      <p
                        className={`text-[10px] mt-0.5 ${
                          isUnlocked ? 'text-deep-brown/50' : 'text-deep-brown/20'
                        }`}
                      >
                        {ach.description}
                      </p>
                    </div>

                    {isUnlocked && unlockedAt && (
                      <span className="text-[9px] text-deep-brown/20 whitespace-nowrap"
                      >
                        {new Date(unlockedAt).toLocaleDateString('zh-CN')}
                      </span>
                    )}

                    {!isUnlocked && (
                      <span className="text-[9px] text-deep-brown/15"
                      >未解锁</span>
                    )}
                  </motion.div>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}
