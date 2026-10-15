---
title: "Azure Cloud HSM Now Writes Hardware-Level Audit Logs"
date: 2026-10-15
categories: [News, "Security"]
tags: [azure, "cloud-hsm", "audit-logging", "compliance"]
---

If you run keys in Azure Cloud HSM, you can now get proof of what happened on the device itself. Hardware audit logging is **generally available**, and it changes how you answer the question "who did what to my HSM?"

The feature produces **hardware-generated audit records** for supported HSM management operations. Because the records come from the HSM and not from a layer above it, they help with security monitoring, compliance reporting, governance and forensic investigations. The article text available here is short, so check the original for the exact list of supported operations and how to access the logs.

If your auditors ask for tamper-resistant evidence around key management, this is worth a read. [Dive into the full technical breakdown here](https://azure.microsoft.com/updates?id=576377)