---
title: "Granular Security for AKS: Azure Files Now Supports Pod-Level Workload Identity"
date: 2026-08-29
categories: [News, Kubernetes]
tags: [azure, aks, storage, security]
---

**Security and storage** must go hand-in-hand in the modern cloud-native ecosystem. For teams running complex workloads on Azure Kubernetes Service (AKS), managing access to SMB file shares just reached a new level of precision and safety. This update represents a significant step forward for developers seeking to implement strict identity management in their cluster environments.

The Azure Files Container Storage Interface (CSI) driver now officially supports **workload identity** for pod-level authentication. While managed identity previously enabled workloads to mount Azure Files at a broader level, this enhancement brings the power of *Azure AD Workload ID* directly to individual pods. By shifting to pod-specific authentication for SMB shares, you can enforce stricter access controls and reduce your attack surface—moving closer to a true **Zero Trust** architecture while simplifying credential management.

Ready to elevate your cluster's security posture?

[Dive into the full technical breakdown here](https://azure.microsoft.com/updates?id=570120)