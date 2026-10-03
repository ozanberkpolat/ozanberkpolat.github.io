---
title: "Four Suspended SKUs on a Licensing Group Blocked Every New User"
date: 2026-10-25
categories: [Entra ID]
tags: [azure, entra-id, group-based-licensing, microsoft-graph, powershell]
description: "Old SKUs left on a license group after a renewal made every assignment fail for new members, and the admin center no longer showed them."
figure: "4 SKUs"
figure_note: "suspended, still on group"
---

Two people joined a customer at the end of September, one day apart. Both were added to the group that hands out Microsoft 365 E5. Neither of them got a single license. At that moment the E5 subscription had 15 free seats.

The cause was a step I had written down myself a few days earlier as "cleanup after the cutover, not urgent".

## The renewal that looked finished

The customer was moving from four separate subscriptions to one bundle. Until the end of September they had Office 365 E5, Enterprise Mobility + Security E5, Defender for Endpoint P2 and Microsoft 365 E5 Extra Features, all assigned together. The replacement was Microsoft 365 E5 with 180 seats. It had been in the tenant since the start of July, assigned to nobody.

When I checked on 23 September, 165 users were still on the old SKUs: 161 through one licensing group and 4 assigned directly. Graph gave the old subscriptions an end date of 29 September, 09:16 UTC. In the admin center's Licenses view, the negative "Available" number on each old product was exactly the number of users who would lose that product on the day.

I suggested two steps. First add the new SKU to the existing group, because that changes nothing for anyone and is easy to roll back. Then remove the old SKUs from the group. In my notes the second step went under "after the cutover, not urgent". For the 165 existing users that was true: once their new E5 was active, the old assignments did nothing for them.

The customer added Microsoft 365 E5 to the group on 28 September and the existing users moved over without errors. On 29 September the old subscriptions went to `Suspended` in Graph, which the admin center shows as Disabled. There was no grace period. One account that had not been put in the group yet lost Exchange, Office, Intune and Defender access when the old subscriptions were suspended, and stayed without them until it was added to the group.

## What the new users hit

The two new joiners were created on 29 and 30 September and added to the same group. A few days later the customer asked why onboarding had produced users without licenses.

Graph showed both users with their group licenses in `Error`. The group still carried six products. Two were live: Microsoft 365 E5 and 10-Year Audit Log Retention. The other four were the old SKUs, with zero active units. For Defender for Endpoint P2 the error was `CountViolation`, which means there was no seat to give. Microsoft 365 E5, with its 15 free seats, also showed `Error`, with the reason `Other`.

So one SKU without seats was enough to stop the whole set for a new member. I didn't find a Learn page that states this rule. It is what the license states on both users showed. The existing 165 users had no errors. Only new members were hit, so it took a few days to surface.

## Two portals, and neither would remove it

The customer's admin had User Administrator and tried to remove the old SKUs in the Microsoft 365 admin center. They weren't there. On the group's row only Microsoft 365 E5 appeared, so there was no Unassign option for the old products.

The Entra admin center showed all six products on the group, each with `State: Active`. That state is about the assignment to the group. It tells you nothing about the subscription behind it, and four of those subscriptions had been suspended since 29 September. Entra also refuses to edit: the blade says "Adding, removing, and reprocessing licensing assignments is only available within the M365 Admin Center".

> In Entra's group license list, `State: Active` only means the product is assigned to the group. Check the subscription status in Graph before you trust that list.
{: .prompt-warning }

Microsoft's [subscription lifecycle page](https://learn.microsoft.com/en-us/microsoft-365/commerce/subscriptions/what-if-my-subscription-expires) explains half of it. In the Disabled stage, "Admins can access the admin center, but can't assign licenses to users". It doesn't say the Licenses page stops listing the product. That part is my observation from this tenant: the admin center listed only the active products, and Entra listed everything but would not change it.

