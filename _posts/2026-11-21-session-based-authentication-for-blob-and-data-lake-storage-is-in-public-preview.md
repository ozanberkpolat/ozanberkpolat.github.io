---
title: "Session-Based Authentication for Blob and Data Lake Storage Is in Public Preview"
date: 2026-11-21
categories: [News, "Storage"]
tags: ["azure", "ignite 2026", "blob storage", "data lake storage", "authentication"]
---

**Session-based authentication** for Azure Blob and Data Lake Storage cuts the per-request authentication and authorization time for AI agents and applications. The security controls your organization already enforces stay in place.

Teams that run agents or apps making many small storage requests should care, because per-request auth overhead adds up at that volume. Data platform and security engineers should confirm how it interacts with existing RBAC and network rules.

Test it with a high-request-rate workload and measure the latency change. Review your authorization model before any rollout, since this is a preview.

[Read the announcement](https://azure.microsoft.com/updates?id=580306)