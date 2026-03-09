---
title: How to Fix DeletingLicensedGroupNotAllowed Errors in Entra Sync
date: 2025-10-31 12:00:00 +0300
categories: [How To]
tags: [azure, azure ad connect, troubleshooting, powershell, microsoft graph]
---

If you manage a hybrid Microsoft Entra ID (formerly Azure AD) environment, you know that Azure AD Connect is usually a "set it and forget it" tool. But occasionally, you might check your sync logs and find a stubborn export error: `DeletingLicensedGroupNotAllowed`. 

In this quick guide, we'll look at why this error happens and how you can easily resolve it.

## Understanding the Error

When you delete a synchronized security or Microsoft 365 group from your on-premises Active Directory, Azure AD Connect naturally tries to delete it from Entra ID as well. However, if that group is currently being used for **group-based licensing**, Entra ID will block the deletion to prevent accidental license removal for your users.

When this happens, the Azure AD Connect sync cycle throws the `DeletingLicensedGroupNotAllowed` error.

## What You Need Before We Start

To fix this, you'll need a few things ready:
* Access to your Azure AD Connect server.
* Global Administrator or Directory Writer permissions in Entra ID.
* The Microsoft Graph PowerShell module installed. (If you don't have it, run `Install-Module Microsoft.Graph -Scope AllUsers`).

---

## Step-by-Step Fix

### Step 1: Find the Problematic Group's Object ID

First, we need to identify exactly which group is causing the hiccup.

1. Hop onto your Azure AD Connect server and open the **Synchronization Service Manager** (`C:\Program Files\Microsoft Azure AD Sync\UIShell\miisclient.exe`).
2. Navigate to the **Connectors** tab.
3. Select your on-premises Active Directory Connector.
4. Go to the **Export** (or Export Errors) section.
5. Look for the `DeletingLicensedGroupNotAllowed` error. Double-click it to open the *Error Details*.
6. Copy the **Cloud Anchor** or **Object ID**. We will need this to find the group in the cloud.

### Step 2: Locate the Group in Entra ID

Now let's head over to PowerShell to see what this group is. Connect to Microsoft Graph with the necessary permissions:

```powershell
Connect-MgGraph -Scopes "Group.Read.All"
```

Once connected, run the following command, replacing `OBJECT-ID` with the ID you copied in the previous step:

```powershell
Get-MgGroup -GroupId "OBJECT-ID" | Select-Object DisplayName, Id, Mail, MailEnabled, SecurityEnabled
```

This will give you the display name of the group so you know exactly what you are dealing with.

### Step 3: Remove the Licenses and Re-Sync

Before proceeding, double-check with your team to ensure this group was intentionally deleted from on-premises and isn't needed anymore. 

Once confirmed:
1. Log in to the **Microsoft Entra Admin Center** or Azure Portal.
2. Find the group and navigate to its **Licenses** blade.
3. Remove all assigned licenses from the group.
4. Go back to your Azure AD Connect server (or open an elevated PowerShell prompt) and force a Delta Sync:

```powershell
Start-ADSyncSyncCycle -PolicyType Delta
```

Check the Synchronization Service Manager one last time. The export error should be gone, and the group will finally be deleted from Entra ID!

> **Note:** If the error still persists after removing the licenses, a delta sync might not be enough. Try running an initial (full) sync instead: `Start-ADSyncSyncCycle -PolicyType Initial`.
{: .prompt-info }

## Wrapping Up

Group-based licensing is a fantastic feature, but its built-in safety mechanisms can sometimes cause sync friction. By removing the licenses first, you clear the path for Azure AD Connect to do its job. 

Happy syncing!