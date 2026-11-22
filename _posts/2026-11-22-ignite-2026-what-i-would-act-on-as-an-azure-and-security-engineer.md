---
title: "Ignite 2026: What I Would Act On as an Azure and Security Engineer"
date: 2026-11-22
categories: [Solution Advisory]
tags: [azure, ignite, security, networking, ai-agents]
description: "My filtered read of Ignite 2026 for people who run Azure, Microsoft 365 and security in production."
figure: "98 notes"
figure_note: "Radar notes in four days"
---

Ignite 2026 ran from 18 to 21 November and I wrote 98 short Radar notes while it was on. Nobody should read 98 notes, so this is the filtered version: what I would put on a team's backlog next week, ordered by how soon it bites. The full list lives on my [Ignite 2026 page](https://blog.obp.com.tr/ignite/2026/), and Microsoft's own summary is the [Book of News](https://news.microsoft.com/events/ignite/2026/book-of-news/).

One warning before the list. A lot of this is preview. I mark GA where the announcement said GA; everything else I would test in a lab subscription and keep away from production change windows.

## Things with a date or a config change attached

These are small, boring and the most likely to cause a ticket if ignored.

**Azure Functions OpenAI extension.** [Support ends on April 20, 2027](https://blog.obp.com.tr/posts/azure-functions-openai-extension-support-ends-on-april-20-2027/). The Learn page adds the part that catches people: preview extension bundle 4.60.0 and later no longer contains the extension. If an app on the preview bundle suddenly loses its OpenAI bindings after a host update, this is why. You can pin the range in `host.json` to buy time:

```json
{
  "version": "2.0",
  "extensionBundle": {
    "id": "Microsoft.Azure.Functions.ExtensionBundle.Preview",
    "version": "[4.*, 4.60.0)"
  }
}
```

Pinning does not extend support past the retirement date. Plan the move to the SDKs directly.

**AES-256 for SQL TDE.** [Symmetric AES keys on Key Vault Premium are GA](https://blog.obp.com.tr/posts/symmetric-aes-keys-on-azure-key-vault-premium-are-generally-available/) and [Azure SQL Database TDE now accepts AES-256 keys from Key Vault](https://blog.obp.com.tr/posts/azure-sql-database-tde-now-accepts-aes-256-keys-from-key-vault/). Two details from the docs matter more than the headline. Automatic rotation moves the protector to a newer version of the same key, so an RSA protector stays RSA forever unless you rotate it manually to a new AES key. And this is Azure SQL Database only; SQL Managed Instance still needs RSA. If you have an encryption standard that says "one key type everywhere", it now has an exception.

**Cross-subscription VM backup.** [One central vault can now back up VMs from other subscriptions](https://blog.obp.com.tr/posts/azure-backup-supports-cross-subscription-vm-backup-with-a-central-vault/). The vault and the VM still have to sit in the same tenant and the same region. Until now the vault had to live in the VM's subscription, which pushed everyone into one vault per subscription per region. For new landing zones I would now design the central model. Snapshot-tier restore stays inside the VM's own subscription, which is worth knowing before you promise a restore path to an auditor.

## Agents finally got identity and containment

This was the real theme of the week. If your organisation lets people run coding agents or Copilot agents, the security tooling finally has something to say about it.

Start with inventory. [Entra Agent ID now extends to discovered local AI agents](https://blog.obp.com.tr/posts/entra-agent-id-extends-to-discovered-local-ai-agents/), and Defender already lists local agents with their MCP servers and whether they auto-approve their own actions. [Defender runtime protection for local agents on Windows is GA](https://blog.obp.com.tr/posts/defender-runtime-protection-for-local-ai-agents-on-windows-is-ga/). On the governance side, Agent 365 added an [action center, agent map insights and MCP governance](https://blog.obp.com.tr/posts/agent-365-adds-action-center-agent-map-insights-and-mcp-governance/), [dynamic risk scoring from runtime signals](https://blog.obp.com.tr/posts/dynamic-agent-risk-in-agent-365-scores-agents-from-runtime-signals/), [FinOps for AI](https://blog.obp.com.tr/posts/agent-365-adds-finops-for-ai-with-cost-management-and-forecasting/) and [usage insights for Microsoft agents even without a license](https://blog.obp.com.tr/posts/agent-365-usage-insights-now-visible-for-microsoft-agents-without-a-license/). That last one is the cheap first step: look before you buy.

Containment came in several layers. [Windows process containers isolate and govern agents](https://blog.obp.com.tr/posts/windows-process-containers-isolate-and-govern-ai-agents-in-preview/), [Agent Grid adds Zero Trust network security for agents](https://blog.obp.com.tr/posts/agent-grid-preview-adds-zero-trust-network-security-for-ai-agents/), AKS got an [agent sandbox extension](https://blog.obp.com.tr/posts/agent-sandbox-cluster-extension-for-aks-is-in-public-preview/), and Edge for Business added [managed agent browsing](https://blog.obp.com.tr/posts/edge-for-business-adds-managed-agent-browsing-and-a-skills-recorder/). Purview previewed [Copilot DLP and controls for endpoint agents](https://blog.obp.com.tr/posts/purview-previews-better-labeling-copilot-dlp-and-controls-for-endpoint-agents/).

At the edge, the [AI security add-on for Azure Firewall Premium](https://blog.obp.com.tr/posts/ai-security-add-on-for-azure-firewall-premium-is-in-public-preview/) and the [AI bot ruleset for Front Door Premium WAF](https://blog.obp.com.tr/posts/ai-bot-ruleset-for-azure-front-door-premium-waf-is-in-public-preview/) are the two I would trial first, because both sit on products many of us already pay for.

My take: do the inventory now, even with preview tooling. The first report is always the useful one, because it shows agents nobody approved.

## Security operations and on-premises hardening

The [Integrated Security Operations Center is GA, with vulnerability shielding in preview](https://blog.obp.com.tr/posts/integrated-security-operations-center-is-ga-vulnerability-shielding-in-preview/), and Azure previewed [adaptive virtual patching](https://blog.obp.com.tr/posts/azure-adaptive-virtual-patching-previews-ai-orchestrated-zero-day-shielding/) for zero-day windows. [Microsoft Perception is GA with red, blue and green team agents](https://blog.obp.com.tr/posts/microsoft-perception-is-ga-with-red-blue-and-green-team-security-agents/), and [Codename MDASH](https://blog.obp.com.tr/posts/codename-mdash-agentic-code-security-system-is-in-preview/) previews agentic code security.

For the ones still running servers in a basement: [baseline security mode now targets on-premises Exchange, SharePoint and Skype servers](https://blog.obp.com.tr/posts/on-premises-baseline-security-mode-targets-exchange-sharepoint-and-skype-servers/). On endpoints, [Windows baseline protection and a new endpoint security platform arrived with Intune features](https://blog.obp.com.tr/posts/windows-baseline-protection-and-endpoint-security-platform-arrive-with-new-intune-features/). [Bastion can now review recorded privileged sessions with AI](https://blog.obp.com.tr/posts/azure-bastion-adds-ai-assisted-review-of-recorded-privileged-sessions/). A recording only helps if someone reviews it, and this makes that review shorter. Regulated teams should look at the [Sovereign Control Panel](https://blog.obp.com.tr/posts/sovereign-control-panel-previews-sovereignty-posture-monitoring-in-the-portal/).

## Networking

Network Security Perimeter got two features I have wanted: [service tags as inbound rules](https://blog.obp.com.tr/posts/network-security-perimeter-adds-service-tags-as-inbound-rules-in-preview/) and [perimeter links](https://blog.obp.com.tr/posts/network-security-perimeter-adds-perimeter-link-for-cross-perimeter-access/) between perimeters. Read the limitations first. The docs say Azure Storage does not support service tags as inbound rules and that some scenarios may appear to work and then fail. Both features also sit behind feature flags:

```bash
az feature register --namespace Microsoft.Network --name EnableServiceTagsInNsp
az feature register --namespace Microsoft.Network --name AllowNspLink
az provider register -n Microsoft.Network
```

Application Gateway had a busy week: [centralized user authentication and JWT validation](https://blog.obp.com.tr/posts/application-gateway-adds-centralized-user-authentication-and-jwt-validation/), a [next-gen elastic v2 architecture](https://blog.obp.com.tr/posts/application-gateway-v2-next-gen-elastic-architecture-is-in-public-preview/), a [confidential compute data plane](https://blog.obp.com.tr/posts/application-gateway-can-run-its-data-plane-in-confidential-compute/) and [advanced load balancing](https://blog.obp.com.tr/posts/application-gateway-adds-advanced-load-balancing-in-public-preview/). JWT validation at the gateway removes a lot of copy-pasted middleware from backends.

Also worth a look: [Azure Firewall for Containers](https://blog.obp.com.tr/posts/azure-firewall-for-containers-enters-public-preview/), [DDoS custom policy (GA)](https://blog.obp.com.tr/posts/azure-ddos-protection-custom-policy-is-generally-available/), DDoS coverage for [NAT Gateway StandardV2 IPs](https://blog.obp.com.tr/posts/azure-ddos-protection-now-covers-nat-gateway-standardv2-public-ips-in-preview/) and [peacetime telemetry](https://blog.obp.com.tr/posts/azure-ddos-protection-peacetime-telemetry-is-in-public-preview/), [ExpressRoute Direct link groups](https://blog.obp.com.tr/posts/expressroute-direct-adds-link-groups-in-public-preview/) and [Multicloud Interconnect GA with AWS and Google Cloud](https://blog.obp.com.tr/posts/azure-multicloud-interconnect-is-ga-with-aws-and-google-cloud-support/). For AI traffic, the [AI Gateway is GA as a standalone service](https://blog.obp.com.tr/posts/azure-ai-gateway-is-ga-as-a-standalone-managed-service/), the [Unified Model API in APIM is GA](https://blog.obp.com.tr/posts/unified-model-api-in-azure-api-management-is-generally-available/), and [APIM Premium v2 is in 35 regions](https://blog.obp.com.tr/posts/api-management-premium-v2-is-now-available-in-35-azure-regions/).

## Resilience, backup and storage

[Infrastructure Resiliency Manager is GA](https://blog.obp.com.tr/posts/azure-infrastructure-resiliency-manager-is-generally-available/), [zone resilience for VMs](https://blog.obp.com.tr/posts/zone-resilience-for-azure-vms-enters-public-preview/) and [App Service geo-redundancy](https://blog.obp.com.tr/posts/app-service-geo-redundancy-enters-public-preview/) are in preview, and [Azure Monitor health models are GA](https://blog.obp.com.tr/posts/azure-monitor-health-models-is-generally-available/). [Chaos Studio workspaces and the AKS extension reached GA](https://blog.obp.com.tr/posts/azure-chaos-studio-workspaces-and-the-aks-extension-reach-ga/), so a DR test can include a real fault instead of a slide.

For recovery points: [immutable disk snapshots](https://blog.obp.com.tr/posts/immutable-snapshots-for-azure-disk-storage-enter-public-preview/), [vaulted Cosmos DB backup (GA)](https://blog.obp.com.tr/posts/azure-backup-for-cosmos-db-is-generally-available-with-vaulted-backups/) and [soft delete in Compute Gallery (GA)](https://blog.obp.com.tr/posts/soft-delete-in-azure-compute-gallery-is-generally-available/). Gallery soft delete is the one I would switch on first; one bad cleanup script is enough to lose an image version.

[Session-based authentication for Blob and Data Lake](https://blog.obp.com.tr/posts/session-based-authentication-for-blob-and-data-lake-storage-is-in-public-preview/) is the storage item security teams should read twice. Sessions last five minutes, are scoped to one container and bound to the client IP. In the logs, a session's `GetBlob` entries carry a session ID instead of the caller identity, so your detections have to join back to the `CreateSession` entry to find who read the data.

## Compute, containers and data, in one breath

[Cobalt 200 Arm VMs are GA](https://blog.obp.com.tr/posts/cobalt-200-arm-vms-are-ga-heading-to-24-regions-by-year-end/), [Azure Linux 4.0 is GA for VMs](https://blog.obp.com.tr/posts/azure-linux-40-is-generally-available-for-vms-and-scale-sets/), [Windows Server 2028 is in preview](https://blog.obp.com.tr/posts/windows-server-2028-enters-public-preview/), and [VM adaptive placement](https://blog.obp.com.tr/posts/vm-adaptive-placement-reduces-deployment-failures-under-capacity-limits/) targets the capacity errors everyone has hit at a bad moment. On AKS: [Intel TDX for confidential node pools](https://blog.obp.com.tr/posts/aks-confidential-vm-node-pools-now-support-intel-tdx/) and the [kata-vm-isolation-v2 runtime class](https://blog.obp.com.tr/posts/aks-pod-sandboxing-adds-kata-vm-isolation-v2-runtime-class-in-preview/). [ARO hosted control planes are GA](https://blog.obp.com.tr/posts/azure-red-hat-openshift-gets-hosted-control-planes-in-ga/).

Data: [Azure HorizonDB is GA](https://blog.obp.com.tr/posts/azure-horizondb-postgresql-compatible-service-is-generally-available/), [PostgreSQL 19 is in preview](https://blog.obp.com.tr/posts/postgresql-19-arrives-in-public-preview-on-azure-database-for-postgresql/), [SQL MI next-gen General Purpose got zone redundancy](https://blog.obp.com.tr/posts/azure-sql-managed-instance-next-gen-gp-gets-zone-redundancy-and-flexible-memory/), and [MySQL servers can finally be renamed](https://blog.obp.com.tr/posts/azure-database-for-mysql-now-supports-renaming-a-server-in-ga/).

On the AI platform side, [Microsoft IQ is GA as a context layer](https://blog.obp.com.tr/posts/microsoft-iq-is-ga-as-the-context-layer-for-enterprise-agents/) and [Foundry models and agents can deploy to your own AKS clusters](https://blog.obp.com.tr/posts/foundry-models-and-agents-can-now-deploy-to-your-own-aks-clusters/). The second one matters for anyone whose data cannot leave their own network boundary.

## What I am doing on Monday

Three things, in this order. Search every Functions app for the OpenAI extension and check which bundle range it uses. List the SQL Database servers with RSA TDE protectors and decide whether a manual rotation to AES-256 belongs in the next key rotation. Open the Agent 365 usage insights, which now show Microsoft agents without a license, and see which agents are already running. The rest can wait for GA.