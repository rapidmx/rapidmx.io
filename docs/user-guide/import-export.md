---
title: Import and export
description: Bring your old mail into RapidMX, download a copy of your data, save single messages and contacts, or ask for your account to be deleted.
sidebar_position: 11
---

# Import and export

Your mail is yours to take with you. You can move mail in from your old provider, download a full copy of your mailbox whenever you like, and save single messages and contacts as standard files. These all live in **Settings** > **Privacy & Data**, except for the contact and message files, which you save from Contacts and Mail.

Importing, exporting and deleting your account only work for your own mailbox, not one that is shared with you.

## Import mail from another account

Most mail programs and providers can export a mailbox as an **mbox** file, and Outlook saves mail as a **PST** file. RapidMX can import either.

1. Export your mail from your old program as an `.mbox` or `.pst` file.
2. In RapidMX, open **Settings** > **Privacy & Data**.
3. Under **Import mail**, choose the **Destination folder**.
4. Click **Upload Mbox or PST file** and choose the file.
5. The import runs in the background. Come back to this page to see how many messages were imported and how many failed.

Files up to 50 GB can be imported (your administrator can change the limit), and you can start up to 10 imports an hour. Every message goes into the folder you chose.

## Download a copy of your data

1. Open **Settings** > **Privacy & Data**.
2. Under **Export my data**, choose a **Format**:
   - **JSON**: everything in your mailbox (messages, contacts, contact lists, calendar, tasks, notes and attachments), as a file other programs can read.
   - **Mbox**: your mail only, in the format most mail programs can import.
3. Click **Request export**.
4. The export is prepared in the background, which can take a few minutes. Come back to the page and click **Download** when it shows as ready.

An export can be up to 2 GB by default; a bigger mailbox makes the request fail rather than give you half of it. Ask your administrator if that happens.

## Save a single message

Open the message, then **More actions** (**…**) > **Save as**:

- **Save as .eml** downloads the whole message as a file most mail programs can open.
- **Save as PDF** opens your browser's print window; choose "Save as PDF" there.

## Export or import contacts

In Contacts, select contacts and click **Export** to download them as a vCard (`.vcf`) file, or click **Import** to add contacts from one. See [Contacts](contacts.md#import-and-export).

## Calendar files

Calendar can't import or export `.ics` files yet. A JSON export (above) includes your calendar.

## Delete your account

If you're leaving and want your data gone:

1. Open **Settings** > **Privacy & Data**.
2. Under **Delete my account**, click **Request account erasure**, then **Request erasure**.

This permanently deletes your mailbox and everything in it once an administrator at your organization reviews and approves it. You can't cancel it after you've sent it, so download a copy first if you might want one. The page shows the request's progress, or the reason if it is refused.

## Contact pictures

Also in **Privacy & Data**: **Show profile pictures from Gravatar**. See [Contacts](contacts.md#contact-pictures-from-gravatar).
