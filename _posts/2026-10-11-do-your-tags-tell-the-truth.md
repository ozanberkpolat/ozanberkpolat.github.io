---
title: "Do Your VM Tags Tell the Truth? Checking Them Against Backup, ASR and Maintenance Configurations"
date: 2026-10-11
categories: [Governance]
tags: [azure, tagging, azure-backup, site-recovery, update-manager, resource-graph]
description: "I rebuilt a monthly check that compares VM tags with what Azure Backup, Site Recovery and maintenance assignments actually do, and it went from 15 flagged VMs to 2 real ones."
figure: "15 → 2"
figure_note: "flagged VMs, old vs new"
---

In March I wrote about [the tag scheme](/posts/mastering-azure-vm-tagging/) we put on every VM: four tags that say whether the VM is backed up, which backup policy it uses, whether it replicates with Site Recovery, and which maintenance configuration patches it. That post ended with an audit policy. A policy can tell you a tag exists. It can't tell you the tag is true.

For that part I had a Logic App. On the first of every month it posted an adaptive card in my Teams chat asking for a bearer token, ran two Resource Graph queries with it, and mailed me two CSVs of VMs whose tags didn't match reality.

This week I rebuilt it as a script and four Resource Graph queries. On the first run I compared both rule sets on the same 78 VMs. The old rules would have flagged at least 15. The new check flags 2. Both are real, and the old rules had rated the backups on both of them as fine.

## Where the truth lives

Each tag has one place in Azure that can confirm or contradict it. All of them are in Resource Graph, so one identity with read access covers the whole tenant.

| Tag | Compared against | Resource Graph table |
|---|---|---|
| `BackupEnabled` | an Azure Backup protected item of workload type VM | `RecoveryServicesResources` |
| `BackupPolicy` | the `policyName` on that same item | `RecoveryServicesResources` |
| `ReplicationEnabled` | a Site Recovery replication protected item | `RecoveryServicesResources` |
| `MaintenanceConfiguration` | a configuration assignment made on the VM | `MaintenanceResources` |

