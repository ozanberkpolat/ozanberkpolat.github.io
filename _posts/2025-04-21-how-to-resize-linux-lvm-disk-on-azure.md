---
title: How to Resize Linux LVM Disk on Azure
date: 2025-04-21 09:00:00 +0300
categories: [How To]
tags: [linux, lvm, azure, storage, microsoft-entra]
description: A professional guide on expanding LVM partitions and XFS filesystems on Azure VMs without data loss.
---

In modern cloud infrastructures, managing disk space dynamically is a critical skill. This guide walks you through the process of expanding a **Logical Volume Manager (LVM)** partition on an Azure Linux VM. We will cover everything from the Azure Portal adjustments to the OS-level filesystem expansion.

## Prerequisites

Before proceeding, ensure your user has the necessary **Microsoft Entra** (formerly Azure AD) permissions to modify VM disk resources. 

> Before performing partition operations, it is highly recommended to take a snapshot of your managed disk.
{: .prompt-danger }

---

## Step 1: Azure Infrastructure Adjustment

The physical disk size must be increased at the Azure fabric level while the VM is in a deallocated state.

1. **Stop and Deallocate:** Shut down your VM via the Azure Portal. Ensure the status is **Stopped (deallocated)**.
2. **Resize Disk:** - Navigate to the **Disks** blade.
   - Select your target disk.
   - Go to **Size + performance**.
   - Update the size and click **Save**.

## Step 2: OS-Level Partition Modification

Once the disk is physically larger, we must inform the Linux kernel and the LVM layer.

### 1. Initial Access and Verification
Start the VM and connect via **Serial Console** or SSH. Switch to the root user:

```bash
sudo su -
```

Check the current storage state:

```bash
lsblk
pvs
lvs
```

### 2. Update the Partition Table
We will use `fdisk` to recreate the partition boundaries. 

```bash
fdisk /dev/sda
```

Inside the `fdisk` interactive prompt, follow these exact keystrokes:

| Key | Action | Note |
|:---|:---|:---|
| `p` | Print | Verify current partition layout |
| `d` | Delete | Choose partition `2` (does not delete data) |
| `n` | New | Create a new partition |
| `Enter` | Default | Use partition number `2` |
| `Enter` | Default | Use the default first sector |
| `Enter` | Default | Use the default last sector (full size) |
| `n` | No | **Do NOT** remove the existing signature |
| `w` | Write | Save changes and exit |

## Step 3: Expanding LVM and Filesystem

Now we expand the Physical Volume (PV), the Logical Volume (LV), and the XFS filesystem.

### 1. Resize Physical Volume
Inform LVM that the underlying partition `/dev/sda2` has grown:

```bash
pvresize /dev/sda2
```

### 2. Resize Logical Volume
We will extend the LV to the target size. Using the `-r` flag helps trigger the filesystem resize automatically for supported types.

```bash
lvresize -r -L 180G /dev/rootvg/homelv
```

### 3. Grow XFS Filesystem
If the filesystem didn't automatically expand, manually grow the XFS layer:

```bash
xfs_growfs /dev/rootvg/homelv
```

---

## Verification and Results

After completion, verify the new sizes using `vgs`, `lvs`, and `df -h`.

**Expansion Summary:**

* **Initial Physical Volume:** 63 GB  
* **Initial Logical Volume:** 1 GB  
* **Final Physical Volume:** 255 GB  
* **Final Logical Volume:** 180 GB  

> Ensure that your `/etc/fstab` entries remain correct if you added any new mount points during this process.
{: .prompt-info }