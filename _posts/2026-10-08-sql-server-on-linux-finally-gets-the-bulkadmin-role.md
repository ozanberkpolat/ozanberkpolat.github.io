---
title: "SQL Server on Linux Finally Gets the bulkadmin Role"
date: 2026-10-08
categories: [News, "Databases"]
tags: [azure, sql-server, linux, security]
---

Running SQL Server on Linux and tired of handing out heavy privileges just to let a service load data? That gap is now closed, and it is **generally available**.

Starting with **SQL Server 2025 CU9** and **SQL Server 2022 CU27**, SQL Server on Linux supports the `bulkadmin` fixed server role and the `ADMINISTER BULK OPERATIONS` permission. Users can perform bulk data import operations without being members of the broader administrative roles, which makes least-privilege setups for ETL and import accounts much easier to apply.

If you manage SQL Server on Linux, check your cumulative update level and see what it means for your import accounts. [Dive into the full technical breakdown here](https://azure.microsoft.com/updates?id=573443)