The exact resource types are listed in the [Resource Graph table reference](https://learn.microsoft.com/azure/governance/resource-graph/reference/supported-tables-resources). Every list gets keyed on the VM's lower-cased resource ID. More on why below.

## What the old rules got wrong

Six things. Two of them produced the 15 false flags. Two hid the real problems. The last two hadn't caused a wrong row yet, as far as I know.

### "Unassigned" was a valid answer

Twelve VMs carry `MaintenanceConfiguration = Unassigned`. That value means no maintenance configuration, on purpose. The old query checked only whether an assignment existed, and when none did it wrote `Not Assigned` without looking at the tag. Same 12 rows, every month.

`Unassigned` is the customer's convention, and the sync script in the March post writes it as the default when a VM has no assignment. So the sync script and the checker disagreed about what one word meant.

Fix: no assignment plus a tag of `Unassigned`, `None`, `N/A` or `-` is a match. A tag that names a configuration while nothing is assigned is still flagged.

### Tag keys come in more than one spelling

Three VMs of one application carry `backupPolicy` with a lower-case b. The old query read `tags['BackupPolicy']`, got nothing back for those three, and reported the tag as missing. The tag was there and correct.

Fix: read the keys case-insensitively. The odd spelling still goes in the report, as a note, so someone can normalise it. It isn't a finding.

### A SQL backup is not a VM backup

SQL Server in Azure VM backups show up as protected items too, and their `sourceResourceId` is the VM's ID. The old query took any backup item pointing at the VM. A VM whose only protection was a database-level backup read as backed up.

This one errs in the quiet direction. Nothing gets flagged, and the gap only shows up on the day someone tries to restore the whole VM.

Fix: only count items where `workloadType` is `VM`.

### Suspended is not protected

These are the two real findings: a pair of network appliance VMs tagged `BackupEnabled = Yes`. Both had backup items in a vault, and both items were in `BackupsSuspended`. Backups had been suspended for months and the tag still said Yes.

The old query counted backup items and never looked at `protectionState`. One item meant Yes, Yes matched the tag, done.

Fix: `Protected`, `IRPending` and `ProtectionError` count as backed up. `BackupsSuspended` and `ProtectionStopped` don't, and the report prints "Suspended" or "Stopped" in the Azure column so the reader sees why it flagged. What to do about the pair is someone's decision: resume the backups, or set the tag to No.

### Names are not identifiers

The old query joined backup items to VMs by lower-cased VM name, and Site Recovery items by `friendlyName`. Two VMs with the same name in two subscriptions would share each other's backups.

Fix: key everything on `tolower(id)`. For Azure-to-Azure replication the source VM's ID is in `properties.providerSpecificDetails.fabricObjectId`.

The sync script in the March post makes the same name join, and it has no workload type filter either. If you copied it, change those two things.

### Two smaller ones

Maintenance was matched with `contains`. A tag of `patch-sun` would match an assigned `patch-sun-late`. Now the configuration name has to be equal, ignoring case.

And the old rules reported `Not Protected` for `BackupPolicy` on every VM that was tagged `BackupEnabled = No` and had a policy tag. Nothing is wrong with that VM. A VM tagged No that really has no backup now gets "Not Applicable" for the policy check.

## The queries

Four plain lists, no joins in KQL. The VM tags come back as a JSON string because the key casing varies from VM to VM.

```kusto
// 1. Every VM, tags as a string
resources
| where type =~ 'microsoft.compute/virtualmachines'
| project name, id = tolower(id), subscriptionId, resourceGroup,
          tags = tostring(tags),
          power = tostring(properties.extended.instanceView.powerState.code)

// 2. Azure Backup items, VM workload only
recoveryservicesresources
| where type =~ 'microsoft.recoveryservices/vaults/backupfabrics/protectioncontainers/protecteditems'
| where tostring(properties.workloadType) =~ 'VM'
| project src = tolower(tostring(properties.sourceResourceId)),
          state = tostring(properties.protectionState),
          policy = tostring(properties.policyName),
          vault = tostring(split(id, '/')[8])

// 3. Site Recovery protected items
recoveryservicesresources
| where type =~ 'microsoft.recoveryservices/vaults/replicationfabrics/replicationprotectioncontainers/replicationprotecteditems'
| project src = tolower(tostring(properties.providerSpecificDetails.fabricObjectId)),
          state = tostring(properties.protectionState),
          health = tostring(properties.replicationHealth)

// 4. Maintenance configurations assigned to a resource
maintenanceresources
| where type =~ 'microsoft.maintenance/configurationassignments'
| project vm = tolower(tostring(properties.resourceId)),
          config = tostring(split(tostring(properties.maintenanceConfigurationId), '/')[8])
```

The decisions happen outside KQL. This is the backup and maintenance part in PowerShell. Replication works like backup: any Site Recovery item whose state isn't empty or `Unprotected` counts as Yes.

```powershell
function Get-Arg([string]$Query) {
    # every subscription the signed-in account can read, 1000 rows a page
    # (-Skip must be at least 1, so the first page leaves it out)
    $rows = @(); $skip = 0
    do {
        $page = if ($skip) { @(Search-AzGraph -Query $Query -First 1000 -Skip $skip -ErrorAction Stop) }
                else { @(Search-AzGraph -Query $Query -First 1000 -ErrorAction Stop) }
        $rows += $page
        $skip += 1000
    } while ($page.Count -eq 1000)
    $rows
}

function Get-Index($rows, [string]$key) {
    $h = @{}
    foreach ($r in $rows) {
        if (-not $r.$key) { continue }
        if (-not $h.ContainsKey($r.$key)) { $h[$r.$key] = [System.Collections.Generic.List[object]]::new() }
        $h[$r.$key].Add($r)
    }
    $h
}

function Get-Tag([string]$json, [string]$key) {
    if (-not $json) { return $null }
    $p = ($json | ConvertFrom-Json).PSObject.Properties |
         Where-Object { $_.Name -ieq $key } | Select-Object -First 1   # any casing
    if ($p) { "$($p.Value)".Trim() } else { $null }
}

# $q holds the four queries above
$backups = Get-Index (Get-Arg $q.backup) 'src'
$assigns = Get-Index (Get-Arg $q.maint) 'vm'
$on      = 'Protected', 'IRPending', 'ProtectionError'   # -in ignores case
$noMaint = 'Unassigned', 'None', 'N/A', '-'

foreach ($vm in Get-Arg $q.vms) {
    $id      = $vm.id
    $items   = @(if ($backups.ContainsKey($id)) { $backups[$id] })
    $active  = @($items | Where-Object { $_.state -in $on })
    $withPol = @($active) + @($items | Where-Object { $_.state -eq 'BackupsSuspended' })

    $bTag = Get-Tag $vm.tags 'BackupEnabled'
    $backup = if ($null -eq $bTag) { 'Tag Missing' }
              elseif ($bTag -notin 'Yes', 'True', 'No', 'False') { 'Invalid Tag' }
              elseif (($bTag -in 'Yes', 'True') -eq ($active.Count -gt 0)) { 'Match' }
              else { 'Mismatch' }

    $pTag = Get-Tag $vm.tags 'BackupPolicy'
    $pAct = if ($withPol.Count) { $withPol[0].policy } else { '' }
    $policy = if (($bTag -in 'No', 'False') -and $withPol.Count -eq 0) { 'Not Applicable' }
              elseif ($null -eq $pTag) { 'Tag Missing' }
              elseif (-not $pAct) { 'Not Protected' }
              elseif ($pTag -eq $pAct) { 'Match' }
              else { 'Mismatch' }

    $mTag    = Get-Tag $vm.tags 'MaintenanceConfiguration'
    $configs = @(if ($assigns.ContainsKey($id)) { $assigns[$id].config })
    $maint = if ($null -eq $mTag) { 'Tag Missing' }
             elseif ($configs.Count -eq 0) { if ($mTag -in $noMaint) { 'Match' } else { 'Not Assigned' } }
             elseif ($mTag -in $configs) { 'Match' }   # exact name, case-insensitive
             else { 'Mismatch' }

    [pscustomobject]@{ VM = $vm.name; Backup = $backup; Policy = $policy; Maintenance = $maint }
}
```

Two guards sit in front of all this. If Resource Graph returns zero VMs, the run fails, because an empty list means a scope or RBAC problem. If none of the VMs carries any of the four tags, it refuses to produce a report, because a tenant without the scheme would give you 78 rows of "Tag Missing".

## What it still can't see

Maintenance assignments made through a [dynamic scope](https://learn.microsoft.com/azure/update-manager/manage-dynamic-scoping) are created on a subscription, so they don't show up as an assignment on the VM. A VM patched only through a dynamic scope will look unassigned to this check. If you use dynamic scopes, this part needs a second source.

It's also a snapshot. It runs on the first of the month and says nothing about the days in between.

> If you build something similar, start from the [Azure Backup Resource Graph samples](https://learn.microsoft.com/azure/backup/query-backups-using-azure-resource-graph), then add the workload type and protection state filters yourself.
{: .prompt-tip }

## Why the count matters

The old report wasn't dramatically wrong. It was wrong the same way every month: the same 12 maintenance rows, the same 3 policy rows. A report like that teaches you which rows to skip, and the next new row gets skipped with them. Meanwhile the two VMs that actually had a problem were sitting in the Match column.

A compliance report that flags things nobody needs to fix is worse than having no report, because its only reader learns to stop reading it. I'd rather have one that stays quiet most months and is right when it speaks up. This month it named two VMs, and both needed a decision.
