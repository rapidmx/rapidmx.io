---
title: CRM
sidebar_position: 15
description: Keep track of customers, companies and deals with your team, and send marketing email campaigns and automated follow-ups.
---

# CRM

The CRM (customer relationship management) app is where a team keeps track of the people and businesses it works
with. It holds your customers and prospects, the companies they belong to, the deals you're working on, and
everything that has happened with each of them. It can also send marketing email: newsletters, announcements and
automatic follow-ups, to people who signed up to receive them.

Take a small design studio as an example. Its website has a newsletter signup form that adds people to a
"Newsletter" list in the CRM. Each month someone designs the newsletter in the CRM's email designer and sends it as
a campaign to that list. When a reader clicks a link about a service, an automation tags them and creates a task
for a colleague to call. When that call turns into a project, the colleague adds a deal to the sales pipeline and
drags it from stage to stage until it's won. Every email, click, note and deal move shows up on the contact's
timeline, so anyone on the team can see the whole story.

:::note
The CRM comes from the CRM plugin. If you don't see **CRM** in the web app's app rail, your administrator hasn't
turned it on. See [Plugins](../administration/plugins.md).
:::

CRM contacts are separate from your personal [contacts](./contacts.md). Your address book is yours, for the people
you email. CRM contacts belong to a team workspace and carry sales and marketing information.

## Workspaces and roles

Everything in the CRM lives in a **workspace**, shared by a team. A sales team might have one workspace, and a
separate brand or department another. Members of a workspace see the same contacts, companies and deals.

Each member has a role, and each role can do everything the roles below it can:

| Role | What it can do |
| --- | --- |
| Viewer | See everything in the workspace. |
| Editor | Also create, change and delete contacts, companies, notes, tasks and imports. |
| Admin | Also change the workspace's settings, members, senders and custom properties. |
| Owner | Also delete the workspace and make other members owners. A workspace always has at least one owner. |

### Create a workspace

1. Select **CRM** in the app rail.
2. The first time, you're asked to create your workspace. Type a **Name** and select **Create workspace**.

To create another workspace later, open the workspace switcher at the top of the CRM and choose
**+ New workspace…**. Your administrator may limit who can create workspaces and how many.

### Set up the workspace

Open **Settings** in the CRM's menu. Admins and owners can change these sections:

- **Workspace**: the name, the **Time zone**, the **Website**, and the **Postal address (shown in marketing email
  footers)**. A postal address is required before you can send a campaign.
- **Members**: search **People** by name or address, choose a role, and select **Add member**. Change a role or
  **Remove** a member from the list.
- **Send as**: the mailboxes the CRM sends from. Pick a **Mailbox** you're allowed to send from, adjust the name
  shown to recipients, and select **Add sender**. Replies to CRM mail arrive in that mailbox. Check **Log email with
  contacts** on a sender to put the ordinary one-to-one email it exchanges with contacts on their timelines.
- **Custom properties**: extra fields for contacts or companies, such as "Renewal date" or "Plan". Choose what the
  property belongs to, give it a label and a type (**Text**, **Number**, **Date**, **Yes / no**, **Dropdown** or
  **Multiple choice**), and select **Add property**.
- **Do not email**: addresses no campaign is ever sent to. Bounces and spam complaints are added here
  automatically, and you can **Add address** by hand.
- **Delete workspace** (owners only): deletes the workspace and everything in it, for every member. This can't be
  undone.

## Contacts and companies

**Contacts** are people, and **Companies** are the businesses they work for. Both are in the CRM's menu. A new
contact is linked automatically to the company whose website domain matches their email address.

### Add and find records

1. Open **Contacts** (or **Companies**) and select **New contact** (or **New company**).
2. Fill in the details and select **Create**.

