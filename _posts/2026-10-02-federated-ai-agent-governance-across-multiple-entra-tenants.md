---
title: "Federated AI Agent Governance Across Multiple Entra Tenants"
date: 2026-10-02
categories: [News, "AI"]
tags: [azure, "agent-365", "entra-agent-id", "mcp"]
---

Running a handful of AI agents is easy. Running hundreds across subsidiaries with separate Microsoft Entra tenants, data stores and regulations is not. Copying everything into one central tenant would break the very boundaries you built.

This Azure Architecture Blog piece describes a **federated agent factory**: centralize standards, templates and governance views, but keep identities, data, detailed telemetry and runtime enforcement in the owning tenant. Microsoft Agent 365 is the central inventory, while a multitenant Entra Agent ID blueprint creates tenant-local agent identities. Tools are exposed as narrow, typed MCP capabilities, and pro-code Foundry agents are forced through a gateway with policy checks, fail-closed behavior and audit events. *Note that Entra Tenant Governance, multitenant agent management and the API Management AI Gateway tier are in preview.*

If you design agent platforms for a multi-tenant organization, this one is worth your time. [Dive into the full technical breakdown here](https://techcommunity.microsoft.com/t5/azure-architecture-blog/build-and-govern-ai-agents-across-a-multitenant-organization/ba-p/4559921)