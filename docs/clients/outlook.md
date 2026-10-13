---
title: Outlook for Windows
description: Connect Outlook for Windows to RapidMX over MAPI over HTTP, what syncs, what doesn't, and the current status of Outlook support.
sidebar_position: 4
---

# Outlook for Windows

Many people have used Outlook for years and would rather keep it. RapidMX speaks **MAPI over HTTP**, the protocol Outlook for Windows uses to talk to an Exchange server, so Outlook can treat a RapidMX mailbox as an Exchange account: mail, calendar, contacts and tasks in one profile, without IMAP or POP3 (RapidMX has neither).

MAPI over HTTP is a plugin, **MAPI over HTTP**, installed by default. It serves `/mapi/emsmdb` (the mailbox) and `/mapi/nspi` (the address book). [Autodiscover](automatic-setup.md) tells Outlook where they are.

:::warning Outlook support is still being finished
As of this writing, Outlook for Windows can find a RapidMX server and add the account, but the project's own testing has not yet confirmed that Outlook opens the mailbox reliably afterwards. In testing, Outlook stopped after restarting with "The set of folders cannot be opened", and the fix is still being worked on. Check the release notes of the `@rapidmx/mapi-plugin` package before you roll Outlook out to your organization, and use the [web app](web.md) in the meantime.
:::

## Before you start

- **An app password.** Outlook can only send a user name and password, not a sign-in through your browser. Create an [app password](app-passwords.md) for Outlook and use it instead of your normal password. If your account uses two-step sign-in, an app password is the only way in.
- **Automatic setup in place.** Your administrator needs the Autodiscover DNS record for your email domain. See [Automatic setup](automatic-setup.md).

## Add your account

These are Outlook's own steps, so the exact wording may differ slightly between Outlook versions.

1. In Outlook, open **File**, then **Add Account**.
2. Type your email address, for example `alex@example.com`, and click **Connect**.
3. When Windows asks for your password, enter your email address as the user name and your **app password** as the password. Tick the box to remember your credentials.
4. Outlook finds the server, adds the account and asks you to restart it.

If Outlook can't find the server, ask your administrator to check the Autodiscover record.

## What works in Outlook

| Area | In Outlook |
| --- | --- |
| Mail | Browse folders, read, send, delete. "Do not deliver before" (scheduled send) and read-receipt requests work. |
| Calendar | Create, change and delete events; send meeting invitations and respond to them. |
| Contacts | Read only. Create and edit contacts in the web app or on your phone. |
| Tasks | Read only. |
| Categories | Your labels from the web app appear as Outlook categories, read only. Add or remove labels in the web app. |
| Address book | Search the organization's address book as you type. |

## What doesn't work in Outlook

These are documented limits of the MAPI plugin. Use the web app for them.

- Opening shared mailboxes or mailboxes delegated to you.
- Inbox rules, search folders and public folders.
- Changing a single occurrence of a recurring meeting, proposing a new meeting time, forwarding a meeting, or scheduling on someone else's behalf.
- Room and resource mailboxes accepting bookings on their own when booked from Outlook.
- Time zones with daylight-saving rules: Outlook gets a fixed offset.
- The Focused / Other inbox split.
- Searching encrypted mail. RapidMX's encrypted search index lives in the web app.
- Editing contacts, tasks or categories (see the table above).

## Encrypted mail

RapidMX's end-to-end encryption uses S/MIME, a standard Outlook already understands. The private key that decrypts your mail, though, stays in your encrypted key vault and is unlocked in the web app, and RapidMX currently has no way to copy it into Outlook. Read and send encrypted mail in the [web app](web.md). See [Encryption](../user-guide/encryption.md).
