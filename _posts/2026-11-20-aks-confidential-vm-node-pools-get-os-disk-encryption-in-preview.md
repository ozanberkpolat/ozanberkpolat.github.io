---
title: "AKS Confidential VM Node Pools Get OS Disk Encryption in Preview"
date: 2026-11-20
categories: [News, "Security"]
tags: ["azure", "ignite 2026", "aks", "confidential vm", "disk encryption"]
---

Confidential VM node pools on AKS protect workloads in memory, but the OS disk was not encrypted at rest. In preview, Ubuntu 26.04 Confidential VM node pools now support **OS disk encryption**, which closes that data-at-rest gap inside the platform.

Security and platform engineers running regulated workloads on AKS should care. You no longer need a separate workaround to cover the OS disk.

Test it in a non-production cluster with an Ubuntu 26.04 confidential node pool. Check the supported regions and VM sizes first. Do not rely on it for production compliance until it is GA.

[Read the announcement](https://azure.microsoft.com/updates?id=581125)