---
title: How to Configure SSO with Entra in Veeam Backup for Microsoft Azure
date: 2024-01-04 09:00:00 +0300
categories: [How To, Azure]
tags: [sso, veeam, azure-ad, backup, authentication]
description: Step-by-step guide to integrating Entra ID SSO with Veeam Backup for Microsoft Azure for seamless and secure authentication.
---

## Overview

This guide outlines the step-by-step process to configure **Single Sign-On (SSO)** with **Entra ID** in Veeam Backup for Microsoft Azure. By integrating these services, users can seamlessly authenticate and access the Veeam portal using their Entra ID credentials. 

---

## Step 1: Obtain Service Provider Settings

1. Switch to the **Configuration** page in Veeam Backup for Microsoft Azure.
2. Navigate to **Settings > Identity Provider**.
3. In the *Identity provider configuration* section, click **Download** under the *Application configuration* section.
4. Save the XML metadata file.

## Step 2: Set up SSO for Entra ID Application

1. Log in to the [Microsoft Azure Portal](https://portal.azure.com).
2. Navigate to **Microsoft Entra ID**.
3. Go to **Enterprise applications** > **New application** > **Create your own application**.
4. Specify a name and select **"Integrate any other application you don't find in the gallery"**.
5. Select **SAML** as the SSO method.

## Step 3: Forward Service Provider Settings to Azure

1. Click **Upload metadata file** and select the file from Step 1.
2. Click **Add**, then **Save**.

> Ensure that the "Reply URL" and "Entity ID" match exactly what was provided in the Veeam metadata file.
{: .prompt-tip }

## Step 4: Create Claims for Entra ID Application

1. In **Attributes & Claims**, click **Edit**.
2. Add a new claim:
   - **Name:** `Username`
   - **Source attribute:** `user.userprincipalname`

## Step 5: Obtain Entra ID Metadata

1. In the **SAML Certificates** section, locate the **Federation Metadata XML** field.
2. Click **Download**.

## Step 6: Import Entra ID Metadata to Veeam

1. In Veeam, go to **Settings > Identity Provider**.
2. Click **Upload Metadata** and select the Azure XML file.

---

## Step 7: Add and Authorize SSO Users

### 7.1 Assign Users in Azure
1. In the Azure Portal, go to **Users and groups**.
2. Click **Add user/group** and assign the necessary access.

> Completing the Azure side is only half the battle. You must explicitly grant these users roles within the Veeam appliance to allow login.
{: .prompt-info }

### 7.2 Add SSO Users on Veeam Console
1. Navigate to **Configuration > Accounts > Portal Users** and click **Add**.
2. Choose **Identity Provider Account**.
3. Enter the **Username** (UPN) of the SSO user.
4. Select the appropriate **Role** and click **Finish**.

---

## Conclusion
You have successfully integrated Entra ID SSO with Veeam.

### Reference
- [Veeam Help Center](https://helpcenter.veeam.com/docs/vbazure/guide/configuring_sso_aad.html?ver=60)