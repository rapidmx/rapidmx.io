---
title: Booking pages
sidebar_position: 12
description: Publish a link that lets anyone pick an open time on your calendar and book a meeting with you, no account needed.
---

# Booking pages

Arranging a meeting by email usually takes several rounds of "does Tuesday at 2 work?". A booking page removes
that. You publish a link, and the person you send it to sees the times you're actually free, picks one and books
it. The meeting goes straight onto your calendar, and they get an invitation for theirs.

For example, a consultant can put a link in her email signature that offers a "15 Minute Chat" and a "60 Minute
Consultation". A prospective client opens it, chooses the longer meeting, picks Thursday at 10:00, chooses a
video call and types their name and email address. Both of them get the meeting on their calendars, and the
client gets a link to cancel or move it later. The client doesn't need a RapidMX account.

Booking pages work from your real calendar. A time is only offered when it falls inside the hours you've made
available and nothing else is on your calendar then, so you can't be double-booked by someone using your link.

:::note
Booking pages come from the Booking plugin. If you don't see **Booking Links** in Settings, your administrator
hasn't turned it on. See [Plugins](../administration/plugins.md).
:::

Booking pages are different from booking a meeting room, which is part of the calendar itself; see
[Calendar](./calendar.md).

## How a booking link is organised

Each **booking link** has its own web address and its own weekly hours. A link offers one or more **meeting
types**, each with a name and a length, such as "15 Minute Chat" (15 minutes) and "60 Minute Consultation" (60
minutes). All the meeting types on one link share the link's hours.

Each meeting type offers one or more **location options**, the ways the visitor can choose to meet:

| Location | What the visitor is asked for |
| --- | --- |
| Phone | Their phone number, so you can call them. |
| Video call | Nothing. They're sent the meeting link. |
| Other | A description of how to reach them, for example an office address or a chat handle. |

You can make as many booking links as you need, for example one for clients and one for colleagues, each with
different hours.

## Create a booking link

1. Open **Settings** and choose **Booking Links**.
2. Select **+ New booking link**.
3. Fill in the form:
   - **Mailbox**: the mailbox the link belongs to. Bookings go onto that mailbox's calendar. If you manage more
     than one mailbox, you can pick any of them.
   - **Name**: what visitors see as the title, for example `Intro call`.
   - **Slug (used in the public link)**: the last part of the link's address, for example `intro-call`. It must
     be different from your other links' slugs.
   - **Description (optional)**: a few lines shown on the booking page.
   - **Host name shown to visitors**: your name as visitors will see it.
   - **Timezone**: the time zone your available hours are written in. Visitors always see times in their own time
     zone.
