---
title: "AKS Pod Sandboxing Adds kata-vm-isolation-v2 Runtime Class in Preview"
date: 2026-11-20
categories: [News, "Compute"]
tags: ["azure", "ignite 2026", "aks", "pod sandboxing", "kata"]
---

The **kata-vm-isolation-v2** runtime class for AKS Pod Sandboxing is in public preview. In the classic flow each pod boots a new Kata VM, which adds cold-start latency and memory overhead. The new class targets that tradeoff between isolation and startup speed.

Platform teams running untrusted or multi-tenant code on AKS should care.

Try it on a test node pool, measure startup time and memory against the current runtime class, and confirm your workloads behave the same.

[Read the announcement](https://azure.microsoft.com/updates?id=581120)