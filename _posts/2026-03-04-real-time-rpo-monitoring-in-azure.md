---
title: "Real-Time RPO Monitoring in Azure: How I Enhanced Disaster Recovery Visibility for a Major European Bank"
date: 2026-03-04 09:00:00 +0300
categories: [Solution Advisory]
tags: [azure, monitoring, rpo, compliance, logic-apps, rest-api, security]
description: "A case study on transitioning from log-based monitoring to an API-driven approach to meet high-precision banking standards."
---

![Real-Time RPO Monitoring](/assets/img/posts/rpopostimage.png)
{: .noshadow }

In the financial sector, **resilience** is the currency of trust. When I was tasked with managing the infrastructure for a major European bank, it was clear that their Disaster Recovery (DR) standards required more than just a functional plan—they required absolute, real-time visibility.

This post explores how I helped them transition from a standard Log Analytics approach to an API-driven monitoring solution to ensure their Recovery Point Objective (RPO) tracking met the highest possible precision.

## Understanding the Stake: Why Precision Matters

**Recovery Point Objective (RPO)** answers the critical question: *"How much data can be afforded to lose?"* For a major financial institution, maintaining a low RPO is a core commitment to their customers. 

Under strict internal governance and frameworks like **DORA**, I helped the bank implement a monitoring strategy that doesn't just report health, but proves it with second-level accuracy.

---

## Phase 1: Moving Beyond the Standard Approach

The initial architecture followed the traditional Azure monitoring pattern: streaming logs to a central **Log Analytics Workspace (LAW)**.

### The Opportunity for Improvement
While this setup is a solid foundation for auditing, I identified a technical limitation regarding "Live Accuracy." Because log ingestion involves inherent latency, the data in the workspace could occasionally lag behind the actual production state. 

> To help the bank satisfy audits that demand precise data at any given second, I recommended moving toward a more direct monitoring model.
{: .prompt-info }

---

## Phase 2: The Shift to Azure REST API

To achieve the visibility they needed, I moved the logic from passive log-waiting to active resource querying. I designed an **Azure Logic App** that communicates directly with the Azure Site Recovery (ASR) provider.

### How this shift added value:

* **Direct State Access:** Instead of reading a "historical report" of an event (the log), I enabled the bank to ask the Resource Provider for the *current* state of every replicated item.
* **Granular Logic:** This allowed us to calculate the exact delta between "Last Successful Sync Time" and "Current Time" before any potential RPO deviation could impact compliance.

### Security-First Architecture
In a high-compliance environment, I ensured that security remained the foundation. By utilizing a **System-Assigned Managed Identity** for the Logic App, I provided a secure, passwordless authentication flow that seamlessly integrated with their existing security frameworks.

---

## Technical Deep Dive: The Logic App Workflow

Below is the sanitized JSON definition of the solution I implemented. The `authentication` block ensures that the bank's identity management remains robust and secret-free.

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
                        "type": "ManagedServiceIdentity"
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

## The Result: Strengthened Resilience

The implementation provided the bank with a high-fidelity monitoring tool that matches their rigorous operational standards:

![ASR RPO Alert Email Screenshot](/assets/img/posts/rpo-alert-email.png)
_Figure 1: Automated HTML Email report designed to provide immediate clarity for operations teams._
{: .noshadow }

1.  **Immediate Visibility:** Real-time HTML reports that give the team a clear view of their RPO status.
2.  **Audit Readiness:** A proactive "pull-based" system that provides definitive proof of compliance during internal and external reviews.
3.  **Operational Efficiency:** The solution is highly cost-effective and provides a superior alert-to-action ratio for the operations team.

## Conclusion

By helping the bank move closer to the API layer, I was able to deliver the precision and security required for their critical infrastructure. This journey from passive logging to active polling is a testament to how the right architectural shift can solidify operational resilience in the most demanding environments.