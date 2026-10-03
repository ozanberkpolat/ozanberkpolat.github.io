---
title: "An Empty Private DNS Zone Took Down Blob Resolution"
date: 2026-10-04
categories: [Solution Advisory]
tags: [azure, private-endpoint, private-dns, dns, azure-policy, bicep]
description: "Field notes from centralizing privatelink zones in a customer's hub-and-spoke tenant, where linked but empty zones answered NXDOMAIN for real services."
figure: "82 zones"
figure_note: "deployed, five were needed"
---

The plan was boring on paper. A customer's tenant had `privatelink.*` zones scattered across resource groups and subscriptions. I would create one central set, link it to the hub, repoint the private endpoints, and delete the leftovers.

I wrote the Bicep with the Azure Verified Modules private DNS module. The tenant used five privatelink zones. Because of the module's default behaviour, the deployment created the whole privatelink catalog instead: 82 zones, every one of them linked to a hub VNet.

Then some services started using those zones, even though they had no record sets, and name resolution went sideways. The ticket sat on hold for a month. When the customer started asking again, I sat down with it properly.

## Why an empty zone breaks things

A private endpoint works through a CNAME chain. `myaccount.blob.core.windows.net` points to `myaccount.privatelink.blob.core.windows.net`. If the VNet sees a linked `privatelink.blob.core.windows.net` zone, Azure DNS answers from that zone. If not, the chain continues to the public endpoint.

So for a given VNet, a privatelink zone is in one of three states:

- linked, with the record: private IP
- not linked: public answer
- linked, without the record: NXDOMAIN

I had assumed an empty zone was harmless and the query would fall through to public DNS. It doesn't. A linked zone is authoritative for the whole namespace. It has no answer, so it says the name doesn't exist.

## Who actually answers?

The spoke VNets pointed at two domain controllers in the hub, or so I believed. Before touching anything I ran an audit script on a DC through Run Command. It listed forwarders, local zones and static records, then resolved real FQDNs twice: through the DC and straight against `168.63.129.16`. Matching columns mean a pure forwarder. The output, names replaced:

```text
Forwarders    : 168.63.129.16
(none - good: no local zone is shadowing Azure DNS)
(none - good: no hand-made overrides)

FQDN                                     via DC          via Azure
<storage-a>.blob.core.windows.net        NXDOMAIN/none   NXDOMAIN/none
<storage-b>.file.core.windows.net        10.0.1.4        10.0.1.4
<keyvault>.vault.azure.net               10.0.2.4        10.0.2.4
<sql-server>.database.windows.net        10.0.3.4        10.0.3.4
```

Identical columns, no local zones, empty hosts file. So for every VNet that pointed at the DCs, only the hub's zone links mattered. That rule did not hold for every VNet, and I learned that the hard way.

## The hotfix

Two storage accounts, prod and UAT, returned NXDOMAIN. The cause was an empty `privatelink.blob.core.windows.net` zone in an unrelated resource group, linked to the hub, holding only its SOA. The real blob zone in the central resource group had the right records and zero links.

A VNet can link to only one zone of a given name, so the order is fixed: remove the decoy's link, then link the real zone.

```bash
az network private-dns link vnet delete \
  -g <decoy-rg> -z privatelink.blob.core.windows.net \
  -n <decoy-link> --subscription <core-sub> --yes

az network private-dns link vnet create \
  -g <central-dns-rg> -z privatelink.blob.core.windows.net \
  -n link-to-hub \
  --virtual-network "/subscriptions/<core-sub>/resourceGroups/<network-rg>/providers/Microsoft.Network/virtualNetworks/<hub-vnet>" \
  --registration-enabled false --subscription <core-sub>
```

The first try at the second command failed. Git Bash rewrote the `/subscriptions/...` argument into a Windows path and the CLI said `Invalid format: resource id should be in ... format`. The decoy link was already gone, so for about a minute blob resolved to its public IP. I reran it from PowerShell. In Git Bash, set `MSYS_NO_PATHCONV=1`.

The 82 empty zones were still linked to the hub VNet in the secondary region. All were confirmed SOA only (`numberOfRecordSets == 1`) and their links were removed.

## Moving zones without downtime

For the zones still outside the central resource group, my first plan was unlink, relink, repoint. That leaves a window of public answers.

Resource move was better. A private DNS zone can move across resource groups and subscriptions, and its VNet links move with it. The App Service zone landed in the central resource group with 81 record sets and all 4 links intact, and all 10 post-move resolution checks passed. ARM even rewrote 29 private endpoint zone group references to the new resource ID by itself. The only prerequisite was deleting the empty same-named zone the AVM deployment had left in the central resource group.

Then all 41 App Service private endpoints got their zone groups pointed at the central zone. The other zones followed the same move pattern.

My PIM role expired halfway through that batch. The script deleted and then recreated each zone group, and 7 creates failed after their deletes, leaving 3 endpoints with no zone group. Unmanaged duplicate records kept them resolving. Check your PIM time before a batch.

## What the cleanup dug up

