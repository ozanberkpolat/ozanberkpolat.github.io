---
title: Resolving Azure Site Recovery (ASR) Kernel Incompatibility on Linux
date: 2026-03-11 13:12:00 +0300
categories: [How To]
tags: [azure, linux, asr, kernel, troubleshooting]
description: A step-by-step guide to fixing the "Site recovery extension does not support the Linux kernel" error by managing kernel versions on Azure Ubuntu VMs.
---

## The Problem

While setting up **Azure Site Recovery (ASR)**, you might encounter the following error regarding kernel versioning:

> Site recovery extension does not support the Linux operating system kernel version running on the source machine.

Upon investigation, it is often found that the server has booted into a kernel version that is not yet supported by the ASR agent.

### Initial Investigation

Check the active kernel version:

```bash
uname -r
```

*Example Output:*
`6.17.0-1008-azure`

According to the **ASR Support Matrix**, the maximum supported version in this scenario might be **6.14.x**. Since the system is running **6.17**, the extension fails to initialize.

---

## Identifying Installed Kernel Versions

To list all kernel packages currently installed on your system:

```bash
dpkg -l | grep linux-image
```

*Example Output:*
```text
linux-image-6.17.0-1008-azure
linux-image-6.14.0-1017-azure
```

In this case:
- **6.17.0-1008-azure** → Unsupported by ASR.
- **6.14.0-1017-azure** → Supported by ASR.

Even though a compatible version exists, the system defaults to the newest (unsupported) kernel during boot.

---

## The Solution

In Azure Ubuntu images, GRUB settings can sometimes be overridden by `cloud-init` or meta-packages. The most reliable way to force the system to use the compatible kernel is to remove the unsupported version.

### 1. Remove the Unsupported Kernel

Execute the following command to remove the specific incompatible kernel package:

```bash
sudo apt remove linux-image-6.17.0-1008-azure
```

### 2. Update GRUB Configuration

After removal, update the bootloader configuration to ensure it points to the remaining supported kernel:

```bash
sudo update-grub
```

### 3. Reboot the Server

```bash
sudo reboot
```

---

## Verification

Once the server is back online, verify the active kernel:

```bash
uname -r
```

**Expected Output:**
`6.14.0-1017-azure`

> The ASR extension should now be able to install and communicate correctly with the Microsoft Entra-backed Azure recovery services.
{: .prompt-info }

---

## Optional: Preventing Automatic Kernel Upgrades

To prevent `apt` from automatically installing a newer, potentially unsupported kernel in the future, you can "hold" the kernel package:

```bash
sudo apt-mark hold linux-azure
```

> [!WARNING]
> Use this with caution. While it stabilizes ASR compatibility, it also prevents the automatic application of security patches provided in newer kernel releases. Ensure you have a manual patching schedule in place.
{: .prompt-warning }

## Conclusion

By following these steps, we have:
1. Identified the kernel version conflict.
2. Removed the incompatible **6.17 kernel**.
3. Stabilized the system on the **6.14 kernel**.
4. Ensured full compatibility for **Azure Site Recovery** operations.
