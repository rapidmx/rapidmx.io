---
sidebar_position: 6
title: Plugins
description: Install, configure, upgrade, disable and uninstall RapidMX plugins from the admin console, including removing a plugin together with its data.
---

# Plugins

Much of what RapidMX can do comes from plugins: Exchange ActiveSync for phones, MAPI for Outlook, Autodiscover, booking pages, video meetings and more. A plugin is an npm package that can add API routes, pages, navigation entries and settings to every server. You manage them from **Plugins** in the admin console, without editing configuration files or redeploying.

You'll come here to turn a feature on or off, change a plugin's settings (for example the public address of the booking pages), and upgrade plugins when new versions come out.

:::warning
Plugins run with the server's full access to its data. Only install plugins you trust.
:::

## The plugins installed by default

A new server starts with these plugins installed and enabled:

| Plugin | What it does | See |
| --- | --- | --- |
| `@rapidmx/activesync-plugin` | Exchange ActiveSync, for the built-in mail apps of phones and tablets | [Phones and tablets](../clients/phones-and-tablets.md) |
| `@rapidmx/mapi-plugin` | MAPI over HTTP, for Outlook on the desktop | [Outlook](../clients/outlook.md) |
| `@rapidmx/autodiscover-plugin` | Lets Outlook and phones find the server from an e-mail address | [Automatic setup](../clients/automatic-setup.md) |
| `@rapidmx/booking-plugin` | Public booking pages people can share | [Booking pages](../user-guide/booking-pages.md) |
| `@rapidmx/meet-plugin` | Video meetings | [Video meetings](../user-guide/video-meetings.md) |

If you remove one of these, it stays removed: the server doesn't add it back when it restarts.

## How changes are applied

Every change (installing, enabling, disabling, upgrading, saving settings, uninstalling) is applied by restarting the servers **one at a time**, so mail keeps flowing. While that happens, a bar runs across the top of the page and the plugin's **Status** shows how many servers have loaded it, and any error a server reported.

When a plugin with pages is added, upgraded, enabled or disabled, each server also rebuilds the web app's pages as it starts. That first start takes longer than usual, from a few seconds to about a minute on a small CPU limit. A plugin whose pages fail to build is left out (its pages aren't served and its menu entries are hidden) and the plugin's status shows the error; the server itself still starts.

## Find and install a plugin

The **Find plugins** section searches the plugin registry. Pick a **Namespace** (or **All namespaces**), search, and choose **Install** beside the plugin you want.

By default, RapidMX only allows plugins from the `@rapidmx` namespace. A plugin outside the allowed list shows **Not allowed on this server**. Widening the list is a server configuration change (`system:plugins:namespaces` and `system:plugins:allowed_packages`), deliberately not something the console can do. See [Configuration](../operations/configuration.md).

You can also choose **Add by name**, enter a **Package name** such as `@rapidmx/crm-plugin`, pick a **Version**, and choose **Add plugin**.

Tick **Allow pre-release versions** to see and install beta releases.

If a plugin needs other plugins, the console lists them before installing and installs or enables them along with it. A plugin that another enabled plugin needs can't be disabled or uninstalled until that one is.

### Install from a file

**Upload** installs a plugin from the `.tgz` file `npm pack` produces, for example to try a build before it's released. An uploaded plugin skips the allowed list, because you are vouching for its code, and is never offered registry updates. Uploads need a recently confirmed identity, are recorded in the audit log, and are limited to 50 MiB by default. They can be turned off in the Helm chart (`plugins.uploads.enabled`). With more than one server copy, uploaded packs are kept in the shared blob store, so it must be shared storage.

## Configure a plugin

Choose **Settings** beside a plugin to open its settings. What you save there overrides the deployment's own configuration (for example values the Helm chart sets, such as the booking pages' public address).

- A field the deployment configures shows that value until you save something else.
- A secret is never shown again once saved. Its field says **Saved - type a new value to replace it**, or **Set by this deployment**.
- **Reset** puts every setting back to what the deployment's configuration or the plugin's default gives; choose **Save** to apply it.

Saving restarts the servers one at a time.

## Upgrade, change version, enable and disable

Beside each installed plugin:

- **Upgrade** appears when a newer version is available.
- **Change version** lets you pick any version, including an older one to roll back. For an uploaded plugin it reads **Install the registry version**.
- **Disable** stops the servers running the plugin but keeps it installed; **Enable** turns it back on.

To act on several plugins at once, tick them (or **Select all**) and use the **Upgrade**, **Disable** or **Uninstall** buttons above the table. **Upgrade all** upgrades every plugin that has an update.

## Uninstall a plugin

1. Choose **Uninstall** beside the plugin.
2. Decide what happens to its data:
   - To keep it, choose **Uninstall**. Everything the plugin stored stays in the database, and adding the plugin again brings it all back.
   - To delete it, tick **Also delete all data this plugin stored**, type the plugin's name to confirm, and choose **Uninstall and delete data**.

Deleting a plugin's data removes:

- the database collections and tables the plugin's features use, with everything in them;
- the plugin's saved settings;
- its downloaded package and cached pages on the servers;
- whatever else the plugin cleans up itself, such as files it stored or data kept outside the database.

This can't be undone, and it needs a recently confirmed identity. It's recorded in the audit log (`plugin.purge_requested`, then `plugin.purge_completed` or `plugin.purge_failed`).

Nothing is deleted while any server is still running the plugin. Once every server has restarted without it, usually within a few minutes, the deletion runs. Until then the plugin's row reads **Uninstalled - data will be deleted after servers restart**, and adding the plugin again cancels the deletion. Afterwards it reads **Data deleted** with the date, or **Data deletion failed** with the reason and a **Retry** button.

What each bundled plugin stores:

- **Booking pages** store booking types, bookings, booking profiles and profile images. Events that bookings created in people's calendars belong to those people and are kept.
- **ActiveSync** stores each device's sync state. Mail sent from phones lives in people's mailboxes and is kept.
- **MAPI** and **Autodiscover** store nothing of their own.

:::note
A plugin that has never been loaded by any server since the release that added this feature can't be uninstalled with its data until it has loaded once. The console says so and changes nothing.
:::

## Related

- [Plugin development](/developers/plugins/overview): writing your own plugin
- [Monitoring](../operations/monitoring.md): the **Diagnostics** page lists installed plugins on each server
