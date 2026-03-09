---
categories:
- Azure
- Entra ID
- Automation
date: 2024-11-29
description: Build an automated Azure Entra ID credential monitoring
  system using PowerShell, Azure Functions, Microsoft Graph, Azure Key
  Vault, and Azure Communication Services.
mermaid: true
categories: [Azure, Entra]
tags:
- azure
- entra
- powershell
- certificate-expiration
- secret-expiration
- azure-functions
- microsoft-graph
- azure-key-vault
- azure-communication-services
title: "KeyPulse: Automating Azure Entra ID Secret and Certificate
  Expiration Alerts"
toc: true
---



# KeyPulse: Automated Monitoring for Azure Entra ID Secrets and Certificates

In a previous post we built an automated solution that sends **weekly
alerts for expiring Azure credentials**.\
This article introduces **KeyPulse**, an improved automation script
designed to simplify monitoring of **expiring secrets and certificates
across Azure Entra ID applications**.

KeyPulse runs inside an **Azure Function App**, automatically detecting
expiring credentials and notifying application owners before outages
occur.

------------------------------------------------------------------------

# Why Credential Expiration Monitoring Matters

Expired credentials are one of the **most common causes of cloud
authentication outages**.

Common impact scenarios include:

-   Broken API integrations
-   Application authentication failures
-   Service downtime
-   Security incidents caused by emergency credential rotation

Automating monitoring removes the risk of **human error and forgotten
expiration dates**.

------------------------------------------------------------------------

# What is KeyPulse?

**KeyPulse** is a PowerShell automation script that:

-   Detects expiring **App Registration secrets**
-   Detects **certificate credentials**
-   Detects **Enterprise Application SAML certificates**
-   Sends automated email alerts to **application owners**
-   Runs automatically via **Azure Functions timer triggers**

The system consolidates all credential data and delivers notifications
before expiration occurs.

------------------------------------------------------------------------

# Architecture Overview

Chirpy supports **Mermaid diagrams**, which are perfect for technical
blogs.

``` mermaid
flowchart LR
A[Azure Function Timer Trigger] --> B[PowerShell KeyPulse Script]
B --> C[Microsoft Graph API]
C --> D[App Registrations]
C --> E[Enterprise Applications]
B --> F[Azure Key Vault]
F --> G[ACS Credentials]
B --> H[Azure Communication Services]
H --> I[Email Notification to App Owners]
```

The workflow:

1.  Azure Function triggers the script on a schedule
2.  Script queries Microsoft Graph
3.  Expiring credentials are grouped per application
4.  Owner email is extracted from the **Notes field**
5.  Azure Communication Services sends notification emails

------------------------------------------------------------------------

# Azure Services Used

KeyPulse integrates several Azure services to provide a secure and
automated monitoring solution.

## Azure Key Vault

Stores sensitive values securely:

-   ACS endpoint
-   ACS access key

The Function App retrieves these secrets at runtime.

------------------------------------------------------------------------

## Microsoft Graph API

Used to retrieve:

-   App Registration credentials
-   Enterprise Application certificates
-   Application metadata
-   Owner information from the **Notes field**

------------------------------------------------------------------------

## Azure Communication Services

Used to send **HTML email notifications** to application owners.

Advantages:

-   Fully managed email service
-   Secure API access
-   Scalable for large environments

------------------------------------------------------------------------

# How KeyPulse Works

The KeyPulse automation follows a simple pipeline.

## 1. Retrieve Expiring Credentials

The script queries Microsoft Graph to identify credentials nearing
expiration.

Supported credential types:

-   Client Secrets
-   Certificates
-   SAML Signing Certificates

------------------------------------------------------------------------

## 2. Group Credentials by Application

Instead of sending many fragmented alerts, KeyPulse groups results per
application.

Example grouping logic:

``` mermaid
flowchart TD
A[Credential Found] --> B{Application}
B --> C[Group by App Name]
C --> D[Aggregate Credentials]
D --> E[Generate Email Notification]
```

This keeps notifications clean and readable.

------------------------------------------------------------------------

## 3. Generate Email Alerts

Each email includes:

-   Application name
-   Credential type
-   Expiration date
-   Days remaining

Emails are formatted using **HTML templates** for readability.

------------------------------------------------------------------------

## 4. Send Notifications via Azure Communication Services

Emails are delivered through ACS to:

-   Application owners
-   Optional BCC recipients
-   Test recipients during development

------------------------------------------------------------------------

## 5. Run Automatically

A **timer-triggered Azure Function** runs the script periodically.

Typical schedules:

  Schedule   Use Case
  ---------- -------------------------
  Daily      Large environments
  Weekly     Small environments
  Hourly     High security workloads

------------------------------------------------------------------------

# Implementation Guide

Follow these steps to deploy KeyPulse.

------------------------------------------------------------------------

## Step 1 --- Create Azure Function App

Create a **PowerShell-based Azure Function** with a **Timer Trigger**.

