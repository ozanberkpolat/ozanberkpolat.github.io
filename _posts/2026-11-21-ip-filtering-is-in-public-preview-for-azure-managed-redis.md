---
title: "IP Filtering Is in Public Preview for Azure Managed Redis"
date: 2026-11-21
categories: [News, "Security"]
tags: ["azure", "ignite 2026", "azure managed redis", "firewall", "ip filtering"]
---

Azure Managed Redis now supports **IP filtering** with firewall rules in public preview. You can limit connections to approved source IP addresses or Azure service tags. That gives you more control over network access to caches that are reachable from the public internet.

Security and platform engineers who run Managed Redis with public access should care.

Add rules for your known clients on a test cache and confirm that nothing legitimate is blocked. Prefer private connectivity where you can, and treat this as an added layer.

[Read the announcement](https://azure.microsoft.com/updates?id=577589)