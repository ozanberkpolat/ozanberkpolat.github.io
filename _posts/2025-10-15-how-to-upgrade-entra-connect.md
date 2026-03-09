---
title: How to Upgrade Microsoft Entra Connect via Staging Mode
date: 2025-10-15 09:00:00 +0300
categories: [How To]
tags: [Azure, Entra, azure ad connect, upgrade]
description: A step-by-step guide to upgrading Microsoft Entra Connect with zero downtime using the staging mode strategy.
---

Upgrading **Microsoft Entra Connect** (formerly Azure AD Connect) is a critical task for identity management. To ensure zero downtime and a safe fallback, we use the **Staging Mode** strategy. This "swing" method allows one server to handle synchronization while the other is being upgraded.

In this guide, we'll walk through the controlled server role switch, the upgrade process, and final validation.

---

## 1. Prerequisites

Before starting, ensure you have the necessary access and backups.

### On-Premises & Cloud Access
- **Local Admin:** Rights on both Active and Staging Entra Connect servers.
- **Enterprise Admin:** Required for AD service account management.
- **Global Administrator:** Required for the Microsoft Entra ID (Azure AD) side.
- **Backups:** Take VM snapshots of both servers. *This is your primary rollback method.*

---

## 2. Pre-Upgrade Preparation

First, identify which server is currently active and export the current configuration.

1.  Open the **Microsoft Entra Connect** wizard.
2.  Select **View or export current configuration**.
3.  Click **Export Settings** and save the `.json` file to a secure network location.

---

## 3. Step-by-Step Role Switch

The goal is to promote the Staging server to Active so the original server can be upgraded offline.

### Phase A: Disable Sync on Active Server
Log on to the **currently active** server and stop the scheduler:

```powershell
# Stop the synchronization scheduler
Set-ADSyncScheduler -SyncCycleEnabled $false
```

### Phase B: Promote Staging Server to Active
Log on to the **Staging server** and perform the following:
1.  Open the **Entra Connect Wizard** -> **Configure**.
2.  Select **Configure staging mode**.
3.  **Uncheck** the "Enable staging mode" box and click **Configure**.
4.  Confirm the scheduler is now active:

```powershell
# Verify the sync cycle is enabled
Get-ADSyncScheduler | Select-Object SyncCycleEnabled
```

5.  Trigger a manual Delta Sync to verify connectivity:

```powershell
# Manually start a delta synchronization
Start-ADSyncSyncCycle -PolicyType Delta
```

---

## 4. Upgrading the (Now) Staging Server

Now that synchronization is running on the temporary active server, we can upgrade the original instance.

1.  On the **original server** (which is now passive), run the latest **Entra Connect MSI** installer.
2.  Follow the prompts and select **Upgrade**.
3.  After the upgrade, keep the server in **Staging Mode**. Do not disable it yet.
4.  Verify the new version is installed correctly:

```powershell
# Check the installed version of Entra Connect
Get-ItemProperty "HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall\*" | Where-Object { $_.DisplayName -like "*Entra*" } | Select-Object DisplayName, DisplayVersion
```

---

## 5. Final Validation & Cleanup

Once the upgraded server is validated, you can choose to switch the roles back to the original setup.

### Validation Checklist
- [ ] Check **Event Viewer** (Application Logs) for "Directory Synchronization" errors.
- [ ] Monitor the **Synchronization Service Manager** for successful exports to Entra ID.
- [ ] Verify recent changes in AD are appearing in the Entra ID Portal.

### Rollback (If needed)
If errors occur, stop the sync on the new server and revert the VM to the pre-upgrade snapshot:

```powershell
# Stop sync if a rollback is required
Set-ADSyncScheduler -SyncCycleEnabled $false
```

---

> [!WARNING]
> Ensure only **one** server has Staging Mode disabled at any given time. Having two active synchronization servers will cause significant identity conflicts.

---