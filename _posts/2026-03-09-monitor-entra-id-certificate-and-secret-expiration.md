---
categories:
- Azure
- Entra ID
- Cloud Automation
date: 2024-08-29
description: Automate monitoring of expiring Azure Entra ID
  certificates, client secrets, and SAML signing certificates using
  PowerShell, Microsoft Graph, and Azure Functions.
categories: [Azure, Entra]
tags:
- Azure
- Entra
- powershell
- automation
- certificates
- secrets
- microsoft-graph
- azure-functions
- cloud-security
title: Monitoring Expiring Certificates and Secrets in Azure Entra ID
  with PowerShell
toc: true
---



# Monitoring Expiring Certificates and Secrets in Azure Entra ID with PowerShell

As organizations scale their cloud environments, managing **certificates and client secrets** 
becomes a critical responsibility for cloud
administrators. Expired credentials tied to **Azure Entra ID app
registrations** or **enterprise applications** can quickly lead to
service outages, authentication failures, and broken integrations.

Manually tracking expiration dates across dozens or hundreds of
applications is inefficient and error‑prone.

In this guide, you'll learn how to build an **automated monitoring
solution** using:

-   Azure Functions
-   Managed Identity
-   Microsoft Graph
-   PowerShell

The script automatically detects **expiring certificates and secrets**,
generates an **HTML report**, and sends an **email notification** to
administrators.

------------------------------------------------------------------------

# Understanding App Registrations vs Enterprise Applications

Before implementing automation, it's important to understand the
difference between **App Registrations** and **Enterprise Applications**
in Azure Entra ID.

## App Registration

An **App Registration** defines the identity of an application in Azure
Entra ID.

It allows the application to:

-   Authenticate with Microsoft identity platform
-   Request tokens
-   Access Microsoft APIs or protected resources

Typical scenarios include:

-   Internal applications calling Microsoft APIs
-   Automation scripts accessing Azure services
-   Custom applications requiring Azure Entra ID authentication

------------------------------------------------------------------------

## Enterprise Application

An **Enterprise Application** is the **service principal** created from
an app registration inside a tenant.

This is where administrators configure:

-   Single Sign-On (SSO)
-   User assignments
-   Conditional Access policies
-   SAML configuration

Enterprise applications are commonly used for:

-   Third‑party SaaS integrations (ServiceNow, Salesforce, etc.)
-   Internal applications deployed for employees
-   Identity federation scenarios

### Key Difference

  Object                   Purpose
  ------------------------ --------------------------------------------
  App Registration         Defines the application identity
  Enterprise Application   Represents the application inside a tenant

------------------------------------------------------------------------

# Prerequisites

Before deploying the automation, ensure the following components are
configured.

## Azure Function App

The monitoring script runs inside an **Azure Function App**, allowing it
to execute automatically on a schedule.

Benefits include:

-   Serverless execution
-   Scheduled automation
-   No infrastructure management

------------------------------------------------------------------------

## System Assigned Managed Identity

Enable **System Assigned Managed Identity** on the Function App.

This allows the function to securely authenticate to **Microsoft Graph**
without storing credentials.

------------------------------------------------------------------------

## Microsoft Graph Permissions

Grant the managed identity the following **Application permissions**:

-   `Application.Read.All`
-   `Directory.Read.All`

These permissions allow the script to read:

-   App Registration secrets
-   App Registration certificates
-   Enterprise Application SAML certificates

------------------------------------------------------------------------

# Assign Microsoft Graph Permissions to Managed Identity

Use the following PowerShell script to assign the required permissions.

``` powershell
$TenantId = "00000000-0000-0000-0000-000000000000"
$IdentityName = "myUserMSI"

$oPermissions = @(
  "Application.Read.All",
  "Directory.Read.All"
)

$GraphAppId = "00000003-0000-0000-c000-000000000000"

$FuncAppSP = Get-AzADServicePrincipal -Filter "displayName eq '$IdentityName'"
$GraphAPISpn = Get-AzADServicePrincipal -Filter "appId eq '$GraphAppId'"

$oAppRole = $GraphAPISpn.AppRole | Where-Object {
    ($_.Value -in $oPermissions) -and ($_.AllowedMemberType -contains "Application")
}

Connect-MgGraph -TenantId $TenantId

foreach($AppRole in $oAppRole)
{
  $GraphRoleAssignment = @{
    "PrincipalId" = $FuncAppSP.Id
    "ResourceId" = $GraphAPISpn.Id
    "AppRoleId" = $AppRole.Id
  }

  New-MgServicePrincipalAppRoleAssignment `
    -ServicePrincipalId $GraphRoleAssignment.PrincipalId `
    -BodyParameter $GraphRoleAssignment `
    -Verbose
}
```

------------------------------------------------------------------------

# Automating Execution with Azure Function Timer Trigger

To ensure the monitoring runs automatically, create a **Timer Trigger**
inside the Azure Function.

Example CRON expression:

    0 0 0 * * 0

This runs the script **every Sunday at midnight (UTC)**.

## CRON Breakdown

  Field     Value   Meaning
  --------- ------- -----------------
  Seconds   0       Start of minute
  Minutes   0       Start of hour
  Hours     0       Midnight
  Day       \*      Every day
  Month     \*      Every month
  Weekday   0       Sunday

### Example schedules

  CRON             Schedule
  ---------------- ----------------------
  0 0 0 \* \* \*   Daily
  0 0 12 \* \* 1   Every Monday at noon

Using a timer trigger ensures administrators are **proactively notified
before credentials expire**.

------------------------------------------------------------------------

# PowerShell Script to Detect Expiring Credentials

The following PowerShell script:

-   Connects to Microsoft Graph
-   Retrieves expiring **App Registration secrets**
-   Retrieves **certificate credentials**
-   Retrieves **Enterprise Application SAML certificates**
-   Generates an **HTML report**
-   Sends an **email alert**

``` powershell
param($Timer)

