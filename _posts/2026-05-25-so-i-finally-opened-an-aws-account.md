---
title: "So I Finally Opened an AWS Account"
date: 2026-05-25 09:00:00 +0300
categories: [AWS, Cloud]
tags: [aws, terraform, azure, multi-cloud, serverless, iac]
description: "An Azure-native consultant's honest first impressions of AWS - through a serverless URL shortener and a Terraform module library."
---

## Some Background

There's a specific kind of itch that engineers get when they hear about infrastructure news in their own backyard. For me, it was the announcement that AWS had launched a Local Zone in Istanbul. I've been working on Azure for years - I know its strengths, its quirks, its naming conventions - and something about that news made me put down the remote and open a terminal.

This isn't a post about a finished product. It's about the beginning of something: learning AWS, comparing it honestly to Azure, and taking the first steps toward becoming a vendor-agnostic multi-cloud solutions consultant. The URL shortener I'll mention later is a vehicle for that, not the destination.

---

Last year, a friend and I made a challenge. He would master Terraform, I would master Bicep, and at some point we'd switch and teach each other everything we'd learned. The kind of plan that sounds great over coffee and quietly stalls when life accelerates.

Life accelerated - fast. On December 15th I started a new job. On December 19th I became a father. Four days apart. The challenge didn't die, it just got buried under things that mattered more. Then on May 20th, AWS announced the general availability of its Istanbul Local Zone, and I finally had both a reason and a quiet evening to get back to it.

I had a clear goal going in: **understand AWS well enough to compare it honestly to Azure, and eventually advise on both without a bias toward either**. Not just deploy things, but understand *why* the platforms make the choices they make - where they converge, and where they genuinely diverge in ways that matter for real decisions.

---

## Starting with the Foundation

The first thing I did was build a Terraform module library. If I was going to explore AWS seriously, I wanted to do it in a structured way - reusable modules, consistent patterns, something I could build on rather than throw away.

On the **Azure side**, I'd already been working with [Azure Verified Modules (AVM)](https://azure.github.io/Azure-Verified-Modules/) - Microsoft's curated, opinionated Terraform module library. Sensible defaults, encryption and managed identities wired in from the start, well-maintained. As a first real project I deployed a hub-and-spoke network topology: a hub VNet in West Europe with Bastion and Gateway subnets, two spoke VNets for prod and dev, bidirectional peering, NSGs per subnet, and a dev VM with auto-shutdown.

On the **AWS side**, I started building equivalent modules - VPC, EC2, Lambda, DynamoDB, IAM, CloudWatch - and putting together a hub-and-spoke project there too. The process of building both in parallel is genuinely instructive. You start to see which concepts map directly across clouds and which ones are platform-native ideas with no clean equivalent on the other side.

---

## The Experiment: A Serverless URL Shortener

For a hands-on experiment with AWS's serverless stack, I needed a project. It had to be simple enough to implement in evenings after work, but complex enough to actually touch multiple services in a meaningful way. A URL shortener fits that brief perfectly - it's not a production-ready application, and it was never meant to be. It's two API endpoints, a database lookup, and a frontend. Simple enough that the infrastructure is the interesting part, not the business logic.

The shortener itself is two Lambda functions (create a short code, redirect to the original URL), a DynamoDB table, an API Gateway HTTP API, and a static frontend served from S3 behind CloudFront. Everything deployed with Terraform, with separate `dev` and `prod` environment configs.

It works - but that's almost beside the point. The point was to go through the motions: write the IAM policies, wire up the API Gateway integration, handle CORS between the frontend and the API, figure out why CloudFront was silently blocking POST requests (spoiler: an overly broad cache behavior with `allowed_methods = ["GET", "HEAD"]`). These are the kinds of things you only learn by doing.

Here's a surface-level comparison of every AWS service I used and its Azure counterpart:

