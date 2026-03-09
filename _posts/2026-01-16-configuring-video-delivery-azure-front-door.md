---
title: Configuring Video Delivery via Azure Front Door and Blob Storage
date: 2026-01-16 10:00:00 +0300
categories: [Consulting]
tags: [azure, azure-front-door, blob-storage, cdn, video-streaming, security, csp-ea]
description: A comprehensive guide on how to securely and efficiently deliver public video content to mobile applications using Azure Front Door and Blob Storage for a large bank.
---

Welcome back! Today, we are diving into a highly requested real-world cloud architecture scenario: building a robust, secure, and high-performance video distribution pipeline for a large bank's mobile application. 

When dealing with financial institutions, security and performance cannot be compromised. This guide outlines the necessary configuration steps to serve public video content securely from Azure Blob Storage through Azure Front Door directly to mobile clients.

## Target Architecture

Before we jump into the configuration, let's look at the high-level flow of our delivery model:

**Mobile Application → Azure Front Door (Standard/Premium) → Azure Blob Storage (Private Container)**



This setup ensures that all media requests are routed through Microsoft's global edge network, benefiting from caching, SSL offloading, and advanced threat protection before ever hitting the origin storage.

---

## Configuration Steps

### 1. Creating the Front Door Profile

The first step is to establish our entry point at the edge.

* Navigate to **Azure Portal > Front Door and CDN Profiles**.
* Click **Create new profile**.
* **SKU:** Select **Premium**. 
    > We highly recommend the Premium tier as it includes Web Application Firewall (WAF) capabilities, which are crucial for banking applications.
    {: .prompt-tip }
* *Note: Region selection is not required as Front Door is a global service.*

### 2. Endpoint and Custom Domain Setup

Next, we configure how the mobile app will communicate with Front Door.

* **Endpoint:** Create a new endpoint (e.g., `media-endpoint`).
* **Custom Domain:** Add your organization's custom domain (e.g., `media.app.com`).
* **TLS:** Select **Azure Managed Certificate** for automated certificate rotation and management.

### 3. Origin Group (Blob Storage)

Here, we define where Front Door will fetch the video content if it's not already cached.

* **Origin type:** Storage (Blob)
* **Hostname:** `<storageaccount>.blob.core.windows.net`
* **Health probe:** Use `HTTPS` and point the path to `/`.

### 4. Routing Configuration

Routing rules dictate how incoming requests are processed.

* **Path:** `/videos/*`
* **Protocol:** HTTPS only.
* **Origin group:** Select the Blob origin created in the previous step.
* **Cache:** Enabled.
* **Query string caching:** Set to **Use query string**. 
    > This setting is absolutely mandatory when using Shared Access Signatures (SAS) to ensure tokens are evaluated correctly.
    {: .prompt-warning }

### 5. Cache & Time-to-Live (TTL)

Optimizing caching is key to reducing latency and storage egress costs.

* **Default TTL:** 1 to 6 hours.
* **Max TTL:** 1 day.
* **Honor origin headers:** Disabled (this allows Front Door to strictly enforce the TTLs we define).

### 6. WAF Settings (Premium SKU)

Security is paramount. The Premium SKU gives us robust WAF features to protect our endpoint.

* **Mode:** Prevention.
* **Rulesets:** Enable OWASP managed rules.
* **Rate limit:** Configure a threshold, for example, `100 requests / 1 minute / IP`.
* **Allowed methods:** Restrict to `GET` and `HEAD` only.

### 7. Blob Storage Security Configuration

We must lock down the origin so that it can *only* be accessed via Front Door.

* **Container access:** Private (no anonymous access).
* **Public access:** Disabled at the Storage Account level.
* **Networking:** Under the Storage firewall settings, restrict access to selected virtual networks and IP addresses. Add a resource instance rule or use service tags to allow traffic strictly from `AzureFrontDoor.Backend`.

> When managing access to the Azure Portal or configuring automated deployments for this infrastructure, ensure you are utilizing Microsoft Entra ID (formerly Azure AD) for strict Role-Based Access Control (RBAC).
{: .prompt-info }

### 8. SAS Token Implementation

To stream the videos, the backend API should generate secure, time-bound tokens for the mobile client.

* **Lifecycle:** The backend API generates short-lived SAS tokens (e.g., 3–10 minutes).
* **Permissions:** `Read` only.
* **Scope:** Limit the token to the specific blob or path being requested.

### 9. Testing the Scenarios

Always validate your security posture before moving to production. Here are the expected outcomes during testing:

* **Direct Blob URL Access** → `403 Forbidden` (Blocked by Storage Firewall).
* **Front Door URL + Valid SAS Token** → `200 OK` or `206 Partial Content` (Successful video stream).
* **Front Door URL + Missing/Expired SAS Token** → `403 Forbidden` (Blocked by Storage Account).

---

## Conclusion

By implementing this architecture, we achieve an Azure-native, highly secure, and exceptionally manageable mobile video distribution pipeline. Azure Front Door handles the global routing, caching, and WAF security, while Azure Blob Storage provides reliable, cost-effective, and secure permanent storage.