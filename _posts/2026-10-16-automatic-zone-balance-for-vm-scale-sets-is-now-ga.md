---
title: "Automatic Zone Balance for VM Scale Sets Is Now GA"
date: 2026-10-16
categories: [News, Compute]
tags: [azure, vmss, availability-zones, resiliency]
---

Zonal imbalance in a scale set is the kind of problem you usually find during an outage, not before. Instances drift across availability zones after scale-in, failures or capacity events, and suddenly one zone carries far more of your fleet than the others.

**Automatic zone balance for Virtual Machine Scale Sets is now generally available.** The feature continuously monitors scale sets deployed across availability zones and automatically redistributes VM instances when it detects an imbalance. The goal is to keep your zone spread healthy without you having to watch for it or rebalance by hand.

If you run zonal scale sets and care about resiliency, this is worth a few minutes of your time. Check the details before you plan your next rollout. [Dive into the full technical breakdown here](https://azure.microsoft.com/updates?id=576334)