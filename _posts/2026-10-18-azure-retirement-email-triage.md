---
title: "\"Are We Affected?\" How I Answer Azure Retirement Emails From Inventory"
date: 2026-10-18
categories: [Governance]
tags: [azure, retirement, resource-graph, kql, operations]
description: "Five Azure retirement and action-required notices, checked against the real inventory instead of memory, and the routine and queries I use to answer them."
figure: "5 notices"
figure_note: "forwarded between May and July"
---

Most months a customer forwards me an email from Azure with one line on top. "Are we affected?" Sometimes it's "Do we need to do anything here?" Underneath is a retirement notice, an image deprecation, or something titled "Action required".

Between May and July one customer forwarded five of them. I know that estate well enough that I could have answered each one from memory in a minute. I didn't. Memory is how you tell a customer "no impact" and then find the VM you forgot three weeks before the deadline. Every one of the five got checked against the inventory first, and every reply carried a scope and a plan.

The notices turned out to be less precise than they look. One said there was no alternative when there was one. Another counted a server that no longer existed.

## The routine

1. **Read the notice for two things:** the exact resource type or feature, and the date. Everything else is boilerplate. The Data Factory notice listed 26 connector versions. One of them mattered.
2. **Turn it into a query.** A resource type, a property, a filter.
3. **Run it across every subscription the customer has,** not only the ones printed in the email. In the Secure Boot case one of the candidates sat in a subscription the email didn't mention.
4. **Sort every hit into affected, not affected, or unknown.** Unknown is a real answer: a VM with no image reference, a stopped VM that reports nothing. Say so instead of guessing.
5. **Answer with scope, owner, deadline and plan.** Which resources by name, who has to act, by when, what goes first, and whether anything restarts.

## Five notices, and what the inventory said

### Secure Boot 2023 certificates

The notice: Windows Trusted Launch and Confidential VMs created before April 2024 need the 2023 Secure Boot certificates, because the 2011 ones expire in June 2026. The VMs keep running either way. They just stop getting boot-level security updates.

The inventory had four candidates. One was Linux, out of scope, since the update covers Windows. That left three Windows VMs: two production, one non-production. I replied within two hours with the list and a plan: trigger the update inside the guest on the non-production VM first, using Run Command and the `AvailableUpdates` registry value from Microsoft's guidance, and call it done when `UEFICA2023Status` reads `Updated`. Then production.

I also wrote "no reboot required". That was wrong.

The non-production VM got there on its own after a delay. One production VM finished the first stage and then waited for a restart before the Boot Manager stage could complete. The other production VM stalled and only completed after a restart. So I went back to the customer for restart windows: one VM could restart any time, the other only outside business hours. The ticket closed on June 11 with all three updated, ahead of the deadline, and with restarts my plan said we wouldn't need.

> Microsoft's [Windows Server Secure Boot troubleshooting page](https://learn.microsoft.com/troubleshoot/windows-server/windows-security/troubleshoot-windows-server-secure-boot-certificate-update-issues) lists event ID 1800 as "Restart required". Ask for a restart window in the first reply, even if you hope not to use it.
{: .prompt-warning }

### Data Factory V1 connectors

The notice said a long list of connector versions was already out of support and "your pipeline may fail anytime". The inventory: 11 linked services across four factories, all of them the Oracle connector on version 1.0.

