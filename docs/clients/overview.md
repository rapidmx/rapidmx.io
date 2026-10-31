---
title: Choose an app
description: Which app to use with RapidMX on a computer, a phone or in Outlook, and what each one can do.
sidebar_position: 1
---

# Choose an app

You can reach your RapidMX mailbox from a web browser, from the mail app built into your phone, and from Outlook for Windows. They all show the same mailbox, so a message you read on your phone is read in the browser too. They differ in how much of RapidMX they can do: the web app does everything, while the others cover the everyday basics of mail, calendar and contacts.

RapidMX has no IMAP or POP3, so mail apps that only speak those can't connect. Apps that speak Exchange ActiveSync (what phones use for work accounts) or MAPI over HTTP (what Outlook for Windows uses) can.

## Which one to use

| You want to... | Use |
| --- | --- |
| Use RapidMX on a computer | The [web app](web.md) in your browser |
| Read mail and see your calendar on a phone or tablet | Your phone's own mail app, set up as an Exchange account. See [Phones and tablets](phones-and-tablets.md) |
| Keep using Outlook on Windows | [Outlook for Windows](outlook.md), with the current limits on that page |
| A desktop app of its own, with several accounts | The [RapidMX app](desktop-and-mobile.md), which is still in development |

## What each app can do

| | Web app | Phone mail apps | Outlook for Windows |
| --- | --- | --- | --- |
| Mail | Yes | Yes | Yes |
| Calendar and meeting invitations | Yes | Yes | Yes |
| Contacts | Yes | Yes | Read only |
| Tasks | Yes | Yes, in apps that show them | Read only |
| Shared and delegated mailboxes | Yes | Use the web app | No |
| Rules and automatic replies settings | Yes | Automatic replies, where the app offers it | No |
| End-to-end encryption | Yes | Reads it with [exported keys](../user-guide/encryption.md#on-phones-and-in-outlook) | Reads it with [exported keys](../user-guide/encryption.md#on-phones-and-in-outlook) |
| Zero-access mail | Yes | Reads it with exported keys | Reads it with exported keys |
| Zero-access calendar, contacts, tasks | Yes | Placeholders only | Placeholders only |
| Encrypted search index | Yes | No | No |
| Plugins (booking pages, video meetings, chat, CRM) | Yes | No | No |
| How you sign in | Your normal sign-in, passkeys and two-step sign-in | [App password](app-passwords.md) | [App password](app-passwords.md) |

## Setting up phones and Outlook

Phones and Outlook need two things from you and one from your administrator:

1. **Your email address.**
2. **An [app password](app-passwords.md)**, which you create on your account page. These apps can't show your organization's sign-in page, so they use an app password instead of your normal one.
3. **Automatic setup**, which your administrator turns on with a DNS record so that apps can find the server from your email address alone. See [Automatic setup](automatic-setup.md).
