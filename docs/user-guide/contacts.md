---
title: Contacts
description: Keep your address book in RapidMX, add people from your mail, mark favorites and import or export vCard files.
sidebar_position: 4
---

# Contacts

Contacts is your address book. The people in it are suggested as you type recipients in Mail and guests in Calendar, and they sync to your phone. RapidMX also keeps a list of people you have written to, so you can turn them into contacts with one click.

Open it with **Contacts** in the app rail, or press `Ctrl+Shift+B`.

## Find your way around

The list on the left has:

- **All contacts**: your contacts plus suggested ones.
- **Your contacts**: the people you have added.
- **Favorites**: contacts you starred.
- **Suggested contacts**: people you have exchanged mail with.
- **Deleted**: contacts you deleted.
- **Your contact lists** and **Categories**, if you have any.

Type in **Search contacts** (or press `/`) to find someone by name or email address. Click **Name** or **Contact info** at the top of the list to sort by it.

If other mailboxes are shared with you, pick which mailbox's contacts to see with **Mailbox**.

## Add a contact

1. Click **New contact**, or press `Alt+N`.
2. Fill in **Display name** (required) and whatever else you know: **First name**, **Last name**, **Company**, **Job title**, **Email**, **Phone**, **Address**, **Notes**. Use **+ Add email**, **+ Add phone** and **+ Add address** for more than one, and choose whether each is home, work or other.
3. To sort contacts into groups of your own, type them in **Categories (comma-separated)**, for example `VIP, Work`.
4. Click **Save**.

**Add someone from your mail.** Click a person's name in a message or meeting to open their contact card, then click **Add to contacts**. In **Suggested contacts**, select people and click **Add to contacts**.

**Add a picture.** Click the camera badge on the contact's picture and choose **Upload file** or **Take photo**. **Remove photo** takes it off again.

## Change or delete a contact

- Select a contact and click **Edit**, change what you need and click **Save**.
- Click **Delete** and confirm with **Yes, delete**. You can select several contacts and delete them together. Deleted contacts move to **Deleted**.

## Favorites and categories

- Click the star on a contact, or **Favorite** in the toolbar, to add them to **Favorites**. **Unfavorite** removes them.
- Select contacts and click **Add category** to give them a category. Each category appears under **Categories** on the left.

## Email a contact

Select one or more contacts and click **Email**.

## Contact lists

To start a list, click **+** next to **Your contact lists**, type a name and click **Add**. Adding contacts to a list from the web app isn't possible yet.

## Import and export

- **Export**: select the contacts you want and click **Export**. One contact downloads as a `.vcf` file with their name; several download as `contacts.vcf`.
- **Import**: click **Import** and choose a `.vcf` (vCard) file. A file can be up to 5 MB, and the first 2,000 contacts in it are imported. People already in your contacts are skipped.

Most address books, including those on phones and in other mail programs, can export vCard files. CSV files can't be imported.

On narrow screens, **Import** and **Export** are under **More actions**.

## Contact pictures from Gravatar

RapidMX can show pictures people have registered with Gravatar, a public picture service. It's off by default, because it sends a scrambled form of each contact's address (and your IP address) to gravatar.com. To turn it on for this browser, open **Settings** > **Privacy & Data** and tick **Show profile pictures from Gravatar**.

## Encryption keys

A contact's details include an **Encryption** section when RapidMX knows their encryption keys: whether they encrypt mail to you too, their key fingerprints and a **Key history**. If a different key shows up for someone, it is flagged here for you to accept or reject. See [Encryption](encryption.md#signs-on-a-message).

## Your organization's directory

When you type a name in **To** or **Add guests**, people, shared mailboxes, rooms and groups from your organization are suggested even if they aren't in your contacts. There is no page that lists the whole directory.
