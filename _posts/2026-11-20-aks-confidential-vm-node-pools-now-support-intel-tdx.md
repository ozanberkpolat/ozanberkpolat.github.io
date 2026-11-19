---
title: "AKS Confidential VM Node Pools Now Support Intel TDX"
date: 2026-11-20
categories: [News, "Security"]
tags: ["azure", "ignite 2026", "aks", "confidential computing", "intel tdx"]
---

Confidential VM node pools on AKS now support **Intel TDX** and are generally available. Until now, the CVM node images only supported AMD SEV-SNP, which blocked teams standardized on TDX for attestation and hardware confidentiality.

Security and platform engineers with TDX-based attestation policies should care. Mixed-hardware estates can now align AKS with them.

Check TDX VM size and region availability, then test your attestation flow on a new node pool before moving workloads.

[Read the announcement](https://azure.microsoft.com/updates?id=581130)