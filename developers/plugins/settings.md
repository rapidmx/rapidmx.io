---
title: Settings
sidebar_position: 5
description: How a plugin declares settings that administrators edit in the admin console, how secrets are kept out of the browser, and how saved values interact with the deployment's own configuration.
---

# Settings

Most plugins have something an administrator has to decide: the public address booking emails link to, the TURN server
video calls relay through, how many campaign messages may go out per minute. A plugin declares these in its manifest,
and the admin console turns them into a form on the plugin's **Settings** dialog. The plugin itself reads them as
ordinary configuration with `@Config`, so it needs no settings code of its own.

## Declaring a setting

Settings are a list under `rapidmx.plugin.settings`. The Video Conferencing plugin's TURN secret, for example (help text shortened):

```json
{
    "key": "mail:videoconf:turn:shared_secret",
    "label": "TURN server shared secret (for expiring credentials)",
    "type": "string",
    "secret": true,
    "default": "",
    "help": "coturn's static-auth-secret, if configured. ..."
}
```

| Field | Required | Meaning |
| --- | --- | --- |
| `key` | yes | The configuration key the plugin reads with `@Config`. Unique within the plugin. |
| `label` | yes | The field's label in the admin console. |
| `type` | yes | `string`, `number`, `boolean` or `select`. |
| `help` | no | Text shown under the field. |
| `default` | no | The value a fresh install saves. It must be a valid value for the type. |
| `required` | no | The admin console won't save the form without a value, unless there is a `default`. |
| `min`, `max` | no | Inclusive bounds for a `number`. |
| `options` | for `select` | A non-empty list of `{ "value": "...", "label": "..." }`. |
| `secret` | no | `true` keeps the saved value out of every response and out of the Diagnostics page. |

The server validates the whole manifest when an administrator adds the plugin and again when a server copy loads it, so
a plugin with an invalid setting is refused with a message that names it. Run `parsePluginManifest()` from
`@rapidmx/restapi` in a test to catch these before you publish (see [Routes, models and jobs](routes-and-models.md#the-entry-point-rule)).

Read the value in the plugin with the same key and the same default:

```ts
@Config("mail:crm:send_rate_per_minute", 600)
protected sendRatePerMinute: number = 600;
```

## Keys a plugin may not use

Put every setting under a namespace of your own, following the published plugins: `mail:booking:*`, `mail:crm:*`,
`mail:videoconf:*`, `mail:autodiscover:*`.

A saved plugin setting outranks the deployment's own configuration (see [below](#where-the-value-comes-from)). If a
plugin could declare any key, it could grant itself trusted roles, replace the JWT secret, point the server at another
database or run a command. So the server refuses a setting in, or under, any of its own configuration namespaces, both
when the manifest is read and when a value is saved, and again when it applies saved values at startup. Among them are
`auth`, `trusted_roles`, `trusted_proxies`, `cookies`, `session`, `cors`, `datastores`, `system` (which covers
`system:plugins`), `react`, `static_assets`, `metrics`, `diagnostics`, and these `mail:*` groups: `mail:transport`,
`mail:internal`, `mail:escrow`, `mail:pki`, `mail:auth_server_url`, `mail:basic_auth`, `mail:security`, `mail:blob`,
`mail:scan`, `mail:dns`, `mail:dkim`, `mail:domains`, `mail:auto_provision`, `mail:compose`, `mail:search`,
`mail:preferences`, `mail:branding`, `mail:default_quota_bytes` and each of the server's jobs under `mail:jobs:*`. The
authoritative list is `CORE_CONFIG_NAMESPACES` in `@rapidmx/restapi`. Comparison ignores case and treats `__` as `:`.

`mail:` itself isn't reserved, only those groups, so `mail:yourplugin:*` is safe.

## Secrets

A setting is treated as a secret when the manifest marks it `"secret": true`, or when its key names one. The server
judges a key by its words: `client_secret`, `smtp_password`, `passphrase`, `credentials`, `access_token`, `api_key`,
`private_key`, `connection_string`, `dsn` and `authorization` are secrets; `author`, `tokenizer`, `max_tokens` and a plain
`key` are not.

For a secret:

- the API never returns the saved value, only `{ "secret": true }` in its place, and the admin console shows a
  write-only password field ("Saved - type a new value to replace it");
- sending that placeholder back unchanged keeps the saved value, so a form that didn't touch the field doesn't wipe it;
- the value the deployment configures through the environment is reported only as being set, never shown.

The Diagnostics page hides only the settings a manifest marks `"secret": true`, not the ones whose key merely looks
secret. **Always set `"secret": true` explicitly** on anything sensitive, even when the key already names a secret.

## Where the value comes from

The server's configuration is layered, highest first:

1. the value an administrator saved in the plugin's settings;
2. the command line;
3. the environment (`mail__crm__send_rate_per_minute`), which is how the Helm chart configures settings;
4. the server's defaults;
5. the default in the plugin's own `@Config`.

A saved value goes in a configuration layer of its own above the environment, so a value saved in the admin console
always wins. An empty saved value counts as nothing saved, and the next layer applies. This lets the chart or an
operator configure a plugin through the environment while still leaving administrators the final say.

The admin console makes this visible. For each setting the deployment's configuration provides, the plugin API's
`configured` field says what it is (or only that it is set, for a secret), and the field shows it with the note "This
deployment's configuration provides the value shown unless one is saved here." The dialog's **Reset** button puts every
field back to what applies with nothing saved; saving after that removes the saved values, so the deployment's
configuration or the plugin's default applies again.

### Defaults that name the host

A `string` default may contain `<host>`, as in Autodiscover's `"https://<host>"` or the CRM's public site address. When
a plugin is added, the server replaces it with the host the server is reached at, so the plugin works as installed. A
default plugin added when the server first starts gets the host from `mail:dns:mx_hostname`; one an administrator adds
gets the host of the admin console request. When no host is known, the setting stays unset and the admin console offers
its host in the form.

## When settings change

Saving settings is a change to the plugin set, so the servers restart one at a time to apply it, and the admin console
says so under the form. A plugin reads its settings once, when its classes are created, and never sees a value change
under it while running.

When an administrator upgrades a plugin, its saved values are checked again against the new version's manifest. Values
for settings the new version no longer declares are dropped instead of failing the upgrade, so renaming a setting's key
loses what was saved under the old one. Keep keys stable across releases.