| Layer | AWS | Azure | AWS Pros | AWS Cons | Azure Pros | Azure Cons |
|---|---|---|---|---|---|---|
| **Serverless compute** | Lambda | Azure Functions | Mature ecosystem, granular IAM per function, arm64/Graviton pricing | More resources to wire up explicitly (role, log group, permission) | Less ceremony for simple triggers, good VS Code integration | Less visibility into underlying wiring |
| **NoSQL store** | DynamoDB | Cosmos DB | Simple pricing model, TTL built-in, generous permanent free tier | Single-region by default, limited query flexibility without GSIs | Multi-model (SQL, Mongo, Cassandra APIs), global distribution as a first-class feature | Can get expensive fast at scale, more complex pricing |
| **API layer** | API Gateway HTTP API v2 | API Management | ~70% cheaper than REST API, low latency, native CORS config | Two API versions (v1/v2) with different feature sets can be confusing | Rich policies engine, built-in developer portal, versioning | Heavyweight for simple use cases, slower cold start on consumption tier |
| **CDN / edge** | CloudFront | Azure Front Door | Global PoP coverage, tight S3/Lambda integration, free tier for 12 months | Cache behavior config can be unintuitive | Front Door has WAF + load balancing in one product | CDN Classic is being retired; Front Door is the successor but pricier |
| **Static hosting** | S3 + CloudFront | Azure Blob + Static Web Apps | Flexible, composable, OAC for private bucket access | No built-in CI/CD pipeline for static sites | Static Web Apps has built-in GitHub Actions deployment, free SSL | Less control over CDN behavior |
| **Observability** | CloudWatch | Azure Monitor | Logs, metrics, and alarms in one place, Lambda integration is automatic | Insights query language has a learning curve, dashboards feel dated | KQL is powerful once you know it, Application Insights DX is excellent | KQL learning curve, can get expensive at high log volume |
| **IaC** | Terraform AWS provider | Terraform AzureRM / Bicep | Stable, well-documented, large community | No curated AVM equivalent - more decisions from scratch | Azure Verified Modules (AVM) give opinionated, secure defaults out of the box | AVM is Terraform-only; Bicep has its own module registry (less mature) |
| **Identity / access** | IAM | Microsoft Entra ID + Managed Identities | Fine-grained, resource-level policies, inline and managed policies | Steep learning curve, easy to misconfigure, no Resource Group–level scope | Managed Identities are elegant, RBAC at any scope level | Entra ID licensing can be complex for advanced features |

---

## First Impressions: AWS Through Azure Eyes

After a few weeks of hands-on time, here's where my head is at - not definitive conclusions, just honest first impressions.

**The mental model takes adjustment.** Azure's hierarchy - Subscription → Resource Group → Resource - maps closely to how teams think about ownership, cost, and access. In AWS, the account boundary is the primary isolation unit and IAM is the primary access control layer. Both models work, but they reward different organizational habits. Coming from Azure, I kept looking for the Resource Group equivalent and had to consciously unlearn that instinct.

**Lambda and Functions are more similar than different at the code level.** The gap is in the surrounding ecosystem. API Gateway + Lambda involves wiring up several explicit resources; Azure Functions can feel lower-friction for simple cases. But I've come to appreciate the explicitness of the AWS model - when Terraform plans your infrastructure, you see every permission, every integration, every route. Less magic means fewer surprises.

**DynamoDB vs Cosmos DB is a real philosophical difference.** Both are managed NoSQL, but Cosmos DB is more opinionated about global distribution and consistency models as first-class concepts. DynamoDB's on-demand pricing and TTL-based expiry clicked for me faster than I expected - probably because I was building something lightweight.

**Terraform on AWS feels more like assembly.** On Azure, AVM gives you a well-tested, opinionated starting point. On AWS, the official provider is excellent but the higher-level module ecosystem is less curated. You make more decisions from scratch, which is educational but also means more surface area for mistakes. Both are valid approaches - just different tradeoffs.

**The free tier is genuinely generous.** Lambda at 1 million requests per month free permanently, DynamoDB at 25 RCU/WCU free permanently - for a learning environment and showcase project, the cost is zero. That removes a lot of friction from experimentation.

> The AWS permanent free tier is a meaningful advantage for anyone building a lab or learning environment. You can iterate without a billing surprise at the end of the month.
{: .prompt-tip }

---

## Why This Matters to Me

The Istanbul Local Zone wasn't just a news item. It was a signal that AWS is investing in proximity to Turkish users - which is directly relevant to clients and employers operating in this market. Being able to say "here's what AWS offers locally, here's how it compares to Azure's presence, and here's how you'd architect for each" is a concrete, valuable capability.

But more broadly, I've come to believe that the most useful thing a cloud architect can offer isn't deep expertise in one platform - it's the ability to read a requirement and recommend the right tool without starting from a vendor preference. That takes real time on both sides, not just certifications.

This is the beginning of that. The module library will grow. The projects will get more complex. Next up: container workloads, managed Kubernetes (EKS vs AKS), and a proper look at identity federation across clouds.

The challenge with my friend never officially happened. But I think I ended up learning what I was supposed to learn from it anyway - just on my own schedule, and with a better reason.

---


*Here it is -> [Snip](https://dlfq8gs89k9ue.cloudfront.net/).*

*Made with ❤️ by OBP*