The list was the easy part of the reply. The useful part was telling the customer that moving a linked service to version 2.0 means entering the credentials again, and that the host, port and service name move into a single `server` property ([Oracle connector upgrade steps](https://learn.microsoft.com/azure/data-factory/connector-oracle#upgrade-the-oracle-connector)). So I offered a working session with the people who hold them. That is where the ticket ended on my side: scope and plan delivered.

### A deprecated Windows Server image plan

The notice: the `2022-datacenter-azure-edition` plan would be deprecated on January 12, 2027, with "No alternative option provided by Publisher."

The inventory: 14 VMs on that plan. Zero scale sets, zero gallery images built from it. Deprecation blocks new deployments from the image and stops scale sets from scaling out. Running VMs are not touched. So the answer for the 14 was no action now. Windows Server 2022 gets security updates through extended support until [October 2031](https://learn.microsoft.com/lifecycle/products/windows-server-2022), and that is the real migration deadline for those machines.

I looked at an in-place upgrade to 2025 before replying. It would not even clear the warning: after an in-place upgrade the publisher, offer and plan in the VM properties stay the same, and Microsoft says Azure Update Manager is not officially supported on such a VM ([in-place upgrade caution](https://learn.microsoft.com/azure/virtual-machines/windows-in-place-upgrade)). All 14 are patched through Update Manager.

And "no alternative" wasn't true. The change that came out of this ticket was in the Bicep template: new Windows VMs now default to Windows Server 2025 Datacenter: Azure Edition, with two lines we had already agreed on in a security meeting:

```bicep
secureBootEnabled: isWindows ? true : null
securityType: isWindows ? 'TrustedLaunch' : null
```

### General-purpose v1 storage accounts

The notice: GPv1 accounts retire on October 13, 2026, creation is blocked from September 1, 2026, and anything left gets migrated automatically, possibly at a higher price.

The account that mattered was a Site Recovery cache account with a random name, the kind the portal's Enable replication flow tends to create when nobody picks an existing one. Two VMs replicated through it. That is less odd than it sounds: Microsoft's own [A2A PowerShell guide](https://learn.microsoft.com/azure/site-recovery/azure-to-azure-powershell#reprotect-and-fail-back-to-the-source-region) creates its cache account with `-Kind Storage`, which is GPv1.

Upgrading the account in place would have been the shortest fix. I chose to empty it instead, because it was one of six randomly named cache accounts we were consolidating anyway. The catch: a replicating VM's cache account can't be changed in place. It is disable replication, enable again, and a full re-seed with the VM unprotected until it finishes. One VM was re-seeded onto the standard cache account. The other was deallocated with a recovery point more than three weeks old, and after a keep-or-drop decision it came out of replication. The account was deleted on July 27.

### Site Recovery agents out of support

This one arrived in May and again in July: Site Recovery components in a vault had expired, "3 server(s)".

My first reply was short. This was the agent update problem I was already tracking, and the better fix was to stop pushing updates by hand and let Site Recovery manage them through an Automation account ([automatic Mobility service updates](https://learn.microsoft.com/azure/site-recovery/azure-to-azure-autoupdate#enable-automatic-updates)).

When I went through the vault properly, it held 19 protected items and 4 were flagged for an agent update. One flagged item pointed at a VM that had been deleted. One pointed at a VM that had been moved to another resource group after replication started, so every update push failed with "The specified source Azure VM is not found." The other two were genuinely expired agents, and the push failed on them too. Clicking "install" again would never have fixed the first two. Site Recovery's support matrix treats a resource group move of a replicating VM as unsupported, and the remedy is disable and re-enable.

Automatic updates were off on all three DR vaults, still configured with the retired Run As authentication type. We created three Automation accounts with system-assigned identities, one per vault. Turning the vault setting on waited on a role assignment from the customer's side.

## The queries

These are the shapes I reach for, with names replaced by placeholders. Run them in Resource Graph Explorer or with `az graph query` across all subscriptions.

Storage accounts by kind. The notice was about `Storage` (GPv1). The [retirement overview](https://learn.microsoft.com/azure/storage/common/general-purpose-version-1-account-migration-overview) also names legacy `BlobStorage` accounts, so I include both:

```kusto
resources
| where type =~ 'microsoft.storage/storageaccounts'
| where kind in~ ('Storage', 'BlobStorage')
| project subscriptionId, resourceGroup, name, kind, sku = tostring(sku.name), tags
```

A hit is not a plan. Find out what writes to the account before you touch it. In my case it was a Site Recovery vault, and that changed the whole answer.

VMs by image, OS and security type. One query serves both the image notice and the Secure Boot notice; only the last filter changes:

```kusto
resources
| where type =~ 'microsoft.compute/virtualmachines'
| extend img = properties.storageProfile.imageReference
| project subscriptionId, resourceGroup, name,
    osType = tostring(properties.storageProfile.osDisk.osType),
    securityType = tostring(properties.securityProfile.securityType),
    offer = tostring(img.offer), sku = tostring(img.sku)
// image deprecation: the plan named in the notice
| where sku =~ '<plan-from-notice>' or isempty(sku)
// Secure Boot instead:
// | where osType =~ 'Windows' and securityType in~ ('TrustedLaunch', 'ConfidentialVM')
```

Rows with an empty `sku` go straight into "unknown". When I checked the same estate for Windows Server 2016 end of support, the image reference was empty on all 15 of the 2016 VMs. They had come into Azure from existing disks. The OS version came from the agent heartbeat instead:

```kusto
Heartbeat
| where TimeGenerated > ago(7d)
| summarize arg_max(TimeGenerated, OSName, OSMajorVersion) by Computer, _ResourceId
```

A stopped VM sends no heartbeat, so it stays "unknown" until someone starts it or tells you what it runs.

Data Factory linked services don't show up in Resource Graph, so I list the factories there and ask ARM for each factory's linked services. A version 2.0 Oracle linked service carries `"version": "2.0"`; a version 1.0 one has no `version` and uses a `connectionString`:

```bash
az graph query -q "resources | where type =~ 'microsoft.datafactory/factories' | project id" \
  --first 1000 --query "data[].id" -o tsv |
while read -r id; do
  az rest --method get \
    --url "https://management.azure.com${id}/linkedservices?api-version=2018-06-01" \
    --query "value[].[name, properties.type, properties.version]" -o tsv |
  sed "s|^|${id##*/}\t|"
done
```

Compare the type column against the connector list in the notice. An empty version on a listed type means affected.

Inside the guest, for Secure Boot, a check I can push with Run Command:

```bash
az vm run-command invoke -g <resource-group> -n <vm-name> \
  --command-id RunPowerShellScript --scripts @check-secureboot.ps1
```

```powershell
# True once the 2023 CA is in the Secure Boot DB
[System.Text.Encoding]::ASCII.GetString((Get-SecureBootUEFI db).bytes) -match 'Windows UEFI CA 2023'

# 1808 = success, 1801 = incomplete, 1800 = restart required
Get-WinEvent -FilterHashtable @{ LogName = 'System'; Id = 1800, 1801, 1808 } -MaxEvents 5 -ErrorAction SilentlyContinue |
    Select-Object TimeCreated, Id, Message
```

For Site Recovery I don't have a single query I trust. I check each vault's extension update setting, then, for every flagged item, whether the source VM ID it points at still resolves.

## What goes in the reply

The answer the customer can act on fits in a few lines: what is affected, by name; what isn't, and why; what is still unknown; who has to do something; by when. Write it from a query result and the follow-up questions mostly stop. And if your plan says "no reboot", ask for a restart window anyway.
