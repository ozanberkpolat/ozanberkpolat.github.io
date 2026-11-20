---
title: "Application Gateway v2 Next-Gen Elastic Architecture Is in Public Preview"
date: 2026-11-20
categories: [News, "Networking"]
tags: ["azure", "ignite 2026", "application gateway", "autoscaling", "load balancing"]
---

A new **elastic architecture for Application Gateway v2** is in public preview. Microsoft states it cuts provisioning time by up to 50% and autoscaling time by up to 70% compared with the current v2 design. It targets demanding workloads and traffic that changes quickly.

Network and platform engineers who run bursty web or API front ends should care most. Slow scale-out is a common cause of latency spikes and 502 errors during sudden load, so faster autoscaling can reduce the need to over-provision minimum instance counts.

Deploy a test gateway in a non-production subscription and replay a realistic traffic spike. Compare scale-out time and cost against your current v2 gateway before planning any migration. Check preview region and feature limits first, and do not move production traffic yet.

[Read the announcement](https://azure.microsoft.com/updates?id=580428)