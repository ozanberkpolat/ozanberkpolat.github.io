---
title: "Azure Storage Permissions Now Drive Access in Azure AI Search and Foundry IQ"
date: 2026-11-25
categories: [News, "AI"]
tags: [azure, "azure-ai-search", "foundry-iq", "storage"]
---

Building RAG on top of enterprise documents usually raises one awkward question: who is allowed to see which result? A new GA release gives you a cleaner answer by letting **Azure AI Search and Foundry IQ in Microsoft Foundry** use supported Azure Storage permissions to control access to search results.

Once configured, search applications and AI agents return content based on *each user's access*. That reduces the need to build and maintain a separate permission layer just to keep search and agent answers aligned with what users can already open in Azure Storage. The feature is **generally available**, so it is ready for production planning.

If you ship search or agents over data in Azure Storage, this is worth a careful read. [Dive into the full technical breakdown here](https://azure.microsoft.com/updates?id=581303)