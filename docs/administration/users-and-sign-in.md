---
sidebar_position: 5
title: Users and sign-in
description: Manage people's accounts on the sign-in server, make someone an administrator, and choose which sign-in methods, second factors and providers are allowed.
---

# Users and sign-in

RapidMX keeps two things apart: the **account** a person signs in with, and the **mailbox** that holds their mail. Accounts live on the sign-in server (the auth-server, at `https://auth.example.com`), which handles passwords, two-factor sign-in, passkeys and sign-in with Google, Apple, Facebook or Microsoft. Mailboxes live on the mail server and are managed in the [admin console](admin-console.md).

So when someone joins, you create their account here, then a mailbox they own (see [Mailboxes](mailboxes.md)). When someone forgets their password, loses their phone or needs administrator rights, you come here.

## The sign-in server's admin console

The sign-in server has its own admin console at `https://auth.example.com/admin`. Like RapidMX's, it needs the `admin` role and asks you to confirm it's you before it opens. Its sections are:

| Section | What it's for |
| --- | --- |
| **Users** | Find, create, edit and delete accounts |
| **OAuth Clients** | Apps allowed to sign people in through this server |
| **Messages** | The wording of sign-in code e-mails and texts, and the SMTP server, SMS provider (Twilio or Telnyx) and WhatsApp credentials they're sent with |
| **Audit Log** | Sign-ins, registrations, identity confirmations, impersonations, second-factor changes, app-password use and account deletions |
| **Diagnostics** | Versions, resource usage and live logs of the sign-in server |
| **Settings** | Branding of the sign-in pages, and the **Registration & Security** switches |

## Create an account

