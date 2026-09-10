---
title: "Speed Reimagined: Azure Ephemeral OS Disk Full Caching Hits GA"
date: 2026-09-10
categories: [News, "Cloud Infrastructure"]
tags: [azure, "virtual-machines", "performance"]
---

Stop letting remote storage latency bottleneck your cloud performance. Azure has officially announced the **General Availability** of Ephemeral OS Disk with full caching for new virtual machines and Virtual Machine Scale Sets. This isn't just a minor update; it's a significant leap for architects and developers who require consistent, high-speed disk performance without the traditional overhead of network-attached storage.

The core value lies in local execution: this feature caches the **complete OS image** onto the VM’s local storage. Once the initial cache is primed, remote-storage reads are eliminated entirely. This results in near-instantaneous boot times and significantly reduced latency for stateless workloads. By leveraging the physical NVMe or SSD storage of the underlying host, your applications gain the raw speed necessary for modern, high-scale deployments.

Ready to transform your deployment strategy and eliminate storage-based bottlenecks?

[Dive into the full technical breakdown here](https://azure.microsoft.com/updates?id=570551)