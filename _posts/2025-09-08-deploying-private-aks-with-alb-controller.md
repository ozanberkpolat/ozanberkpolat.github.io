---
title: Deploying a Private AKS Cluster with Application Gateway for Containers (ALB)
date: 2025-09-08 12:00:00 +0300
categories: [How To]
tags: [azure, kubernetes, azure cli]
description: A comprehensive step-by-step guide on deploying a private Azure Kubernetes Service (AKS) cluster with a custom Private DNS Zone and setting up the Application Gateway for Containers (ALB Controller).
---

When deploying enterprise-grade infrastructure on Azure, security and traffic management are top priorities. In this guide, we will walk through the process of deploying a private Azure Kubernetes Service (AKS) cluster utilizing a Private DNS Zone, and subsequently configuring the Application Gateway for Containers (ALB Controller) for modern layer 7 load balancing.



## Prerequisites

Before diving into the deployment, there are a couple of important environment-specific prerequisites to address:

1. **User Assigned Managed Identity:** You must create a User Assigned Managed Identity and grant it at least the **Reader** role on your specific Private DNS Zone (e.g., `privatelink.switzerlandnorth.azmk8s.io`).
2. **Public IP Exemption:** In many enterprise environments, there are strict governance policies applied at the tenant level. 

> **Note:** If your deployment tenant has an Azure Policy restricting the creation of Public IPs, you must create an **exemption** for this specific deployment to proceed successfully.

---

## 1. Deploy Kubernetes Cluster with Private DNS Zone

First, we will set up the foundational private AKS cluster. We are utilizing variables to make the script reusable for your specific environment.

```bash
# Define your environment variables
SUBSCRIPTION_NAME="<Your-Subscription-Name>"
RG_NAME="rg-my-aks-cluster"
AKS_NAME="aks-my-private-cluster"
NODE_RG_NAME="rg-my-aks-nodes"
VNET_SUBNET_ID="/subscriptions/<Sub-ID>/resourceGroups/<VNet-RG>/providers/Microsoft.Network/virtualNetworks/<VNet-Name>/subnets/<Subnet-Name>"
PRIVATE_DNS_ZONE_ID="/subscriptions/<Sub-ID>/resourceGroups/<DNS-RG>/providers/Microsoft.Network/privateDnsZones/privatelink.<region>.azmk8s.io"
IDENTITY_ID="/subscriptions/<Sub-ID>/resourcegroups/$RG_NAME/providers/Microsoft.ManagedIdentity/userAssignedIdentities/myAKSIdentity"

# Set the active subscription
az account set --subscription $SUBSCRIPTION_NAME

# Create the Private AKS Cluster
az aks create \
  --resource-group $RG_NAME \
  --name $AKS_NAME \
  --node-count 1 \
  --generate-ssh-keys \
  --network-plugin azure \
  --vnet-subnet-id $VNET_SUBNET_ID \
  --disable-public-fqdn \
  --enable-private-cluster \
  --private-dns-zone $PRIVATE_DNS_ZONE_ID \
  --assign-identity $IDENTITY_ID \
  --node-resource-group $NODE_RG_NAME
```

---

## 2. Deploy Application Gateway for Containers ALB Controller

With our cluster running, we can proceed to install and configure the ALB controller.

### 2.1 Enable OIDC and Workload Identity

To securely connect the ALB Controller to Azure resources without managing secrets, we use Microsoft Entra Workload ID.

```bash
az aks update \
  --resource-group $RG_NAME \
  --name $AKS_NAME \
  --enable-oidc-issuer \
  --enable-workload-identity \
  --no-wait
```

### 2.2 Create and Federate the Managed Identity

Next, we create a user-assigned managed identity specifically for the ALB controller and federate it.

```bash
IDENTITY_RESOURCE_NAME='azure-alb-identity'

echo "Creating identity $IDENTITY_RESOURCE_NAME in resource group $RG_NAME"
az identity create --resource-group $RG_NAME --name $IDENTITY_RESOURCE_NAME

# Wait briefly to allow Entra ID replication
echo "Waiting 60 seconds to allow for replication of the identity..."
sleep 60
```

