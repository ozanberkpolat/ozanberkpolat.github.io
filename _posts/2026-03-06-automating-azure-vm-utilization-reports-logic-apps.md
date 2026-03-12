---
title: Automating Azure VM Utilization Reports with Logic Apps
date: 2026-03-06 09:00:00 +0300
categories: [Automation]
tags: [azure, logic-apps, kql, azure-monitor, log-analytics, reporting, automation]
description: A step-by-step guide to generating automated monthly VM resource utilization (CPU, RAM, Disk) reports using Azure Logic Apps, Log Analytics, and KQL.
---

Monitoring the resource utilization of Virtual Machines (VMs) is critical for performance tuning and cost optimization in large-scale Azure environments. Handling this manually for customer environments is time-consuming and prone to human error.

In this post, we will explore an automation architecture using **Azure Logic Apps** and **Log Analytics** to automatically generate a monthly report containing CPU, Memory, and Storage metrics, which is then emailed to the relevant stakeholders as a formatted Excel spreadsheet.



## Solution Architecture and Workflow

Our automation is built upon the following core steps:

1. **Trigger (Recurrence):** The workflow is scheduled to run on the 1st of every month at 07:00 AM (W. Europe Standard Time).
2. **KQL Queries (Log Analytics):** Metrics for the past two months are queried from the Log Analytics Workspace. We filter the data to only include business hours (09:00 - 16:00) for a more realistic representation of the active workload.
3. **File Operations:** A predefined Excel template (`VM_Utilization_Report_Template.xlsx`) stored in SharePoint is copied and dynamically renamed for the current reporting month.
4. **Writing Data (Office Scripts):** We use the Excel Online (Business) API to execute unattended Office Scripts, injecting the JSON payloads returned by Log Analytics directly into the Excel sheets.
5. **Email Delivery:** The finalized Excel file is retrieved and sent as an attachment via Office 365 Outlook.

> **Important:** Because this workflow interacts with Azure Monitor Logs and SharePoint/Excel Online, ensure your Logic App is granted the appropriate permissions, ideally using a Managed Identity or a dedicated service account properly configured in Microsoft Entra ID.
{: .prompt-warning }

---

## Log Analytics Metric Queries (KQL)

Retrieving accurate data is the most crucial part of this workflow. Below are the three primary KQL queries used in the Logic App. 



### 1. CPU Metrics (CPUMetrics)

This query analyzes the CPU utilization trends over the last two months, specifically targeting daytime business hours.

```kusto
// Dynamic Date: From the beginning of 2 months ago to the end of last month
let startDate = startofmonth(datetime_add('month', -2, now()));
let endDate   = startofmonth(now()) - 1h - 1s;

// 1. Inventory (pulled back 65 days to catch records from 2 months ago)
let Inventory = VMComputer
| where TimeGenerated > ago(65d)
| summarize arg_max(TimeGenerated, OperatingSystemFullName) by _ResourceId
| project _ResourceId, FullOSName = OperatingSystemFullName;

// 2. Backup Inventory
let BackupInventory = Heartbeat
| where TimeGenerated > ago(65d)
| summarize arg_max(TimeGenerated, OSName, OSType) by _ResourceId
| project _ResourceId, SimpleOSName = coalesce(OSName, OSType);

// 3. Main Metric Query
InsightsMetrics
| where TimeGenerated between (startDate .. endDate)
| where Name == "UtilizationPercentage"
| extend LocalTime = datetime_add("hour", 1, TimeGenerated)
| where hourofday(LocalTime) between (9 .. 16) 
| extend YearMonth = format_datetime(LocalTime, "yyyy-MM")
| extend TagsJson = parse_json(Tags)
| extend TotalCPU = toint(TagsJson["vm.azm.ms/totalCpus"])
| summarize AvgCPU = avg(Val), MaxCPU = max(Val), TotalCPU = any(TotalCPU), Computer = any(Computer) by _ResourceId, YearMonth
| join kind=leftouter (Inventory) on _ResourceId
| join kind=leftouter (BackupInventory) on _ResourceId
| extend RawOS = coalesce(FullOSName, SimpleOSName, "Unknown")
| extend CleanOS = iff(RawOS contains "Red Hat", "Red Hat Enterprise Linux", RawOS)
| project Computer = strcat(Computer, " CPU"), YearMonth, AvgCPU = round(AvgCPU, 2), MaxCPU = round(MaxCPU, 2), TotalCPU
| order by Computer asc, YearMonth asc
```

