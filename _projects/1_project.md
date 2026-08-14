---
layout: page
title: Skill-as-API
description: Confidential multi-agent coordination for agentic software engineering
importance: 1
category: research systems
---

**Skill-as-API** is a coordination protocol for agentic software engineering where a skill's *public view* is limited to its name, typed schemas, and trust tier, while the body — code plus system prompt — is closure-captured and **never crosses the wire**. Four defense layers address IP extraction, prompt theft via injection, and trust drift.

- Released as an open-source Python SDK over XMTP with 1.8–2.9 s cross-continent reconnect latency.
- Featured in [awesome-agentic-patterns](https://github.com/nibzard/awesome-agentic-patterns) (~4.7K stars) as the [Black-Box Skill Invocation](https://github.com/nibzard/awesome-agentic-patterns/blob/main/patterns/black-box-skill-invocation.md) pattern.
- Accepted to a **KDD 2026 Workshop**.

Links: [GitHub](https://github.com/ZiwayZhao/agent-coworker) · [PyPI](https://pypi.org/project/agent-coworker/)
