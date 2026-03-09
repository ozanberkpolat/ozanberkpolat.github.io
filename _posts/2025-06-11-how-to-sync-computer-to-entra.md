---
title: How to Synchronize a Specific Computer Object to Entra ID
date: 2025-06-11 13:39:00 +0300
categories: [How To]
tags: [Azure, Entra, Aadc]
---

In many hybrid environments, synchronizing every local computer object to the cloud isn't always the best approach. There are several scenarios where selective synchronization is preferred: to maintain a clean Entra ID directory, to manage licenses more effectively, or to ensure that only authorized and active devices are visible in the cloud environment. By filtering which objects are synchronized, administrators can reduce security risks and avoid cluttering the tenant with decommissioned or irrelevant machines. This guide walks you through the steps to synchronize a specific computer object to **Entra ID** using **Azure AD Connect (AADC)**.

## Step-by-Step Configuration

### 1. Launch Sync Service Manager
First, log in to your **AADC server** and launch the **Synchronization Service Manager** tool.

### 2. Access Connector Properties
Navigate to the **Connectors** tab at the top of the interface. Locate your local Active Directory Connector (e.g., `gunvorgroup.local`), right-click on it, and select **Properties** (or use the shortcut `Ctrl+P`).

### 3. Configure Directory Partitions
Once the Properties window is open, follow these sub-steps to navigate your directory:
* Select **Configure Directory Partitions** from the left-hand menu.
* In the "Select directory partitions" list, highlight your specific domain partition (e.g., `DC=gunvorgroup,DC=local`).
* Click on the **Containers...** button on the right side.
* A credentials window will appear. Enter the required administrative **User name** (e.g., `aberkpolat.p`) and **Password**, then click **OK**.

### 4. Select the Target Object
The **Select Containers** window will now display your Active Directory tree hierarchy:
* Browse through the folders to find the **exact computer object** you wish to sync.
* Check the box next to the target machine (for example, `VM-GVA-PYT01`).
* Click **OK** to save your selection and close the dialog.

---

> **Note:** After making these changes, the object will not appear in Entra ID immediately. A **Delta Import** and **Delta Synchronization** must run, either manually via PowerShell or by waiting for the next scheduled synchronization cycle.

---