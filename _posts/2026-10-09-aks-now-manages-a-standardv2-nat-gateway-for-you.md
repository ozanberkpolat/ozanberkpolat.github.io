---
title: "AKS Now Manages a StandardV2 NAT Gateway for You"
date: 2026-10-09
categories: [News, "Networking"]
tags: [azure, aks, nat-gateway, networking]
---

Outbound connectivity from AKS just got less of a manual chore. **Managed StandardV2 NAT Gateway for AKS is now generally available**, so AKS can provision and manage the NAT Gateway for you.

The key facts from the announcement: this applies to clusters that use an *AKS-managed virtual network*, and StandardV2 becomes the **default managed NAT Gateway SKU for new clusters** in supported regions when you pick the `managedNATGateway` outbound type. If you plan new clusters, check how your outbound type and region line up with this default.

Worth a look before your next cluster build. [Dive into the full technical breakdown here](https://azure.microsoft.com/updates?id=574430)