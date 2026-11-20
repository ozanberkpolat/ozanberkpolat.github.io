---
title: "Pod Snapshot Cluster Extension for AKS Is in Public Preview"
date: 2026-11-21
categories: [News, "Compute"]
tags: ["azure", "ignite 2026", "aks", "pod snapshot", "sandbox"]
---

The **pod snapshot cluster extension** targets sandboxed workloads that lose in-memory state when they restart. AI environments have to reload models and rebuild runtime context. Other applications repeat JVM warmup or repopulate caches. Snapshots aim to avoid that repeated initialization cost.

Platform teams running sandboxed or agent workloads on AKS should care, especially where cold start time is a problem.

Try it in a non-production cluster alongside your sandboxing setup. Measure restart time with and without snapshots before you plan around it, because this is a preview.

[Read the announcement](https://azure.microsoft.com/updates?id=580921)