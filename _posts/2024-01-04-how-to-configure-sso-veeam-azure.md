---
title: How to Configure SSO with Azure AD in Veeam Backup for Microsoft Azure
date: 2024-01-04 09:00:00 +0300
categories: [How To, Azure]
tags: [sso, veeam, azure-ad, backup, authentication]
description: Step-by-step guide to integrating Azure Active Directory SSO with Veeam Backup for Microsoft Azure for seamless and secure authentication.
---

## Overview

This guide outlines the step-by-step process to configure **Single Sign-On (SSO)** with **Azure Active Directory (AAD)** in Veeam Backup for Microsoft Azure. By integrating these services, users can seamlessly authenticate and access the Veeam portal using their Azure AD credentials. 

We will also cover how to assign SSO users to specific administrative roles within the Veeam Portal.

---

## Step 1: Obtain Service Provider Settings

Before configuring Azure, we need the metadata from the Veeam appliance.

1. Switch to the **Configuration** page in Veeam Backup for Microsoft Azure.
2. Navigate to **Settings > Identity Provider**.
3. In the *Identity provider configuration* section, click **Download** under the *Application configuration* section.
4. Save the XML metadata file. This contains the service provider authentication settings required by Azure.

## Step 2: Set up SSO for Azure AD Application

1. Log in to the [Microsoft Azure Portal](https://portal.azure.com).
2. Navigate to **Microsoft Entra ID** (formerly Azure Active Directory).
3. Go to **Enterprise applications** and click **New application** > **Create your own application**.
4. Specify a name (e.g., `Veeam-Backup-Azure-SSO`) and select **"Integrate any other application you don't find in the gallery (Non-gallery)"**.
5. Once created, navigate to **Single sign-on** from the left menu and select **SAML**.

## Step 3: Forward Service Provider Settings to Azure

1. In the SAML Single sign-on window, click **Upload metadata file**.
2. Select the file you downloaded from Veeam in **Step 1**.
3. Click **Add**. In the *Basic SAML Configuration* window, verify the identifiers and click **Save**.

> [!TIP]
> Ensure that the "Reply URL" and "Entity ID" match exactly what was provided in the Veeam metadata file.

## Step 4: Create Claims for Azure AD Application

Azure needs to send the correct attributes to Veeam to identify users.

1. Locate the **Attributes & Claims** section and click **Edit**.
2. Add a new claim:
   - **Name:** `Username`
   - **Source attribute:** `user.userprincipalname`
3. Save the changes.

## Step 5: Obtain Azure AD Metadata

1. In the **SAML Certificates** section, locate the **Federation Metadata XML** field.
2. Click **Download** to save this file to your local machine.

## Step 6: Import Azure AD Metadata to Veeam

1. Go back to the **Veeam Backup for Microsoft Azure** configuration page.
2. Navigate to **Settings > Identity Provider**.
3. Click **Upload Metadata**.
4. Select the XML file you just downloaded from the Azure Portal (Step 5).
5. Click **Upload**.

---

## Step 7: Add and Authorize SSO Users

### 7.1 Assign Users in Azure
1. In the Azure Portal (Enterprise Application), go to **Users and groups**.
2. Click **Add user/group**.
3. Assign the group (e.g., `AGrp-ALL-VeeamBackupAzure-PortalUsers`) or specific users who should have access.

> [!IMPORTANT]
> Completing the Azure side is only half the battle. You must explicitly grant these users roles within the Veeam appliance.

### 7.2 Add SSO Users on Veeam Console
1. Log in to the **Veeam Backup for Microsoft Azure** console.
2. Navigate to **Configuration > Accounts > Portal Users** and click **Add**.
3. For the account type, choose **Identity Provider Account**.
4. In the **Name** section, provide the **Username** (UPN) of the SSO user or group as defined in Azure.
5. Select the appropriate **Role** (e.g., Portal Administrator, Portal Operator) and click **Finish**.

---

## Conclusion

By following these steps, you have successfully integrated Azure AD SSO with Veeam. This not only improves the user experience by reducing password fatigue but also enhances security through centralized identity management.

### Reference
- [Veeam Help Center: Configuring SSO with Azure AD](https://helpcenter.veeam.com/docs/vbazure/guide/configuring_sso_aad.html?ver=60)