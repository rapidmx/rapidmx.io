---
title: Rules and automatic replies
description: Sort incoming mail automatically with mail filters, block or trust senders, and send an automatic reply while you're away.
sidebar_position: 7
---

# Rules and automatic replies

Some mail can be handled without you. **Mail filters** (rules) file, copy, mark or forward messages as they arrive, for example moving every newsletter to a folder. **Blocked and safe senders** decide which senders always go to Junk Email and which never do. **Automatic replies** answer people while you're on holiday. All three run on the server, so they work even when you're not signed in.

## Create a mail filter

1. Open **Settings** > **Mail Filters** and click **+ New filter**.
2. Give it a **Name**, for example "File newsletters".
3. Under **Conditions**, say which messages it applies to. Type a value and click **Add** (or press `Enter`):
   - **From contains**: part of the sender's address or name.
   - **Subject contains** and **Body contains**: a word or phrase.
   - **Any To/Cc recipient equals**: an exact address.
   - **Has an attachment**.
   - **Importance**: **Low**, **Normal** or **High**.

   A message must match every condition you fill in. Several values in one condition mean "any of these".
4. Under **Actions**, pick what happens and click **Add action**:
   - **Move to folder** or **Copy to folder**, then choose the folder.
   - **Delete the message**.
   - **Mark as read**.
   - **Forward to**, with one email address.
5. Under **Settings**, leave **Enabled** ticked. Tick **Stop processing more rules once this one matches** if later rules shouldn't touch these messages.
6. Click **Create filter**.

Every filter needs at least one condition, so a filter can't accidentally apply to all your mail.

**Quick start from a message.** Open a message, then **More actions** > **Advanced actions** > **Create rule**. The new filter is filled in with the sender and subject.

### How filters run

- Filters run when a message arrives, after the spam filter and before it reaches your Inbox. Mail the spam filter puts in Junk Email skips your filters.
- They run in order of **Sequence (evaluation order, ascending)**: 0 first, then 1, and so on.
- If several filters move the same message, the last one wins. **Copy to folder** adds extra copies.
- You can have up to 200 filters, each with up to 20 actions.

To change a filter, open **Settings** > **Mail Filters**, click **View** next to it, make your changes and click **Save changes**. To stop one without losing it, untick **Enabled**. Filters can't be deleted in the web app yet.

:::note
Forwarding rules are recorded in your organization's audit log, because automatic forwarding is a common way for mail to leak.
:::

## Block or trust a sender

Open **Settings** > **Blocked & Safe Senders**. Each entry is an address (`name@example.com`) or a whole domain (`example.com`, which covers every address there but not its subdomains).

- **Blocked senders**: their mail goes straight to Junk Email. Type an address or domain and click **Block**.
- **Safe senders**: their mail is never put in Junk Email just because the spam filter didn't like it, as long as it really comes from them (it passes the sender's domain's authentication check). Mail with a virus, or mail your organization's policy quarantines, is still kept out. Type an address or domain and click **Trust**.

An entry can be on only one list; adding it to one takes it off the other. Each list holds up to 1,000 entries. **Remove** takes an entry off.

You can also do this from a message: **More actions** > **Block** > **Block** the address or **Never block** the address, or in Junk Email, **Not junk, and always trust** the sender.

## Turn on automatic replies

1. Open **Settings** > **Automatic Replies**.
2. Tick **Automatic replies are on**.
3. Write your **Message**, for example when you're back and who to contact meanwhile.
4. To have replies start and stop on their own, set both **Start (optional)** and **End (optional)**. Leave both blank to keep replies on until you turn them off.
5. Click **Save**.

Set both dates, or neither. If you set only one, replies go out straight away and keep going until you turn them off.

What to expect:

- Everyone who writes to you gets the same reply, with the subject "Automatic reply:" followed by their message's subject.
- Each sender gets at most one automatic reply a day.
- Mailing lists, bulk mail, bounces and other automatic messages don't get a reply.

**For a single event.** A calendar event can carry its own automatic reply, for example a day off or a conference: in the event's full form, tick **Send an automatic reply while this event is happening** and write the message. While the event is happening, its message is sent instead of the one in Settings, even if automatic replies are off there. See [Calendar](calendar.md#create-an-event).

On a phone, you can usually also turn automatic replies on and off from the account's settings in the phone's mail app.
