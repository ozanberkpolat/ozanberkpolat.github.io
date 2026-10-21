---
title: "Service Tags Now Match in Azure Front Door Premium WAF Custom Rules"
date: 2026-10-21
categories: [News, "Networking"]
tags: [azure, "front door", "waf", "security"]
---

Keeping IP allow and deny lists current in your WAF rules is tedious and easy to get wrong. A new match condition in Azure Front Door Premium WAF removes much of that chore.

The **service tag match condition** for Azure Web Application Firewall custom rules is now *generally available* on Azure Front Door Premium. Service tags represent groups of IP address prefixes used by Azure services, and Microsoft maintains those prefixes for you. Instead of hand-curating address ranges, you reference the tag directly in a custom rule.

If you run Front Door Premium and filter traffic by Azure service origin, this is worth a look. Read how the condition works and how to use it.

[Dive into the full technical breakdown here](https://azure.microsoft.com/updates?id=577156)