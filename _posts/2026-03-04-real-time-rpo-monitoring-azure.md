---
title: "Real-Time RPO Monitoring in Azure: Why We Moved from Logs to API for a Major European Bank"
date: 2026-03-04 09:00:00 +0300
categories: [Solution Advisory]
tags: [azure, monitoring, rpo, compliance, logic-apps, rest-api, security]
description: "Exploring the architectural shift from standard Log Analytics to a custom REST API-driven approach for precise RPO tracking in high-stakes financial environments."
---

In the financial sector, **resilience** is the currency of trust. When managing the infrastructure for a major European bank, the stakes for Disaster Recovery (DR) are incredibly high. Regulatory bodies and strict audits require not just a recovery plan, but proven, real-time visibility into data consistency.

This post explores why we transitioned from a standard Log Analytics approach to a custom API-driven monitoring solution for Recovery Point Objective (RPO) tracking.

## Understanding the Stake: What is RPO and Why Does it Matter?

**Recovery Point Objective (RPO)** defines the maximum age of files that an organization must recover from backup storage for regular operations to resume after a disaster. Essentially, it answers the question: "How much data can we afford to lose?"

For a financial institution, a high RPO is not just a technical failure—it’s a compliance breach. Under frameworks like **DORA (Digital Operational Resilience Act)** in Europe, banks must demonstrate proactive monitoring of these metrics.

---

## Phase 1: The Standard Approach (Diagnostic Settings)

Our initial architecture followed the traditional Azure monitoring pattern:

1.  Enable **Diagnostic Settings** on the Recovery Services Vault (RSV).
2.  Stream logs to a central **Log Analytics Workspace (LAW)**.
3.  Use **KQL (Kusto Query Language)** to alert on replication health.

### The Reality Check
While this is excellent for long-term auditing, we hit a wall regarding "Live Accuracy." Log Analytics ingestion involves a delay (latency). By the time a log entry reached the workspace and triggered an alert, the actual RPO status on the production resource might have already changed. 

> For a bank that needs to report precise data at any given second, "near-real-time" logs weren't "real" enough.
{: .prompt-warning }

---

## Phase 2: The Architectural Shift to Azure REST API

To solve the visibility gap, we moved the logic from waiting for logs to actively querying the source. We implemented an **Azure Logic App** that communicates directly with the Azure Site Recovery (ASR) provider via the REST API or Resource Graph.

### Why this change was a game-changer:

* **Direct State Access:** Instead of reading a "report" of an event (the log), we are asking the Resource Provider for the current state of every replicated item.
* **Granular Logic:** We can now calculate the exact delta between the "Last Successful Sync Time" and "Current Time" to identify RPO violations before they become critical.

### Security First: Managed Identity & RBAC
In a high-compliance environment, we utilized a **System-Assigned Managed Identity** for the Logic App. By assigning the **Reader** role at the Recovery Services Vault (RSV) scope, we achieved a passwordless, secure authentication flow that satisfies strict banking audits.

---

## Technical Deep Dive: The Logic App Workflow

Below is the sanitized JSON definition. Note the `authentication` block in the HTTP action, which leverages the Azure infrastructure for identity.

```json
{
    "definition": {
        "$schema": "https://schema.management.azure.com/providers/Microsoft.Logic/schemas/2016-06-01/workflowdefinition.json#",
        "actions": {
            "HTTP_Query_Resource_Graph": {
                "type": "Http",
                "inputs": {
                    "uri": "https://management.azure.com/providers/Microsoft.ResourceGraph/resources?api-version=2021-03-01",
                    "method": "POST",
                    "headers": { "Content-Type": "application/json" },
                    "authentication": {
                        "type": "ManagedServiceIdentity",
                        "audience": "https://management.azure.com"
                    },
                    "body": {
                        "subscriptions": ["<YOUR_SUBSCRIPTION_ID>"],
                        "query": "recoveryservicesresources | where type =~ 'microsoft.recoveryservices/vaults/replicationfabrics/replicationprotectioncontainers/replicationprotecteditems' | extend vmName = tostring(properties['friendlyName']) | extend rpoInSeconds = toint(properties['providerSpecificDetails']['rpoInSeconds']) | where isnotempty(rpoInSeconds) and rpoInSeconds > 600 | project vmName, rpoInSeconds | order by rpoInSeconds asc"
                    }
                }
            }
        }
    }
}
```

---

## The Result: Audit-Ready Resilience

Aşağıdaki görselde, Logic App tarafından üretilen ve kritik eşiği aşan sunucuları gösteren örnek bir alarm e-postası yer almaktadır. Bu format, operasyon ekiplerinin sorunu saniyeler içinde teşhis etmesini sağlar.

![ASR RPO Alert Email Screenshot](/assets/img/posts/rpo-alert-email.png)
_Figure 1: Automated HTML Email report showing VMs exceeding the RPO threshold._
{: .noshadow }

By switching to an API-based polling mechanism, the bank now has:

1.  **Immediate Visibility:** Automated HTML reports that show exactly which VMs are nearing their RPO limit.
2.  **Zero-Trust Compliance:** By using Managed Identity and **Microsoft Entra ID**, the solution passes security audits without rotating credentials.
3.  **Cost Efficiency:** Costs pennies compared to Log Analytics ingestion for high-frequency logs.

## Conclusion

In high-compliance environments, moving closer to the API layer provides the precision and security required to maintain true operational resilience.
