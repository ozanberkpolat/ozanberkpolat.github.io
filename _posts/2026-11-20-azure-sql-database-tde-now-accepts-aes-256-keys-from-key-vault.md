---
title: "Azure SQL Database TDE Now Accepts AES-256 Keys From Key Vault"
date: 2026-11-20
categories: [News, "Security"]
tags: ["azure", "ignite 2026", "azure sql database", "tde", "key vault"]
---

You can now use **AES-256 keys** stored in Azure Key Vault Premium or Managed HSM as TDE protectors for Azure SQL Database. This is generally available and offers an alternative to RSA keys for data at rest.

Security and database teams with customer-managed key policies, or with post-quantum readiness plans, should review it. Symmetric keys are seen as more resilient against future quantum attacks than RSA.

Inventory databases that use RSA protectors and test a key rotation in a non-production server. Confirm your Key Vault tier is Premium or Managed HSM.

[Read the announcement](https://azure.microsoft.com/updates?id=579531)