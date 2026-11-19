---
title: "Azure SQL Managed Instance Next-gen GP Gets Zone Redundancy and Flexible Memory"
date: 2026-11-19
categories: [News, "Databases"]
tags: ["azure", "ignite 2026", "sql managed instance", "zone redundancy", "managed instance link"]
---

The Azure SQL Managed Instance Next-gen General Purpose tier now has two generally available updates. **Zone redundancy** spreads service components across availability zones in supported regions, protecting against datacenter outages without application changes. On Premium-series hardware with zone redundancy, memory can be adjusted independently of vCores. The Managed Instance link for migration and disaster recovery with SQL Server Always On is also generally available, and local development options for Azure SQL Database are added.

Database architects planning SQL Server modernization should care, as zone redundancy at General Purpose cost levels changes resiliency designs.

Check zone redundancy support in your target regions, review instances that were sized up only for memory, and test the link for migration or disaster recovery runs.

[Read the announcement](https://news.microsoft.com/events/ignite/2026/book-of-news/#azure-sql-expands-modernization-resiliency-and-local-development-options)