### 2.3 Role Assignments

The ALB identity needs specific permissions over the AKS node resource group and the ALB subnet.

```bash
MC_RESOURCE_GROUP=$(az aks show --name $AKS_NAME --resource-group $RG_NAME --query "nodeResourceGroup" -otsv | tr -d '\r')
mcResourceGroupId=$(az group show --name $MC_RESOURCE_GROUP --query id -otsv)
principalId=$(az identity show -g $RG_NAME -n $IDENTITY_RESOURCE_NAME --query principalId -otsv)

# Update this with your actual ALB Subnet ID
ALB_SUBNET_ID='/subscriptions/<Sub-ID>/resourceGroups/<VNet-RG>/providers/Microsoft.Network/virtualNetworks/<VNet-Name>/subnets/<ALB-Subnet-Name>'

# AppGw for Containers Configuration Manager role
az role assignment create --assignee-object-id $principalId --assignee-principal-type ServicePrincipal --scope $mcResourceGroupId --role "fbc52c3f-28ad-4303-a892-8a056630b8f1"

# Network Contributor permission 
az role assignment create --assignee-object-id $principalId --assignee-principal-type ServicePrincipal --scope $ALB_SUBNET_ID --role "4d97b98b-1d4f-4787-a291-c67834d212e7"

# Federate the credential
AKS_OIDC_ISSUER="$(az aks show -n "$AKS_NAME" -g "$RG_NAME" --query "oidcIssuerProfile.issuerUrl" -o tsv)"
az identity federated-credential create \
  --name "azure-alb-identity" \
  --identity-name "$IDENTITY_RESOURCE_NAME" \
  --resource-group $RG_NAME \
  --issuer "$AKS_OIDC_ISSUER" \
  --subject "system:serviceaccount:azure-alb-system:alb-controller-sa"
```

---

## 3. Install the ALB Controller via Helm

Time to deploy the controller onto the cluster.

```bash
HELM_NAMESPACE='default'
CONTROLLER_NAMESPACE='azure-alb-system'

# Get AKS credentials
az aks get-credentials --resource-group $RG_NAME --name $AKS_NAME

# Install via Helm
helm install alb-controller oci://[mcr.microsoft.com/application-lb/charts/alb-controller](https://mcr.microsoft.com/application-lb/charts/alb-controller) \
  --namespace $HELM_NAMESPACE \
  --version 1.2.3 \
  --set albController.namespace=$CONTROLLER_NAMESPACE \
  --set albController.podIdentity.clientID=$(az identity show -g $RG_NAME -n $IDENTITY_RESOURCE_NAME --query clientId -o tsv)
```

**Verify the Installation:**

```bash
kubectl get pods -n azure-alb-system
```

---

## 4. Create the Application Gateway for Containers

### 4.1 Define the Kubernetes Namespace

```yaml
apiVersion: v1
kind: Namespace
metadata:
  name: alb-dev-gateway
```

### 4.2 Deploy the ApplicationLoadBalancer Resource

We link our newly created ALB controller to the designated subnet. 

```yaml
apiVersion: alb.networking.azure.io/v1
kind: ApplicationLoadBalancer
metadata:
  name: ainext-lb
  namespace: alb-dev-gateway
spec:
  associations:
  - /subscriptions/<Sub-ID>/resourceGroups/<VNet-RG>/providers/Microsoft.Network/virtualNetworks/<VNet-Name>/subnets/<Gateway-Subnet-Name>
```

*(Note: Apply the above manifests using `kubectl apply -f <filename.yaml>`)*

### 4.3 Validation

Finally, monitor the provisioning state and check your gateway resource:

```bash
# Watch the status of the load balancer
kubectl get applicationloadbalancer ainext-lb -n alb-dev-gateway -o yaml -w

# Check the gateway details
kubectl get gateway -n alb-dev-gateway -o yaml
```

With these configurations in place, your private AKS setup is now fully capable of leveraging Azure's next-generation Application Gateway for Containers!