1. In the sign-in server's admin console, open **Users** and choose **+ New user**.
2. Choose the **Identifier type** (**Username**, **Email** or **Phone**) and enter the **Identifier**, for example `jane@example.com`.
3. Optionally set a **Temporary password**. Leave it blank to have the person set their own password later. With a temporary password you can also choose **Allow the user to change their password** and **Require the user to change their password at first sign-in** (both on by default).
4. Leave **Roles** empty for an ordinary user. See [Make someone an administrator](#make-someone-an-administrator).
5. Tick **Verified** if you've already confirmed the identifier belongs to them, and **Require multi-factor authentication to sign in** if they must use a second factor.
6. Choose **Create account**.

Then create their mailbox in RapidMX's admin console and pick this account as the owner. You can look the owner up by e-mail address, username or user id.

:::tip
If you'd rather people create their own mailbox the first time they sign in, turn on **Let people create their own mailbox** in RapidMX's [Mailbox policy](mailboxes.md#mailbox-policy). They still need an account first.
:::

## Help someone who can't sign in

Open **Users**, find the person and choose **View**. Their page has:

- **Overview**: roles, scopes, **Verified**, and **Require multi-factor authentication to sign in**. Choose **Save** after a change.
- **Identifiers**: the usernames, e-mail addresses and phone numbers they can sign in with.
- **Sign-in methods**: each password, authenticator app, passkey, hardware key, app password and set of recovery codes, with when it was added and **Last used**. Remove a lost device's method here, or choose **Set password** to give them a new password.
- **Recent activity**: their entries from the audit log.
- **Impersonate**: sign in as this account to see exactly what it sees.
- **Danger zone**: **Delete account**. This can't be undone.

Deleting an account doesn't delete its mailbox. Delete or keep the mailbox separately in RapidMX's admin console (see [Delete a mailbox](mailboxes.md#delete-a-mailbox)).

## Make someone an administrator

Administrator rights come from the `admin` role on the account.

1. Open the person's account under **Users**.
2. Under **Overview**, add `admin` to **Roles**.
3. Choose **Save**.

That one role opens both admin consoles: RapidMX's at `https://mail.example.com/admin` and the sign-in server's at `https://auth.example.com/admin`. Remove the role the same way to take the rights away.

Remember what the role does and doesn't give: it lets the person run the platform, but [not read other people's mail](admin-console.md#administrators-manage-the-platform-not-peoples-mail). Recovering encrypted mail is a separate role again, held per escrow scope (see [Key escrow](key-escrow.md)).

### Confirming it's you

Even with the `admin` role, a normal sign-in doesn't carry administrator rights. The sign-in server leaves the role out of a session until the person **confirms it's you** again, for example by entering their password, an authenticator code or using their passkey or security key. RapidMX's admin console sends you through that confirmation every time you open it, and the most sensitive actions (deleting a mailbox, changing retention, exporting someone else's mailbox, managing escrow scopes) check that it happened recently.

So an administrator's everyday session in the mail app can't change the platform on its own.

## Sign-in methods

People manage their own sign-in methods on their account page, `https://auth.example.com/account` (see [Account security](../user-guide/account-security.md)). The methods are:

- **Password**
- **One-time codes** sent by e-mail, or by SMS or WhatsApp once those are configured under **Messages**
- **Authenticator apps** (TOTP)
- **Passkeys**, and **hardware security keys** (FIDO2)
- **Recovery codes**, for getting back in when a second factor is lost
- **App passwords**, for apps such as Outlook and phones' built-in mail apps that can't answer a two-factor prompt. See [App passwords](../clients/app-passwords.md).
- **Sign in with Google, Apple, Facebook or Microsoft**, once configured (below)

E-mailed sign-in codes are sent through the SMTP server set for the sign-in server. With the Helm chart this defaults to the bundled Postfix, from `noreply@example.com`; on AWS it needs an SES SMTP account. See [Configuration](../operations/configuration.md).

## Registration and security settings

Under **Settings** → **Registration & Security**:

| Setting | What it does | Default in RapidMX |
| --- | --- | --- |
| **Allow new user registration** | Lets people create their own account by signing up, through the public API, or by signing in with Google, Apple, Facebook or Microsoft for the first time. Administrators can always create accounts in **Users**. | Off |
| **Require multi-factor authentication** | Every account must have a second factor to sign in, and new accounts require one from the start. You can still exempt an individual account on its page. | Off |
| **Allow accounts to have multiple passwords** | Lets one account have several passwords, any of which signs in. Off means an account has one password, so whoever can change it controls password sign-in. | Off |

For most organizations, leave registration off and create accounts yourself; otherwise anyone who can reach the sign-in page can make an account.

## Sign in with Google, Apple, Facebook or Microsoft

Each provider's button appears on the sign-in page only once that provider is configured with your own app credentials, which you register with the provider. The settings are part of the sign-in server's configuration (with the Helm chart, under `authserver.service.config` or `authserver.service.extraEnv`):

| Provider | Settings |
| --- | --- |
| Google | `auth__google__clientID`, `auth__google__clientSecret`, `auth__google__redirectURI` |
| Microsoft | `auth__microsoft__clientID`, `auth__microsoft__clientSecret`, `auth__microsoft__tenant`, `auth__microsoft__redirectURI` |
| Apple | `auth__apple__clientID`, `auth__apple__teamId`, `auth__apple__keyId`, `auth__apple__privateKey`, `auth__apple__redirectURI` |
| Facebook | `auth__facebook__clientID`, `auth__facebook__clientSecret`, `auth__facebook__redirectURI` |

The redirect URI points at the sign-in page, `https://auth.example.com/auth/signin`. Keep secrets in a Kubernetes Secret or OpenBao rather than in plain values (see [Secrets and OpenBao](../operations/secrets-and-openbao.md)).

With **Allow new user registration** off, a first-time sign-in with a provider can't create a new account.

## Related

- [Account security](../user-guide/account-security.md): what your users see on their account page
- [App passwords](../clients/app-passwords.md): signing in from Outlook and phones
- [Mailboxes](mailboxes.md#impersonate-a-user): impersonating from RapidMX's admin console
