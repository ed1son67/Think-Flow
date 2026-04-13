---
title: 进程 vs 线程
type: source
status: active
created: 2026-04-13
updated: 2026-04-13
tags:
  - operating-systems
  - concurrency
source_refs:
  - raw/processed/2026-04-13-process-vs-thread.md
topic_refs:
  - process-vs-thread
---

# Summary

这份笔记简要对比了进程与线程，覆盖调度单位、资源占用、通信方式以及基本关系。

# Core Ideas

- 进程是资源调度的最小单位，线程是 CPU 调度的最小单位。
- 一个进程至少包含一个线程，并且可以包含多个线程。
- 进程拥有独立内存空间，线程共享所属进程的内存。
- 进程通信依赖 IPC，线程常通过共享内存进行通信。

# Key Details

- 文档将 IPC 具体列举为消息队列、信号量、信号、共享内存。
- 文档强调线程共享进程内存，因此线程间协作成本通常更低。
- 原文最后写为“线程切换消耗较大”，该表述保留为源材料记录，未在本页延伸解释。

# Reusable Insights

- 对比进程与线程时，可以从调度、资源、通信、关系四个固定维度展开。
- 面试类速记材料适合沉淀为结构化对比页，便于后续扩展更严格的系统表述。

# Open Questions

- “进程是资源调度的最小单位”这一表述是否意在表达“资源分配的基本单位”？
- “线程切换消耗较大”是否为笔误，是否想表达进程切换成本通常更高？

# Related Topics

- [[process-vs-thread]]