Looking at every record and zone group surfaced production problems nobody had reported:

- A production App Service ran with public access disabled and its name returned NXDOMAIN, so nothing could reach it. Its record sat in a prod zone not linked to the hub, while the linked nonprod zone shadowed the name. Every other prod app worked because its Bicep hardcoded the nonprod zone. This one pointed at the "correct" prod zone, and that broke it.
- Nine production apps resolved only through duplicate records nobody managed. Any endpoint IP change, or someone deleting "duplicates", would have taken all nine down.
- A production Key Vault was served from the nonprod zone, and some endpoints had no zone group at all.

None of it was caused by the centralization. It had been sitting there.

## The mistake I made

With "only hub links matter" in my head, I removed spoke links I thought were inert. One was the database zone link on the VNet where the nonprod App Services lived.

That VNet used Azure-provided DNS, not the DCs. Four VNets did, and for them their own links are the only thing that resolves anything. The apps started resolving the UAT SQL server to its public IP, and that server had public access disabled.

My tests missed it because they all resolved from the DC, which only exercises the hub's links. 15 out of 15 green with a blind spot. I restored every link a VNet had before the work, pointed at central zones. At the end, all 49 private endpoints resolved correctly.

Before removing any VNet link, read that VNet's `dhcpOptions.dnsServers`, and test from every kind of resolver, not only the DC.

## Fallback to internet

On the hub links I set `resolutionPolicy = NxDomainRedirect` ("Enable fallback to internet" in the portal). When a linked privatelink zone has no matching record, Azure retries against the public name instead of returning NXDOMAIN. The [fallback documentation](https://learn.microsoft.com/azure/dns/private-dns-fallback) explains it.

```bash
az network private-dns link vnet update -g <rg> -z <zone> -n <link> \
  --subscription <sub> --resolution-policy NxDomainRedirect
```

It would not have saved the blob accounts or the prod app: both had public access off, so they would have resolved publicly and been refused. It protects bystanders in the namespace that use public endpoints. It is fail-open, a trade-off I made knowingly.

> Private records had a 10 second TTL. The public answer from the fallback was cached by the DC for about 9 minutes. A brief fallback can pin the wrong answer far longer than a private answer ever lives.
{: .prompt-warning }

It only works on `privatelink.*` zones. Anything else is rejected with `The ResolutionPolicy property is applicable exclusively to private link zones` ([troubleshooting article](https://learn.microsoft.com/troubleshoot/azure/dns/troubleshoot-private-dns-zone-override-nxdomain)). The tenant also had a private `azure-api.net` zone and a private zone for the company's own public domain, one record each. Linking either to the hub would have made a sparse zone authoritative for a busy public namespace, and the `azure-api.net` one would have broken an Azure OpenAI resolution chain that runs through it. Both stayed unlinked.

## Guardrails

Every defect traced back to a zone created outside the central resource group, or a zone group pointing at the wrong zone. The policies, at the management group:

| Policy | Effect |
|---|---|
| `privatelink.*` zones only in the central resource group | Deny |
| Zone groups may only reference central zones | Deny |
| VNet links should use `NxDomainRedirect` | Audit |

The first matches on the full resource ID, so a same-named resource group in another subscription doesn't pass. A simplified version of its rule:

```json
"if": {
  "allOf": [
    { "field": "type", "equals": "Microsoft.Network/privateDnsZones" },
    { "field": "name", "like": "privatelink.*" },
    { "field": "id", "notLike": "/subscriptions/<core-sub>/resourceGroups/<central-dns-rg>/*" }
  ]
},
"then": { "effect": "Deny" }
```

I tested both Deny policies live. A zone in a wrong resource group got `RequestDisallowedByPolicy`, one in the central resource group was allowed, and a zone group pointing elsewhere was rejected at ARM preflight.

Two gaps remain. The DeployIfNotExists policy that gives new endpoints a zone group isn't deployed; its managed identity needs role assignments, which needs User Access Administrator, and I didn't have that active. And I found no policy alias for record count, so "linked but empty" needs a scheduled Resource Graph query:

```kusto
resources
| where type =~ 'microsoft.network/privatednszones'
| extend recs = toint(properties.numberOfRecordSets),
         links = toint(properties.numberOfVirtualNetworkLinks)
| where links > 0 and recs <= 1
| project name, resourceGroup, subscriptionId, links
```

That query would have caught the original incident on day one.

My first instinct was a third policy blocking links to spoke VNets. The four VNets on Azure DNS need those links, so I didn't write it.

## DR doesn't need its own zones

The 82 zones in the secondary region had no records, no links after the hotfix, and the region had no private endpoints. They were deleted. Private DNS zones are global; the resource group is only a container. A second set means duplicating every record forever, and a VNet can only see one of the two. When DR becomes real, link the existing central zones to the DR hub.

What DR actually lacks is a resolver: both DCs are in the primary region. I left it on the follow-up list as a separate item.

If I did this again I'd pin the zone list in the template and write the guardrails first. Police the zones and the zone groups with policy. The links are not worth policing.
