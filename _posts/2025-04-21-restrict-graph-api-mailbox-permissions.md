---
title: How to Restrict Microsoft Graph API Permissions to Specific Mailboxes
date: 2025-04-21 12:00:00 +0300
categories: [How To]
tags: [azure, graph, security, entra-id, exchange-online, powershell]
description: Learn how to restrict broad Microsoft Graph Application permissions like Mail.Read or Mail.Send to specific mailboxes using Application Access Policies in Entra ID.
---

When building applications or background services that interact with Microsoft 365, you often need to use the Microsoft Graph API to read or send emails. However, if you grant Application-level permissions (such as `Mail.Read` or `Mail.Send`) to an App Registration in Microsoft Entra ID, there is a significant security catch: **these permissions grant access to *every single mailbox* in your organization by default.**

> Microsoft Entra ID was formerly known as Azure Active Directory (Azure AD). You will often see these terms used interchangeably in older documentation.
{: .prompt-info }

For security and compliance reasons, granting tenant-wide access is rarely a good idea. The Principle of Least Privilege dictates that an application should only have access to the specific mailboxes it actually needs to function. 

In this guide, we will walk through how to limit these broad tenant-wide permissions using **Application Access Policies**.

## Prerequisites

Before we begin, ensure you have the following:
1. An **App Registration** created in Microsoft Entra ID with the required Application permissions (e.g., `Mail.Read`, `Mail.Send`) granted and admin consent applied.
2. The **Application (client) ID** of your app registration (`AppId`).
3. The [Exchange Online PowerShell V2 module](https://learn.microsoft.com/en-us/powershell/exchange/exchange-online-powershell-v2) installed.
4. Exchange Administrator privileges.

## Step 1: Create a Mail-Enabled Security Group

To restrict access, you cannot assign policies directly to individual users or mailboxes. Instead, you must use a **Mail-Enabled Security Group**.

1. Navigate to the Microsoft 365 Admin Center or Exchange Admin Center.
2. Create a new Mail-Enabled Security Group.
3. Add the specific mailboxes you want the application to access (e.g., `deal-recognizer-test@gunvorgroup.com`) as members of this group.
4. Obtain the **Object ID** of this newly created group (`GroupID`).

> You cannot use a standard Microsoft 365 Group or a Distribution List for this task. The policy explicitly requires a Mail-Enabled Security Group.
{: .prompt-warning }

## Step 2: Configure the Application Access Policy

Once you have your `AppId` and `GroupId`, you will use Exchange Online PowerShell to tie them together with a restrictive policy.

First, open your terminal and connect to Exchange Online:

```powershell
Connect-ExchangeOnline
```

Next, create the Application Access Policy. This policy will act as a fence, ensuring the app can only interact with the members of your designated security group.

```powershell
# Define your variables
$AppId = "YOUR_APP_REGISTRATION_ID"
$GroupId = "YOUR_MAIL_ENABLED_SECURITY_GROUP_ID"

# Apply the restriction policy
New-ApplicationAccessPolicy -AppId $AppId -PolicyScopeGroupId $GroupId -AccessRight RestrictAccess -Description "Restrict access to deal-recognizer-test@gunvorgroup.com"
```

### Understanding the Command:
* `-AppId`: The unique client identifier of your Microsoft Entra ID app.
* `-PolicyScopeGroupId`: The object ID of the mail-enabled security group containing your target mailboxes.
* `-AccessRight RestrictAccess`: This explicitly tells Exchange to *deny* access to any mailbox that is not a member of the group.
* `-Description`: A helpful note for your future self or fellow admins to understand the policy's purpose.

## Step 3: Test and Verify

Changes to Application Access Policies can take up to 30 minutes to fully propagate across Microsoft 365. Once the time has passed, you can test your policy directly from PowerShell using the `Test-ApplicationAccessPolicy` cmdlet:

```powershell
Test-ApplicationAccessPolicy -AppId $AppId -Identity "deal-recognizer-test@gunvorgroup.com"
```

If the mailbox is successfully included in the group, the `AccessCheckResult` will display **Granted**. If you run the same test against a mailbox outside of the group, it should rightfully return **Denied**.

## Conclusion

By leveraging Application Access Policies, you can confidently utilize the Microsoft Graph API in your background services without exposing your entire organization's email data. Always remember to review your Entra ID app permissions regularly to keep your tenant secure!

> Need to explicitly block an app from specific mailboxes instead of restricting it? You can use the exact same cmdlet but change the `-AccessRight` parameter to `DenyAccess`.
{: .prompt-tip }