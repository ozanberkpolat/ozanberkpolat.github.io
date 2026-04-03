---
title: "AKS Scaling Crisis: The Hidden 100-Backend Pool Trap"
date: 2026-04-03
categories: [News, Architecture]
tags: [azure, aks, agic, gateway-api]
---

Kubernetes deployments look perfect—until traffic mysteriously stops. That's exactly what happened when an Azure Kubernetes Service cluster using Application Gateway Ingress Controller hit Azure's hard 100-backend pool limit. The issue is deceptively silent: Kubernetes resources apply successfully, but the Application Gateway rejects the 101st backend pool, breaking ingress for new applications.

This real-world case study reveals how a common deployment pattern—one Service and Ingress per application—triggers this ceiling, complete with reproduction steps and the exact AGIC error message. More importantly, it maps three mitigation paths, with Gateway API-based routing emerging as the strategic long-term solution, despite being in preview.

If you're running AGIC at scale, this is the warning you can't afford to miss.

[Dive into the full technical breakdown here](https://techcommunity.microsoft.com/t5/azure-architecture-blog/aks-cluster-with-agic-hits-the-azure-application-gateway-backend/ba-p/4508201)