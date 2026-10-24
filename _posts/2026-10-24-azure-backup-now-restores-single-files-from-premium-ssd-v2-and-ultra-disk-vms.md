---
title: "Azure Backup Now Restores Single Files from Premium SSD v2 and Ultra Disk VMs"
date: 2026-10-24
categories: [News, "Backup"]
tags: [azure, "azure-backup", "ultra-disk", "premium-ssd-v2"]
---

If your VMs run on **Premium SSD v2** or **Ultra Disks**, you have had to restore a whole disk just to get one file back. That gap has now closed.

Azure Backup has made **Item-Level Recovery (ILR)** *generally available* for Azure VMs using these disk types, with both 512 byte and 4KB logical sector sizes. You can recover individual files and folders straight from a recovery point instead of rebuilding the full VM or disk.

Worth a look if you protect performance-sensitive workloads and want faster, lighter restores. [Dive into the full technical breakdown here](https://azure.microsoft.com/updates?id=577963)