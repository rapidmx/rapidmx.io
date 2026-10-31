---
title: Encryption
description: How zero-access and end-to-end encryption protect your mail, how to send encrypted mail to S/MIME and OpenPGP users, and how to keep your keys and recovery codes safe.
sidebar_position: 6
---

# Encryption

RapidMX protects your mail in two ways, both using keys that belong to you. They are kept on the server in a locked vault, and only you can unlock it, with an **encryption password** that is separate from your sign-in password and never sent to the server.

| | **Zero-access encryption** | **End-to-end encryption** |
| --- | --- | --- |
| Protects | Everything stored in your mailbox | Individual messages |
| Who encrypts | The server, the moment mail arrives | The sender's device |
| Does the server ever see it? | Briefly, while delivering it, then it keeps no readable copy | Never |
| Do the other people need keys? | No | Yes |
| Badge on the message | **Protected at rest** | **Encrypted** |

Zero-access encryption works without you doing anything, so an ordinary message from anyone is still stored in a form only you can open. End-to-end encryption goes further, for messages where you and the recipient both have keys.

RapidMX can also **sign** your mail, which proves to the recipient that the message really came from you and wasn't changed on the way.

Your organization decides how much of this is available, and how much of it is automatic. In many organizations, mail between colleagues is encrypted end to end without you doing anything.

## Set up your encryption password

The first time you open Mail, you see **Protect your mailbox**.

![Choosing an encryption password](/img/screenshots/mail-protect.png)

1. Type an **Encryption password** of 12 or more characters, and type it again in **Confirm password**. A passphrase of several unrelated words is long enough and easy to remember. Don't reuse your sign-in password.
2. Click **Continue**.
3. **Save your recovery codes** shows eight codes. Click **Copy codes to clipboard** and store them somewhere safe, such as a password manager or a printed sheet in a locked drawer.
4. Tick **I have saved these recovery codes in a safe place** and click **Continue**.

:::danger Keep your recovery codes
If you forget your encryption password, a recovery code is the only way to get back into your encrypted mail. Nobody at your organization can reset the encryption password for you. The codes are not shown again.
:::

## Unlock your keys

Your keys stay locked until you need them. Mail asks for your encryption password in **Unlock your mailbox** when you open an encrypted message, send a signed or encrypted one, or change your encryption settings. Type it and click **Unlock**.

Once unlocked, your keys stay in that browser tab's memory and are never saved to disk. They are removed when you sign out, when you close the tab, or after a period without activity (30 minutes unless you change it, see [Encryption settings](#encryption-settings)).

## Zero-access encryption

