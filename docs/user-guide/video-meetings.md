---
title: Video meetings
sidebar_position: 13
description: Add a video call to a calendar invitation or share a personal meeting room, and run the call from your browser.
---

# Video meetings

Video meetings let you talk face to face with colleagues, clients or anyone else from a web browser. There's
nothing to install, and the people you invite don't need a RapidMX account. They open the link, check their
camera and microphone, type their name and join.

There are two ways to start one:

- **From a calendar invitation.** When you schedule a meeting, turn on video conferencing and every guest
  receives their own join link inside the invitation. This suits planned meetings with a known guest list.
- **From your personal room.** A permanent link that's always yours. Share it whenever someone needs to talk to you
  right now, or put it in your email signature.

For example, a project lead schedules Monday's status meeting with three colleagues and one outside contractor,
and checks **Add video conferencing**. Each of them gets an invitation with a personal join link. On Monday they
each select the link, and the call starts in their browser.

:::note
Video meetings come from the Meet plugin. If you don't see **Add video conferencing** in the calendar or **Video
Conferencing** in Settings, your administrator hasn't turned it on. See
[Plugins](../administration/plugins.md).
:::

Video meetings are designed for small groups. Everyone's camera connects directly to everyone else's, so calls
work best with up to about four to six people.

## Add a video call to a calendar invitation

1. Create a meeting in the calendar and add your guests. See [Calendar](./calendar.md).
2. Check **Add video conferencing**. You need at least one guest besides yourself.
3. Save and send the invitation.

The event's location becomes "Video call — link in this invitation", and each guest's invitation contains a join
link made just for them. On the event, a **Join video call** button opens the call for you, and the link itself is
shown underneath in case you want to open it in another browser.

:::tip
If you add or remove guests after turning on video conferencing, the guest list of the video meeting isn't
updated. Clear **Add video conferencing**, check it again and send the invitation, so everyone on the current list
gets a link.
:::

To remove the video call, clear **Add video conferencing** and save.

## Use your personal meeting room

1. Open **Settings** and choose **Video Conferencing**.
2. Under **Your personal room**, select **Create my personal room**.
3. Optionally, change the **Room name** and select **Save**.
4. Select **Copy** to copy the room's link, and share it.

Anyone with the link can join at any time, so share it only with people you'd let into the room. Once you have a
personal room, a **Meet** button appears in the web app's app rail, and selecting it takes you straight into your
room.

