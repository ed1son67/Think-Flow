# Think Flow

Think Flow 是一个面向 LLM Agent 的本地优先知识库工作流仓库。它用一套稳定的 Markdown 目录结构、规则文件和轻量脚本，把“原始资料 -> 结构化 Wiki -> 可复用结论”串起来，适合在 Obsidian、Claude Code、Cursor、Codex 等环境中持续沉淀知识。

项目核心不是“临时问答”，而是让 Agent 维护一个会持续积累的 Wiki：

- `raw/` 保存原始资料，作为证据层
- `wiki/` 保存 Agent 生成和维护的结构化知识页
- `CLAUDE.md`、`AGENTS.md`、`skills/` 定义工作规则和命令入口
- `scripts/` 提供少量本地辅助脚本

## 适用场景

- 持续阅读和整理论文、文章、播客笔记
- 搭建个人研究知识库或团队内部知识库
- 将一次次 AI 对话沉淀为可追溯、可复用的长期资产
- 在 Obsidian 中可视化浏览知识结构，同时让 Agent 负责维护

## 仓库结构

```text
think-flow/
├── raw/                  # 原始资料层，Agent 只读，不应重写
├── wiki/                 # Wiki 页面、索引、日志
├── scripts/              # 本地辅助脚本
├── skills/               # Think Flow 技能定义
├── tests/                # 回归测试
├── CLAUDE.md             # 仓库工作规则
├── AGENTS.md             # Codex / OMX 运行规则
└── LLM-WIKI.md           # 设计理念说明
```

关键目录说明：

- `raw/inbox/`：待处理资料入口
- `raw/processed/`：已处理资料归档
- `raw/assets/`：资料附件
- `wiki/sources/`：单个来源的摘要页
- `wiki/topics/`：主题归纳页
- `wiki/syntheses/`：高价值问答或分析沉淀
- `wiki/index.md`：内容索引
- `wiki/log.md`：操作日志

## 主要能力

### 1. Ingest

把一份资料或一段笔记摄入到知识库：

- 读取 `raw/inbox/` 中的单个文件，或把内联文本先落到 `raw/inbox/`
- 生成/更新 `wiki/sources/` 来源页
- 更新相关 `wiki/topics/`
- 更新 `wiki/index.md` 与 `wiki/log.md`
- 将已处理原始资料移到 `raw/processed/`

### 2. Query

基于已有 Wiki 回答问题，而不是每次都直接扫原始文档：

- 优先读取 `wiki/index.md`
- 先看 topic，再看 source
- 区分“Wiki 已有结论”和“模型推断”
- 支持把高价值回答继续写回 `wiki/syntheses/`

### 3. Lint

检查 Wiki 结构和基本健康状态：

- 是否缺少 `index.md` / `log.md`
- 内容页是否缺失 frontmatter
- 页面是否遗漏索引项
- 页面是否为空

### 4. Summary

把当前 Claude / Codex / Cursor 会话整理成可复用知识，再继续走 ingest 流程。

## 环境要求

运行本仓库的本地脚本通常只需要：

- Python 3.9+
- Git
- 一个支持仓库规则和命令的 LLM Agent 环境，例如 Claude Code、Cursor、Codex

可选依赖：

- `pytest`：用于运行测试
- Obsidian：用于浏览和维护本地 Wiki

## 安装

### 1. 克隆仓库

```bash
git clone <your-repo-url> think-flow
cd think-flow
```

### 2. 准备 Python 环境

如果你希望隔离依赖，建议使用虚拟环境：

```bash
python3 -m venv .venv
source .venv/bin/activate
```

本仓库没有强制运行时依赖；如果你要跑测试，再安装 `pytest`：

```bash
python3 -m pip install pytest
```

### 3. 安装 Think Flow Skill

仓库内置了技能安装脚本，会把 `skills/` 下的技能复制到目标目录，并把 `{{PROJECT_ROOT}}` 渲染为当前项目绝对路径。

安装全部技能：

```bash
python3 scripts/install_skill.py \
  --project-root "$(pwd)" \
  --target-root "$HOME/.claude/skills"
```

仅安装单个技能：