Zero-access encryption is on by default. Your mailbox starts using it the first time you sign in to the web app and unlock your keys. Mail you already have is then sealed in the background. After that, administrators, storage and backup copies can't read what's in your mailbox. Neither can an administrator who [impersonates](../administration/mailboxes.md#impersonate-a-user) you.

To change it, open **Settings** > **Encryption** and look under **Zero-access encryption**.

- **Enable zero-access encryption** turns it on or off for your mailbox. Only you can change this. If an administrator has turned it off for the whole server, this page says so.
- **What to protect** has a switch each for **Mail**, **Calendar**, **Contacts** and **Tasks**. If one of your phones or Outlook syncs a type, that type starts off, so the device keeps working. The switch tells you what would break.

Turning protection off never decrypts anything. It only affects what's saved afterwards.

### What is and isn't encrypted

| Type | Encrypted | Stays readable by the server, and why |
| --- | --- | --- |
| **Mail** | Message bodies, subjects, previews and attachments | Sender, recipients, dates, size, flags and folder, to deliver, thread and search your mail |
| **Calendar** | Event titles, locations and descriptions | Times, repeats, time zone, attendees, responses and busy status, for free/busy, invitations and reminders |
| **Contacts** | Names, company, job title, phone numbers, postal addresses, notes, categories and photos | Email addresses, to deliver mail and find each contact's encryption keys |
| **Tasks** | Task titles and notes | Due dates, reminders, priority, completion and list |

For every type, the server can also see folder and list names, how many items there are and when they change.

:::note Zero-access is not end-to-end encryption
The server sees what arrives or what you save for as long as it takes to process it. It scans incoming mail for spam and viruses, seals it, and keeps only the encrypted copy. This protects what is stored, but you are trusting the server to discard the readable version. For a message the server must never see, use [end-to-end encryption](#send-an-encrypted-or-signed-message).
:::

Your organization may also use [escrow](#if-you-forget-your-encryption-password), which lets a group of authorized people recover this content together.

### What changes for you

Because the server can't read your stored content:

- **Searching** message contents happens on your device, after you unlock. See [Search](search.md).
- **Mail filters** can't be applied to mail already in your mailbox by looking at its contents. Sender, recipient and other envelope conditions keep working.
- **Importing an archive** isn't offered for a mailbox whose mail is protected. See [Import and export](import-export.md).
- **Exports** contain your mail in its encrypted form. Open them in a mail app that has your keys.
- **Protected contacts, events and tasks** can't be edited while your keys are locked, and can't be moved to another mailbox. Copy them instead.
- **Video meetings** created from your mailbox get their own temporary key, carried in each guest's join link. See [Video meetings](video-meetings.md).

## Send an encrypted or signed message

When your keys are unlocked, the message window shows two boxes:

- **Encrypt this message**
- **Digitally sign this message** (only once you have a [signing certificate](#get-a-signing-certificate))

If your keys are locked, click **Unlock to sign or encrypt this message** first.

Each recipient's address shows whether they can receive encrypted mail: "supports encryption" or "no encryption key found". You can only encrypt when every recipient supports it. This includes people outside your organization whose key RapidMX can find, on Proton Mail, Thunderbird and other apps. If one of them doesn't, Mail tells you who, and you can remove them or send the whole message without encryption.

RapidMX picks the format for each recipient, S/MIME or [OpenPGP](#exchange-encrypted-mail-with-openpgp-users). If recipients need different formats, it sends one encrypted copy per format, and never a plain copy.

If your organization has chosen automatic encryption, the box is ticked for you when every recipient supports it.

Current limits for encrypted and signed messages:

- They can't include attachments or pictures in the text yet.
- Encrypted messages can't have **Bcc** recipients.
- Encrypted messages aren't saved as drafts, so closing the window discards what you wrote.

## Exchange encrypted mail with OpenPGP users

S/MIME is RapidMX's own format, but many people outside RapidMX use OpenPGP, including everyone on Proton Mail and people using Thunderbird or GnuPG. If your administrator allows OpenPGP, your mailbox gets an OpenPGP key the next time you unlock it, and RapidMX publishes it so those people can find it. You don't need to do anything else: write to them as usual, and the message is encrypted in the right format.

You'll find the key in **Settings** > **Encryption** under **OpenPGP key**:

- **Fingerprint** is what someone can compare with you to confirm they have the right key.
- **Preferred format** says what other RapidMX servers should use when they could use either. Leave it on **S/MIME (recommended)** unless you mostly read this mailbox in an OpenPGP app.
- **Download public key** gives you a file to hand to someone yourself.
- **Export secret key** lets you read this mailbox's OpenPGP mail in another app. It asks for your encryption password and a passphrase for the file. Anyone with the file and passphrase can read that mail and sign as you.

On a contact that has an OpenPGP key, **Preferred format** chooses **Automatic**, **S/MIME** or **OpenPGP** for mail to that person.

If only some copies of a message to mixed recipients go out, the pop-up says so and **Retry** sends only the copy that didn't go.

## Read an encrypted message

Messages a sender encrypted end to end show "Encrypted message" in the message list, with a small lock. When you open one while your keys are locked, you see **This message is encrypted** with an **Unlock** button. Unlock, and the message appears in place. OpenPGP mail opens the same way.

Mail protected by zero-access encryption shows its real subject and preview once you have unlocked, with the **Protected at rest** badge.

If you see **This message can't be decrypted**, the reason is shown below it. Usually the message wasn't encrypted for you (for example it was forwarded to you), or it uses an old encryption method RapidMX doesn't accept as safe.

## Signs on a message

Each message carries a small badge that says how it was protected:

| Badge | Means |
| --- | --- |
| **Unprotected** | An ordinary message, neither signed nor encrypted. |
| **Protected at rest** | Stored with zero-access encryption. The server saw it during delivery but kept no readable copy. |
| **Encrypted** | Only the recipients could read it. |
| **Signed & verified** / **Encrypted & verified** | Signed by the sender's known key and unchanged since. |
| **Signed - signer not verified** / **Encrypted - signer not verified** | Signed, but with a certificate you don't know yet. |
| **Signature failed** | The signature doesn't check out. The message may have been changed. Treat it with caution. |
| **Verified when first opened** | It was verified when you first read it, but the sender's key has changed or been revoked since. |

**Trust a new sender.** For a message marked "signer not verified", you can click **Trust this signer**. Before you do, compare the fingerprint shown with the sender by phone or in person: anyone can create a certificate with any name on it.

**A sender's key changed.** If you see **This sender's signing key changed**, compare the **Current key** and the **New key**. This is routine when someone renews their certificate, but it can also mean someone is pretending to be them. Confirm the new fingerprint with the person, then choose **Accept new key**, or **Keep current key** if you're not sure. You can review a contact's keys later in the **Encryption** section of their contact card. S/MIME and OpenPGP keys are tracked separately. OpenPGP keys work the same way, and you can paste one by hand.

## Get a signing certificate

To sign your mail you need a **digital signature certificate**. It is optional: encryption works without one.

1. Open **Settings**, then **Encryption**.
2. Under **Digital signatures**, click **Enable digital signatures**.
3. Wait. On most servers the certificate is issued automatically: the certificate authority sends a verification e-mail to your mailbox, RapidMX answers it for you, and the certificate arrives, usually within 10 to 30 minutes. You can leave the page; you'll be told when it is issued or if it fails. **Check status** asks again.

On some servers an administrator issues certificates by hand. The card then says so and names who to contact.

The card shows **Active** once the certificate is installed, and its expiry date. Within 30 days of expiry it offers **Renew**. If a request fails, click **Try again**.

## If you forget your encryption password

1. Open an encrypted message, or **Settings** > **Encryption**, so Mail asks you to unlock.
2. Click **Use a recovery code instead**, type one of your codes and click **Unlock**. Upper or lower case, spaces and dashes don't matter.
3. In **Set a new encryption password**, type a **New encryption password**, confirm it and click **Set password**.

The code you used stops working. If you have two or fewer left, generate a new set (see below).

If you have lost both your password and your recovery codes, your encrypted mail, including everything protected by zero-access encryption, can't be opened by you or by anyone else. Some organizations use **escrow**, which lets a group of authorized people in the organization recover encrypted mail for legal or compliance reasons. If so, **Settings** > **Encryption** says so under **Escrow**. Escrow does not give you back access yourself; ask your administrator.

## Encryption settings

**Settings** > **Encryption** has everything else:

- **Encryption keys** lists your keys by fingerprint.
- **Unlock methods** lists the password and each recovery code that can unlock your mailbox. **Remove** stops one from working.
- **Changing your password.** There is only one encryption password. To change it, use **Rotate keys** (below).
- **Recovery codes.** **Regenerate recovery codes** gives you a new set of eight and makes all the old ones stop working at once. Save the new codes the same way.
- **Zero-access encryption**, **Export keys for Outlook or a phone** and **OpenPGP key** are described above and below.
- **Rotate keys.** Use this if you think someone may know your password or a recovery code, or a device was lost. You set a new password and get new recovery codes, and every old way of unlocking stops working. Mail you already sent or received still opens. Click **Rotate keys now**, then **Yes, rotate my keys**.
- **Session timeout** sets how long your keys stay unlocked on this device with no activity: **5 minutes**, **15 minutes**, **30 minutes** (the default), **1 hour** or **Never**. It applies the next time you open or reload the app.
- **Local search index size** sets how much space the [search index](search.md) may use on this device.
- **This session.** **Destroy keys on this device now** locks your keys in this tab at once, for example before you step away from a shared computer.

## On phones and in Outlook

Other mail apps can't open your vault, so they need a copy of your keys to read encrypted mail. To give them one:

1. Open **Settings** > **Encryption** in the web app, and find **Export keys for Outlook or a phone**.
2. Choose **Export keys**, then type your encryption password and a **File passphrase** for the file. Tick **Include my signing key** only if that app will sign mail you send.
3. Install the `.p12` file on your phone or in Outlook, then delete the file.

:::danger
Anyone with the file and its passphrase can read all of this mailbox's mail. Keep it safe.
:::

Without your keys, those apps show an explanation in place of a protected message. Calendar, contacts and tasks are different: phones and Outlook can't open them even with your keys. They show "Protected event" busy blocks, contacts by email address only, and "Protected task". A meeting changed on a phone doesn't notify attendees, and Outlook doesn't send invitations for a protected calendar, so send those from the [web app](../clients/web.md).