If the page says no public join page URL is configured, ask your administrator to set one (see
[For administrators](#for-administrators)).

The **Meetings** list on the same page shows your other video meetings, including the ones created for calendar
invitations, with their **Title**, **Visibility**, **Status** and **Created** date. Select **Copy link** to copy a
public meeting's link, or **Cancel** to cancel a scheduled meeting.

## Join a meeting

These steps are the same for you and your guests.

1. Open the join link. The page shows the meeting's title and who is hosting it.
2. Select **Allow camera and microphone**, and allow access when your browser asks. If you'd rather not, you can
   still join without them.
3. Check your camera preview. Use **Choose a camera** and **Choose a microphone** to switch devices, and the
   microphone and camera buttons to start muted or with your camera off.
4. Type your name under **Your name**.
5. Select **Join meeting**.

Your browser remembers the camera, microphone and effects you chose, and whether each was on, for the next
meeting you join from the same browser.

Some meetings ask for more before you get in:

- **A password.** The page says "This meeting requires a password to join." Type the password the host gave you.
- **A waiting room.** The page says "The host must let you in before you can join." After you ask to join, you see
  "Waiting for the host to let you in…" until the host admits you.

## During the call

The bar at the bottom of the call has these controls:

| Control | What it does |
| --- | --- |
| Microphone | Mutes and unmutes you. While unmuted, bars move with the sound it picks up. The arrow next to it (**Choose microphone**) switches microphones. |
| Camera | Turns your camera on and off. A green dot shows while it's sending. The arrow next to it (**Choose camera**) switches cameras. |
| Video effects | Opens the effects described below. |
| **Share screen** | Shows a window, tab or your whole screen to everyone. Select **Stop sharing** to end it. Only one person can share at a time. If your shared window appears sideways or mirrored to others, use **Rotate shared screen** or **Flip shared screen**. |
| **Send a reaction** | Shows a quick emoji reaction to everyone. |
| **Raise hand** | Lets everyone see you want to speak. Select **Lower hand** to take it down. |
| Grid or focused view | Switches between seeing everyone the same size and focusing on one person. |
| **More options** (…) | **Diagnostics**, **Connection method**, **Hide self** / **Show self**, and for the host, **Settings**. |
| **Leave call** | Leaves the meeting. You can select **Rejoin meeting** afterwards. |

The participant count at the top of the call opens the list of everyone in the call. It shows who is the host,
who has raised a hand and who is muted.

### Video effects

Open **Effects** in the lobby, or the effects button during the call, to change how your camera looks. The
effects combine, and everyone in the call sees the result.

- **Background**: **None**, **Blur**, or **Custom image** (a picture from your own device).
- **Look**: **None**, **Black & white**, **Sepia**, **Night vision** or **Pixelate**.
- **Fun**: **None**, **Sunglasses**, **Cat**, **Party hat**, **Crown** or **Mustache**.

A custom background picture never leaves your browser. While a background effect is starting, your real
background is hidden rather than shown. Effects need your camera to be on, and they make your computer work
harder.

### When a connection is slow or blocked

Each participant's video tile may show a label that explains how their video reaches you:

| Label | Meaning |
| --- | --- |
| Awaiting connection… | The connection to this person is still being set up. |
| Relayed | A direct connection wasn't possible, so the video goes through a relay server. |
| Relayed (TCP) | The same, over a connection that copes with stricter networks. Sound or video may pause briefly. |
| Server relay | Nothing else worked, so the video goes through the RapidMX server. Video quality is lower and sound may lag. |
| Can't connect | This person can't be reached from your network. |

If calls from one network keep failing, show **More options** > **Diagnostics** to your administrator. Leave
**Connection method** on **Auto** unless your administrator tells you otherwise.

## Host a meeting

The host is the person whose mailbox the meeting belongs to: the organizer of a calendar meeting, or the owner of
a personal room. The host gets extra controls.

In the participant list, the host can:

- select **Mute** on someone to mute them. They can unmute themselves again.
- select **Remove** to remove someone from the meeting. They see "Removed from the meeting". Removing someone
  doesn't take their link away, so to keep a removed person from coming back, turn on the waiting room or set a
  password.
- when the waiting room is on, see who is under **Waiting to join** and select **Admit** or **Deny**.

Under **More options** > **Settings**, the host can change the **Meeting settings**:

- **Mute new participants on join**: people who join from now on start muted. They can unmute themselves.
- **Set a password**: people must type it to join. Use **Change** or **Remove password** later.
- **Require the host to admit participants**: turns on the waiting room.

### Talking stick

For a meeting where only one person should speak at a time, the host can select **Talking stick**. Everyone else
is muted and can't unmute, and the host holds the stick at first. People who want to speak raise their hands, and
the host selects **Give stick** next to a name in the participant list. That person is unmuted and everyone else,
including the host, is muted. Select **End talking stick** to give everyone their microphone back.

## For administrators

The Meet plugin's settings are changed on the **Plugins** page of the admin console (see
[Plugins](../administration/plugins.md)).

| Setting | Key | Default | What it does |
| --- | --- | --- | --- |
| Public join page URL | `mail:videoconf:public_url` | this server's address followed by `/meet` | The address of the public join pages. Filled in when the plugin is installed. Calendar invitations include join links only when it's set. |
| TURN server URL | `mail:videoconf:turn:url` | empty | One or more `turn:` or `turns:` addresses, separated by commas, for example `turn:turn.example.com:3478,turns:turn.example.com:5349`. A plain `turn:` address is offered over both UDP and TCP. Leave empty to use public STUN servers only. |
| TURN server username | `mail:videoconf:turn:username` | empty | Used as-is unless a shared secret is set. |
| TURN server credential (static) | `mail:videoconf:turn:credential` | empty | The TURN password for the username above. Ignored when a shared secret is set. |
| TURN server shared secret (for expiring credentials) | `mail:videoconf:turn:shared_secret` | empty | coturn's `static-auth-secret`. When set, every join gets its own short-lived credentials instead of one permanent password. Recommended. |
| WebSocket media relay | `mail:videoconf:relay:enabled` | `true` | The last-resort path through the RapidMX server for participants whose network blocks both direct and TURN connections. With several server replicas it needs the Redis that the push system uses. |
| Video effects assets URL | `mail:videoconf:effects:assets_url` | empty | Where browsers download the effects' machine-learning files from. Empty uses `cdn.jsdelivr.net` and `storage.googleapis.com`. To host them yourself, point it at a directory holding `wasm/` (from the `@mediapipe/tasks-vision` package), `selfie_segmenter.tflite` and `face_landmarker.task`. |

Calls try three paths for each pair of participants, in order: a direct connection, then the TURN server, then the
server's WebSocket relay. Without a TURN server most calls still connect, but people behind strict firewalls may
fall back to the slower server relay or not connect at all. To run a TURN server alongside RapidMX, see
[Video relay](../operations/video-relay.md).

Limitations in the current version:

- Calls are peer-to-peer with no media server, so they suit small groups (about four to six people).
- The server relay needs a browser that supports WebCodecs (recent Chrome, Edge and Firefox).
- The lobby doesn't fill in a signed-in user's name. Everyone types it.
- **Mute**, **Mute new participants on join** and the talking stick rely on each participant's browser to obey
  them. **Remove**, the password and the waiting room are enforced by the server.
- If the host leaves during talking-stick mode, nobody else can hand the stick on.

## Protected meetings

When your mailbox uses [zero-access encryption](encryption.md#zero-access-encryption), a new video meeting gets its own temporary key. The meeting's title and participant names are sealed. Each guest's join link carries the key after `#k=`, a part of the address that is never sent to the server, and the key expires an hour after the meeting's last occurrence. The event editor says when a meeting isn't end-to-end protected, and why.
