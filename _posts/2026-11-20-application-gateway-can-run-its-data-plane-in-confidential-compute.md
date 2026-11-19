---
title: "Application Gateway Can Run Its Data Plane in Confidential Compute"
date: 2026-11-20
categories: [News, "Security"]
tags: ["azure", "ignite 2026", "application gateway", "confidential computing", "waf"]
---

**Application Gateway confidential compute** is in public preview. The gateway data plane runs inside a confidential computing environment. Decrypted requests and TLS keys are protected while the gateway processes them, not only in transit.

Security and network engineers who terminate TLS for regulated or sensitive workloads should look at this. It narrows who can inspect traffic in memory, including privileged operators on the host.

Check regional and SKU support in a test environment first. Measure latency and cost against your current v2 gateways before you plan a migration.

[Read the announcement](https://azure.microsoft.com/updates?id=579649)