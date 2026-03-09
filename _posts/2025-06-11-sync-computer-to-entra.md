---
title: How to Synchronize a Specific Computer Object to Entra ID
date: 2025-06-11 13:39:00 +0300
categories: [how to, Azure]
tags: [azure, entra, aadc]
---

[cite_start]In many hybrid environments, synchronizing every local computer object to the cloud isn't always the best approach[cite: 3]. [cite_start]There are several scenarios where selective synchronization is preferred: to maintain a clean Entra ID directory, to manage licenses more effectively, or to ensure that only authorized and active devices are visible in the cloud environment[cite: 3, 86]. [cite_start]By filtering which objects are synchronized, administrators can reduce security risks and avoid cluttering the tenant with decommissioned or irrelevant machines[cite: 3, 52]. [cite_start]This guide walks you through the steps to synchronize a specific computer object to **Entra ID** using **Azure AD Connect (AADC)**[cite: 3].

## Step-by-Step Configuration

### 1. Launch Sync Service Manager
[cite_start]First, log in to your **AADC server** and launch the **Synchronization Service Manager**[cite: 4, 6].

### 2. Access Connector Properties
[cite_start]Navigate to the **Connectors** tab[cite: 8, 9]. [cite_start]Right-click on your local Active Directory Connector (e.g., `company.local`) and select **Properties** or press `Ctrl+P`[cite: 5, 15, 20].

### 3. Configure Directory Partitions
In the Properties window, follow these sub-steps:
* [cite_start]Select **Configure Directory Partitions** from the left pane[cite: 56, 62].
* [cite_start]Select your specific domain partition (e.g., `DC=company,DC=local`)[cite: 69].
* [cite_start]Click on the **Containers** button[cite: 52, 83].
* [cite_start]When prompted, enter your administrative **Credentials** and click **OK**[cite: 52, 70, 76, 77, 84].

### 4. Select the Target Object
[cite_start]A "Select Containers" tree view will appear[cite: 91]. 
* [cite_start]Browse through the hierarchy and check the box for the **exact computer object** you wish to sync[cite: 86].
* [cite_start]In this example, the object `VM-GVA-PYT01` is selected[cite: 112].
* [cite_start]Click **OK** to confirm your selection[cite: 86, 127].

---

> **Note:** After making these changes, a **Delta Import** and **Delta Synchronization** must run (either manually or via the next scheduled cycle) for the object to appear in Entra ID.

---