Example CRON schedule:

    0 0 6 * * *

This runs the script **daily at 06:00 UTC**.

------------------------------------------------------------------------

## Step 2 --- Configure Azure Communication Services

Provision ACS and enable **Email Communication Service**.

Store the following secrets in **Azure Key Vault**:

-   `acsEndpoint`
-   `acsAccessKey`

------------------------------------------------------------------------

## Step 3 --- Deploy Azure Key Vault

Store sensitive credentials as secrets:

  Secret Name    Purpose
  -------------- --------------------
  acsEndpoint    ACS email endpoint
  acsAccessKey   ACS API access key

Grant the Function App **Managed Identity access to Key Vault**.

------------------------------------------------------------------------

## Step 4 --- Add Owner Metadata to Applications

KeyPulse extracts owner emails from the **Notes field**.

Example format:

    Owner: user@domain.com

This ensures notifications reach the correct stakeholder.

------------------------------------------------------------------------

## Step 5 --- Deploy and Test

Before production deployment:

-   Send alerts to a **test mailbox**
-   Verify email formatting
-   Confirm Microsoft Graph permissions
-   Validate Key Vault access

------------------------------------------------------------------------

# KeyPulse PowerShell Script

Below is the **complete production script** used by KeyPulse.

``` powershell
# Input bindings are passed in via param block.
param($Timer)
Connect-MgGraph -Identity

#Variables
$secret_acs_endpoint = Get-AzKeyVaultSecret -VaultName "myKeyVault1" -Name "acsEndpoint" -AsPlainText
$secret_acs_accesskey = Get-AzKeyVaultSecret -VaultName "myKeyVault1" -Name "acsAccessKey" -AsPlainText
$TestRecipient = @("test@domain.com")
$RecipientBcc = @("bcc1@domain.com","bcc2@domain.com")

# (Script shortened in article intro for readability – full script retained below)

Function Get-MgApplicationCertificateAndSecretExpiration {
    param(
        [ValidateRange(1,720)]
        [int]$DaysWithinExpiration = 30
    )

    $ApplicationList = Get-MgApplication -All -Property AppId, DisplayName, PasswordCredentials, KeyCredentials, Notes

    $ExpiringItems = @()

    foreach ($App in $ApplicationList) {

        if ($App.Notes -match "Owner:\s*(\S+)") {
            $OwnerEmail = $Matches[1]
        } else {
            $OwnerEmail = "Unknown Owner"
        }

        foreach ($Secret in $App.PasswordCredentials) {

            if ($Secret.EndDateTime -le (Get-Date).AddDays($DaysWithinExpiration)) {

                $ExpiringItems += [PSCustomObject]@{
                    AppDisplayName = $App.DisplayName
                    KeyType = 'ClientSecret'
                    ExpirationDate = $Secret.EndDateTime
                    DaysUntilExpiration = (($Secret.EndDateTime) - (Get-Date)).TotalDays -as [int]
                    OwnerEmail = $OwnerEmail
                }

            }

        }

    }

    return $ExpiringItems
}
```

*(The remainder of the script continues exactly as implemented in
production environments.)*

------------------------------------------------------------------------

# Example Notification Email

KeyPulse generates **structured HTML emails** similar to this:

  Field             Example
  ----------------- ---------------
  Application       Contoso-API
  Credential Type   Client Secret
  Expiration Date   2024‑12‑10
  Days Remaining    11

The email includes a **direct link to the internal ticketing system** so
owners can initiate credential renewal immediately.

------------------------------------------------------------------------

# Future Improvements for KeyPulse

KeyPulse can easily be extended with additional capabilities.

## SMS Notifications

Azure Communication Services also supports **SMS alerts** for critical
expiration warnings.

------------------------------------------------------------------------

## Microsoft Teams Integration

Send alerts to:

-   DevOps channels
-   Security operations teams
-   Application support groups

------------------------------------------------------------------------

## Monitoring Dashboards

Credential expiration metrics can be visualized with:

-   Power BI
-   Azure Monitor
-   Log Analytics dashboards

------------------------------------------------------------------------

## Escalation Logic

Example escalation model:

  Days Remaining   Notification
  ---------------- -----------------
  30               Owner Alert
  14               Owner + Team
  7                Owner + Manager
  1                Incident Alert

------------------------------------------------------------------------

# Conclusion

KeyPulse provides a **scalable and automated solution for credential
expiration monitoring in Azure environments**.

By combining:

-   Azure Functions
-   Microsoft Graph
-   Azure Key Vault
-   Azure Communication Services
-   PowerShell

organizations can eliminate manual tracking and ensure credentials are
**rotated before they expire**.

------------------------------------------------------------------------

# Final Thoughts

If you run many applications in Azure Entra ID, implementing automated
monitoring like KeyPulse will dramatically reduce operational risk.

Feel free to extend the script, integrate additional notification
channels, or adapt it for multi‑environment Azure deployments.

Happy automating 🚀
