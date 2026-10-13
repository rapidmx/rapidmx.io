---
title: Search
description: "Find messages in RapidMX, including encrypted ones, with search words and filters like from:, subject: and has:attachment."
sidebar_position: 2
---

# Search

Search finds messages by any word in them, including the text of attached PDF, Word and HTML files. It also finds encrypted messages, which the server itself can't read: for those, your browser keeps its own encrypted search index on your device, so it can search them once your keys are unlocked.

## Search your mail

1. Click the search box above the message list (it says "Search all mail…"), or press `/`.
2. Type what you're looking for. Results appear as you type.
3. Press `Escape`, or open another folder, to clear the search.

Search looks through every folder of the mailbox you're in. Results are listed by how well they match, not by date, and **Filter** doesn't apply to them.

If more than one mailbox is shared with you, **Search all mailboxes** above the results widens the search to all of them (up to 25 at once), and **Search this mailbox only** narrows it again.

## Search words

Narrow a search by typing these in the box, alone or together with ordinary words:

| Type | Finds |
| --- | --- |
| `from:anna` | Mail from an address or name containing "anna". |
| `to:sales@example.com` | Mail sent to that address. |
| `cc:sam@example.com` | Mail with that address in Cc. |
| `subject:invoice` | Mail with "invoice" in the subject. |
| `has:attachment` | Mail with attachments. |
| `before:2026-06-30` | Mail from before that date. |
| `after:2026-01-01` | Mail from on or after that date. |
| `is:unread` | Unread mail. Also `is:read`, `is:flagged`, `is:answered`, `is:forwarded`. |

More tips:

- Put several words in quotes to find them together: `"quarterly report"`. Quotes work after a search word too: `from:"Anna Lee"`.
- `OR` finds either word: `invoice OR receipt`.
- A minus sign leaves a word out: `invoice -draft`.
- Several search words must all match: `from:anna has:attachment after:2026-01-01`.

## Encrypted mail and the local index

The server can't read encrypted messages, so it can't search them. RapidMX handles them on your device instead:

- **Unlock your keys** to include encrypted mail. Until then, a link above the results says "Unlock to include encrypted messages in these results".
- **The local index.** Once your keys are unlocked, your browser builds an encrypted search index of your recent mail on your device in the background. Searches of recent encrypted mail are then instant. The line above the results says how far back it reaches, for example "Local search covers messages back to" a date, and "(still building)" while it is being built.
- **Older encrypted mail** is still searched, more slowly: click **Search all mail** above the results.
- **The index is removed** when your keys lock, when you sign out, or after the encryption **Session timeout**. It is rebuilt the next time you unlock.

To choose how much space the index may use on this device, open **Settings** > **Encryption** > **Local search index size**: from **100 MB** to **10 GB**, or **Unlimited (disk space only)**. The default is 500 MB in a browser. A new size applies the next time the index is rebuilt.

In a mailbox that is shared with you, encrypted messages can only be unlocked by the mailbox's owner, so they aren't included in your results.

## Search your calendar and contacts

- **Calendar**: type in **Search events**, and step through the matches with `Enter` and `Shift+Enter`. It looks at the title, place, description, organizer and guests of events in the calendars you have ticked. See [Calendar](calendar.md#search-your-calendar).
- **Contacts**: type in **Search contacts**. It looks at names and email addresses.

## Limits

- At most 500 results are listed. If you hit that, add more search words.
- If a mailbox couldn't be searched, for example because it took too long, the results say "Some results may be missing" and name it.
