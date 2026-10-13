---
title: Sign-in and account security
description: Sign in to RapidMX, add a passkey or an authenticator app, turn on two-step sign-in and change your password.
sidebar_position: 10
---

# Sign-in and account security

Your RapidMX account is protected by how you sign in. A password alone is easy to steal; adding a **passkey**, an **authenticator app** or a **security key** makes it much harder for anyone else to get in. This page shows how to sign in and how to set those up.

Your sign-in is managed on your **account page**, which is separate from Mail's settings. Open it from the account menu (your picture or initials) > **Account**.

Your sign-in password and your [encryption password](encryption.md) are two different things. Changing one does not change the other.

## Sign in

1. Open your organization's RapidMX address, for example `https://mail.example.com`. You are sent to the sign-in page.
2. In **Account ID, e-mail, or phone**, type your username, email address or phone number, and click **Continue**.
3. Choose how to sign in, if you have more than one way, and follow the steps: type your **Password**, use your passkey, enter the code from your authenticator app, or enter a **One-time code** sent to your email or phone.
4. If your account uses two-step sign-in, **Verify it's you** asks for your second step.

![The sign-in page](/img/screenshots/sign-in.png)

Other options on the sign-in page, depending on what your organization has turned on:

- **Sign in with a passkey**, which skips typing anything.
- **Continue with Google**, **Continue with Microsoft**, **Continue with Apple** or **Continue with Facebook**, to sign in with that account.

**Confirm it's you.** Before some sensitive actions, such as opening the admin console, RapidMX asks for your password again in **Confirm it's you**.

![Confirm it's you](/img/screenshots/confirm-password.png)

**Forgot your password?** There is no "forgot password" link. Sign in another way if you have one (a passkey or a one-time code), or ask your administrator to set a temporary password. You'll be asked to choose a new one the next time you sign in.

## Your account page

The account page has these cards:

- **Username**: a name you can sign in with instead of an email address or phone number.
- **Profile**: your name and birthdate.
- **Contacts**: the email addresses and phone numbers on your account. Verify one to be able to sign in with it or receive one-time codes there.
- **Sign-in methods**: your passwords, authenticator apps, passkeys and security keys.
- **App passwords**: passwords for Outlook and phone mail apps. See [App passwords](../clients/app-passwords.md).
- **Security**: two-step sign-in.

The **Log out** button at the top signs you out.

## Add a passkey

A passkey lets you sign in with your fingerprint, face or device PIN instead of a password. It can't be phished, because it only works on your organization's real sign-in page.

1. On your account page, find **Sign-in methods** and click **+**.
2. Choose **Passkey**, then **Add passkey**.
3. Follow your browser's or phone's prompt.
4. Give it a **Label (optional)**, such as "iPhone", and click **Confirm**.

## Add an authenticator app

An authenticator app (such as Google Authenticator or 1Password) shows a short code that changes every few seconds.

1. In **Sign-in methods**, click **+** and choose **Authenticator app**, then **Add authenticator app**.
2. Scan the QR code with the app, or type the code shown into it. You won't see the code again.
3. Type the code the app now shows into **Verification code**, give it a label if you like, and click **Verify and add**.

## Add a security key

For a hardware key such as a YubiKey: in **Sign-in methods**, click **+**, choose **Hardware key (FIDO2, YubiKey)**, then **Add security key**, insert the key and follow your browser's prompt.

## Turn on two-step sign-in

With two-step sign-in, a password alone isn't enough: you also need your authenticator app or security key.

1. Add an authenticator app or a security key first (see above). A passkey doesn't count as a second step.
2. In the **Security** card, tick **Require multi-factor authentication to sign in** and click **Save**.

From then on, Outlook and phone mail apps need an [app password](../clients/app-passwords.md).

## Change your password

In **Sign-in methods**, click **Change** next to your password. Type the **New password** and **Confirm new password**; the list below the fields shows which rules it still needs to meet. Click **Save password**.

## Remove a sign-in method

In **Sign-in methods**, click **Remove** next to it and confirm. The **Last used** column helps you spot ones you no longer use, for example an old phone.

## If a device is lost or stolen

1. Remove its passkey under **Sign-in methods**.
2. Remove its app password under **App passwords**.
3. Change your password if it might be known.
4. If you used the device to read encrypted mail, rotate your encryption keys. See [Encryption](encryption.md#encryption-settings).
5. Tell your administrator.
