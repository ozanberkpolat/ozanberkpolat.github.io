---
title: "An OS Disk Snapshot Is Not a Rollback When LVM Spans Two Disks"
date: 2026-11-01
categories: [Disaster Recovery]
tags: [azure, linux, lvm, snapshots, rhel]
description: "A test clone built from an OS disk snapshot went straight to emergency mode because the root volume group continued on a data disk."
figure: "15 disks"
figure_note: "one server's real rollback set"
---

In October I was helping a customer move a group of RHEL 8.6 servers to 8.10. Before the first command on the pilot server I took an incremental snapshot of its OS disk. Only the OS disk. `dnf update` writes to `/`, `/usr`, `/boot` and `/etc`, the application data lives on data disks, so I didn't think the data disks had anything to do with it.

Later that day the customer reported a repository problem on that server and I wanted to reproduce it somewhere safe. The plan was a throwaway VM built from that same OS disk snapshot, in the same subnet, with the upgrade run there first. The data disk was off limits for the test.

That snapshot turned out to be the least useful thing I made all day.

## The clone that wouldn't boot

Building the clone was routine: a managed disk from the snapshot, a NIC in the same subnet with a dynamic IP, and a VM of the same size with that disk as its OS disk and no data disks. The only friction was a custom deny policy that requires governance tags on every VM. Its error message listed three tags. The policy definition wanted a fourth one that the message never mentioned.

Then boot diagnostics showed this:

```text
[ TIME ] Timed out waiting for device dev-mapper-rootvg-optlv.device
[DEPEND] Dependency failed for /opt.
[DEPEND] Dependency failed for Local File Systems.
You are in emergency mode.
Cannot open access to console, the root account is locked.
```

The volume group `rootvg` was spread over two physical volumes: `/dev/sda2` on the OS disk (63 GB) and a second PV on the data disk (64 GB). Root, `/boot`, `/usr`, `/var`, `/home`, `/tmp` and swap were all on the OS disk and mounted fine. `optlv`, the 88 GB logical volume behind `/opt`, had its extents on the data disk. No data disk, no `optlv`. `/opt` was a normal fstab entry without `nofail`, so systemd gave up on `Local File Systems` and dropped into emergency mode.

Then the second layer. Emergency mode asks for the root password, and root was locked. The serial console showed me the prompt and refused me in the same screen.

Because the system never reached multi-user, the Azure Linux agent never started either: `agentStatus: Not Ready`, `vmAgentVersion: Unknown`. Run Command, the VMAccess password reset and every other extension-based path depend on that agent. All of them were closed.