### 2. Memory Metrics

Following the same logic for dates and business hours, this query calculates used and available memory based on the `AvailableMB` counter.

```kusto
let startDate = startofmonth(datetime_add('month', -2, now()));
let endDate   = startofmonth(now()) - 1h - 1s;

let Inventory = VMComputer
| where TimeGenerated > ago(65d)
| summarize arg_max(TimeGenerated, OperatingSystemFullName) by _ResourceId
| project _ResourceId, FullOSName = OperatingSystemFullName;

let BackupInventory = Heartbeat
| where TimeGenerated > ago(65d)
| summarize arg_max(TimeGenerated, OSName, OSType) by _ResourceId
| project _ResourceId, SimpleOSName = coalesce(OSName, OSType);

InsightsMetrics
| where TimeGenerated between (startDate .. endDate)
| where Name == "AvailableMB"
| extend LocalTime = datetime_add("hour", 1, TimeGenerated)
| where hourofday(LocalTime) between (9 .. 16)
| extend YearMonth = format_datetime(LocalTime, "yyyy-MM")
| extend TagsJson = parse_json(Tags)
| extend TotalMB = todouble(TagsJson["vm.azm.ms/memorySizeMB"])
| summarize AvgAvailMB_Raw = avg(Val), MinAvailMB_Raw = min(Val), TotalMB = max(TotalMB), Computer = any(Computer) by _ResourceId, YearMonth
| extend AvgUsedMB = round(TotalMB - AvgAvailMB_Raw, 2), MaxUsedMB = round(TotalMB - MinAvailMB_Raw, 2), AvgAvailableMB = round(AvgAvailMB_Raw, 2)
| extend AvgUsagePercent = round((AvgUsedMB / TotalMB) * 100, 2), MaxUsagePercent = round((MaxUsedMB / TotalMB) * 100, 2), TotalGB = round(TotalMB / 1024, 2)
| join kind=leftouter (Inventory) on _ResourceId
| join kind=leftouter (BackupInventory) on _ResourceId
| extend RawOS = coalesce(FullOSName, SimpleOSName, "Unknown")
| extend CleanOS = iff(RawOS contains "Red Hat", "Red Hat Enterprise Linux", RawOS)
| extend ComputerNameMemory = strcat(Computer, " Memory")
| project Computer = ComputerNameMemory, YearMonth, AvgUsedMB, MaxUsedMB, TotalMB, AvgAvailableMB, AvgUsagePercent, MaxUsagePercent, TotalGB
| order by Computer asc, YearMonth asc
```

### 3. Storage Metrics

To track disk capacity, we monitor the `LogicalDisk` namespace and the `FreeSpaceMB` counter. By extracting the `MountId`, we can independently report on the capacity of each attached disk.