The role was never the issue. Microsoft documents that Groups Administrator, License Administrator or User Administrator is enough for [group-based licensing](https://learn.microsoft.com/en-us/microsoft-365/admin/manage/manage-group-licenses). If the role is eligible through PIM it has to be activated first, which is worth asking about whenever someone says "I have the role and it still fails".

## Removing them by SKU ID

The way out is Graph. [`Set-MgGroupLicense`](https://learn.microsoft.com/en-us/powershell/module/microsoft.graph.groups/set-mggrouplicense) adds and removes group licenses by SKU ID, so it doesn't matter whether any portal still lists the product. I only had read access in this tenant, so I sent the commands to the customer's admin:

```powershell
Connect-MgGraph -Scopes "LicenseAssignment.ReadWrite.All","Group.Read.All" -TenantId <tenant-id>

# E5 licensing group: remove the four suspended SKUs.
# Microsoft 365 E5 and 10-Year Audit Log Retention stay on the group.
Set-MgGroupLicense -GroupId <e5-license-group-id> -AddLicenses @() -RemoveLicenses @(
    "<office-365-e5-sku-id>",
    "<ems-e5-sku-id>",
    "<defender-endpoint-p2-sku-id>",
    "<m365-e5-extra-features-sku-id>"
)

# F3 licensing group: same problem, one suspended SKU.
Set-MgGroupLicense -GroupId <f3-license-group-id> -AddLicenses @() -RemoveLicenses @("<m365-f3-sku-id>")
```

Two details. Keep 10-Year Audit Log Retention on the group: that SKU was renewed under the same ID, so it sits next to the dead ones in a list, but it is live. And the F3 group had the same trap waiting, with a suspended F3 SKU still on it and no new member yet to trip over it.

After the removal the two users should get their licenses on the next processing run, or with Licenses > Reprocess on each user. At the time of writing I haven't seen the confirmation for both users, so I can't yet say the reprocess closed it.

Both new users also had an empty usage location. That was not the cause: Microsoft documents that users without a location inherit the tenant's location under group-based licensing. I would still set it during onboarding.

## Finding these groups before a new joiner does

What I want before any renewal is a list of every license group, every SKU on it, and how many seats are left. I put this together afterwards from the documented cmdlets and the patterns in Microsoft's [group-based licensing PowerShell examples](https://learn.microsoft.com/en-us/entra/identity/users/licensing-powershell-graph-examples). It only reads:

```powershell
Connect-MgGraph -Scopes "Directory.Read.All","Organization.Read.All"

$skus   = Get-MgSubscribedSku -All
$groups = Get-MgGroup -All -Property Id, DisplayName, AssignedLicenses |
    Where-Object { $_.AssignedLicenses }

foreach ($group in $groups) {
    foreach ($license in $group.AssignedLicenses) {
        $sku  = $skus | Where-Object { $_.SkuId -eq $license.SkuId }
        $free = if ($sku) { $sku.PrepaidUnits.Enabled - $sku.ConsumedUnits } else { 0 }
        if ($free -le 0) {
            [PSCustomObject]@{
                Group     = $group.DisplayName
                Sku       = if ($sku) { $sku.SkuPartNumber } else { "unknown: $($license.SkuId)" }
                Status    = $sku.CapabilityStatus
                FreeSeats = $free
            }
        }
    }
}
```

Every row is a group where the next new member will fail. A suspended SKU shows up with a [`capabilityStatus`](https://learn.microsoft.com/en-us/graph/api/resources/subscribedsku) other than `Enabled`. A healthy SKU that is simply full shows up too, and for a new joiner that is the same failure, so I want both in the list. Microsoft's examples note that a SKU disabled in the tenant can come back as unknown, which is why the script reports those as well. Run it in your own tenant and compare it with the Entra view before you act on it.

## Remove the old SKU while you can still see it

The fix was two commands. The real lesson is about timing. Remove the old SKU from the group in the Microsoft 365 admin center while the old subscription is still active. Once it goes Disabled, the admin center stops showing it and you are into Graph and SKU IDs.

Don't count on a grace window either. The lifecycle page says that since February 2026 the Expired stage no longer applies to license-based subscriptions bought directly through a Microsoft Customer Agreement. In this tenant users lost access on the end date itself.

> Renewal order: add the new SKU to the group, confirm users have it, then remove the old SKUs in the same change window, before the end date.
{: .prompt-tip }

I filed the removal under cleanup. It belongs in the migration itself, and two new joiners paid for my filing.