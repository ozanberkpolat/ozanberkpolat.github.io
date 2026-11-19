---
title: "AI Bot Ruleset for Azure Front Door Premium WAF Is in Public Preview"
date: 2026-11-19
categories: [News, "Security"]
tags: ["azure", "ignite 2026", "front door", "waf", "bot protection"]
---

Azure Front Door Premium WAF now has an **AI bot ruleset** in public preview. AI crawlers and agents visit sites for different reasons, and you may want to allow some and block others. Robots.txt only works when the bot chooses to obey it, so it does not enforce anything. A WAF ruleset gives you enforcement at the edge.

Web platform owners, security engineers and anyone running public content on Front Door Premium should look at this. It matters most if you want to let search or assistant agents in but keep training crawlers out.

To act, enable the ruleset on a non-production WAF policy first, run it in detection mode, and review which AI bots hit your site. Then decide which categories to allow or block before switching to prevention mode. Expect preview limits, so check the documentation before relying on it for production.

[Read the announcement](https://azure.microsoft.com/updates?id=581604)