The Microsoft Learn article on [fstab boot errors](https://learn.microsoft.com/troubleshoot/azure/virtual-machines/linux/linux-virtual-machine-cannot-start-fstab-errors) lists "an entry exists for an unattached device without the `nofail` option" as one of the common causes. A partial clone produces exactly that. The fstab is correct for the original server. The clone is simply missing a disk.

> With root locked and the guest agent waiting for a boot that never finishes, the only ways in are GRUB over the serial console or an offline repair from another VM. Decide which one you will use before you need it.
{: .prompt-warning }

## Getting back in

The first option was the serial console: catch the GRUB menu, append `rd.break enforcing=0` to the kernel line, remount `/sysroot` read-write, chroot and edit fstab. It works without the root password, but it is manual work in a browser console against a boot timer.

I went with the offline route. A small helper VM (B2s, Ubuntu, same subnet) with the clone's OS disk attached to it as a data disk. On the helper only half of `rootvg` is present, so the volume group has to be activated in partial mode before anything can be mounted:

```bash
# On the helper VM, with the clone's OS disk attached
vgchange -ay --activationmode partial
mount /dev/mapper/rootvg-rootlv /mnt

cp /mnt/etc/fstab /mnt/etc/fstab.bak
# add nofail to every entry except comments and the root filesystem
awk '/^#/ || NF<4 {print; next} $2=="/" {print; next} {if ($4 !~ /nofail/) $4=$4",nofail"; print}' \
  /mnt/etc/fstab.bak > /mnt/etc/fstab
```

After that I deleted the helper and recreated the test VM with the repaired disk as its OS disk. Halfway through the rebuild my PIM activation expired and the deployment failed:

```text
AuthorizationFailed: ... does not have authorization to perform action
'Microsoft.Resources/deployments/write'
```

Re-activating fixed it, with about a minute of waiting for the role to apply. If your elevation window is short, this kind of repair eats it quickly.

With `nofail` in place the clone booted, `/opt` stayed empty, the agent reported Ready and Run Command worked again. The upgrade itself was uneventful after all that: 536 packages, a reboot into the 8.10 kernel, nothing left in `dnf check-update`. The blanket `nofail` change only ever went onto the throwaway clone. The real server's fstab was not touched.

If building a helper VM by hand is not an option, the same Learn article describes `az vm repair repair-button --button-command 'fstab'`. It creates a temporary repair VM and a copy of the OS disk, then comments out data file system entries that aren't needed for boot. I did not try it against a half-present volume group, so I can't say how it handles this case.

## What it said about the rollback plan

The clone was only a test. The uncomfortable part was what it said about my rollback point. The only snapshot from before the work started was that OS disk snapshot. Restored on its own into a new VM, it would land in the same emergency mode. On these servers the operating system is not one disk. `rootvg` lives across the OS disk and a data disk, so the rollback unit is both disks, taken together.

The next day, before the real upgrade on the pilot server, I snapshotted both:

| Disk | Size | Snapshot SKU | Taken at |
|---|---|---|---|
| Data disk | 64 GB | Standard_LRS | 15:56:41 |
| OS disk | 64 GB | Standard_ZRS | 15:57:13 |

Thirty-two seconds apart. Nothing changed the LVM layout in between, so for an OS rollback the pair is good enough.

The database server that came next had 15 disks: the OS disk and 14 data disks, seven of them 2 TB Oracle data disks. All 15 incremental snapshots succeeded, and the set took from 17:14:33 to 17:18:14, about four minutes. Every snapshot came from a running system, so each one is crash-consistent on its own and the set spans four minutes. For rolling back the OS upgrade that is fine: you restore the OS disk and the data disk that carries the rest of `rootvg`, and the Oracle data was never touched. If the database itself has to go back to that point too, the Oracle disks need a fresh snapshot after the database is shut down.

The four-minute spread is the part that [VM restore points](https://learn.microsoft.com/azure/virtual-machines/virtual-machines-create-restore-points) address. In crash-consistent mode a restore point captures "a write-order-consistent snapshot of all disks", and disks you don't need can be excluded. Check the limits first: crash consistency is not supported for Ultra Disks, Premium SSD v2, write-accelerated disks or Azure Boost sizes, and the Azure CLI page still labels the mode as preview.

```bash
# Restore point in an existing restore point collection
az restore-point create \
  --resource-group <resource-group> \
  --collection-name <collection-name> \
  --name pre-upgrade \
  --consistency-mode CrashConsistent
```

## One snapshot chain, one SKU

One more thing from that day that I could not find in the documentation. The first OS disk snapshot had been taken in the portal and was Standard_ZRS. That matches the [incremental snapshot page](https://learn.microsoft.com/azure/virtual-machines/disks-incremental-snapshots): incremental snapshots use ZRS automatically where the region supports it.

My script asked for Standard_LRS on the next incremental snapshot of the same disk, and Azure refused it. The data disk, which had no earlier snapshot, accepted LRS without complaint. The only difference was the existing ZRS snapshot on the OS disk. Retrying the OS disk as ZRS worked.

The same Learn page says you can override the default redundancy but recommends against it. Its restrictions list does not mention that one disk's incremental chain apparently sticks to one SKU. Leaving the default alone would have avoided the retry.

## What to look at before you trust an OS disk snapshot

The runbook for the remaining servers now has two lines in its pre-check list that were not there before: snapshot every disk that carries part of `rootvg`, together, right before the change; and a note that root is locked, so emergency mode is not a way back in.

The evidence had been in front of me the whole time. `df -h` on the pilot server showed `/opt` as `/dev/mapper/rootvg-optlv`, 89G, in the same volume group as `/`, on a VM whose OS disk is 64 GB. A logical volume larger than the OS disk cannot live only on the OS disk. Before calling an OS disk snapshot a rollback, look at where the root volume group's physical volumes actually are. If any of them is on a data disk, that data disk belongs in the snapshot set.