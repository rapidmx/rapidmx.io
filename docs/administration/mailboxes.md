---
sidebar_position: 3
title: Mailboxes
description: Create mailboxes for people, impersonate a user safely, share and delete mailboxes, erase leftover data, and set mailbox defaults.
---

# Mailboxes

A mailbox holds a person's mail, calendar, contacts, tasks and notes, and has one primary address such as `jane@example.com`. Most mailboxes belong to one person, its **owner**. A mailbox without an owner is a **shared mailbox** (such as `support@example.com`), and a mailbox can also be a bookable room or piece of equipment; both are covered in [Groups and resources](groups-and-resources.md).

You come here when someone joins (create their mailbox), needs help (impersonate them), or leaves (delete the mailbox and, when the time comes, erase its data).

:::info What you can and can't see
The **Mailboxes** pages show administrative details only: addresses, owners, quota, resource and escrow settings. They never show anyone's mail, calendar, contacts or settings, and being an administrator doesn't let you open someone else's mailbox in the mail app. To see a person's account you **impersonate** them, which is recorded. Listing mailboxes and opening a mailbox's page are recorded in the [audit log](quarantine-and-audit-log.md) too. See [The admin console](admin-console.md#administrators-manage-the-platform-not-peoples-mail).
:::

## Before you start: the person needs an account

A mailbox is owned by an account on the sign-in server. Create the person's account first (see [Users and sign-in](users-and-sign-in.md#create-an-account)), then create the mailbox and name them as its owner.

Alternatively, turn on **Let people create their own mailbox** under [Mailbox policy](#mailbox-policy): anyone who signs in without a mailbox can then create one for themselves.

## Create a mailbox

1. Open **Mailboxes** and choose **+ New mailbox**.
2. Fill in the address. Once you have at least one domain, the form shows **Local part** (for example `jane`) and a list of your domains. Mailboxes can only be created on a verified domain that isn't an alias.
3. Enter the **Display name**, for example `Jane Doe`. This is the name recipients see. It can't contain `@` or line breaks.
4. Under **Owner**, choose **Owned by a specific person**, type their e-mail address, username or user id, and confirm with **Use this owner**.
5. Check **Timezone** (it starts with your own) and **Quota (GB)** (it starts with the default from the mailbox policy).
6. Choose **Create mailbox**. The mailbox's page opens.

The new mailbox gets all its standard folders (Inbox, Drafts, Sent Items, Deleted Items, Junk Email, Archive, Calendar, Contacts, Tasks and so on) straight away. Its owner can sign in to the [web app](../clients/web.md) and start using it.

If the address still holds data from a mailbox you deleted earlier, the form says **This address still has data from a deleted mailbox.** and offers **Erase the leftover data**. See [Erase what a deleted mailbox left](#erase-what-a-deleted-mailbox-left).

## The mailbox list

**Mailboxes** lists every mailbox with its **Address**, **Display name**, **Owner** (or **Shared**) and **Quota used**. Choose **View** to open one.

A mailbox's page shows its display name, owner, timezone, quota, alias addresses and creation date, with links to **View quarantine** and **View ingest queue** (see [Quarantine and audit log](quarantine-and-audit-log.md)). Below that are the **Shared access**, **Escrow scope** and (for a room or equipment) **Resource settings** cards.

## Impersonate a user

Impersonating signs you in as the mailbox's owner, so you see and can do everything they can. Use it to help someone with a problem you can't reproduce, or to set up something on their behalf, such as sharing their calendar.

1. Open the person's mailbox and choose **Impersonate this user**.
2. Read the confirmation and choose **Impersonate**. The mail app opens as that person.
3. A banner at the top says **You are viewing as** the user. When you're done, choose **Return to admin**.

Keep in mind:

- This is the only way an administrator sees another user's mail, and it's recorded in the sign-in server's audit log.
- While impersonating, you act as that person with their access, not yours: anything you send or change is done as them, and the **Admin Console** link is hidden until you return.
- Mail the person encrypted end to end stays unreadable unless their key vault is unlocked with their own encryption password or recovery code. Impersonation doesn't bypass encryption. See [Encryption and certificates](encryption-and-certificates.md).

The button only appears on mailboxes that have an owner.

## Shared access

The **Shared access** card lists who has been given access to the mailbox, as **Read only** or **Full access**.

- **On a person's mailbox**, you can review and **Revoke** access, but you can't grant it: only the owner shares their own mailbox (or you, while impersonating them).
- **On a shared mailbox**, you can grant access to anyone, including yourself. Choose **Add me** to make it appear in your own mail app.

Every grant and revocation is written to the audit log. Shared mailboxes are covered in [Groups and resources](groups-and-resources.md#shared-mailboxes).

If an entry reads **Not a user - this entry has no effect**, it names something that isn't a user account. Remove it, or on a shared mailbox choose **Replace with a user**.

## Escrow scope

If your organization uses [key escrow](key-escrow.md), the **Escrow scope** card decides whose holders can jointly recover this mailbox's encrypted mail. Choose a scope (or **No escrow**), choose **Save escrow scope**, and confirm the change. With no scope, nobody can recover the mailbox's encrypted mail if its owner loses their keys.

## Delete a mailbox

1. Open the mailbox and choose **Delete mailbox**.
2. Choose **Delete**.

Deleting removes the mailbox itself, but its mail, contacts, calendars and everything else are **kept** until they are erased. Until then, the address can't be used for a new mailbox. This gives you time to export what you need first (see [Data requests](compliance.md#data-requests)).

To delete and erase in one step, tick **Also erase all of its data now (permanent)**, type the mailbox's address to confirm, and choose **Delete and erase all its data**.

Deleting fails if the mailbox is a custodian on an active [legal hold](compliance.md#legal-hold).

:::note
Deleting a mailbox doesn't delete the person's account on the sign-in server. Do that separately in the sign-in server's admin console if they're leaving. See [Users and sign-in](users-and-sign-in.md).
:::

## Erase what a deleted mailbox left

When deleted mailboxes still have data, the **Mailboxes** page shows a **Deleted mailboxes with remaining data** section listing each address with its folder and message counts.

1. Choose **Erase data** beside the address.
2. Read what will be deleted: the mail, drafts and attachments, contacts, calendar events, tasks, notes, labels, filter rules and signatures, encryption keys, share links and access lists.
3. Type the address to confirm and choose **Erase data**.

The erasure runs in the background. You can close the window with **Stop watching**; the section shows **Erasing** until it finishes, and then the address is free again. Erasing is permanent, and it's refused while a legal hold covers the mailbox.

## Mailbox policy

**Mailbox Policy** holds the defaults for new mailboxes on this server:

| Setting | What it does |
| --- | --- |
| **Default quota (GB)** | The storage a mailbox starts with when an administrator creates it |
| **Let people create their own mailbox** | Someone who signs in without a mailbox can create one, using their username on one of this server's verified domains |
| **Quota for self-created mailboxes (GB)** | The quota such a mailbox gets (shown when the option above is on) |

Each field can be put back to the value in the server's configuration with **Reset to server default**. Nothing is saved until you choose **Save**.

## Related

- [Groups and resources](groups-and-resources.md): shared mailboxes, rooms, distribution lists and aliases
- [Import and export](../user-guide/import-export.md): how people move their own mail in and out
- [Data requests](compliance.md#data-requests): exporting, importing into, and erasing mailboxes on someone's behalf
