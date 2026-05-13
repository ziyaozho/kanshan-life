# 第二幕 · 人生重启计划

> 用系统的方式，重新设计你的人生。

## 项目简介

一个基于知乎刘看山 IP 的人生指南系统，通过问卷、雷达图、任务系统、技能追踪等功能，帮助用户在人生迷茫期找到方向并采取行动。

## 技术栈

- Next.js 14 (App Router)
- React 18
- TypeScript
- Tailwind CSS
- Framer Motion
- DeepSeek API（任务/对话生成）

## 本地运行

```bash
# 1. 安装依赖
npm install

# 2. 配置环境变量
cp .env.example .env.local
# 然后在 .env.local 中填入你自己的 DeepSeek API Key

# 3. 启动开发服务器
npm run dev
```

打开 [http://localhost:3000](http://localhost:3000) 查看效果。

## 环境变量

| 名称 | 说明 | 获取方式 |
|------|------|----------|
| `DEEPSEEK_API_KEY` | DeepSeek 大模型 API 密钥 | [platform.deepseek.com](https://platform.deepseek.com/) |

> 注意：`.env.local` 已加入 `.gitignore`，不会被提交到仓库。请勿在代码中硬编码 API 密钥。

## 主要场景

- `/` — 首页
- `/scene/tunnel` — 时空隧道（人生问卷）
- `/scene/analysis` — AI 分析
- `/scene/goal` — 目标设定
- `/scene/profile` — 人生图谱（六维雷达图）
- `/scene/hall` — 人生大厅（主线/支线任务）
- `/scene/quest` — 任务执行（闯关界面）
- `/scene/skills` — 技能追踪
- `/scene/bookshelf` — 人生之书

## 构建

```bash
npm run build
npm run start
```
