---
sidebar_position: 10
title: Spam and virus protection
description: How RapidMX scans mail with rspamd and ClamAV, where each verdict sends a message, and how users' junk reports teach the spam filter.
---

# Spam and virus protection

Every message that reaches a RapidMX mailbox is checked for spam by [rspamd](https://rspamd.com) and for viruses by [ClamAV](https://www.clamav.net), both installed with the server. This page explains what happens to a message after it's scanned, what to do when users complain about junk, and how the spam filter learns from your users.

There's nothing to switch on: scanning is part of every deployment. The settings that exist are in the Helm chart, not the admin console, because they're about how the scanners run. What you do in the console is review what was held back (see [Quarantine and audit log](quarantine-and-audit-log.md)).

## Where a message goes

After scanning, each copy of an incoming message goes to one of three places:

| Verdict | Where it goes |
| --- | --- |
| A virus is found | **Quarantine**. It never appears in any folder or on any device. |
| ClamAV can't scan it (down, timed out, error) | **Quarantine**. A scanner outage never lets unscanned mail through. |
| rspamd says reject | **Junk Email** |
| rspamd says it's suspicious (for example "add header" or "rewrite subject") | **Junk Email** |
| rspamd can't be reached | **Junk Email**, so a person can still look at it rather than having it lost or delivered blind |
| Clean | **Inbox**, after which the person's own [rules](../user-guide/rules-and-automatic-replies.md) run |

ClamAV scans the whole message and each attachment separately. A message that would push a mailbox over its quota is also quarantined rather than dropped or stored over quota.

Mail people send is scanned too. A message that fails the scan isn't sent, and its sender is told it failed.

:::note
On a development install (`NODE_ENV` of `dev`, `development` or `test`), a scanner that can't be reached at all is treated as clean, and the server logs a warning. In production (any other `NODE_ENV`), a scanner outage fails closed as described above.
:::

## Blocked and safe senders

Each person keeps their own lists under **Settings → Blocked and safe senders** in the mail app:

- Mail from a **blocked** address or domain goes to Junk Email, whatever its spam score.
- Mail from a **safe** address is never sent to Junk Email for its spam score, but only when the message is authenticated (it carries a valid DKIM signature for the sender's domain). An unauthenticated message from a "safe" address isn't trusted, because the address could be forged.

Neither list ever releases a message that was quarantined for a virus or by policy.

## Reports teach the spam filter

When someone uses **Report junk**, **Report phishing** or **Not junk** in the mail app, RapidMX moves the message (to Junk Email, or back to the Inbox) and also teaches rspamd's classifier from it, so the filter gets better at telling your organization's wanted and unwanted mail apart. **Not junk** can also add the sender to the person's safe senders.

Things to know:

- **It takes a while to have an effect.** The classifier's opinion only counts towards a message's score once it has learned 200 messages of each kind, spam and not spam (`mail.rspamd.bayes.minLearns`, rspamd's own default). A fresh install starts with none, and reports are the only lessons it gets, so a small organization reaches that slowly. Lower the number knowingly.
- **Encrypted messages are never used for learning.**
- **What it learned is kept in Redis.** The bundled Redis doesn't keep its data on a persistent volume by default, so the learning is lost if its pod is deleted. Turn on `redis.master.persistence.enabled` to keep it.
- **A failed lesson doesn't fail the report.** The message is still moved; the report just notes the classifier wasn't taught.
- **Turn learning off** with `mail.rspamd.learn.enabled=false` if you don't want it. Reports still move and mark messages.

Every report is written to the [audit log](quarantine-and-audit-log.md) as `message.reported`, with the kind of report, the sender's address and whether the classifier learned from it. Filter the audit log's **Action** by `message.reported` to see them; a **phishing** report (`"kind": "phishing"` in the entry's details) is the one to watch for. RapidMX has no separate alert for these.

## Settings in the Helm chart

| Value | What it does | Default |
| --- | --- | --- |
| `mail.rspamd.controller.password` | The password for rspamd's controller, which the server uses to teach it. Generated once and kept if you don't set it. | generated |
| `mail.rspamd.controller.existingSecret` | Read that password from a Secret you manage instead | |
| `mail.rspamd.bayes.minLearns` | Messages of each kind to learn before the classifier's verdict counts | `200` |
| `mail.rspamd.bayes.redis.db` | The Redis database the classifier's statistics are kept in | `1` |
| `mail.rspamd.bayes.redis.servers` | Use another Redis for them | the bundled Redis |
| `mail.rspamd.bayes.extraConfig` | Extra rspamd classifier settings | |
| `mail.rspamd.learn.enabled` | Teach rspamd from users' reports | `true` |

The full list is in the [Helm chart reference](../operations/helm-chart.md). For a scanner that isn't healthy, see [Troubleshooting](../operations/troubleshooting.md) and the **Diagnostics** page ([Monitoring](../operations/monitoring.md)).
