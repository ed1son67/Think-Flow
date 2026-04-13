---
title: 进程与线程
type: topic
status: active
created: 2026-04-13
updated: 2026-04-13
tags:
  - operating-systems
  - concurrency
source_refs:
  - 2026-04-13-process-vs-thread
topic_refs: []
---

# Current View

进程与线程的核心区别可以稳定地归纳为：调度对象不同、内存与资源边界不同、通信机制不同，以及组织关系不同。

# Key Points

- 线程是执行与 CPU 调度的更细粒度单位。
- 进程通常作为资源与地址空间隔离边界。
- 一个进程可以包含多个线程，线程共享进程内存。
- 进程间通信通常依赖 IPC 机制，线程间协作通常基于共享内存。

# Supporting Evidence

- 来源 [[2026-04-13-process-vs-thread]] 总结了调度单位、资源隔离、IPC 和共享内存等要点。
- 来源中列举的 IPC 包括消息队列、信号量、信号、共享内存。

# Tensions / Trade-offs

- 共享内存让线程协作更直接，但也带来同步与并发安全问题。
- 进程隔离性更强，但跨进程通信通常更重。
- 源材料中的“线程切换消耗较大”与常见系统表述存在张力，需要后续校验。

# Open Questions

- 是否需要在该主题页补充“资源分配单位 / 调度单位”这组更标准的表述？
- 是否要追加更完整的切换开销对比与典型使用场景？

# Related Pages

- [[2026-04-13-process-vs-thread]]
