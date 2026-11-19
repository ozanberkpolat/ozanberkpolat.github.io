---
title: "Immutable Snapshots for Azure Disk Storage Enter Public Preview"
date: 2026-11-20
categories: [News, "Storage"]
tags: ["azure", "ignite 2026", "azure disks", "snapshots", "immutability"]
---

**Immutable snapshots** for Azure Disk Storage are in public preview. You can apply an immutability policy to snapshots of any disk type to block deletion for up to 90 days. While the policy is active, no one can delete the snapshot.

Backup and security owners should care, since this protects recovery points against ransomware and compromised admin accounts.

Test it on a non-critical disk, pick a retention window that matches your recovery targets, and note that you cannot remove snapshots early.

[Read the announcement](https://azure.microsoft.com/updates?id=581503)