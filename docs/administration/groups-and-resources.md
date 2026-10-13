---
sidebar_position: 4
title: Groups and resources
description: Alias addresses, distribution lists, shared mailboxes, and room and equipment mailboxes that accept bookings on their own.
---

# Groups and resources

Not every address belongs to one person. A team wants `sales@example.com` to reach everyone in sales; the front desk wants several people to answer `hello@example.com` from one inbox; the office wants meeting rooms that people can book from their calendar. RapidMX has a tool for each:

| You want | Use |
| --- | --- |
| A second address for the same person or list | An [alias address](#aliases), or an [alias domain](domains.md#alias-domains) |
| One address that delivers a copy to several people | A [distribution list](#distribution-lists) |
| One inbox that several people read and answer from | A [shared mailbox](#shared-mailboxes) |
| A room or piece of equipment people can book | A [resource mailbox](#rooms-and-equipment) |

## Aliases

An alias is an extra address that delivers to an existing mailbox or distribution list. A mailbox's page in the admin console shows its **Alias addresses**, and a distribution list's page shows its own.

There are two kinds:

- **Alias addresses** on one mailbox or list, such as `j.doe@example.com` for `jane@example.com`. The admin console doesn't have a form for adding these yet; they can be set through the REST API, which accepts them as administrative fields of a mailbox or list.
- **Alias domains**, which give every address on one domain a twin on another (`jane@example.org` for `jane@example.com`). These are set up under **Domains**. See [Alias domains](domains.md#alias-domains).

Aliases must be on one of your domains, like any other address.

## Distribution lists

A distribution list is an address that delivers a copy of each message to every member. Members can be mailboxes on this server, other distribution lists (lists can be nested), or addresses at other organizations, whose copy is sent on to them.

### Create a list

1. Open **Distribution Lists** and choose **+ New distribution list**.
2. Enter the **Primary SMTP address** (for example `team@example.com`), a **Name**, and optionally a **Description**. The address must be on one of your verified domains and can't already be used by a mailbox or another list.
3. Choose **Create distribution list**. The list's page opens.
4. Under **Members**, type each address in **Member address to add** and choose **Add**. Choose **Remove** beside a member to take them off.

### Restrict senders

A list can be set to accept mail only from its own members. Its page shows this as **Restrict senders**: **Only members may send**, or **No**.

Members are recognized by a verified DKIM signature, as reported by your mail server's `Authentication-Results` header. That needs the server's trusted authserv id to be set (`mail.trustedAuthservId` in the Helm chart, which defaults to Postfix's host name when you use the bundled Postfix). If it isn't set, **all** mail sent to a restricted list is dropped. See [Mail transport](../operations/mail-transport.md).

:::note
The admin console shows this setting but doesn't yet have a switch for it, or a button to delete a list; both are available through the REST API.
:::

Nested lists are expanded up to 10 levels deep, and a loop (list A containing list B containing list A) is skipped rather than delivered forever.

## Shared mailboxes

A shared mailbox has no single owner. People are given access to it, see it in their own mail app next to their own mailbox, and read and reply from it. It suits addresses like `support@`, `hello@` or `billing@`.

### Create a shared mailbox

1. Open **Mailboxes** and choose **+ New mailbox**.
2. Enter the address and display name, for example `support` and `Support`.
3. Under **Owner**, keep **Shared mailbox (no single owner)**.
4. Choose **Create mailbox**.

### Give people access

On the mailbox's page, under **Shared access**:

1. Enter the person's e-mail address, username or user id.
2. Choose **Read only** or **Full access**, and grant it.
3. To open the mailbox yourself, choose **Add me**.

The mailbox appears in each person's mail app. To take access away, choose **Revoke**; it takes effect immediately. Every grant and revocation is written to the [audit log](quarantine-and-audit-log.md).

This is the only way an administrator opens a mailbox: you grant yourself access, visibly and on the record. It works only on shared mailboxes. A person's own mailbox can only be shared by its owner, which people do from their own settings (see [Shared mailboxes and delegation](../user-guide/shared-mailboxes.md)).

## Rooms and equipment

A resource mailbox represents something people book: a meeting room, a projector, a pool car. People add it to a meeting like any attendee, and it can accept or decline on its own according to rules you set, so two meetings don't end up in the same room.

### Create a room or piece of equipment

1. Open **Mailboxes** and choose **+ New mailbox**.
2. Enter the address and display name, for example `boardroom` and `Boardroom`.
3. Keep **Shared mailbox (no single owner)**. A resource has no owner.
4. Tick **This is a resource mailbox (a bookable room or piece of equipment)** and fill in the settings below.
5. Choose **Create mailbox**.

A mailbox becomes a resource when it's created; an existing mailbox can't be turned into one later. You can change the settings afterwards on the mailbox's page, under **Resource settings**, and save them with **Save resource settings**.

| Setting | What it does |
| --- | --- |
| **Resource type** | **Room** or **Equipment** |
| **Capacity (optional)** | How many people a room holds. Informational only; it doesn't affect booking. |
| **Automatically accept booking requests** | The resource answers meeting requests by itself: it accepts one that fits the rules below and declines one that doesn't, or that conflicts with an existing booking. Recurring meetings are checked occurrence by occurrence. Off by default. |
| **Allow conflicting bookings (skip conflict checking entirely)** | Requests are accepted even when the resource is already booked. |
| **Booking window, in days (optional)** | A request whose first occurrence is further away than this is declined. Empty means no limit. |
| **Maximum duration, in minutes (optional)** | A request longer than this is declined. Empty means no limit. |

The last three settings only take effect while **Automatically accept booking requests** is on. Without automatic acceptance, the resource doesn't answer requests by itself. Give the people who look after the room access under **Shared access**, as for any shared mailbox, so they can manage its calendar.

How people book rooms is described in [Calendar](../user-guide/calendar.md).
