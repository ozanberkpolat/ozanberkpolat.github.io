---
title: "\"AKS Meets the 100 Backend Pool Wall\""
date: 2026-04-04
categories: [News, Infrastructure]
tags: [azure, aks, application-gateway, scaling-limits]
---

You've just deployed your 101st app on AKS and traffic stops dead. Everything looks fine in Kubernetes, but Azure Application Gateway quietly refuses to create another backend pool. That's because AGIC hits a hard 100-pool limit, and once you cross it, no new Ingress works—even though your YAML applies successfully.

This deep-dive walks through a real-world scaling failure, shows exactly how to reproduce it, and breaks down the three mitigation paths: Azure Gateway Controller (public-only), deprecated ingress-nginx (retiring 2026), and the strategic Gateway API–based application routing (preview). If you're exposing dozens of services via AGIC, this is the blocker you can't afford to hit in production.

[Dive into the full technical breakdown here](https://techcommunity.microsoft.com/t5/azure-architecture-blog/aks-cluster-with-agic-hits-the-azure-application-gateway-backend/ba-p/4508201)