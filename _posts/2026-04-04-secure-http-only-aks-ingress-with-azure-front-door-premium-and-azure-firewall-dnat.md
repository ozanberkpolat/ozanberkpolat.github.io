---
title: "Secure HTTP-only AKS Ingress with Azure Front Door Premium and Azure Firewall DNAT"
date: 2026-04-04
categories: [News, Architecture]
tags: [azure, aks, ingress, security, networking]
---

**Microsoft has published a detailed reference architecture for securing HTTP-only AKS ingress using Azure Front Door Premium and Azure Firewall DNAT.** This new guide walks you through building a private-by-default Kubernetes ingress pattern that keeps your Application Gateway and AKS cluster off the public internet while still delivering global edge protection and centralized network controls.

The architecture leverages a Hub-Spoke VNet topology where Azure Front Door acts as the public frontend with WAF, Azure Firewall performs DNAT to a private Application Gateway, and AGIC manages the final routing into AKS. You get layered security (edge WAF + network-level allow lists + L7 routing), reduced public attack surface, and operational clarity through clear separation of responsibilities.

The guide includes a complete command-line runbook for deploying the entire stack—from VNets and firewall to AKS with AGIC—plus sample Kubernetes manifests and validation steps. It’s designed for scenarios requiring centralized inbound control, global edge WAF, or controlled origin exposure without exposing internal infrastructure.

If you’re architecting secure ingress for production AKS workloads, this is a must-read blueprint. [Dive into the full technical breakdown here](https://techcommunity.microsoft.com/t5/azure-architecture-blog/secure-http-only-aks-ingress-with-azure-front-door-premium/ba-p/4508167)