Connect-MgGraph -Identity

Function Get-MgApplicationCertificateAndSecretExpiration {

    param(
        [ValidateRange(1,720)]
        [int]$DaysWithinExpiration = 30
    )

    $DaysWithinExpiration++

    $ApplicationList = Get-MgApplication -All -Property AppId, DisplayName, PasswordCredentials, KeyCredentials, Id -PageSize 999
    $ExpiringItems = @()

    $CertificateApps = $ApplicationList | Where-Object {$_.keyCredentials}

    foreach ($App in $CertificateApps) {
        foreach ($Cert in $App.keyCredentials) {
            if ($Cert.endDateTime -le (Get-Date).AddDays($DaysWithinExpiration)) {

                $ExpiringItems += [PSCustomObject]@{
                    AppDisplayName      = $App.DisplayName
                    KeyType             = 'Certificate'
                    ExpirationDate      = $Cert.EndDateTime
                    DaysUntilExpiration = (($Cert.EndDateTime) - (Get-Date)).TotalDays -as [int]
                    ThumbPrint          = [System.Convert]::ToBase64String($Cert.CustomKeyIdentifier)
                    Description         = $Cert.DisplayName
                }

            }
        }
    }

    $ClientSecretApps = $ApplicationList | Where-Object {$_.passwordCredentials}

    foreach ($App in $ClientSecretApps) {
        foreach ($Secret in $App.PasswordCredentials) {

            if ($Secret.EndDateTime -le (Get-Date).AddDays($DaysWithinExpiration)) {

                $ExpiringItems += [PSCustomObject]@{
                    AppDisplayName      = $App.DisplayName
                    KeyType             = 'ClientSecret'
                    ExpirationDate      = $Secret.EndDateTime
                    DaysUntilExpiration = (($Secret.EndDateTime) - (Get-Date)).TotalDays -as [int]
                    ThumbPrint          = 'N/A'
                    Description         = $Secret.DisplayName
                }

            }

        }
    }

    $ExpiringItems | Sort-Object DaysUntilExpiration | Where-Object {$_.DaysUntilExpiration -ge 0}

}

Function Get-MgEnterpriseAppSamlCertExpiration {

    $EnterpriseAppList = Get-MgServicePrincipal -All
    $ExpiringItems = @()

    $CertificateApps = $EnterpriseAppList | Where-Object {
        $_.keyCredentials | Where-Object {
            $_.usage -eq "Sign" -and $_.type -eq "AsymmetricX509Cert"
        }
    }

    foreach ($App in $CertificateApps) {

        foreach ($Cert in $App.keyCredentials) {

            $today = Get-Date
            $next31Days = $today.AddDays(31)

            if ($Cert.endDateTime -ge $today -and $Cert.endDateTime -le $next31Days) {

                $ExpiringItems += [PSCustomObject]@{
                    AppDisplayName      = $App.DisplayName
                    KeyType             = 'SAML Signing Certificate'
                    ExpirationDate      = $Cert.endDateTime
                    DaysUntilExpiration = (($Cert.EndDateTime) - (Get-Date)).TotalDays -as [int]
                    ThumbPrint          = [System.Convert]::ToBase64String($Cert.CustomKeyIdentifier)
                    Description         = $Cert.DisplayName
                }

            }

        }

    }

    $ExpiringItems | Sort-Object DaysUntilExpiration

}

$ExpiringAppSecrets = Get-MgApplicationCertificateAndSecretExpiration -DaysWithinExpiration 21
$ExpiringSamlCerts = Get-MgEnterpriseAppSamlCertExpiration

$AllExpiringCerts = $ExpiringAppSecrets + $ExpiringSamlCerts

$htmlTable = $AllExpiringCerts | ConvertTo-Html -Fragment -As Table

$body = @"
<p>Dear Cloud Admin,</p>

<p>This is an automated notification that some Azure Entra ID certificates or secrets will expire soon.</p>

$htmlTable

<p>Please coordinate with application owners to renew them before expiration.</p>
"@

$Parameters = @{
    From = 'sender@domain.com'
    To = 'recipient@domain.com'
    Subject = 'Entra ID Certificates and Secrets Expiry Alert'
    Body = [string]$body
    BodyAsHtml = $true
    SmtpServer = 'mysmtpserver'
}

Send-MailMessage @Parameters
```

------------------------------------------------------------------------

# Conclusion

Certificate and secret expiration is one of the most common causes of
cloud authentication outages.

Automating monitoring using:

-   Azure Functions
-   Managed Identity
-   Microsoft Graph
-   PowerShell

ensures administrators receive **early warnings before credentials
expire**.

This approach removes manual tracking and significantly improves the
reliability of cloud integrations.