```bash
python3 scripts/install_skill.py \
  --source "$(pwd)/skills/think-flow" \
  --project-root "$(pwd)" \
  --target-root "$HOME/.claude/skills"
```

默认目标目录是 `~/.claude/skills`，因此这个安装方式最适合 Claude Code。Cursor 命令模板已随仓库提供在 `.cursor/commands/` 下；Codex 则直接读取本仓库中的 `AGENTS.md` 与 `skills/` 规则。

## 如何使用

### 方式一：通过 Agent 命令工作流使用

这是推荐方式。仓库已经定义了 Think Flow 的命令入口：

- `/th:ingest`
- `/th:query`
- `/th:lint`
- `/th:summary`

典型用法：

```text
/th:ingest raw/inbox/my-article.md
/th:ingest 这是一段希望沉淀到知识库的内联笔记
/th:query 当前 wiki 对 agent framework selection 的结论是什么？
/th:lint
/th:summary
```

工作流约束：

- 原始资料应先进入 `raw/`
- `raw/` 是证据层，原则上不应被重写
- 查询优先基于 `wiki/`，不是直接把聊天记录当长期资产
- durable output 应回写到 `wiki/`

### 方式二：直接运行本地脚本

适合调试、验证和批量操作。

#### 安装技能

```bash
python3 scripts/install_skill.py --project-root "$(pwd)"
```

#### 检查索引覆盖

这个脚本会检查 `wiki/sources/`、`wiki/topics/`、`wiki/syntheses/` 中的页面是否都已出现在 `wiki/index.md`。

```bash
python3 scripts/update_index.py --root "$(pwd)"
```

#### 执行 wiki lint

只报告问题：

```bash
python3 scripts/lint_wiki.py --root "$(pwd)" --mode report
```

安全修复缺失的系统文件后再检查：

```bash
python3 scripts/lint_wiki.py --root "$(pwd)" --mode safe-fix
```

#### 新建 source 页面模板

```bash
python3 scripts/new_source.py \
  --root "$(pwd)" \
  --date 2026-04-16 \
  --title "Example Source" \
  --slug example-source
```

#### 读取当前 AI 会话

读取当前 Codex 会话：

```bash
python3 scripts/read_llm_conversation.py \
  --tool codex \
  --current \
  --cwd "$(pwd)" \
  --format json
```

读取当前 Claude 会话：

```bash
python3 scripts/read_llm_conversation.py \
  --tool claude \
  --current \
  --cwd "$(pwd)" \
  --format json
```

读取当前 Cursor transcript：

```bash
python3 scripts/read_llm_conversation.py \
  --tool cursor \
  --current \
  --cwd "$(pwd)" \
  --format json
```

## 推荐使用流程

### 日常沉淀

1. 将资料放入 `raw/inbox/`
2. 用 `/th:ingest` 处理单个来源
3. 在 Obsidian 中查看 `wiki/index.md`、topic 页和图谱
4. 用 `/th:query` 询问跨资料问题
5. 定期运行 `/th:lint`

### 对话沉淀

1. 在当前仓库中与 Claude / Codex / Cursor 完成一轮工作
2. 执行 `/th:summary`
3. 让会话结论先落到 `raw/inbox/`
4. 再自动进入 ingest，把会话知识写入 wiki

## 设计原则

- Local-first：知识资产保存在本地 Markdown 中
- Evidence first：`raw/` 是证据层，`wiki/` 是综合层
- Incremental synthesis：知识应逐步积累，而不是每次从零检索
- Agent-maintained：由 Agent 负责整理、链接、更新和归档
- Human-guided：由人决定资料来源、关注重点和最终判断

## 测试与验证

运行全部测试：

```bash
python3 -m pytest -q
```

如果本地没有安装 `pytest`，先执行：

```bash
python3 -m pip install pytest
```

## 相关文件

- [LLM-WIKI.md](./LLM-WIKI.md)：项目理念与背景
- [CLAUDE.md](./CLAUDE.md)：仓库内 Think Flow 操作规则
- [skills/think-flow/SKILL.md](./skills/think-flow/SKILL.md)：核心技能说明
- [skills/think-flow-summary/SKILL.md](./skills/think-flow-summary/SKILL.md)：会话总结技能

## English Version

英文说明见 [README_EN.md](./README_EN.md)。
