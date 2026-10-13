---
title: App passwords
description: Create a separate password for Outlook or a phone mail app, so it can sign in to RapidMX without your normal password or a second sign-in step.
sidebar_position: 7
---

# App passwords

The web app signs you in through your organization's sign-in page, where you can use a passkey, an authenticator app or a code sent to your phone. Outlook and phone mail apps can't show that page. All they can do is send a user name and a password. An **app password** is a separate password made for one of those apps, so it can sign in without your normal password and without a second sign-in step.

Use a different app password for each app or device, such as "iPhone" and "Outlook on my laptop". If you lose a device, you remove just that one password, and everything else keeps working.

An app password works only for Outlook and Exchange ActiveSync (phones and tablets). It can't be used to sign in to the web app, the admin console or anything else.

## Create an app password

1. In the web app, open the account menu (your picture or initials) and choose **Account**.
2. Find the **App passwords** card and click **+**.
3. In **Add an app password**, type a **Label** that tells you which app it is for, for example `iPhone` or `Outlook on my laptop`, and click **Create**.
4. The password is shown once. Copy it with the copy button, then click **Done**.
5. Paste it into the app as the password, with your email address as the user name. See [Phones and tablets](phones-and-tablets.md) or [Outlook](outlook.md).

:::note
You can't see an app password again after you close that window. If you lose it, remove it and create a new one.
:::

The **App passwords** card lists each password's **Label**, when it was **Added**, and when it was **Last used** ("Never used" until an app first signs in with it), so you can spot one you no longer need.

## Remove an app password

Remove an app password when you stop using an app, or straight away if a device is lost or stolen.

1. Open **Account** from the account menu.
2. In **App passwords**, click **Remove** next to the password.
3. Confirm. Any app using it stops working immediately.

## Questions

**Does my normal password work in these apps?** The server asks the auth-server to check whatever password the app sends, so on an account without two-step sign-in a normal password may be accepted. Use an app password anyway: it can be removed on its own, and it never exposes the password you use everywhere else. If your account requires a second sign-in step, only an app password works.

**Does an app password expire?** No. It works until you remove it.

**The app says my password is wrong.** Check you used your full email address as the user name and copied the whole app password. After ten failed attempts within 15 minutes the server refuses sign-ins for a while, so wait before trying again.

## For administrators

- App passwords are an auth-server feature. They are turned on in the bundled auth-server (`auth__app_password__enabled: true`), and the server's Outlook and ActiveSync sign-in depends on it.
- On `/mapi` and `/Microsoft-Server-ActiveSync`, the server accepts HTTP Basic sign-in and asks the auth-server to check it, so the auth-server address in `mail:auth_server_url` must be reachable from the server. Nothing else on the server accepts Basic sign-in.
- A successful sign-in is remembered for 5 minutes, and 10 failures per user name per client address in 15 minutes get a "too many requests" answer. These are the `mail.basicAuth` values in the Helm chart. See [Configuration](../operations/configuration.md).
