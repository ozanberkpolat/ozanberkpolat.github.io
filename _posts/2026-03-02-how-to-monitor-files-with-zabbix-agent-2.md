---
title: "How-To: Monitoring Delayed Files with Zabbix Agent 2"
date: 2026-03-02 12:00:00 +0300
categories: [How To]
tags: [how to, zabbix, file monitoring]
description: "Learn how to monitor files waiting for extended periods in a specific directory on a Windows server using Zabbix Agent 2 and PowerShell."
---

## Scenario Overview

This configuration aims to detect `.XPE` files located in the `E:\FTP\IN\DC_BLOCK` directory on the `ISBFWFTP` server that have been sitting unprocessed for more than 1 hour. When the number of files meeting this criteria exceeds 1, an alert (Trigger) will automatically be generated in Zabbix.

The process consists of two main stages: Endpoint (Agent) configuration and Zabbix Server interface configuration.

---

## Stage 1: Client-Side Configuration (Zabbix Agent)

These steps must be performed directly on the target server (`ISBFWFTP`) that you wish to monitor.

### Step 1: Editing the Configuration File

1. Log in to the server with an account that has administrator privileges.
2. Open the `C:\Program Files\Zabbix Agent 2\zabbix_agent2.conf` file using Notepad (**Run as Administrator**).
3. Scroll to the very bottom of the file and paste the following custom parameter (`UserParameter`) command:

```conf
UserParameter=xpe.file.count,powershell -NoProfile -ExecutionPolicy Bypass -Command "$count = (Get-ChildItem 'E:\FTP\IN\DC_BLOCK' -Filter *.XPE | Where-Object { $_.LastWriteTime -lt (Get-Date).AddHours(-1) }).Count; if ($count) { $count } else { 0 }"
```

> Ensure that the user running the Zabbix Agent service (usually 'Local System') has at least `Read` permissions in the target folder so the PowerShell command can execute properly.
{: .prompt-warning }

### Step 2: Restarting the Service

1. Open the `services.msc` management console in Windows.
2. Locate the **Zabbix Agent 2** service in the list.
3. Right-click on the service and select **Restart**.

---

## Stage 2: Server-Side Configuration (Zabbix GUI)

These steps should be performed by an authorized system administrator via the Zabbix Web interface.

### Step 1: Item (Data Collector) Definition

In the Zabbix interface, create a new **Item** for the corresponding Host and enter the following values:

* **Name:** `File monitoring: E:\FTP\IN\DC_BLOCK (.XPE) older than 1 hour`
* **Type:** `Zabbix agent`
* **Key:** `xpe.file.count`
* **Type of information:** `Numeric (unsigned)`
* **Update interval:** `5m`

> You can adjust the **Update interval** based on your needs, but 5 minutes (`5m`) is generally ideal to avoid putting unnecessary load on the server.
{: .prompt-info }

### Step 2: Trigger (Alert) Definition

For the Item you just created, configure a **Trigger** to send an alert when the specific threshold is exceeded:

* **Name:** `ISBFWFTP: More than one .XPE file older than 1 hour detected in E:\FTP\IN\DC_BLOCK`
* **Severity:** `Warning` *(or 'Average', depending on your company's policy)*
* **Expression:** ```text
last(/ISBFWFTP/xpe.file.count) > 1
```

* **Description:** > Monitoring of the directory E:\FTP\IN\DC_BLOCK on ISBFWFTP server. This alert is triggered when more than one .XPE file remains unprocessed for over 1 hour. It indicates a potential failure in the FTP transfer process or the specific service responsible for processing DC_BLOCK files. Please check the service status and file permissions in the target folder.

---

## Verification and Testing

After completing all configurations, you need to verify that the system is working:

1. Navigate to the **Monitoring > Latest Data** menu in the Zabbix interface.
2. Filter the results by typing `ISBFWFTP` into the **Host** field.
3. Check the **Last Value** column for the corresponding Item (`File monitoring...`) to see if a number (e.g., `0`) is being returned.

If a value is successfully returned, your data flow has started without any issues. Congratulations! 🎉