To find records, type in the search box, or select **Filters** to build conditions such as "Lifecycle stage is
Customer" and "Tags includes vip". A filter can match all of its conditions or any of them, and can use your
custom properties, list membership and [segments](#segments). Select a column heading to sort.

### Work with many records at once

Select records with the checkboxes (or select all on the page), then choose **Add tag**, **Remove tag**, **Add to
list**, **Remove from list** or **Delete**. Select **Export** to download everything your search matches as a
CSV file.

### A contact's page

Select a contact to open their page. It shows:

- their fields and custom properties, **Tags (comma-separated)** and **Owner**, which you can change and **Save**;
- their **Subscriptions** to your mailing lists, where you can **Subscribe** or **Unsubscribe** them;
- **Notes**: type a note and select **Add note**;
- **Tasks**: type a task, optionally set a due date, and select **Add task**;
- their deals;
- **Activity**: a timeline of everything that has happened, such as emails sent, opened and clicked, forms
  submitted, list changes and deal moves.

Company pages work the same way, without subscriptions.

### Import from a spreadsheet

1. Open **Import**.
2. Under **The file holds**, choose contacts or companies, pick the **CSV file**, and select **Upload**.
3. Check how the file's columns map to CRM fields. RapidMX suggests a mapping.
4. Optionally:
   - check **Update records that are already here** to update existing records rather than skip them;
   - fill in **Tag everything imported with (comma-separated)**;
   - choose a list under **Subscribe everyone imported to**.
5. Select **Start import**.

The import runs in the background, and the **Import** page shows its progress.

:::warning
Only subscribe people to a list if they agreed to receive that email. The CRM records how each subscription was
made, but it can't know whether the people in a file gave their consent.
:::

## Tasks

**Tasks** in the CRM's menu lists the workspace's follow-ups. Add one with a title, assignee, due date and
priority, and tick it off when it's done. The person a task is assigned to gets a reminder shortly before it's
due.

CRM tasks are separate from your personal [tasks](./tasks.md).

## Mailing lists, forms and subscriptions

A **mailing list** is a group of people who agreed to receive a kind of email from you, such as a monthly newsletter
or product updates. Campaigns are sent to lists. The CRM keeps a record of each subscription: when, how and from
what address it was made.

### Create a mailing list

1. Open **Lists** and select **New list**.
2. Give it a **Name** for your team, and optionally a **Name subscribers see (optional)** and a **Description
   subscribers see**.
3. To make new signups confirm their address first, check **Ask signups to confirm by email (double opt-in)** and
   choose who **Confirmation emails come from**.
4. Leave **Offer it in the preference center** checked if subscribers may join or leave this list themselves.
5. Select **Save**.

The list page shows how many people are **Subscribed** and how many are **Awaiting confirmation**.

### Add a signup form to your website

1. Open **Forms** and select **New form**.
2. Fill in the **Name (only members see it)**, the **Heading** and **Text under the heading** visitors see.
3. Choose the fields to ask for with **+ Add a field…** (for example **First name**, **Company** or a custom
   property), and mark the ones that are **Required**. **Email** is always asked for.
4. Check the lists people are subscribed to when they sign up. To make them confirm their address first, check
   **Ask signups to confirm by email (double opt-in)** and choose who **Confirmation emails come from**.
5. Optionally fill in **Tag contacts with (comma-separated)**, the **Message once submitted**, or a page to send
   them to instead (**Or go to this page (https://)**).
6. Make sure **Take submissions** is checked, and select **Save**.

Select **Open form** to see the form on its own page, and share that link. To put the form inside your website,
select **Copy embed code** and paste the code into your site.

### What subscribers can do

Every campaign email has an unsubscribe link, and mail programs that support it also show their own one-click
unsubscribe button. The designer's **Footer** block adds both an **Unsubscribe** link and an **Email preferences**
link. On the email preferences page, subscribers choose which of your lists to receive, or select **Unsubscribe
from all email**. Neither page needs an account.

## Design an email

Campaigns and automations send email designed in **Templates**.

1. Open **Templates** and select **New template**. Give it a **Name** and **Subject**, and select **Create and
   design**.
2. Build the email in the designer:
   - Drag blocks from the palette into the email: **Heading**, **Text**, **Image**, **Button**, **Divider**,
     **Spacer**, **Social links**, **Footer**, and HTML (HTML blocks can only be added by workspace admins).
   - Sections can have up to four columns.
   - Click text to edit it in place. Select a block to change its settings, such as colours, sizes and links.
   - Insert merge tags, such as the contact's first name, so each reader gets a personal email.
   - Use **Undo** and **Redo**, and **Save for reuse** to keep a block for other templates.
3. Fill in the **Preview text**, the line inboxes show after the subject.
4. Select **Preview** to see the email for a sample reader or any contact, at desktop or phone width, or as plain
   text. Select **Send test** to send it to one of your own mailboxes.
5. Select **Save**.

:::tip
A campaign email needs an unsubscribe link, for example in a **Footer** block. The template list marks templates
that don't have one yet.
:::

## Send a campaign

A **campaign** sends one email to the subscribers of your chosen lists.

1. Open **Campaigns** and select **New campaign**. Give it a **Name** and select **Create**.
2. Fill in each section:
   - **From**: the sender, one of the workspace's send-as addresses.
   - **To**: the lists under **Send to the subscribers of**, and any lists to leave out under **But not to the
     subscribers of**. You can narrow it with **Only those in the segments** or exclude **Never those in the
     segments**. The editor shows how many people the campaign will reach.
   - **Email**: the template to send.
   - **Tracking**: **Track opens (an invisible image)** and **Track clicks (links go through a redirect)**.
   - **A/B test** (optional): see below.
3. Under **Send**, check the list of anything that's still missing, such as a sender, a list, an unsubscribe link
   or your postal address.
4. Leave **When (empty: now)** empty and select **Send now**, or pick a date and time and select **Schedule**.
   Select **Save draft** to finish later.

Campaigns skip addresses that are on the **Do not email** list, that have unsubscribed, or that bounced or
marked your mail as spam before. Sending is spread out over time, so a large list can take a while.

While a campaign is going out you can **Pause**, **Resume** or **Cancel** it. Messages already sent stay sent. A
scheduled campaign can go **Back to draft** until it starts. **Duplicate** copies a campaign to send again.

### Test two versions (A/B test)

In the **A/B test** section, add up to four variants, each with its own subject line or template. The variants are
sent to part of the audience first. After the number of hours you set, the variant that did best under **Pick the
winner by** (**Opens**, **Clicks** or **Replies**) goes to everyone else.

### Read the results

Once sent, a campaign shows its report: how many were sent, opened, clicked, replied, bounced, unsubscribed or
marked as spam, which links were clicked, how each A/B variant did, and a recipients list you can search and
filter. Opens and clicks by automatic mail scanners are counted apart from people's.

Opens, clicks, replies and bounces also appear on each contact's timeline. A hard bounce or a spam complaint puts
the address on the **Do not email** list.

## Segments

A **segment** is a named group of contacts defined by a filter, such as "customers in Germany who opened an email in
the last 30 days". You can use segments to filter contacts, narrow a campaign, and start automations.

1. Open **Segments** and select **New segment**.
2. Give it a **Name** and add conditions.
3. Choose the **Kind**:
   - **Dynamic - keeps up with the filter**: contacts join and leave on their own as they start or stop matching.
   - **Static - the contacts matching now**: a snapshot. Select **Refresh** to update it by hand.
4. Select **Create**. The segment shows how many contacts it holds.

## Lead scoring

**Lead scoring** gives each contact a score, so your team can see who is most interested. A contact's score is the
sum of the workspace's rules.

1. Open **Lead scoring** and select **New rule**.
2. Choose the kind of rule:
   - **By who they are**: points for contacts who match a filter, for example 10 points for the job title
     "Director".
   - **By what they do**: points **Each time the contact** opened an email, clicked a link, replied, had an email
     bounce, submitted a form, subscribed or unsubscribed. Optionally count only **In the last (days, empty:
     ever)**, and cap the rule with **At most (points, empty: no limit)**.
3. Set the **Points (negative takes away)** and select **Create**.

Scores update in the background. Select **Recalculate now** to update them straight away. The score is a contact
field, so you can filter and segment by it.

## Automations

An **automation** is a workflow that runs by itself when a contact does something. For example: when someone
subscribes to the newsletter, send a welcome email, wait three days, and if they haven't replied, send a follow-up.

### Create an automation

1. Open **Automations** and select **New automation**.
2. Pick a starting point, or **Start from scratch**. The ready-made ones are **Welcome, and follow up if there's no
   reply**, **Welcome series**, **Follow up on a form**, **Win back** and **Birthday greeting**.
3. Give it a **Name** and select **Create**.
4. Select the trigger at the top and choose what starts the automation under **When a contact**, for example
   **Subscribes to a list**, **Submits a form**, **Enters a segment**, **Opens an email**, **Has a deal won** or
   **Reaches a date (birthday, renewal, anniversary…)**. You can also limit it with **Only contacts matching
   (optional)**.
5. Add steps below the trigger and select each one to set it up.
6. Select **Save draft** while you work, and **Publish** when it's ready. Publishing checks the whole flow first.

The steps you can add are:

| Kind | Steps |
| --- | --- |
| Timing | **Wait a while**; **Wait for an email to be opened, clicked or replied to**, with a branch for "It happened" and one for "It didn't" |
| Branches | **If / else** on a filter; **Random split** into Path A and Path B |
| Actions | **Send an email**, **Set a field**, **Add a tag**, **Remove a tag**, **Subscribe to a list**, **Unsubscribe from a list**, **Create a task**, **Notify a member**, **Put into another automation**, **Post to a webhook** |

In the automation's settings you can set a goal that takes contacts out early once they reach it, and whether a
contact can go through it **Once only** or **Again, once they've finished**.

### Watch and manage an automation

Each step shows how many contacts are at it. **Contacts in it** lists everyone going through the automation,
**At step** shows where each one is, and **Take out** removes a contact. **Pause** stops the automation and
**Resume** starts it again. Editing a published automation doesn't move contacts already in it: they finish the
version they entered.

## Deals and pipelines

A **deal** is a sale you're working on. It moves through the stages of a **pipeline**, for example Qualified,
Proposal, Negotiation, Won. Every workspace starts with a "Sales" pipeline.

### Track a deal

1. Open **Deals**. The board shows a column for each stage.
2. Select **New deal**, fill in the **Name**, **Amount**, **Currency** and **Stage**, and select **Create**.
3. Drag the deal from column to column as it progresses, or use **Move to**. Moving a deal to a lost stage asks
   why it was lost.

Select a deal to open its page. There you can set the **Owner** and **Expected to close** date, link the contacts
and company involved, and add notes and tasks. The **Stage history** shows every move. Deal moves also appear on
the timelines of the contacts involved, and a deal being created, moved, won or lost can start an automation.

The deals page also shows a forecast: the open value and the weighted value per stage, the win rate, and how long
deals take to win.

### Set up pipelines

Workspace admins can change pipelines under **Pipelines**: add a **New stage**, set each stage's **Probability %**,
**Kind** (open, won or lost) and **Rotting after (days)**, which flags deals that sit in a stage too long. You can
create more pipelines, **Make default** one of them, or **Delete pipeline**.

## Reports

**Reports** shows charts over the last 7, 30, 90 or 365 days (**Period**):

- **Email**: messages sent, opened, clicked, replied to, bounced and unsubscribed from, per day and as rates, and
  the top recipient domains.
- **Audience**: new contacts, subscribes and unsubscribes per day, and each list's subscribers.
- **Sales**: deals won and their value, lost and open, and the win rate, for all pipelines or one.

Each chart can also be shown as a table.

## Connect other systems

**Integrations** in the CRM's menu connects the workspace to your other software, such as your website or online
shop. A workspace admin sets these up, usually with the help of whoever runs that other system.

- **Webhooks**: RapidMX posts a message to an `https://` address of yours whenever something happens, such as a
  contact being created, a subscription, or a deal being won. Select **Add webhook**, then use **Test** to send a
  test message and **Deliveries** to see recent posts.
- **API keys**: select **Make key** to create a key that lets another system add and update
  contacts, subscribe and unsubscribe people, or report events that start automations. The key is shown only once,
  so copy it. **Revoke** a key to stop it working.

The technical details of webhooks and the integration API are in the plugin's
[README](https://github.com/rapidmx/crm-plugin#readme).

## For administrators

The CRM plugin's main settings are changed on the **Plugins** page of the admin console (see
[Plugins](../administration/plugins.md)):

| Setting | Key | Default | What it does |
| --- | --- | --- | --- |
| Public site address | `mail:crm:public_url` | this server's address | Where the public pages (signup forms, the preference center, unsubscribe links) are served from. Links in CRM email point here. |
| Who can create workspaces | `mail:crm:workspace_creator_roles` | empty | Comma-separated roles allowed to create workspaces. Empty lets every signed-in user. |
| Workspaces per user | `mail:crm:max_workspaces_per_user` | `10` | How many workspaces one user may create. |
| Campaign messages per minute | `mail:crm:send_rate_per_minute` | `600` | The most campaign messages the whole server sends per minute, shared by every workspace. Raise it only as far as your mail server and its reputation allow. |
| Per-message bounce addresses | `mail:crm:verp` | `true` | Gives each campaign message its own bounce address (`sender+b-token@domain`), so bounces are matched reliably. Needs plus-addressing, which RapidMX has on by default. |

More limits (`mail:crm:max_members`, `mail:crm:max_senders`, `mail:crm:export:max_rows`, `mail:crm:import:max_bytes`,
`mail:crm:token_secret`) and the schedules of the CRM's background jobs are server configuration keys; the plugin's
[README](https://github.com/rapidmx/crm-plugin#settings) lists them all with their defaults. See
[Configuration](../operations/configuration.md) for how to set server configuration.

Learning about replies, bounces and spam complaints needs an `events` Redis datastore on the server. Without one,
campaigns still send, but those outcomes aren't recorded.

### The CRM page in the admin console

The admin console gets a **CRM** page. It shows the number of **Workspaces** and **Contacts**, the messages **Sent
in the last day** and **Waiting to send**, and every workspace with its size. If a workspace is being used to send
abusive mail, select **Stop sending** to stop its campaign and automation email without touching its data, and
**Let it send** to allow it again.

Server administrators have no access to the contents of a workspace they aren't a member of.

### Limitations

- The CRM is new (version 0.2). Recording replies, bounces and complaints, and posting webhooks, haven't yet been
  verified end to end on a real deployment. Watch your first campaigns closely.
- Senders must be mailboxes the member can already send from. There is no separate list of allowed sending
  domains.
