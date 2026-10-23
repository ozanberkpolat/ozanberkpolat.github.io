---
title: "ABFS Vectored Read Is GA: Fewer Round Trips for Selective Reads on Data Lake Storage"
date: 2026-10-23
categories: [News, "Storage"]
tags: [azure, "data-lake-storage", "abfs", "analytics"]
---

If your analytics jobs read small slices of large files in Azure Data Lake Storage, request overhead is probably a bigger cost than raw bandwidth. **ABFS Vectored Read** is now generally available and targets exactly that pattern.

The idea is simple: compatible analytics engines combine *nearby file ranges* into fewer storage requests and run the reads asynchronously. The result is fewer network round trips for selective reads, which is where columnar and filtered workloads spend a lot of their time.

Curious how it works and which engines benefit? [Dive into the full technical breakdown here](https://azure.microsoft.com/updates?id=577618)