---
title: "Deploy Always-On TCP Workloads on Azure Container Apps with Blue-Green Safety"
date: 2026-04-03
categories: [News, Azure Updates]
tags: [azure, container-apps, blue-green-deployments, tcp-pipelines, redis]
---

When your Azure Container Apps workloads run 24/7 TCP pipelines with no HTTP ingress, traditional traffic splitting won't cut it. This new approach shows how to achieve blue-green deployments by validating new revisions through mock Redis connections before promoting them to production—keeping your always-on streams safe during updates.

The core strategy deploys the new "green" revision with isolated dependency bindings (Temp Redis) and a processing flag set to disabled. You validate the complete pipeline end-to-end using real TCP input, but all writes stay isolated from production. Once validation gates pass—including successful lock acquisition and processing metrics—you promote by flipping configuration flags to switch the green revision to production mode and cleanup follows.

This pattern gives you controlled, reversible releases for TCP workloads where HTTP traffic management doesn't apply, reducing downtime risk while maintaining pipeline integrity.

[Dive into the full technical breakdown here](https://techcommunity.microsoft.com/t5/azure-architecture-blog/blue-green-strategy-for-always-on-tcp-workloads-on-azure/ba-p/4507894)