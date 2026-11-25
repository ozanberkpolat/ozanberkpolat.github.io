---
title: "Ultra Disks Get Zonal Disaster Recovery with Azure Site Recovery"
date: 2026-11-25
categories: [News, "Compute"]
tags: [azure, site-recovery, ultra-disks, disaster-recovery]
---

If you run performance-intensive VMs on Azure Ultra disks, a single zonal disruption used to be a hard problem to plan for. That gap now closes: **Azure Site Recovery supports Zone-to-Zone Disaster Recovery for Ultra disks, and it is generally available.**

The feature lets you protect Ultra disk VMs across Availability Zones by replicating them and recovering them into another zone in the same region. That means your most latency-sensitive and IOPS-hungry workloads can use the same Site Recovery replication and failover model as the rest of your estate, without leaving the region.

Worth a look if zonal resilience is on your architecture checklist. [Dive into the full technical breakdown here](https://azure.microsoft.com/updates?id=582171)