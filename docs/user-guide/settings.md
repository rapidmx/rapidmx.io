---
title: Settings
description: Set up your profile, signatures, appearance, labels, read receipts and notifications in RapidMX.
sidebar_position: 9
---

# Settings

Settings is where you make RapidMX your own: your name as others see it, your signature, the app's colours, and how it notifies you. To open it, click your picture or initials in the top corner and choose **Settings**, or press `Ctrl+Shift+S`.

The sections are listed on the left (on a phone, tap **Open settings menu**):

| Section | What it's for |
| --- | --- |
| **Profile** | Your display name, time zone and who sees when you're busy. |
| **Appearance** | Light or dark, colours and a background picture. |
| **Automatic Replies** | Out-of-office replies. See [Rules and automatic replies](rules-and-automatic-replies.md#turn-on-automatic-replies). |
| **Mail Filters** | Rules that sort incoming mail. See [Rules and automatic replies](rules-and-automatic-replies.md). |
| **Blocked & Safe Senders** | Senders to always send to Junk, or never. See [Rules and automatic replies](rules-and-automatic-replies.md#block-or-trust-a-sender). |
| **Signatures** | Text added to the end of your messages. |
| **Labels** | Coloured tags for messages. |
| **Read Receipts** | When to ask for, and send, read receipts. |
| **Encryption** | Your encryption password, recovery codes and keys. See [Encryption](encryption.md#encryption-settings). |
| **Sharing** | Who else can use this mailbox. See [Shared mailboxes](shared-mailboxes.md). |
| **Privacy & Data** | Gravatar pictures, exporting and importing, deleting your account. See [Import and export](import-export.md). |

Plugins can add sections of their own after these.

**Settings belong to a mailbox.** If other mailboxes are shared with you, pick which one you're changing with **Mailbox** at the top. **Appearance** is the exception: it is yours and follows you to every device.

## Profile

- **Display name**: the name people see next to your address on mail you send, for example "Jane Doe".
- **Time zone**: the time zone your calendar and reminders use. **Use this device's time zone** fills it in from your computer.
- **Free/busy visibility**: who can see the hours you're busy when they look for a meeting time. They never see what the event is.
  - **Everyone on my domain** (the default): people with an address at your organization's domain.
  - **Only people I've shared my calendar with**: only people you've shared your mailbox with.
  - **Nobody**: your availability shows as hidden.
  - **Everyone on this server**: anyone signed in to your organization's RapidMX.

Click **Save**.

## Appearance

Every change shows at once across the whole app and is saved automatically to your account.

- **Colour scheme**: **System** (follow your device), **Light** or **Dark**. You can also switch it from **Theme** in the account menu.
- **Theme colours**: **Primary** (links, the selected app and folder), **Accent** (main buttons and highlights), **Surface** (panels, lists and menus) and **Text**. Pick a colour or type a code like `#1a2b3c`. **Reset** returns one to the default. If text would be hard to read, a warning tells you so.
- **Background**: **None**, **Colour**, or **Image**. For an image, click **Choose image** or drag a picture in (PNG, JPEG, WebP or AVIF, up to 8 MB). **Dim** darkens it so text stays readable, **Blur** softens it, and **Fit** chooses **Cover (fill the window)**, **Contain (show all of it)** or **Tile (repeat)**.

**Reset all** puts everything back to how your organization set it up.

## Signatures

1. Open **Signatures** and click **+ New signature**.
2. Give it a **Name**, for example "Work signature", and write it in the editor.
3. Tick **Use for new messages**, **Use for replies and forwards**, or both.
4. Click **Create signature**.

The signature is added to your messages on its own. You can have several signatures but only one for new messages and one for replies; ticking the box on one signature unticks it on the other. To change a signature, click **Edit**, then **Save changes**.

Signatures can't contain pictures, and can't be deleted in the web app yet. To stop using one, untick both boxes.

## Labels

Labels are coloured tags you put on messages (see [Mail](mail.md#organize-your-mail)). Here you can click **+ New label**, give it a **Name** and **Color**, and **Save**. **Edit** renames or recolours a label, and **Delete** removes it from every message that has it, which can't be undone.

## Read Receipts

A read receipt tells the sender that you've opened their message.

- **Request receipts when sending**: whether your messages ask for a receipt, separately for **internal recipients** (your organization, on by default), **federated recipients** (partner organizations) and **external recipients**. **Request a read receipt** in the message window asks for one on a single message.
- **Respond automatically to requests**: whether RapidMX answers receipt requests for you, for **internal senders** (on by default), **federated senders** and **external senders**. When it doesn't, the message shows **Send receipt** and **Decline** so you can choose.

Click **Save**.

## Notifications

Notification settings are in the account menu, not in Settings, and apply to this browser only:

- **Notifications**: turns all pop-ups on or off, including new mail, calendar reminders and errors. Messages that need you to act, like a message that couldn't be sent, still show.
- **Notification sounds**: a chime for new mail, a bell for reminders and a buzz for errors.
- **Turn on desktop notifications**: lets RapidMX tell you about new mail through your computer's notifications while the tab is in the background. Your browser asks for permission.
- **Recent notifications**: the last 30 pop-ups, in case you missed one.

## Keyboard shortcuts

Press `?` to see them, or see [the web app page](../clients/web.md#keyboard-shortcuts).
