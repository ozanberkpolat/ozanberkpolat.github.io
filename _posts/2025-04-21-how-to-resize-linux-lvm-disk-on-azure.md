---
title: How to Resize Linux LVM Disk on Azure
date: 2025-04-21 09:00:00 +0300
categories: [How To]
tags: [linux, lvm, azure, disk-management, xfs, microsoft-entra]
description: A step-by-step technical guide on expanding LVM-based Linux disks on Azure Virtual Machines without data loss.
---

Expanding disk capacity in a cloud environment is a common task, but when using **Logical Volume Manager (LVM)**, it requires a specific sequence of actions to ensure data integrity. In this guide, we will walk through resizing an Azure Managed Disk and reflecting those changes within the Linux OS.

[Image of Linux LVM architecture showing PV, VG, and LV]

## Prerequisites

- Ensure you have the necessary permissions in **Microsoft Entra ID** to manage Virtual Machine resources.
- Access to the **Azure Serial Console**.
- A full backup or snapshot of your disk is highly recommended before performing partition changes.

---

## Phase 1: Azure Portal Operations

Before the OS can see more space, the physical layer must be expanded.

1. **Stop and Deallocate:** You must stop the VM from the Azure Portal to change disk sizes. Ensure the status is **Stopped (Deallocated)**.
2. **Change Disk Size:** - Navigate to the **Disks** blade of your VM.
   - Select the target disk and go to **Size + performance**.
   - Increase the size and click **Save**.

## Phase 2: Operating System Configuration

After starting the VM, we need to redistribute the new space across the LVM layers.

### 1. Verification
Connect via **Serial Console** and switch to the root user:

```bash
sudo su -
```

List your current block devices and LVM status:

```bash
lsblk
pvs
lvs
```

### 2. Partition Resizing with `fdisk`
We need to redefine the partition boundaries for `/dev/sda`.

```bash
fdisk /dev/sda
```

Follow these exact steps within the `fdisk` prompt:
- **p**: List partitions.
- **d**: Delete the partition (usually number `2` for LVM). *Note: This does not delete the data.*
- **n**: Create a new partition.
- **Enter**: Use the default partition number (2).
- **Enter**: Use the default first sector.
- **Enter**: Use the default last sector (this picks up the new space).
- **n**: When asked to remove the signature, type **No**.
- **w**: Write changes and exit.

> If you accidentally remove the signature, the LVM metadata will be lost. Always select 'No' when prompted.
{: .prompt-warning }

### 3. Expanding the LVM Layers
Now, we inform the LVM management layer about the partition change.

**Resize the Physical Volume (PV):**
```bash
pvresize /dev/sda2
```

**Resize the Logical Volume (LV):**
We will use the `-r` flag to resize the underlying filesystem automatically.
```bash
lvresize -r -L 180G /dev/rootvg/homelv
```

**Grow XFS Filesystem:**
If the filesystem did not expand automatically with the previous command, use:
```bash
xfs_growfs /dev/rootvg/homelv
```

---

## Summary of Changes

By following this workflow, we successfully achieved the following expansion:

| Component | Before Extension | After Extension |
|:---|:---|:---|
| **Physical Volume (PV)** | 63 GB | 255 GB |
| **Logical Volume (LV)** | 1 GB | 180 GB |

Your Linux environment now has the additional capacity ready for use without a reboot.

> Always verify the final state using the `df -h` command to ensure the filesystem reflects the changes.
{: .prompt-tip }