4. Under **Meeting types**, set up what visitors can book:
   - Give the first meeting type a **Meeting type name** and a **Duration (minutes)**.
   - Under **Location options**, choose a **Type** (Phone, Video call or Other) and, if you like, a
     **Label (optional)** that visitors see instead of the type's name. For a video call you can paste a
     **Meeting URL (optional)**; see [Video calls on bookings](#video-calls-on-bookings) for what happens if you
     leave it empty.
   - Select **Add location option** to offer another way to meet, or **Add meeting type** to offer another kind of
     meeting.
5. Set the limits:
   - **Minimum notice (minutes)**: how soon a booking may start. The default of 60 stops someone booking a meeting
     that starts in five minutes.
   - **Booking window (days ahead)**: how far into the future people can book. The default is 30 days.
6. If you want to look at each booking before it's final, check **Require my approval before confirming a
   booking**. See [Bookings that need your approval](#bookings-that-need-your-approval).
7. Under **Weekly availability**, add the hours you can be booked. Choose a day, a start and an end time, and
   select **Add window**. Repeat for each day. For example, add Monday 09:00 to 12:00 and Monday 13:00 to 17:00 to
   keep your lunch hour free. Use **Remove** to take a window away.
8. Select **Create**.

The link opens in its detail page. It's live straight away.

:::tip
Visitors are only ever offered times inside your weekly availability, and never times when your calendar is
already busy. To block out a day off, put an event on your calendar for it.
:::

## Share a booking link

The **Booking Links** page lists your links with their address, their meeting types and whether they're enabled.
Select **Copy link** next to a link to copy its full address, then paste it into an email, your signature or your
website. On a link's detail page, the **Copy** button next to the address does the same.

A booking link looks like `https://mail.example.com/book/sam@example.com/intro-call`: your server's address, then
the mailbox's address, then the slug.

## Give your booking pages a picture and banner

At the top of the **Booking Links** page, **Booking page appearance** shows how your booking pages will look. The
banner and avatar (round picture) you set here appear on every booking page of that mailbox.

1. Select the camera button on the banner or the avatar.
2. Choose to upload a file, take a photo, or remove the current picture.

Pictures are cropped and resized for you, so any photo works. They're saved as soon as you choose them.

## What the visitor sees

When someone opens your link, they see your name, your banner and picture, the link's name and description, and
the open times.

1. If the link offers more than one meeting type, they choose one.
2. Under **Select a time**, they pick a time. Times are shown in their own time zone. **Show later times** loads
   more.
3. They enter their name and email address, and can add **Notes (optional)**.
4. Under **How would you like to meet?**, they choose one of the meeting type's location options and, for a phone
   or "other" location, fill in their phone number or how to reach them.
5. They select **Confirm booking**.

The page then says **You're booked!** and shows a link to cancel or reschedule later. They're also sent an email
confirmation with a calendar invitation, which includes that same link.

From the cancel-or-reschedule link, the visitor can select **Reschedule** to choose a new time from your current
availability, or **Cancel booking** to cancel it.

## What happens when someone books

- **The meeting goes onto your calendar**, in the calendar of the link's mailbox. The event's location shows the
  video link, the phone number or the visitor's instructions, and its description says who booked and what they
  wrote in their notes. It has a 15-minute reminder.
- **You get a message in your Inbox**, titled "New booking: *meeting type* with *visitor*". Replying to it
  replies to the visitor.
- **The visitor gets a confirmation email** with a calendar invitation, which also carries a 15-minute reminder.

If the visitor later cancels, the meeting is taken off your calendar and you get a "Booking cancelled" message.
If they reschedule, the event moves and you get a "Booking rescheduled" message that shows the new time and the
old one.

## Video calls on bookings

When a visitor chooses a video call, the link they receive depends on how you set up that location option:

- **You entered a Meeting URL** (for example, a permanent meeting room link): every booking uses that address.
- **You left it empty, and your organisation uses [video meetings](./video-meetings.md)**: RapidMX creates a new
  video meeting for each booking, and the visitor gets its link automatically.
- **You left it empty, and video meetings aren't turned on**: the booking is made without a link. Open the
  booking link's detail page, find the booking under **Upcoming bookings**, paste the address into its **Video
  URL** field and select **Save**. The visitor is emailed an updated invitation with the link, and your calendar
  event is updated too.

You can also use the **Video URL** field to give one particular booking its own link, or to change it.

## Bookings that need your approval

If you checked **Require my approval before confirming a booking**, the booking page tells visitors that you
confirm each booking. A new booking:

- goes onto your calendar as **tentative** instead of busy;
- arrives in your Inbox as "Booking request: *meeting type* with *visitor*", saying it's awaiting your
  confirmation;
- shows the visitor "Awaiting the host's confirmation" on their cancel-or-reschedule page.

:::note
The current version has no button that confirms a pending booking. The booking stays marked as awaiting
confirmation. To agree or decline, reply to the "Booking request" message, which goes to the visitor.
:::

## Edit, pause or delete a booking link

Select **View** next to a link on the **Booking Links** page to open its detail page. There you can change any of
the fields from [Create a booking link](#create-a-booking-link) and select **Save**. Changing a meeting type
doesn't change bookings that have already been made.

- **To stop taking bookings for a while**, clear **Enabled (publicly bookable)** and save. The link stops working
  until you turn it back on, and existing bookings are kept.
- **To move a link to another mailbox**, change **Mailbox**. This is only allowed until the link has its first
  booking.
- **To delete a link**, select **Delete** and confirm. The link stops working immediately. A link that already has
  bookings can't be deleted, because the people who booked would lose their way to cancel or reschedule. Turn it
  off instead.

The detail page also lists the link's bookings under **Upcoming bookings**, with the time, meeting type and who
booked.

## For administrators

The Booking plugin has one setting, changed on the **Plugins** page of the admin console (see
[Plugins](../administration/plugins.md)):

| Setting | Key | Default | What it does |
| --- | --- | --- | --- |
| Public booking page URL | `mail:booking:public_url` | empty | The address of the public booking pages, for example `https://mail.example.com/book`. Confirmation emails include the link to cancel or reschedule only when this is set. The Helm chart sets it to the server's public address followed by `/book`. |

Booking pages are public and need no sign-in, so every booking request is rate limited. They share the server's
general rate-limit settings, whose defaults are tuned for sign-in attempts. If visitors who page through several
weeks of times run into errors, raise `rateLimit.maxAttempts`; see [Configuration](../operations/configuration.md).

Booking links and bookings belong to their mailbox. Erasing a mailbox removes its booking links and bookings, and
uninstalling the plugin with its data removes them for every mailbox, along with the booking page pictures.

Limitations in the current version:

- The booking page editor sets weekly hours only. There is no way in the web app to block out specific dates
  other than putting an event on the calendar.
- There is no page that lists all of a mailbox's booking links. Each link must be shared on its own.
- A pending booking can't be confirmed from the web app (see
  [Bookings that need your approval](#bookings-that-need-your-approval)).
