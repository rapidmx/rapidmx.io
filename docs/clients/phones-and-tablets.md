---
title: Phones and tablets
description: Add your RapidMX account to the mail app on an iPhone, iPad or Android device with Exchange ActiveSync.
sidebar_position: 5
---

# Phones and tablets

Your phone's built-in mail app can already talk to RapidMX. RapidMX speaks **Exchange ActiveSync**, the protocol phones and tablets use for work accounts, so you add it as an "Exchange" account and get your mail, calendar, contacts and tasks in the phone's own apps, kept up to date as things change. You don't need to install anything from an app store.

Exchange ActiveSync is a plugin, **Exchange ActiveSync**, installed by default. It supports protocol versions 14.0, 14.1, 16.0 and 16.1.

## What syncs

| Item | On your phone |
| --- | --- |
| Mail | Every folder, including drafts. New mail arrives as it comes in (push). Send, reply and forward. |
| Calendar | Your events, with meeting invitations you can accept or decline from the phone. |
| Contacts | Your contacts, both ways. |
| Tasks | Your tasks, both ways, in apps that show Exchange tasks. |
| Address book | Search the organization's directory when you type a recipient. |
| Automatic replies | Turn your out-of-office reply on or off from the phone's account settings, where the app offers it. |

Notes, file shares and rights-managed (IRM) mail are not supported.

## Which apps have been tested

The project has confirmed these with real devices:

- **Mail on iPhone and iPad** (Apple's built-in app).
- **Gmail on Android**, using its Exchange account type, with push for mail, calendar and contacts.

Other Exchange ActiveSync apps, such as Samsung Email, are expected to work, since they speak the same protocol. **Outlook for iOS and Android** is a known problem: in testing, it found the server but then failed to add the account. Use the phone's built-in mail app for now.

## Before you start

You need:

- **Your email address**, for example `alex@example.com`.
- **An app password.** Phone mail apps can only send a user name and password. Create an [app password](app-passwords.md) for the phone and use it in place of your normal password. If your account uses two-step sign-in, an app password is the only way in.

## Add your account on an iPhone or iPad

1. Open **Settings**, then **Mail**, **Accounts**, **Add Account**.
2. Choose **Microsoft Exchange**.
3. Enter your email address and a description, then tap **Next**.
4. If the phone offers to sign in with Microsoft, choose **Configure Manually** instead. Enter your **app password** and tap **Next**.
5. If the phone asks for a server, enter your organization's mail server name, for example `mail.example.com`, and your email address as the user name.
6. Choose what to sync (Mail, Contacts, Calendars, Reminders) and tap **Save**.

Apple renames these screens from time to time, so the labels on your device may be slightly different.

## Add your account on Android

Android phones come with different mail apps. In the Gmail app:

1. Open Gmail, tap your profile picture, then **Add another account**.
2. Choose **Exchange and Office 365**.
3. Enter your email address, then your **app password**.
4. If the app asks for server settings, enter your organization's mail server name, for example `mail.example.com`, with your email address as the user name.
5. Accept the security request (see the next section) and finish.

To get calendar and contacts updates as they happen, set the account's sync frequency to **Automatic (Push)** in its settings.

## Security requirements on your phone

When you add the account, the phone asks you to accept security settings from your organization (some phones call it "activating device administration"). These come from your administrator. By default RapidMX asks for:

- a screen lock passcode of at least 4 characters, with simple ones like `1111` or `1234` not allowed;
- device encryption turned on;
- **the phone wiping itself after 8 wrong passcode attempts in a row.**

Your administrator can change these. If you refuse them, the account won't sync.

## For administrators

- **Policy settings.** In the admin console, open **Plugins**, find **Exchange ActiveSync** and click **Settings**. **Require a device passcode**, **Minimum passcode length**, **Failed unlocks before wipe**, **Require device encryption** and **Allow simple passcodes** set the policy above. **Forget idle devices after (days)** (default 90) removes pairings with devices that haven't synced for that long. The remaining settings tune batch sizes and push intervals and rarely need changing.
- **Remote wipe.** An administrator can tell a lost device to erase itself, or only the account on it, with `POST /api/mail/devices/{uid}/remote-wipe` (body `{ "accountOnly": true }` for the account only). It takes effect the next time the device connects. A wiped device stays blocked until an administrator calls `POST /api/mail/devices/{uid}/unblock`. There is no button for this in the admin console yet.
- **Sign-in.** Phones use HTTP Basic sign-in on `/Microsoft-Server-ActiveSync`, checked against the auth-server. Ten failed sign-ins for one user from one address within 15 minutes are refused for a while. See [App passwords](app-passwords.md).
- **Automatic setup** needs the Autodiscover DNS record for each domain. See [Automatic setup](automatic-setup.md).

## Encrypted mail on your phone

End-to-end encrypted messages are decrypted with your private key, which stays in your encrypted key vault and is unlocked in the web app. RapidMX currently has no way to copy that key to a phone, so read and send encrypted mail in the [web app](web.md). See [Encryption](../user-guide/encryption.md).
