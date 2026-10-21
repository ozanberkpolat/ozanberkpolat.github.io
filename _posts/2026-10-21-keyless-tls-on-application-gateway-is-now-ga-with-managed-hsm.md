---
title: "Keyless TLS on Application Gateway Is Now GA with Managed HSM"
date: 2026-10-21
categories: [News, "Security"]
tags: [azure, application-gateway, key-vault, managed-hsm, tls]
---

TLS private keys sitting on a gateway are a standing risk. **Azure Application Gateway now supports keyless TLS termination**, so the key never has to leave the vault.

The feature is *generally available* and works with certificates whose private keys live in **Azure Key Vault Managed HSM**. Each TLS handshake signature is performed inside the HSM, and the private key is never exported to the gateway. That changes how you can meet strict key-custody requirements without giving up Application Gateway as your entry point.

If you run regulated workloads or care about key isolation, this is worth a close look. [Dive into the full technical breakdown here](https://azure.microsoft.com/updates?id=577130)