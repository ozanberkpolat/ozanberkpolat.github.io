---
title: "Comprehensive Azure Disaster Recovery & Database Restore Test"
date: 2026-01-23 12:00:00 +0300
categories: [Disaster Recovery]
tags: [azure, disaster-recovery, oracle, active-directory, powershell]
description: A detailed walk-through of a comprehensive database and infrastructure restore test in an isolated Azure environment.
---

Testing your Disaster Recovery (DR) plan is just as important as having one. Recently, we conducted a comprehensive, full-scale database and infrastructure restore test in Microsoft Azure. 

This post details our methodology, execution order, and the exact steps taken to restore a multi-tier architecture—including a Domain Controller, an Oracle Database, an Interface/Session server, and a Terminal server—into a completely isolated virtual network.



## 1. Infrastructure Scope and Impact Analysis

The primary goal was to restore a subset of our production environment into an isolated network (`rg-isolated-dr-network`) without disrupting live services. The environment consisted of the following virtual machines:

* **CORE-DC01 / 02 (Domain Controller):** Restored to the latest available backup. We anticipated a 6-7 hour data loss (meaning any user, group, password, or GPO changes within that window would be lost in the restored environment).
* **APP-TERM01 (Terminal Server):** Used for end-user connections to validate the application. We specifically restored the OS disk and `datadisk_0` (which holds user profiles).
* **CORE-DB01 (Oracle Database Server):** The core database server.
* **APP-INT01 (Interface/Session Server):** The middle-tier server responsible for opening sessions and communicating with the Oracle DB.

> **Note:** Because the Interface and Terminal servers run on Windows Server, restoring the Domain Controller first was critical. These machines rely on the DC for Time synchronization, DNS resolution, and domain authentication.

## 2. Pre-Requisites and Isolation Strategy

Before initiating any restores, strict network isolation was mandatory.

We verified the Network Security Group (NSG) assigned to the isolated virtual network. All inbound and outbound traffic was blocked by default, with only specific exceptions made later for Remote Desktop Protocol (RDP) access from our secure management subnet to the Terminal Server. 

All restored VMs and their associated resources were deployed into a dedicated resource group (`rg-drtest-env`). To ensure stability within the isolated network, all restored VMs were assigned **Static IP addresses** via the Azure Portal.

## 3. Restore Sequence and Methodology

The order in which servers are brought back online is the make-or-break factor in a DR scenario. Here is the strategy we mapped out:

1.  **Domain Controller:** Restored first.
2.  **Terminal Server:** Restored second. The DR tester accesses this server via a **Local Administrator** account initially.
3.  **DNS Re-routing:** Inside the Terminal Server, the local `hosts` file and network adapter DNS settings are updated to point to the newly restored DC's IP address. This re-establishes domain communication.
4.  **Domain Login:** The tester logs out and logs back into the Terminal Server using a **Domain Admin** account to verify Active Directory health.
5.  **Database & Interface:** The DB server is restored, followed by the Interface server.



### Handling the Oracle Database Storage

Restoring the database required precision to ensure data consistency. We didn't just restore the VM; we utilized Azure Managed Disk snapshots for the highly active data disks.

1.  After obtaining approval from the business units, the Oracle service on the *active production server* was briefly paused.
2.  We immediately executed a PowerShell script (`ExistingDisks-to-Snapshots.ps1`) to take synchronized snapshots of data disks 3, 6, 7, 8, 9, and 10.
3.  A secondary script (`Snapshots-to-NewDisks.ps1`) was used to convert these snapshots into new Managed Disks.
4.  These newly minted disks were attached to the restored DB VM, ensuring the caching settings matched production exactly.

### Time Synchronization and DNS Health

Because a Domain Controller acts as the time authority for the network, a time skew of more than 5 minutes can break Kerberos authentication. Once the DC was up, we ran the following commands on the restored machines to force time synchronization:

```cmd
w32tm /resync
w32tm /query /status
```

We also verified the health of the DNS service, the Netlogon service, and the accessibility of the `SYSVOL` and `NETLOGON` shares.

### Preventing Backup Conflicts

To prevent the restored database from attempting to write to our production backup storage account, the Oracle Backup Service was stopped immediately upon booting the restored VM. 

Once halted, we navigated to the Storage Account's Network Settings and granted access to the isolated network's default subnet via a **Service Endpoint**. Only after this strict boundary was established did we re-enable the backup services for testing.

---

## 4. Post-Test Cleanup

A crucial part of any DR test is the teardown. Leaving test resources running not only incurs unnecessary cloud costs but also introduces potential security and operational risks. 

Once the Database Administrators completed their application-level validations, the environment was decommissioned. We completely deleted the restored VMs, their associated disks, network interfaces, and the temporary resource group. Finally, the Service Endpoint definitions on the backup DR Storage Account were removed, returning the environment to its original state.