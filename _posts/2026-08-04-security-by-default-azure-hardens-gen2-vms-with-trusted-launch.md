---
title: "Security by Default: Azure Hardens Gen2 VMs with Trusted Launch"
date: 2026-08-04
categories: [News, Security]
tags: [azure, virtual-machines, infrastructure]
---

In an era where sophisticated firmware-level threats are on the rise, your cloud infrastructure needs more than just a perimeter firewall—it needs a **foundation of trust**. Microsoft is taking a massive leap forward in infrastructure security by ensuring that your virtual assets are protected from the moment they power on.

The general availability of **Trusted Launch as Default (TLaD)** for Azure Gen2 virtual machines and scale sets marks a significant shift in cloud hardening. By automatically enabling **Secure Boot** and **vTPM**, Azure now establishes a hardware-rooted chain of trust for every new deployment. This isn't just an incremental update; it's a move toward "zero-config" security that prevents bootkits and rootkits from compromising your environment before the OS even loads.

> "With Trusted Launch now active by default, developers can focus on building applications while Azure handles the complexities of low-level system integrity."

Ready to see how this impacts your existing deployment workflows and Gen2 architecture?

[Dive into the full technical breakdown here](https://azure.microsoft.com/updates?id=568600)