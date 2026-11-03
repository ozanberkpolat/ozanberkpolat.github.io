---
title: "PostgreSQL Flexible Server: Move from VNet Integration to Private Endpoints"
date: 2026-11-03
categories: [News, "Networking"]
tags: [azure, postgresql, private-endpoint, vnet]
---

Network design for Azure Database for PostgreSQL Flexible Server just got less permanent. If your server was deployed with VNet integration, you are no longer locked into that choice.

The update is now **generally available**: you can change an existing VNet-integrated server from delegated-subnet networking to a *private endpoint capable* configuration. That opens the door to private endpoints for secure connectivity without rebuilding the server from scratch. The article text provided is brief, so check the original for the exact steps, prerequisites and any limitations.

If you manage PostgreSQL networking on Azure, this is worth a few minutes. [Dive into the full technical breakdown here](https://azure.microsoft.com/updates?id=574541)