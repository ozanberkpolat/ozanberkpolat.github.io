---
title: "Azure Functions OpenAI Extension Support Ends on April 20, 2027"
date: 2026-11-21
categories: [News, "Serverless"]
tags: ["azure", "ignite 2026", "azure functions", "openai extension", "microsoft foundry", "azure ai search"]
---

Support for the **Azure Functions OpenAI extension** ends on April 20, 2027. Microsoft asks affected teams to move to the OpenAI, Microsoft Foundry or Azure AI Search SDKs directly, depending on the scenario.

Anyone running Function apps that use the extension for bindings should care. Inventory those apps now and note which scenario each one covers: model calls, agent logic or search and retrieval.

Plan the move to the matching SDK well before the deadline. Replace the extension bindings with direct SDK calls and retest. Add the work to your backlog now so it doesn't land on you close to the cutoff.

[Read the announcement](https://azure.microsoft.com/updates?id=579952)