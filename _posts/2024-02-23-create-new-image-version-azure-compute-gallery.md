---
title: How to Create a New Version from an Existing Image in Azure Compute Gallery
date: 2024-02-23 12:00:00 +0300
categories: [How To]
tags: [azure, how to, compute gallery, golden image]
description: A step-by-step guide on how to update an existing Golden Image and create a new version within an Azure Compute Gallery.
---

In enterprise environments, maintaining up-to-date "Golden Images" is crucial for secure and efficient virtual machine deployments. Azure Compute Gallery makes it easy to manage your custom images and their versions across your organization. 

This guide walks you through the process of taking an existing image version, applying necessary updates, and saving it as a brand new version within your Compute Gallery.

## Step 1: Deploy a VM from the Latest Image Version

To update an image, you first need a running virtual machine based on the current latest version of that image.

1. Navigate to your **Azure Compute Gallery** in the Azure Portal.
2. Under the **Definitions** tab, select your target VM image definition (for example, `win2022-datacenter`).
3. Click on the **latest version** of that image definition to view its details.
4. From the top menu, click **+ Create VM** to deploy a new virtual machine using this specific image version.

## Step 2: Customize, Sysprep, and Deallocate

Once your VM is successfully deployed and running, it's time to prepare it with your new updates.

1. **Connect** to the newly created VM (via RDP or Azure Bastion).
2. **Apply Updates:** Install the latest OS updates, security patches, or any new software required for your new Golden Image.
3. **Sysprep the Machine:** After all changes are made, you must run the System Preparation tool (`sysprep`) to generalize the VM and shut it down. Run the tool and select the options to **Generalize** and **Shutdown**.
4. **Deallocate:** Go back to the Azure Portal, navigate to the VM's overview page, and click **Stop**. Wait until the VM status changes to **Stopped (deallocated)**.

> Running sysprep and generalizing the machine is mandatory for creating standard, reusable Windows VM images. Without this step, the captured image will not be usable for deploying new VMs.
{: .prompt-warning }

## Step 3: Capture the VM into the Compute Gallery

Now that the VM is generalized and properly deallocated, you can capture it as a new version.

1. On the VM's overview page in the Azure Portal, click the **Capture** button from the top menu.
2. Under the capture options, select the target Compute Gallery (if you only have one in the environment, it may be selected automatically).
3. In the **Gallery details** section, configure the following:
   * **Target Azure compute gallery:** Select your existing compute gallery.
   * **Operating system state:** Select **Generalized** (since you ran the sysprep command).
   * **Target VM image definition:** Choose the existing image definition where you want to add the new version.
4. In the **Version details** section:
   * **Version number:** Enter your new version number following the semantic versioning format (e.g., `0.0.2`).

## Step 4: Review and Verify

1. Click **Review + Create** at the bottom of the capture screen.
2. Once the Azure validation passes, click **Create**.
3. Azure will now process the capture and replicate the new image version according to your target region settings. 
4. After the deployment is complete, navigate back to your Compute Gallery and check the image definition. You will now see your new version (e.g., `0.0.2`) listed with a **Succeeded** provisioning state and automatically marked as the `(latest version)`.

Congratulations! You have successfully updated your golden image and created a new, deployable version in your Azure Compute Gallery.