---
title: "Soft Delete in Azure Compute Gallery Is Generally Available"
date: 2026-11-21
categories: [News, "Compute"]
tags: ["azure", "ignite 2026", "compute gallery", "image versions", "soft delete"]
---

**Soft delete** in Azure Compute Gallery lets you recover image versions that were deleted by accident. You set a retention period from 7 to 365 days. During retention you can still deploy from soft-deleted images, using a supported API version.

Platform and image-pipeline owners should care. A mistaken cleanup job or a bad script no longer has to mean rebuilding golden images.

Enable it on your galleries and pick a retention period that fits your image lifecycle. Check that your deployment tooling uses an API version that supports deploying from soft-deleted images.

[Read the announcement](https://azure.microsoft.com/updates?id=581907)