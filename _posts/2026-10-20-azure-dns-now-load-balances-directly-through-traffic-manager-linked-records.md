---
title: "Azure DNS Now Load Balances Directly Through Traffic Manager Linked Records"
date: 2026-10-20
categories: [News, "Networking"]
tags: [azure, dns, traffic-manager, load-balancing]
---

If you run DNS-based load balancing on Azure, you know the pattern: a CNAME in your zone pointing at a *trafficmanager.net* name. That extra hop is now optional.

Azure DNS now integrates with **Azure Traffic Manager** and is **generally available**. You can associate an Azure DNS record set directly with a Traffic Manager profile, which removes the need for a CNAME record pointing to the Traffic Manager profile. The record set is linked to the profile, so DNS-based load balancing is handled as part of the record itself.

Worth a look if you manage zones and Traffic Manager profiles separately today. [Dive into the full technical breakdown here](https://azure.microsoft.com/updates?id=573917)