```kusto
let startDate = startofmonth(datetime_add('month', -2, now()));
let endDate   = startofmonth(now()) - 1h - 1s;

let Inventory = VMComputer
| where TimeGenerated > ago(65d)
| summarize arg_max(TimeGenerated, OperatingSystemFullName) by _ResourceId
| project _ResourceId, FullOSName = OperatingSystemFullName;

let BackupInventory = Heartbeat
| where TimeGenerated > ago(65d)
| summarize arg_max(TimeGenerated, OSName, OSType) by _ResourceId
| project _ResourceId, SimpleOSName = coalesce(OSName, OSType);

InsightsMetrics
| where TimeGenerated between (startDate .. endDate)
| where Namespace == "LogicalDisk"
| where Name == "FreeSpaceMB"
| extend LocalTime = datetime_add("hour", 1, TimeGenerated)
| where hourofday(LocalTime) between (9 .. 16)
| extend MountId = tostring(parse_json(Tags)["vm.azm.ms/mountId"]), RawDiskSize = todouble(parse_json(Tags)["vm.azm.ms/diskSizeMB"]), YearMonth = format_datetime(LocalTime, "yyyy-MM")
| extend DiskSizeMB_Raw = iif(RawDiskSize > 10000000, RawDiskSize / 1024.0 / 1024.0, RawDiskSize)
| summarize AvgFreeMB_Raw = avg(Val), MinFreeMB_Raw = min(Val), DiskSizeMB_Raw = max(DiskSizeMB_Raw), ComputerName = any(Computer) by _ResourceId, MountId, YearMonth
| extend DiskSizeMB = round(DiskSizeMB_Raw, 2), DiskSizeGB = round(DiskSizeMB_Raw / 1024.0, 2), AvgUsedMB  = round(DiskSizeMB_Raw - AvgFreeMB_Raw, 2), MaxUsedMB  = round(DiskSizeMB_Raw - MinFreeMB_Raw, 2)
| extend AvgUsedGB  = round(AvgUsedMB / 1024.0, 2), MaxUsedGB  = round(MaxUsedMB / 1024.0, 2), AvgUsedPercent = iif(DiskSizeMB_Raw == 0, 0.0, round(AvgUsedMB * 100.0 / DiskSizeMB_Raw, 2)), MaxUsedPercent = iif(DiskSizeMB_Raw == 0, 0.0, round(MaxUsedMB * 100.0 / DiskSizeMB_Raw, 2))
| join kind=leftouter (Inventory | extend JoinID = tolower(_ResourceId)) on $left._ResourceId == $right.JoinID
| join kind=leftouter (BackupInventory | extend JoinID = tolower(_ResourceId)) on $left._ResourceId == $right.JoinID
| extend RawOS = coalesce(FullOSName, SimpleOSName, "Unknown")
| extend CleanOS = iff(RawOS contains "Red Hat", "Red Hat Enterprise Linux", RawOS)
| extend FinalComputerName = strcat(ComputerName, " Storage ", MountId)
| project Computer = FinalComputerName, MountId, YearMonth, DiskSizeMB, DiskSizeGB, AvgUsedMB, AvgUsedGB, MaxUsedMB, MaxUsedGB, AvgUsedPercent, MaxUsedPercent
| order by Computer asc, MountId asc, YearMonth asc
```

## Integrating with Excel via Office Scripts

After the KQL queries successfully run, the Logic App grabs the content of the template file (`VM_Utilization_Report_Template.xlsx`) and creates a new file dynamically named for the prior month (e.g., `VMUtilization_02-2026.xlsx`).

> **Pro Tip:** Notice the `Wait` (Delay) action set to 90 seconds in the Logic App right after the file creation. This is a crucial step! It ensures that SharePoint fully synchronizes the newly created file and removes any internal file locks before the Office Scripts attempt to write data to it.
{: .prompt-tip }

The workflow then uses the "Run script" action from the Excel Online connector. It passes the raw JSON array (`@string(outputs('CPUMetrics')?['body/value'])`) from Log Analytics into the script, which iterates through the data and populates the spreadsheet cleanly.

## Email Notification

Once all three metric sets (CPU, Memory, Storage) are written to the spreadsheet, the Logic App fetches the final file content and constructs an HTML-formatted email using the Office 365 Outlook connector. 

This creates a completely touch-free, automated reporting mechanism that delivers actionable insights directly to the inbox of those who need it!

---

If you have any questions about adapting these KQL queries for your own environment or setting up the Excel Office Scripts, let me know in the comments below!