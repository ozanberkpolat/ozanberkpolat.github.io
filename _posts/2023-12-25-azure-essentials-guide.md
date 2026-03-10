---
title: "Azure Essentials: A Professional Guide from My Early Career"
date: 2023-12-25 10:00:00 +0300
categories: [Essentials]
tags: [azure, entra-id, networking, virtual-machines, infrastructure]
description: A comprehensive collection of foundational Azure concepts and operational insights gathered during my first steps into the tech industry.
---

When I first entered the cloud sector, the vast landscape was both exciting and overwhelming. I am documenting these notes as a token of gratitude to the colleague who mentored me during those early days. By sharing these insights, I hope to provide a clear roadmap for others starting their journey.

## 1. Identity and Access Management (Microsoft Entra ID)

Identity is the primary security perimeter in the cloud. Understanding the nuances of Microsoft Entra ID (formerly Azure AD) is crucial:

* **App Registrations vs. Service Principals:** An App Registration is the global definition of the application, while a Service Principal is the local instance/identity used within a specific tenant (similar to a service account).
* **Enterprise Applications:** This is where you manage Managed Identities and third-party SaaS integrations.
* **On-Prem Sync (Entra Connect):** This service synchronizes local identities with Entra ID, typically on a 30-minute interval. Note that opening the "Configure Mode" pauses synchronization; ensure it is closed once adjustments are complete.
* **Conditional Access:** Use the Insights tab to monitor which policies are being triggered and how they impact user sign-ins.

## 2. Compute and Automation Services

### App Service & Function Apps
* **App Service Plan:** These are the hosts for your Web Apps and Function Apps. When performing a **Scale Up**, it is vital to notify stakeholders as the operation may cause temporary freezing or downtime.
* **Function Apps:** These execute code (Python, PowerShell, etc.) based on triggers. If your script relies on external modules, remember to define them in the `requirements` file.

### Automation and Insights
* **Automation Account:** Ideal for running scheduled tasks like ServiceNow integrations via Runbooks.
* **Application Insights:** A powerful tool for debugging and troubleshooting. It provides telemetry on function calls, latency, and application health.

## 3. Virtual Machine (VM) Management

VM operations require attention to cost and stability:

* **Proper Shutdown:** Stopping a VM from within the OS does not stop billing. To stop incurring costs, use the **Stop (Deallocated)** command from the Azure Portal.
* **Resizing:** Always opt for the latest VM size versions (e.g., v5 instead of v4) as they often offer better performance at a lower price point.
* **Migration:** When moving VMs between regions, take a snapshot of the OS disk, create a new disk from that snapshot, and deploy a new VM from the result.
* **Security:** Use **Just-In-Time (JIT)** access to request temporary, time-bound access to specific ports, significantly reducing the attack surface.

## 4. Networking and Connectivity

The standard architecture is usually a **Hub and Spoke** model.

* **VNet Peering:** Subnets in different VNets cannot communicate unless peering is established.
* **Network Security Groups (NSG):** NSGs are applied at the subnet level. Use **Service Tags** (e.g., `AzureDevOps`) to allow traffic from Microsoft services without manually managing IP ranges.
* **IP Configuration:** Static IP assignments should be performed via the Azure Network Interface (NIC) settings, never from within the OS itself.

## 5. Governance and Security

* **Azure Policy:** Acts like GPO for the cloud. **Definitions** describe the rules, **Assignments** apply them, and **Exemptions** exclude specific resources. A collection of definitions is called an **Initiative**.
* **Microsoft Defender for Cloud:** Provides security scanning at the subscription level. It can scan VMs via agents or through agentless snapshot-based analysis.
* **Roles (RBAC):** Avoid granting `Owner` permissions unless absolutely necessary. Use the principle of least privilege.

## 6. Storage and Databases

* **Storage Account:** Secure access by using **Private Endpoints** for each storage type and utilizing RBAC instead of access keys where possible.
* **Azure SQL:** Managed Instances (MI) are considered best practice for high availability, offering robust backup features and point-in-time restore capabilities.

## 7. DNS Architecture

Azure's global DNS IP is `168.63.129.16`. In a hybrid environment:
1. DNS requests from on-prem are routed to an **Azure Private DNS Resolver**.
2. The resolver checks the **Private DNS Zone**.
3. If the VNet is linked to the zone, the address is resolved and returned.

{: .prompt-info }
On-prem DNS traffic typically traverses the "Hub" VNet, which is peered with all "Spoke" VNets to ensure seamless resolution across the infrastructure.

---
*Knowledge grows when shared. These notes represent the foundation of my cloud expertise.*